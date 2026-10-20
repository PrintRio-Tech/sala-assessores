import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

describe('ReleaseFormPage contrato de composição', () => {
  it('consome RichTextEditor e RichTextViewer de @print/ui, sem TipTap local', () => {
    const root = dirname(fileURLToPath(import.meta.url))
    const editor = readFileSync(join(root, '../components/ReleaseFormEditor/index.tsx'), 'utf8')
    const document = readFileSync(join(root, '../../list/components/ReleaseDocument/index.tsx'), 'utf8')
    const sidebar = readFileSync(join(root, '../components/ReleaseFormSidebar/index.tsx'), 'utf8')

    expect(editor).toContain("import { RichTextEditor")
    expect(editor).toContain("from '@print/ui'")
    expect(editor).not.toContain('@tiptap')
    expect(document).toContain('RichTextViewer')
    expect(document).toContain("from '@print/ui'")
    expect(sidebar).toContain('SearchableSelectField')
    expect(sidebar).toContain('Baixar modelo')
    expect(sidebar).toContain('Importar planilha')
    expect(sidebar).not.toContain('PersonSelectField')
    expect(sidebar).not.toContain('Atividade vinculada')
  })

  it('Destinatários usa SearchableSelectField contained, mesma casca do Select da sidebar', () => {
    const root = dirname(fileURLToPath(import.meta.url))
    const sidebar = readFileSync(join(root, '../components/ReleaseFormSidebar/index.tsx'), 'utf8')
    const block = sidebar.match(/<SearchableSelectField[\s\S]*?label="Destinatários"[\s\S]*?\/>/)?.[0]

    expect(block).toBeDefined()
    expect(block).toContain('contained')
  })
})
