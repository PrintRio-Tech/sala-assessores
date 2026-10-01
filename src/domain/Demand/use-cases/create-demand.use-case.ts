import { DEFAULT_DEMAND_ORIGIN, EMPTY_DEMAND_ENRICHMENT, parseDemandDeadline, type Demand } from '../demand.entity'
import type { DemandCaptureRevision, DemandRepository, NewDemand } from '../demand.repository'

export type DemandAuthor = { id: string; name: string }

export function demandCaptureToNewDemand(
  input: DemandCaptureRevision,
  author: DemandAuthor,
): NewDemand {
  return {
    title: input.subject.trim(),
    requestSummary: input.pressRequest.trim(),
    factContext: input.factContext.trim(),
    journalistId: input.journalistId,
    journalistName: input.journalistName.trim() || input.contactName.trim(),
    outletName: input.outletName.trim() || input.contactOutlet.trim(),
    contactMode: input.contactMode,
    contactName: input.contactName.trim() || input.journalistName.trim(),
    contactOutlet: input.contactOutlet.trim() || input.outletName.trim(),
    responsibleId: author.id,
    responsibleName: author.name,
    deadlineAt: parseDemandDeadline(input.requestedDeadline),
    channel: input.channel.trim(),
    origin: input.origin ?? DEFAULT_DEMAND_ORIGIN,
    priority: input.priority ?? 'medium',
    enrichment: input.enrichment ?? EMPTY_DEMAND_ENRICHMENT,
  }
}

export class CreateDemand {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  execute(input: DemandCaptureRevision, author: DemandAuthor): Promise<Demand> {
    return this.repo.create(demandCaptureToNewDemand(input, author))
  }
}
