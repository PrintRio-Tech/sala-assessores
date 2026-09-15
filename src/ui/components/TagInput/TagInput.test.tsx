import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TagInput } from './TagInput'

function Harness({
  initial = [],
  suggestions = ['Operação', 'urgente', 'ESG', 'economia', 'energia', 'governança', 'extra'],
  loading = false,
}: {
  initial?: string[]
  suggestions?: string[]
  loading?: boolean
}) {
  const [tags, setTags] = useState(initial)
  return <TagInput tags={tags} onChange={setTags} suggestions={suggestions} loading={loading} />
}

describe('TagInput', () => {
  it('cria chips com Enter, vírgula e blur, sem CSV', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Tags' })

    await user.type(input, 'Operação{Enter}')
    await user.type(input, 'ESG,')
    await user.type(input, 'energia')
    await user.tab()

    expect(screen.getByLabelText('Tags selecionadas')).toHaveTextContent('Operação')
    expect(screen.getByLabelText('Tags selecionadas')).toHaveTextContent('ESG')
    expect(screen.getByLabelText('Tags selecionadas')).toHaveTextContent('energia')
    expect(input).toHaveValue('')
  })

  it('ignora duplicata case-insensitive e só limpa o input', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Operação']} />)
    const input = screen.getByRole('textbox', { name: 'Tags' })

    await user.type(input, 'operação{Enter}')

    expect(within(screen.getByLabelText('Tags selecionadas')).getAllByText('Operação')).toHaveLength(1)
    expect(input).toHaveValue('')
  })

  it('remove o último chip com Backspace no input vazio e o clicado pelo x', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Operação', 'ESG']} />)

    await user.click(screen.getByRole('button', { name: 'Remover tag ESG' }))
    expect(screen.queryByText('ESG')).not.toBeInTheDocument()

    await user.click(screen.getByRole('textbox', { name: 'Tags' }))
    await user.keyboard('{Backspace}')
    expect(screen.queryByLabelText('Tags selecionadas')).not.toBeInTheDocument()
  })

  it('sugere no máximo 6 tags locais e desabilita sugestões em loading, sem spinner', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await user.type(input, 'e')

    const listbox = screen.getByRole('listbox', { name: 'Sugestões de tags' })
    expect(within(listbox).getAllByRole('option')).toHaveLength(6)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    rerender(<Harness loading />)
    const loadingList = screen.getByRole('listbox', { name: 'Sugestões de tags' })
    for (const option of within(loadingList).getAllByRole('option')) {
      expect(option).toBeDisabled()
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
