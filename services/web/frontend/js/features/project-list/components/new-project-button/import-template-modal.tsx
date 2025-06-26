import { useEffect, useState } from 'react'
import { Modal, Button, List, Spin, Alert } from 'react-bootstrap'
import axios from 'axios'

type ImportTemplateModalProps = {
  onHide: () => void
  openProject: (projectId: string) => void
  visible: boolean
}

/*export default function ImportTemplateModal({ onHide, openProject, visible }: ImportTemplateModalProps) {
  const [templates, setTemplates] = useState<{ [id: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return;
    setLoading(true)
    setError(null)
    axios
      .post('/project/template/list') // adjust path if needed!
      .then(res => setTemplates(res.data))
      .catch(err => setError('Failed to load templates'))
      .finally(() => setLoading(false))
  }, [visible])

  return null/*(
    <Modal open={visible} onCancel={onHide} footer={null} title="Import from Template">
      {loading && <Spin />}
      {error && <Alert type="error" message={error} />}
      <List
        dataSource={Object.entries(templates)}
        renderItem={([projectId, name]) => (
          <List.Item>
            <Button type="link" onClick={() => openProject(projectId)}>
              {name}
            </Button>
          </List.Item>
        )}
      />
    </Modal>
  )
}*/