  const OError = require('@overleaf/o-error')
const metrics = require('@overleaf/metrics')
const Settings = require('@overleaf/settings')
const { ObjectId } = require('mongodb')
const Features = require('../../infrastructure/Features')
const { Project } = require('../../models/Project')
const { Folder } = require('../../models/Folder')
const ProjectEntityUpdateHandler = require('./ProjectEntityUpdateHandler')
const ProjectDetailsHandler = require('./ProjectDetailsHandler')
const HistoryManager = require('../History/HistoryManager')
const { User } = require('../../models/User')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const { gitClone } = require('../Git/GitController')
const { callbackify } = require('util')
const _ = require('lodash')
const AnalyticsManager = require('../Analytics/AnalyticsManager')
const TpdsUpdateSender = require('../ThirdPartyDataStore/TpdsUpdateSender')
const SplitTestHandler = require('../SplitTests/SplitTestHandler')
const EditorController = require('../Editor/EditorController')

const dataPath = "/overleaf/services/web/app/templates/project_files"
const outputPath = "/var/lib/overleaf/data/compiles/"

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const templateProjectDir = Features.hasFeature('saas')
  ? 'example-project'
  : 'example-project-sp'

async function createBlankProject(
  ownerId,
  projectName,
  attributes = {},
  options
) {
  const isImport = attributes && attributes.overleaf
  const project = await _createBlankProject(
    ownerId,
    projectName,
    attributes,
    options
  )
  const segmentation = _.pick(attributes, [
    'fromV1TemplateId',
    'fromV1TemplateVersionId',
  ])
  Object.assign(segmentation, attributes.segmentation)
  segmentation.projectId = project._id
  if (isImport) {
    AnalyticsManager.recordEventForUserInBackground(
      ownerId,
      'project-imported',
      segmentation
    )
  } else {
    AnalyticsManager.recordEventForUserInBackground(
      ownerId,
      'project-created',
      segmentation
    )
  }
  return project
}

async function createProjectFromSnippet(ownerId, projectName, docLines) {
  const project = await _createBlankProject(ownerId, projectName)
  AnalyticsManager.recordEventForUserInBackground(ownerId, 'project-created', {
    projectId: project._id,
  })
  await _createRootDoc(project, ownerId, docLines)
  return project
}

async function createBasicProject(ownerId, projectName) {
  const project = await _createBlankProject(ownerId, projectName)

  const docLines = await _buildTemplate('mainbasic.tex', ownerId, projectName)
  await _createRootDoc(project, ownerId, docLines)

  AnalyticsManager.recordEventForUserInBackground(ownerId, 'project-created', {
    projectId: project._id,
  })

  return project
}

async function createExampleProject(ownerId, projectName) {
  const project = await _createBlankProject(ownerId, projectName)

  await _addExampleProjectFiles(ownerId, projectName, project)
  AnalyticsManager.recordEventForUserInBackground(ownerId, 'project-created', {
    projectId: project._id,
  })

  return project
}

// Create a project from an aexisting template. Different from createTemplate.
async function createTemplateProject(ownerId, projectName) {
  const project = await _createBlankProject(ownerId, projectName)

  await _addTemplateProjectFiles(ownerId, projectName, project, templateProjectDir)
  AnalyticsManager.recordEventForUserInBackground(ownerId, 'project-created', {
    projectId: project._id,
  })

  return project
}

async function createGitProject(ownerId, projectLink) {
  console.log("Importing git project")
  const regex = /^git@(.+?)\.com:(.+?)\/(.+?)\.git$/;
  const match = projectLink.match(regex);

  if (match) {
    const username = match[1];
    const repoName = match[2];
    const projectName = `${repoName} (${username})`
    const project = await _createBlankProject(ownerId, projectName)
    AnalyticsManager.recordEventForUser(ownerId, 'project-created', {
      projectId: project._id,
    })
    await gitClone(project._id, ownerId, projectLink)

    return project
  } else {
    throw new Error('Invalid SSH URL format');
  }
}

async function _addExampleProjectFiles(ownerId, projectName, project) {
  const mainDocLines = await _buildTemplate(
    `${templateProjectDir}/main.tex`,
    ownerId,
    projectName
  )
  await _createRootDoc(project, ownerId, mainDocLines)

  const bibDocLines = await _buildTemplate(
    `${templateProjectDir}/sample.bib`,
    ownerId,
    projectName
  )
  await ProjectEntityUpdateHandler.promises.addDoc(
    project._id,
    project.rootFolder[0]._id,
    'sample.bib',
    bibDocLines,
    ownerId,
    null
  )

  const frogPath = path.join(
    __dirname,
    `/../../../templates/project_files/${templateProjectDir}/frog.jpg`
  )
  await ProjectEntityUpdateHandler.promises.addFile(
    project._id,
    project.rootFolder[0]._id,
    'frog.jpg',
    frogPath,
    null,
    ownerId,
    null
  )
}

async function addTemplateFolder(projectId, ownerId, parentId, name) {
  console.log("on ajoute un dossier")
  console.log("dossier ajouté : ", name)
  const doc = await EditorController.promises.addFolder(
    projectId,
    parentId,
    name,
    'editor',
    ownerId
  )

  //await recAddFiles(projectId, ownerId, parentId, name, itemPath)
  return doc._id.toString()
}

async function addTemplateFile(ownerId, projectId, itemPath, parentId) {
  console.log("on ajoute un fichier")
  try {
    await ProjectEntityUpdateHandler.promises.addFile(
          projectId,
          parentId,
          path.basename(itemPath),
          itemPath,
          null,
          ownerId,
          null
        )
  } catch (err) {
    console.error(err.message)
    return "0"
  }
}

async function addDocFile(ownerId, projectName, projectId, filespath, itemPath, parentId, localPath) {
  console.log("projectName : ", projectName)
  console.log("itemPath : ", itemPath)
  const filepath = path.join(filespath, itemPath)
  const bibDocLines = await _buildTemplate(
    `${path.join(localPath, path.basename(itemPath))}`,
    ownerId,
    projectName
  )
  await ProjectEntityUpdateHandler.promises.addDoc(
    projectId,
    parentId,
    path.basename(itemPath),
    bibDocLines,
    ownerId,
    null
  )
}

/*async function recAddFiles(ownerId, projectName, project, filespath, templatePath) {
  const items = await fse.readdir(templatePath)
  console.log("recAddFiles a été appelé avec templatePath = ", templatePath)
  for (const item of items){
    const itemPath = path.join(templatePath, item)
    const stat = await fse.stat(itemPath)
    if (stat.isDirectory() && item != ".git"){
      const newFolderId = await addFolder(project._id, ownerId, project.rootFolder[0]._id, item, itemPath)
      await recAddFiles(ownerId, projectName, project, filespath, templatePath)
    } else {
      const itemPath = path.join(templatePath, item)
      const isDoc = itemPath.match(/\.bib$/)
      if (isDoc){
        await addDocFile(ownerId, projectName, project, filespath, itemPath)
      } else if (path.basename(itemPath).localeCompare("main.tex")){
        await addFile(ownerId, project, itemPath, )
      }
    }
  }
}*/

async function recAddFiles(currentPath, projectId, ownerId, parentId, projectName, localPath){

  const items = await fse.readdir(currentPath)

  console.log("localPath : ", localPath)
  for (const item of items) {
    console.log("on traite ", item)
    const itemPath = path.join(currentPath, item)
    const stat = await fse.stat(itemPath)

    if (stat.isDirectory() && item != ".git") {
      console.log("on traite un dossier")
      const newFolderId = await addTemplateFolder(projectId, ownerId, parentId, item)
      await recAddFiles(itemPath, projectId, ownerId, newFolderId, projectName, path.join(localPath, item))
    } else if (stat.isFile()) {
      const itemPath = path.join(currentPath, item)
      const isDoc = itemPath.match(/\.bib$/)
      if (isDoc){
        console.log("on traite de la doc")
        await addDocFile(ownerId, projectName, projectId, currentPath, itemPath, parentId, localPath)
      } else if (path.basename(itemPath).localeCompare("main.tex")){
        console.log("on traite un fichier")
        await addTemplateFile(ownerId, projectId, itemPath, parentId)
      }
    } 
  }
}

/*async function _addTemplateProjectFiles(ownerId, projectName, project, filespath) {
  temp = path.join(filespath, 'main.tex')
  const main = temp
  const mainDocLines = await _buildTemplate(
    `${main}`,
    ownerId,
    projectName
  )
  await _createRootDoc(project, ownerId, mainDocLines)
  const templatePath = path.join(
    __dirname,
    `/../../../templates/project_files`,
    templateProjectDir
  )

  await recAddFiles(ownerId, projectName, project, filespath, templatePath)
}*/

function getRootId(projectId) {
  let decimalValue = BigInt('0x' + projectId)
  let decrementedValue = decimalValue - BigInt(1)
  let decrementedHexString = decrementedValue.toString(16)
  return decrementedHexString
}

async function _addTemplateProjectFiles(ownerId, projectName, project, filespath) {
  temp = path.join(filespath, 'main.tex')
  const main = temp
  const mainDocLines = await _buildTemplate(
    `${main}`,
    ownerId,
    projectName
  )
  await _createRootDoc(project, ownerId, mainDocLines)
  const templatePath = path.join(
    __dirname,
    `/../../../templates/project_files`,
    templateProjectDir
  )
  console.log("on a filespath : ", filespath)
  console.log("et templatePath : ", templatePath)
  await recAddFiles(templatePath, project._id, ownerId, getRootId(project._id), projectName, templateProjectDir)
}

async function _createBlankProject(
  ownerId,
  projectName,
  attributes = {},
  { skipCreatingInTPDS = false } = {}
) {
  metrics.inc('project-creation')
  const timer = new metrics.Timer('project-creation')
  await ProjectDetailsHandler.promises.validateProjectName(projectName)

  const rootFolder = new Folder({ name: 'rootFolder' })

  attributes.lastUpdatedBy = attributes.owner_ref = new ObjectId(ownerId)
  attributes.name = projectName
  const project = new Project(attributes)

  // Initialise the history unless the caller has overridden it in the attributes
  // (to allow scripted creation of projects without full project history)
  if (project.overleaf.history.id == null && !attributes.overleaf) {
    const historyId = await HistoryManager.promises.initializeProject(
      project._id
    )
    if (historyId != null) {
      project.overleaf.history.id = historyId
    }
  }

  // All the projects are initialised with Full Project History. This property
  // is still set for backwards compatibility: Server Pro requires all projects
  // have it set to `true` since SP 4.0
  project.overleaf.history.display = true

  if (Settings.currentImageName) {
    // avoid clobbering any imageName already set in attributes (e.g. importedImageName)
    if (!project.imageName) {
      project.imageName = Settings.currentImageName
    }
  }
  project.rootFolder[0] = rootFolder
  const user = await User.findById(ownerId, {
    'ace.spellCheckLanguage': 1,
    _id: 1,
  })
  project.spellCheckLanguage = user.ace.spellCheckLanguage
  const historyRangesSupportAssignment =
    await SplitTestHandler.promises.getAssignmentForUser(
      user._id,
      'history-ranges-support'
    )
  if (historyRangesSupportAssignment.variant === 'enabled') {
    project.overleaf.history.rangesSupportEnabled = true
  }
  await project.save()
  if (!skipCreatingInTPDS) {
    await TpdsUpdateSender.promises.createProject({
      projectId: project._id,
      projectName,
      ownerId,
      userId: ownerId,
    })
  }
  timer.done()
  return project
}

async function _createRootDoc(project, ownerId, docLines) {
  try {
    const { doc } = await ProjectEntityUpdateHandler.promises.addDoc(
      project._id,
      project.rootFolder[0]._id,
      'main.tex',
      docLines,
      ownerId,
      null
    )
    await ProjectEntityUpdateHandler.promises.setRootDoc(project._id, doc._id)
  } catch (error) {
    throw OError.tag(error, 'error adding root doc when creating project')
  }
}

async function _buildTemplate(templateName, userId, projectName) {
  const user = await User.findById(userId, 'first_name last_name')
  const templatePath = path.join(
    __dirname,
    `/../../../templates/project_files/${templateName}`
  )
  const template = fs.readFileSync(templatePath)
  const data = {
    project_name: projectName,
    user,
    year: new Date().getUTCFullYear(),
    month: MONTH_NAMES[new Date().getUTCMonth()],
  }
  const output = _.template(template.toString())(data)
  return output.split('\n')
}

async function createTemplate(ownerId, projectName){
  const project = await createBasicProject(ownerId, projectName)
  await templateUpdate(project._id, ownerId)
  return project
}

async function templateUpdate(projectId, ownerId){
  console.log("Copying")
  const src = outputPath + projectId + "-" + ownerId
  const dest = dataPath + projectId + "-" + ownerId
  const bannedFiles = ['output.aux', 'output.fdb_latexmk', 'output.fls', 'output.log', 'output.pdf', 'output.stdout', 'output.synctex.gz', '.project-sync-state'];

  resetFolder(dest)

    fse.copy(src, dest, err => {

        if (err) {
          console.error(`Error when copying ${src} to ${dest}:`, err)
          return
        }

        fse.readdir(dest, (err, files) => {
        if (err) {
            console.error(`Erreur when reading folder: ${err}`)
            return
        }

        files.forEach(file => {

            const filePath = path.join(dest, file)

            fse.stat(filePath, (err, stats) => {

                if (err) {
                    console.error(`Error getting stats of file: ${filePath}, ${err}`);
                    return;
                }

                if (bannedFiles.includes(path.basename(filePath))) {
                   fse.remove(filePath, err => {
                        if (err) {
                            console.error(`Couldn't delete file: ${filePath}, ${err}`)
                            return
                        }
                    });
                }
           });
       });
    console.log("Source: " + src)
    console.log("Destination: " + dest)
    })
  })
}



module.exports = {
  createBlankProject: callbackify(createBlankProject),
  createProjectFromSnippet: callbackify(createProjectFromSnippet),
  createBasicProject: callbackify(createBasicProject),
  createExampleProject: callbackify(createExampleProject),
  createGitProject: callbackify(createGitProject),
  createTemplateProject: callbackify(createTemplateProject),
  promises: {
    createBlankProject,
    createProjectFromSnippet,
    createBasicProject,
    createExampleProject,
    createGitProject,
    createTemplateProject
  },
}