import { demandService } from '@/application/composition'
import { currentUser } from '@/application/current-user'
import type { DemandCaptureRevision } from '@/domain/Demand/demand.repository'

export const defaultDemandCapture: DemandCaptureRevision = {
  subject: 'Pedido local',
  factContext: 'Contexto',
  pressRequest: 'Pedido',
  requestedDeadline: '2026-08-28',
  channel: 'Telefone',
  contactMode: 'local',
  contactName: 'Maria Clara',
  contactOutlet: 'Redação',
  journalistId: '',
  journalistName: 'Maria Clara',
  outletName: 'Redação',
}

export function captureDemand(overrides: Partial<DemandCaptureRevision> = {}) {
  return demandService.create({ ...defaultDemandCapture, ...overrides }, currentUser)
}
