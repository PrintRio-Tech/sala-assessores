import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DemandClosureDrawer } from './DemandClosureDrawer'
import { DemandDecisionDrawer } from './DemandDecisionDrawer'
import { DemandEnrichmentDrawer } from './DemandEnrichmentDrawer'
import { DemandPositioningDrawer } from './DemandPositioningDrawer'
import { DemandReviewDrawer } from './DemandReviewDrawer'
import { DemandVersionDrawer } from './DemandVersionDrawer'

afterEach(cleanup)

describe('Demand action drawers', () => {
  it('normaliza listas e registra todo o enriquecimento da demanda', async () => {
    const onSave = vi.fn()
    render(<DemandEnrichmentDrawer open onOpenChange={vi.fn()} onSave={onSave} responsibleOptions={[{ value: 'ana', label: 'Ana Paula' }]} />)
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Tags' }), 'Urgente, imprensa, urgente')
    await user.type(screen.getByRole('textbox', { name: 'Tema' }), 'Mobilidade')
    await user.type(screen.getByRole('textbox', { name: 'Área' }), 'Transportes')
    await user.type(screen.getByRole('textbox', { name: 'Fatos confirmados' }), 'Linha interditada')
    await user.type(screen.getByRole('textbox', { name: 'Pendências' }), 'Confirmar horário')
    await user.click(screen.getByRole('combobox', { name: 'Responsável' }))
    await user.click(await screen.findByRole('option', { name: 'Ana Paula' }))
    await user.click(screen.getByRole('combobox', { name: 'Prioridade' }))
    await user.click(await screen.findByRole('option', { name: 'Urgente' }))
    await user.type(screen.getByRole('textbox', { name: 'Próximo passo' }), 'Validar com a área')
    await user.click(screen.getByRole('button', { name: 'Salvar enriquecimento' }))

    expect(onSave).toHaveBeenCalledWith({
      tags: ['Urgente', 'imprensa'], topic: 'Mobilidade', area: 'Transportes',
      confirmedFacts: 'Linha interditada', pendingItems: 'Confirmar horário',
      responsibleId: 'ana', priority: 'urgent', nextStep: 'Validar com a área',
    })
  })

  it('solicita review identificando revisor e versão', async () => {
    const onSubmit = vi.fn()
    render(<DemandReviewDrawer open onOpenChange={vi.fn()} onSubmit={onSubmit} reviewerOptions={[{ value: 'bia', label: 'Beatriz Lima' }]} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox', { name: 'Revisor' }))
    await user.click(await screen.findByRole('option', { name: 'Beatriz Lima' }))
    await user.type(screen.getByRole('textbox', { name: 'Versão para review' }), 'v2')
    await user.click(screen.getByRole('button', { name: 'Solicitar review' }))

    expect(onSubmit).toHaveBeenCalledWith({ reviewerId: 'bia', version: 'v2' })
  })

  it.each([
    ['Aprovar', 'approve'],
    ['Pedir ajustes', 'request_changes'],
    ['Reprovar', 'reject'],
  ] as const)('registra a decisão %s separada de estado e posicionamento', async (label, decision) => {
    const onSubmit = vi.fn()
    render(<DemandDecisionDrawer open onOpenChange={vi.fn()} onSubmit={onSubmit} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('radio', { name: label }))
    await user.type(screen.getByRole('textbox', { name: 'Responsável pela decisão' }), 'Ana Paula')
    await user.type(screen.getByRole('textbox', { name: 'Justificativa' }), 'Texto validado com a diretoria')
    await user.click(screen.getByRole('button', { name: 'Registrar decisão' }))

    expect(onSubmit).toHaveBeenCalledWith({ decision, decider: 'Ana Paula', rationale: 'Texto validado com a diretoria' })
  })

  it('registra o posicionamento final como artefato com versão, canal, destinatário e data', async () => {
    const onSubmit = vi.fn()
    render(<DemandPositioningDrawer open onOpenChange={vi.fn()} onSubmit={onSubmit} />)
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Versão final' }), 'v3')
    await user.click(screen.getByRole('combobox', { name: 'Canal de envio' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.type(screen.getByRole('textbox', { name: 'Destinatário' }), 'repórter@jornal.com')
    await user.type(screen.getByRole('textbox', { name: 'Data do posicionamento' }), '28082026')
    await user.type(screen.getByRole('textbox', { name: 'Posicionamento final' }), 'Nota oficial aprovada.')
    await user.click(screen.getByRole('button', { name: 'Registrar posicionamento' }))

    expect(onSubmit).toHaveBeenCalledWith({ version: 'v3', channel: 'email', recipient: 'repórter@jornal.com', date: '2026-08-28', body: 'Nota oficial aprovada.' })
  })

  it('registra nova versão como artefato próprio com conteúdo e data', async () => {
    const onSubmit = vi.fn()
    render(<DemandVersionDrawer open onOpenChange={vi.fn()} onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Identificação da versão' }), 'v2')
    await user.type(screen.getByRole('textbox', { name: 'Data da versão' }), '28082026')
    await user.type(screen.getByRole('textbox', { name: 'Conteúdo da nova versão' }), 'Texto revisado com a fonte dos indicadores.')
    await user.click(screen.getByRole('button', { name: 'Salvar nova versão' }))

    expect(onSubmit).toHaveBeenCalledWith({ version: 'v2', date: '2026-08-28', body: 'Texto revisado com a fonte dos indicadores.' })
  })

  it('só permite encerrar sem envio após confirmação explícita', async () => {
    const onConfirm = vi.fn()
    render(<DemandClosureDrawer open onOpenChange={vi.fn()} onConfirm={onConfirm} />)
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Motivo do encerramento' }), 'A pauta perdeu atualidade.')
    expect(screen.getByRole('button', { name: 'Encerrar sem envio' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Confirmo o encerramento sem envio' }))
    await user.click(screen.getByRole('button', { name: 'Encerrar sem envio' }))

    expect(onConfirm).toHaveBeenCalledWith({ reason: 'A pauta perdeu atualidade.' })
  })
})
