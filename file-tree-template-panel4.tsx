import React, {useState} from 'react' //
import { useTranslation } from 'react-i18next'
import { Button, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap' //
import { useFileTreeTemplate } from '../contexts/file-tree-template'
import { showNotification } from '../../../infrastructure/notification-system';
import Icon from '../../../shared/components/icon' //
import * as eventTracking from '../../../infrastructure/event-tracking'//

function FileTreeTemplatePanel() {
  const { t } = useTranslation()
  const { 
    isTemplateTabOpen, 
    closeTemplateTab, 
    importTemplate, 
    availableTemplates,
    isImporting 
  } = useFileTreeTemplate()
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  if (!isTemplateTabOpen) return null
  // Regrouper les templates par catégorie
  const templatesByCategory = availableTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, typeof availableTemplates>)

  // Filtrer les templates basés sur la recherche
  const filteredTemplates = searchTerm.trim() 
    ? availableTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : availableTemplates

    const handleImportModalShow = () => {
        setShowImportModal(true)
        eventTracking.sendMB('template-import-click', { location: 'template-panel' })
      }
    
    const handleImportModalClose = () => {
        setShowImportModal(false)
        setImportUrl('')
      }
    
    const handleImportSubmit = async () => {
        if (!importUrl.trim()) return
        
        try {
          const success = await importTemplate(importUrl);
          
          if (success) {
            showNotification({
              type: 'success',
              message: t('template_import_success'),
              duration: 3000,
            })
            handleImportModalClose()
          } else {
            showNotification({
              type: 'error',
              message: t('template_import_failed'),
              duration: 3000,
            })
          }
        } catch (error) {
          showNotification({
            type: 'error',
            message: t('template_import_failed'),
            duration: 3000,
          })
        }
      }
    
    const handleTemplateSelect = async (templateId: string) => {
        eventTracking.sendMB('template-select', { template_id: templateId })
        
        try {
          const success = await importTemplate(templateId)
          
          if (success) {
            showNotification({
              type: 'success',
              message: t('template_applied_successfully'),
              duration: 3000,
            })
            closeTemplateTab()
          } else {
            showNotification({
              type: 'error',
              message: t('template_apply_failed'),
              duration: 3000,
            })
          }
        } catch (error) {
          showNotification({
            type: 'error',
            message: t('template_apply_failed'),
            duration: 3000,
          })
        }
      }

  
  return (
    <div className="file-tree-template-panel">
      <div className="file-tree-template-header">
        <h3>{t('project_templates')}</h3>
        <Button onClick={closeTemplateTab} bsStyle="link">
            <Icon type="times" accessibilityLabel={t('close')} />
        </Button>
      </div>

      <div className="file-tree-template-search">
        <FormControl
          type="text"
          placeholder={t('search_templates')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="import-template">
        <Button 
          onClick={handleImportModalShow} 
          bsStyle="primary"
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <Icon type="spinner" spin fw accessibilityLabel={t('loading')} />
              {t('importing')}
            </>
          ) : (
            <>
              <Icon type="upload" fw accessibilityLabel={t('import')} />
              {t('import_a_template')}
            </>
          )}
        </Button>
      </div>
    
      <div className="file-tree-template-content">
        {searchTerm.trim() ? (
          // Afficher les résultats de recherche
          <div className="template-search-results">
            <h4>{t('search_results')}</h4>
            <ul className="template-list">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => (
                  <li key={template.id}>
                    <Button 
                      bsStyle="link" 
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.name}
                    </Button>
                  </li>
                ))
              ) : (
                <li className="no-results">{t('no_templates_found')}</li>
              )}
            </ul>
          </div>
        ) : (
          // Afficher les templates par catégorie
          Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category} className="template-category">
              <h4>{t(category)}</h4>
              <ul className="template-list">
                {templates.map(template => (
                  <li key={template.id}>
                    <Button 
                      bsStyle="link" 
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      
      {/* Modal d'importation de template */}
      <Modal show={showImportModal} onHide={handleImportModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('import_template')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup>
            <ControlLabel>{t('template_url')}</ControlLabel>
            <FormControl
              type="text"
              placeholder={t('enter_template_url')}
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
            />
          </FormGroup>
          <p className="text-muted">
            {t('template_import_instructions')}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleImportModalClose}>{t('cancel')}</Button>
          <Button 
            bsStyle="primary" 
            onClick={handleImportSubmit}
            disabled={!importUrl.trim() || isImporting}
          >
            {isImporting ? (
              <>
                <Icon type="spinner" spin fw accessibilityLabel={t('loading')} />
                {t('importing')}
              </>
            ) : (
              t('import')
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}


//export default FileTreeTemplatePanel