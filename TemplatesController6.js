const path = require('path')
const SessionManager = require('../Authentication/SessionManager')
const TemplatesManager = require('./TemplatesManager')
const ProjectHelper = require('../Project/ProjectHelper')
const logger = require('@overleaf/logger')
const { expressify } = require('@overleaf/promise-utils')

const TemplatesController = {
  getV1Template(req, res) {
    const templateVersionId = req.params.Template_version_id
    const templateId = req.query.id
    if (!/^[0-9]+$/.test(templateVersionId) || !/^[0-9]+$/.test(templateId)) {
      logger.err(
        { templateVersionId, templateId },
        'invalid template id or version'
      )
      return res.sendStatus(400)
    }
    const data = {
      templateVersionId,
      templateId,
      name: req.query.templateName,
      compiler: ProjectHelper.compilerFromV1Engine(req.query.latexEngine),
      imageName: req.query.texImage,
      mainFile: req.query.mainFile,
      brandVariationId: req.query.brandVariationId,
    }
    return res.render(
      path.resolve(
        __dirname,
        '../../../views/project/editor/new_from_template'
      ),
      data
    )
  },

  async createProjectFromV1Template(req, res) {
    const userId = SessionManager.getLoggedInUserId(req.session)
    const project = await TemplatesManager.promises.createProjectFromV1Template(
      req.body.brandVariationId,
      req.body.compiler,
      req.body.mainFile,
      req.body.templateId,
      req.body.templateName,
      req.body.templateVersionId,
      userId,
      req.body.imageName
    )
    delete req.session.templateData
    if (!project) {
      throw new Error('failed to create project from template')
    }
    return res.redirect(`/project/${project._id}`)
  },
}

// Ajouter dans services/web/app/src/Features/Templates/TemplatesController.js

async importTemplate(req, res) {
  try {
    const userId = SessionManager.getLoggedInUserId(req.session);
    const { templateUrl, templateName } = req.body;
    
    if (!templateUrl) {
      return res.status(400).json({ success: false, message: 'Template URL is required' });
    }

    // Extraire l'ID du template depuis l'URL si c'est un ID externe
    // ou utiliser directement si c'est un ID de template
    const templateId = /^[0-9]+$/.test(templateUrl) 
      ? templateUrl 
      : extractTemplateIdFromUrl(templateUrl);

    if (!templateId) {
      return res.status(400).json({ success: false, message: 'Invalid template URL or ID' });
    }

    // Récupérer les infos du template
    const templateInfo = await TemplatesManager.promises.fetchFromV1(templateId);
    
    // Créer un projet à partir du template
    const project = await TemplatesManager.promises.createProjectFromV1Template(
      null, // brandVariationId
      templateInfo.compiler || 'pdflatex',
      templateInfo.mainFile || 'main.tex',
      templateId,
      templateName || templateInfo.name || 'Imported Template',
      templateInfo.version_id,
      userId,
      templateInfo.imageName
    );

    if (!project) {
      throw new Error('Failed to create project from template');
    }

    return res.json({ 
      success: true, 
      projectId: project._id,
      message: 'Template imported successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error importing template');
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to import template'
    });
  }
}

// Fonction utilitaire pour extraire l'ID de template d'une URL
function extractTemplateIdFromUrl(url) {
  try {
    // Essai de trouver un ID dans l'URL (adapter selon ton format d'URL)
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const templateIdIndex = pathSegments.findIndex(segment => segment === 'templates' || segment === 'template');
    
    if (templateIdIndex !== -1 && pathSegments.length > templateIdIndex + 1) {
      return pathSegments[templateIdIndex + 1];
    }
    
    // Si on ne trouve pas via le chemin, chercher dans les paramètres
    return urlObj.searchParams.get('id') || urlObj.searchParams.get('template_id');
  } catch (e) {
    // Si l'URL est invalide, retourner null
    return null;
  }
}

module.exports = {
  getV1Template: TemplatesController.getV1Template,
  createProjectFromV1Template: expressify(
    TemplatesController.createProjectFromV1Template
  ),
}
