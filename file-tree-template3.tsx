import React, { createContext, useContext, useState, FC, ReactNode } from 'react'
import { useProjectContext } from '../../../shared/context/project-context'
import { postJSON } from '../../../infrastructure/fetch-json'

interface Template {
    id: string
    name: string
    category: string
    description?: string
    thumbnail?: string;
}

interface FileTreeTemplateContextType {
    isTemplateTabOpen: boolean
    openTemplateTab: () => void
    closeTemplateTab: () => void
    importTemplate: (templateId: string) => Promise<boolean>
    availableTemplates: Template[]
    isImporting: boolean
}

const FileTreeTemplateContext = createContext<FileTreeTemplateContextType | null>(null)

export const FileTreeTemplateProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [isTemplateTabOpen, setIsTemplateTabOpen] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const { _id: projectId } = useProjectContext()

  // Exemple de templates disponibles (à remplacer par une vraie API)
  const availableTemplates: Template[] = [
    { id: 'academic-paper-1', name: 'Academic Paper 1', category: 'academic_papers' },
    { id: 'academic-paper-2', name: 'Academic Paper 2', category: 'academic_papers' },
    { id: 'presentation-1', name: 'Presentation 1', category: 'presentations' },
    { id: 'presentation-2', name: 'Presentation 2', category: 'presentations' },
  ]

  const openTemplateTab = () => {
    setIsTemplateTabOpen(true)
  }

  const closeTemplateTab = () => {
    setIsTemplateTabOpen(false)
  }

  const importTemplate = async (templateIdorURL: string): Promise<boolean> => {
    setIsImporting(true)
    try {
      // Appel à l'API pour importer un template
      const response = await postJSON(`/project/${projectId}/import`, { 
        templateUrl: templateIdorURL,
        templatename 
      })
      setIsImporting(false)
      return response.success;
    } catch (error) {
      console.error('Error importing template:', error)
      setIsImporting(false)
      return false
    }
  }

  return (
    <FileTreeTemplateContext.Provider
      value={{
        isTemplateTabOpen,
        openTemplateTab,
        closeTemplateTab,
        importTemplate,
        availableTemplates,
        isImporting
      }}
    >
      {children}
    </FileTreeTemplateContext.Provider>
  )
}

export const useFileTreeTemplate = () => {
    const context = useContext(FileTreeTemplateContext)
    if (!context) {
      throw new Error('useFileTreeTemplate must be used within a FileTreeTemplateProvider')
    }
    return context
  }