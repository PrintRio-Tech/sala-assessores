import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { NewLocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
import { DemandCreateDrawer } from './DemandCreateDrawer'

const journalist: Journalist = {
  id: 'j-carolina',
  name: 'Carolina Montenegro',
  roleTitle: 'Repórter',
  outletName: 'Valor Econômico',
  desk: 'Economia',
  email: 'c.montenegro@valor.com.br',
  phone: '+55 11 90000-0000',
  preferredChannel: 'email',
  bestContactWindow: 'Manhã',
  topics: ['Economia'],
  isActive: true,
  objectiveStats: {
    totalDemands: 1,
    solicitedCount: 1,
    proactiveCount: 0,
    successRate: 1,
    positioningUsageRate: 1,
  },
  demandHistory: [],
  relationshipEvaluations: [],
}

const capture: NewLocalDemandCapture = {
  subject: 'Resultados do Q1 2024',
  factContext: 'Envio de release com resultados do primeiro trimestre.',
  pressRequest: 'Pedido de posicionamento sobre o trimestre.',
  requestedDeadline: '2026-03-12',
  channel: 'E-mail',
  contactMode: 'known',
  contactName: 'Carolina Montenegro',
  contactOutlet: 'Valor Econômico',
  journalistId: 'j-carolina',
  journalistName: 'Carolina Montenegro',
  outletName: 'Valor Econômico',
}

function EditSession({ onCapture = vi.fn() }: { onCapture?: (capture: NewLocalDemandCapture) => void }) {
  const [open, setOpen] = useState(true)
  const [mode, setMode] = useState<'create' | 'edit'>('edit')

  return (
    <DemandCreateDrawer
      open={open}
      mode={mode}
      initialCapture={capture}
      journalists={[journalist]}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return
        setOpen(false)
        setMode('create')
      }}
      onCapture={(next) => {
        onCapture(next)
        setOpen(false)
        setMode('create')
      }}
    />
  )
}

describe('DemandCreateDrawer edit close', () => {
  it('fecha a edição salva sem virar Nova demanda nem pedir descarte da captura', async () => {
    const onCapture = vi.fn()
    const user = userEvent.setup()
    render(<EditSession onCapture={onCapture} />)

    const drawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Assunto' }), {
      target: { value: 'Resultados do Q1 corrigidos' },
    })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }))

    expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Resultados do Q1 corrigidos',
    }))
    expect(screen.queryByRole('dialog', { name: /Descartar captura/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Descartar alterações/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Nova demanda/ })).not.toBeInTheDocument()
  })
})

describe('DemandCreateDrawer edit session', () => {
  it('não volta ao primeiro passo quando o initialCapture ganha nova identidade com o drawer aberto', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DemandCreateDrawer
        open
        mode="edit"
        initialCapture={capture}
        journalists={[journalist]}
        onOpenChange={vi.fn()}
        onCapture={vi.fn()}
      />,
    )

    const drawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    expect(within(drawer).getByRole('textbox', { name: 'Assunto' })).toBeVisible()

    rerender(
      <DemandCreateDrawer
        open
        mode="edit"
        initialCapture={{ ...capture }}
        journalists={[journalist]}
        onOpenChange={vi.fn()}
        onCapture={vi.fn()}
      />,
    )

    expect(within(drawer).getByRole('textbox', { name: 'Assunto' })).toBeVisible()
    expect(within(drawer).queryByRole('combobox', { name: 'Canal de entrada' })).not.toBeInTheDocument()
  })
})

describe('DemandCreateDrawer capture fields', () => {
  it('organiza três decisões: contato com prioridade, pedido e classificação opcional, sem apuração', async () => {
    const onCapture = vi.fn()
    const user = userEvent.setup()
    render(
      <DemandCreateDrawer
        open
        journalists={[journalist]}
        tagSuggestions={['operação', 'urgente']}
        onOpenChange={vi.fn()}
        onCapture={onCapture}
      />,
    )

    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    expect(within(drawer).getByRole('tab', { name: 'Contato' })).toBeVisible()
    expect(within(drawer).getByRole('tab', { name: 'Pedido' })).toBeVisible()
    expect(within(drawer).getByRole('tab', { name: 'Classificação' })).toBeVisible()
    expect(within(drawer).queryByRole('tab', { name: 'Caso' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('combobox', { name: 'Responsável' })).not.toBeInTheDocument()

    await user.click(within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' }))
    await user.click(await screen.findByRole('option', { name: 'Carolina Montenegro' }))
    expect(within(drawer).queryByText('Nome do contato')).not.toBeInTheDocument()
    expect(within(drawer).queryByText('Redação ou veículo')).not.toBeInTheDocument()
    expect(within(drawer).getByRole('region', { name: 'Contexto do contato' }).querySelector('.pf-card, [class*="card"]')).toBeNull()
    await user.click(within(drawer).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Prioridade' }))
    expect(await screen.findByRole('option', { name: 'Crítica' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Urgente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Normal' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'Alta' }))
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))

    expect(within(drawer).getByRole('textbox', { name: 'Assunto' })).toBeVisible()
    expect(within(drawer).getByRole('textbox', { name: 'O que aconteceu?' })).toBeVisible()
    expect(within(drawer).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' })).toBeVisible()
    expect(within(drawer).queryByRole('group', { name: 'Apuração' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('textbox', { name: 'Fatos confirmados' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('textbox', { name: 'Pendências' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('textbox', { name: 'Tags' })).not.toBeInTheDocument()
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Assunto' }), { target: { value: 'Entrevista' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que aconteceu?' }), { target: { value: 'Pedido de pauta.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' }), { target: { value: 'Entrevista exclusiva.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Prazo solicitado' }), { target: { value: '12/03/2026' } })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))

    expect(within(drawer).getByRole('textbox', { name: 'Tags' })).toBeVisible()
    expect(within(drawer).getByRole('textbox', { name: 'Tema' })).toBeVisible()
    expect(within(drawer).getByRole('textbox', { name: 'Áreas ou entidades' })).toBeVisible()
    expect(within(drawer).queryByRole('textbox', { name: 'Próximo passo' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('group', { name: 'Apuração' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('group', { name: 'Acompanhamento' })).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('combobox', { name: 'Prioridade' })).not.toBeInTheDocument()
    await user.type(within(drawer).getByRole('textbox', { name: 'Tags' }), 'operação{Enter}')
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Tema' }), { target: { value: 'Governança' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Áreas ou entidades' }), { target: { value: 'Jurídico' } })
    await user.click(within(drawer).getByRole('button', { name: 'Concluir captura' }))

    expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Entrevista',
      priority: 'high',
      enrichment: expect.objectContaining({
        tags: ['operação'],
        topics: ['Governança'],
        relatedAreas: ['Jurídico'],
        confirmedFacts: [],
        pendingFacts: [],
        nextStep: null,
      }),
    }))
  })

  it('preserva fatos, pendências e próximo passo já gravados ao editar só a classificação', async () => {
    const onCapture = vi.fn()
    const user = userEvent.setup()
    render(
      <DemandCreateDrawer
        open
        mode="edit"
        initialCapture={{
          ...capture,
          enrichment: {
            tags: ['original'],
            topics: ['Tecnologia'],
            relatedAreas: ['Presidência'],
            confirmedFacts: ['Hub anunciado.'],
            pendingFacts: ['Confirmar data da entrevista.'],
            nextStep: 'Preparar briefing.',
          },
        }}
        journalists={[journalist]}
        onOpenChange={vi.fn()}
        onCapture={onCapture}
      />,
    )

    const drawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    expect(within(drawer).queryByRole('group', { name: 'Apuração' })).not.toBeInTheDocument()
    await user.click(within(drawer).getByRole('tab', { name: 'Classificação' }))
    expect(within(drawer).queryByRole('textbox', { name: 'Próximo passo' })).not.toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }))

    expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
      enrichment: expect.objectContaining({
        tags: ['original'],
        confirmedFacts: ['Hub anunciado.'],
        pendingFacts: ['Confirmar data da entrevista.'],
        nextStep: 'Preparar briefing.',
      }),
    }))
  })

  it('não bloqueia a captura quando a classificação fica vazia', async () => {
    const onCapture = vi.fn()
    const user = userEvent.setup()
    render(
      <DemandCreateDrawer
        open
        journalists={[journalist]}
        onOpenChange={vi.fn()}
        onCapture={onCapture}
      />,
    )
    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    await user.click(within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' }))
    await user.click(await screen.findByRole('option', { name: 'Carolina Montenegro' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'Telefone' }))
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Assunto' }), { target: { value: 'Caso rápido' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que aconteceu?' }), { target: { value: 'Fato inicial.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' }), { target: { value: 'Nota.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Prazo solicitado' }), { target: { value: '12/03/2026' } })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    expect(within(drawer).getByRole('textbox', { name: 'Tags' })).toBeVisible()
    await user.click(within(drawer).getByRole('button', { name: 'Concluir captura' }))

    expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Caso rápido',
      priority: null,
      enrichment: expect.objectContaining({ tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null }),
    }))
  })
})
