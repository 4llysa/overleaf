import BlankProjectModal from './blank-project-modal'
import ExampleProjectModal from './example-project-modal'
import GitProjectModal from './git-project-modal'
import ImportTemplateModal from './import-template-modal'
import importOverleafModules from '../../../../../macros/import-overleaf-module.macro'
import { JSXElementConstructor, lazy, Suspense, useCallback} from 'react'//, useState } from 'react'
import { Nullable } from '../../../../../../types/utils'
import { FullSizeLoadingSpinner } from '@/shared/components/loading-spinner'
import { useLocation } from '@/shared/hooks/use-location'
import TemplateGetter from '../../../../../../app/src/Features/Templates/TemplateGetter'
import {readdir} from 'fs-extra'
/*import {
  postJSON
} from '../../../../infrastructure/fetch-json'*/
import { useUserContext } from '../../../../shared/context/user-context'


const templatePath = "/var/lib/overleaf/data/template_files/users/"

export type NewProjectButtonModalVariant =
  | 'blank_project'
  | 'example_project'
  | 'upload_project'
  | 'import_from_git_free'
  | 'import_from_github'
  | 'import_from_template'

const UploadProjectModal = lazy(() => import('./upload-project-modal'))

type NewProjectButtonModalProps = {
  modal: Nullable<NewProjectButtonModalVariant>
  onHide: () => void
  templatesMap?: Record<string, string>
}

function NewProjectButtonModal({ modal, onHide}: NewProjectButtonModalProps) {//, templatesMap = {} }: NewProjectButtonModalProps) {
  const [importProjectFromGithubModalWrapper] = importOverleafModules(
    'importProjectFromGithubModalWrapper'
  )
  const ImportProjectFromGithubModalWrapper: JSXElementConstructor<{
    onHide: () => void
  }> = importProjectFromGithubModalWrapper?.import.default

  const location = useLocation()
  const { id: userId } = useUserContext()
  const openProject = useCallback(
    (projectId: string) => {
      location.assign(`/project/${projectId}`)
    },
    [location]
  )

  switch (modal) {
    case 'blank_project':
      return <BlankProjectModal onHide={onHide} />
    case 'example_project':
      return <ExampleProjectModal onHide={onHide} />
    case 'upload_project':
      return (
        <Suspense fallback={<FullSizeLoadingSpinner delay={500} />}>
          <UploadProjectModal onHide={onHide} openProject={openProject} />
        </Suspense>
      )
    case 'import_from_git_free':
      return <GitProjectModal onHide={onHide} />
    case 'import_from_github':
      return <ImportProjectFromGithubModalWrapper onHide={onHide} />
    //case 'import_from_template':
      /*runAsync(
            postJSON('/template', {
              body:{
                projectId: projectId,
                userId: userId//,
                //projectName: projectName
              }
            })
        );
      return (
        <ImportTemplateModal
          //show
          onHide={onHide}
          visible={true}
          //templatesMap={TemplateGetter.getTemplate(readdir(templatePath+"/"+userId), {}, function () {})}
          openProject={openProject} 
        />
      )*/
     //case 'import_from_template':

    default:
      return null
  }
}

export default NewProjectButtonModal
