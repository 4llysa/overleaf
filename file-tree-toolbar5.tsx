import React from 'react';
import { useTranslation } from 'react-i18next';
import * as eventTracking from '../../../infrastructure/event-tracking';
import { Button } from 'react-bootstrap';
import Tooltip from '../../../shared/components/tooltip';
import Icon from '../../../shared/components/icon';
import { useProjectContext } from '@/shared/context/project-context';
import { useEditorContext } from '../../../shared/context/editor-context';
import { useFileTreeActionable } from '../contexts/file-tree-actionable';
import { showNotification } from '../../../infrastructure/notification-system';
import useAsync from '../../../shared/hooks/use-async';
import {
  getUserFacingMessage,
  postJSON,
} from '../../../infrastructure/fetch-json';
import { useFileTreeTemplate } from '../contexts/file-tree-template';

type NewProjectData = {
  project_id: string
  owner_ref: string
  owner: {
    first_name: string
    last_name: string
    email: string
    id: string
  }
}

function FileTreeToolbar() {
  const { permissionsLevel } = useEditorContext();

  if (permissionsLevel === 'readOnly') return null;

  return (
    <div className="toolbar toolbar-filetree">
      <FileTreeToolbarLeft />
      <FileTreeToolbarRight />
    </div>
  );
}

function FileTreeToolbarLeft() {
  const { t } = useTranslation();
  const { isLoading, runAsync } = useAsync();
  const { _id: projectId } = useProjectContext();
  const {
    canCreate,
    startCreatingFolder,
    startCreatingDocOrFile,
    startUploadingDocOrFile,
  } = useFileTreeActionable();
  const { openTemplateTab } = useFileTreeTemplate();

  const createWithAnalytics = () => {
    eventTracking.sendMB('new-file-click', { location: 'toolbar' });
    startCreatingDocOrFile();
  };

  const uploadWithAnalytics = () => {
    eventTracking.sendMB('upload-click', { location: 'toolbar' });
    startUploadingDocOrFile();
  };

  const handleTemplateClick = () => {
    eventTracking.sendMB('template-project-click', { location: 'toolbar' });
    openTemplateTab();
  };

  const handleGitPull = async () => {
    eventTracking.sendMB('git-pull-click', { location: 'toolbar' });

    try {
      await runAsync(
        postJSON(`/project/${projectId}/git/pull`, {})
      );
      showNotification({
        type: 'success',
        message: t('git_pull_success'),
        duration: 3000 // 3 secondes
      });
    } catch (error) {
      const message = getUserFacingMessage(error);
      console.error(message);
      showNotification({
        type: 'error',
        message: t('git_pull_failed'),
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="toolbar-left">
      {canCreate && (
        <>
          <Tooltip id="new-file" description={t('new_file')} overlayProps={{ placement: 'bottom' }}>
            <Button 
              onClick={createWithAnalytics} 
              bsStyle={null}
            >
              <Icon type="file" fw accessibilityLabel={t('new_file')} />
            </Button>
          </Tooltip>
          <Tooltip id="new-folder" description={t('new_folder')} overlayProps={{ placement: 'bottom' }}>
            <Button 
              onClick={startCreatingFolder} 
              bsStyle={null}
            >
              <Icon type="folder" fw accessibilityLabel={t('new_folder')} />
            </Button>
          </Tooltip>
        </>
      )}
      <Tooltip id="upload" description={t('upload')} overlayProps={{ placement: 'bottom' }}>
        <Button onClick={uploadWithAnalytics}>
          <Icon type="upload" fw accessibilityLabel={t('upload')} />
        </Button>
      </Tooltip>
      <Tooltip
        id="template-project"
        description={t('project_with_template')}
        overlayProps={{ placement: 'bottom' }}
      >
        <Button onClick={handleTemplateClick} bsStyle={null}>
          <Icon type="copy" fw accessibilityLabel={t('project_with_template')} />
        </Button>
      </Tooltip>
      <Tooltip 
        id="git-pull" 
        description={t('git_pull')} 
        overlayProps={{ placement: 'bottom' }}
      >
        <Button 
          onClick={handleGitPull}
          disabled={isLoading}
          bsStyle={null}
        >
          {isLoading ? (
            <Icon type="spinner" spin fw accessibilityLabel={t('loading')} />
          ) : (
            <Icon type="code-fork" fw accessibilityLabel={t('git_pull')} />
          )}
        </Button>
      </Tooltip>
    </div>
  );
}

function FileTreeToolbarRight() {
  const { t } = useTranslation();
  const { canRename, canDelete, startRenaming, startDeleting } =
    useFileTreeActionable();

  if (!canRename && !canDelete) {
    return null;
  }

  return (
    <div className="toolbar-right">
      {canRename ? (
        <Tooltip
          id="rename"
          description={t('rename')}
          overlayProps={{ placement: 'bottom' }}
        >
          <Button onClick={startRenaming}>
            <Icon type="pencil" fw accessibilityLabel={t('rename')} />
          </Button>
        </Tooltip>
      ) : null}
      {canDelete ? (
        <Tooltip
          id="delete"
          description={t('delete')}
          overlayProps={{ placement: 'bottom' }}
        >
          <Button onClick={startDeleting}>
            <Icon type="trash-o" fw accessibilityLabel={t('delete')} />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export default FileTreeToolbar;