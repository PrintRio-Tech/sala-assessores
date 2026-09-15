import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { demandService } from '@/application/composition'
import { useLocalDemandStore } from '../stores/local-demand.store'
import { useLocalDemandActions } from './use-local-demand-actions'

const capture = {
  subject: 'Pedido local',
  factContext: 'Contexto',
  pressRequest: 'Pedido',
  requestedDeadline: '2026-08-28',
  channel: 'Telefone',
  contactMode: 'local' as const,
  contactName: 'Maria Clara',
  contactOutlet: 'Redação',
  journalistId: '',
  journalistName: 'Maria Clara',
  outletName: 'Redação',
}

describe('useLocalDemandActions', () => {
  beforeEach(() => useLocalDemandStore.getState().reset())

  it('captura uma demanda local e notifica o sucesso', () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useLocalDemandActions())

    let record: ReturnType<typeof result.current.capture> | undefined
    act(() => {
      record = result.current.capture(capture, { onSuccess })
    })

    expect(record?.subject).toBe('Pedido local')
    expect(useLocalDemandStore.getState().records).toHaveLength(1)
    expect(onSuccess).toHaveBeenCalledWith(record)
  })

  it('adota uma demanda remota ao revisar a captura', async () => {
    const remote = await demandService.getById('d-regulacao')
    const { result } = renderHook(() => useLocalDemandActions())

    act(() => {
      result.current.revise(remote!, {
        ...capture,
        subject: 'Título revisado',
        journalistId: remote!.journalistId,
        journalistName: remote!.journalistName,
        outletName: remote!.outletName,
        contactMode: 'known',
        contactName: remote!.journalistName,
        contactOutlet: remote!.outletName,
      })
    })

    const stored = useLocalDemandStore.getState().records[0]
    expect(stored?.id).toBe(remote!.id)
    expect(stored?.subject).toBe('Título revisado')
  })

  it('atualiza uma demanda já local e remove o registro', () => {
    const existing = useLocalDemandStore.getState().add(capture)
    const onRemoved = vi.fn()
    const { result } = renderHook(() => useLocalDemandActions())

    act(() => {
      result.current.revise({ ...existing, kind: 'local' }, { ...capture, subject: 'Assunto editado' })
      result.current.linkJournalist(existing.id, {
        journalistId: 'j-1',
        journalistName: 'Carolina Montenegro',
        outletName: 'Valor Econômico',
      })
      result.current.remove(existing.id, { onSuccess: onRemoved })
    })

    expect(useLocalDemandStore.getState().records).toHaveLength(0)
    expect(useLocalDemandStore.getState().isHidden(existing.id)).toBe(true)
    expect(onRemoved).toHaveBeenCalled()
  })
})
