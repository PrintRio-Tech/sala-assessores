import { describe, expect, it, vi } from 'vitest'

import type { Demand } from '../demand.entity'
import { parseDemandDeadline } from '../demand.entity'
import type { DemandCaptureRevision, DemandRepository } from '../demand.repository'
import { CreateDemand } from './create-demand.use-case'

const capture: DemandCaptureRevision = {
  subject: 'Pedido local',
  factContext: 'Contexto recebido.',
  pressRequest: 'Pedido da redação.',
  requestedDeadline: '2026-08-28',
  channel: 'Telefone',
  contactMode: 'local',
  contactName: 'Maria Clara',
  contactOutlet: 'Redação',
  journalistId: '',
  journalistName: 'Maria Clara',
  outletName: 'Redação',
  priority: 'high',
}

function createdDemand(partial: Partial<Demand> = {}): Demand {
  return {
    id: 'd-new',
    code: 'IMP-001',
    title: 'Pedido local',
    requestSummary: 'Pedido da redação.',
    factContext: 'Contexto recebido.',
    journalistId: '',
    journalistName: 'Maria Clara',
    outletName: 'Redação',
    contactMode: 'local',
    contactName: 'Maria Clara',
    contactOutlet: 'Redação',
    responsibleId: 'r-noel',
    responsibleName: 'Noel Ferreira',
    deadlineAt: parseDemandDeadline('2026-08-28'),
    channel: 'Telefone',
    origin: 'solicited',
    priority: 'high',
    status: 'in_progress',
    createdAt: new Date('2026-08-28T10:00:00.000Z'),
    updatedAt: new Date('2026-08-28T10:00:00.000Z'),
    interactions: [],
    ...partial,
  }
}

describe('CreateDemand', () => {
  it('envia ao repositório o agregado com título, prazo e responsável do autor', async () => {
    const repo: DemandRepository = {
      list: vi.fn(),
      listResponsibles: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdDemand()),
      reviseCapture: vi.fn(),
      remove: vi.fn(),
      registerInteraction: vi.fn(),
      createAttachmentUpload: vi.fn(),
      putAttachment: vi.fn(),
      savePositioning: vi.fn(),
      registerOutcome: vi.fn(),
    }
    const useCase = new CreateDemand(repo)

    const demand = await useCase.execute(capture, { id: 'r-noel', name: 'Noel Ferreira' })

    expect(repo.create).toHaveBeenCalledWith({
      title: 'Pedido local',
      requestSummary: 'Pedido da redação.',
      factContext: 'Contexto recebido.',
      journalistId: '',
      journalistName: 'Maria Clara',
      outletName: 'Redação',
      contactMode: 'local',
      contactName: 'Maria Clara',
      contactOutlet: 'Redação',
      responsibleId: 'r-noel',
      responsibleName: 'Noel Ferreira',
      deadlineAt: parseDemandDeadline('2026-08-28'),
      channel: 'Telefone',
      origin: 'solicited',
      priority: 'high',
      enrichment: {
        tags: [],
        topics: [],
        relatedAreas: [],
        confirmedFacts: [],
        pendingFacts: [],
        nextStep: null,
      },
    })
    expect(demand.code).toBe('IMP-001')
    expect(demand.status).toBe('in_progress')
  })

  it('assume origem solicited quando a captura não informa', async () => {
    const repo: DemandRepository = {
      list: vi.fn(),
      listResponsibles: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdDemand({ origin: 'solicited' })),
      reviseCapture: vi.fn(),
      remove: vi.fn(),
      registerInteraction: vi.fn(),
      createAttachmentUpload: vi.fn(),
      putAttachment: vi.fn(),
      savePositioning: vi.fn(),
      registerOutcome: vi.fn(),
    }
    const useCase = new CreateDemand(repo)

    await useCase.execute(capture, { id: 'r-noel', name: 'Noel Ferreira' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ origin: 'solicited' }))
  })

  it('envia origem proactive quando a captura escolhe proativa', async () => {
    const repo: DemandRepository = {
      list: vi.fn(),
      listResponsibles: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdDemand({ origin: 'proactive' })),
      reviseCapture: vi.fn(),
      remove: vi.fn(),
      registerInteraction: vi.fn(),
      createAttachmentUpload: vi.fn(),
      putAttachment: vi.fn(),
      savePositioning: vi.fn(),
      registerOutcome: vi.fn(),
    }
    const useCase = new CreateDemand(repo)

    await useCase.execute({ ...capture, origin: 'proactive' }, { id: 'r-noel', name: 'Noel Ferreira' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ origin: 'proactive' }))
  })

  it('assume prioridade medium quando a captura não informa', async () => {
    const repo: DemandRepository = {
      list: vi.fn(),
      listResponsibles: vi.fn(),
      getById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdDemand({ priority: 'medium' })),
      reviseCapture: vi.fn(),
      remove: vi.fn(),
      registerInteraction: vi.fn(),
      createAttachmentUpload: vi.fn(),
      putAttachment: vi.fn(),
      savePositioning: vi.fn(),
      registerOutcome: vi.fn(),
    }
    const { priority: _omitted, ...withoutPriority } = capture
    const useCase = new CreateDemand(repo)

    await useCase.execute(withoutPriority, { id: 'r-noel', name: 'Noel Ferreira' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ priority: 'medium' }))
  })
})
