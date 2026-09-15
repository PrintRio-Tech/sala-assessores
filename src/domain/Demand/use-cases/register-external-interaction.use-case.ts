import {
  EXTERNAL_INTERACTION_RESULT_RULES,
  getExternalInteractionFieldErrors,
  isExternalInteractionResult,
  isExternalInteractionType,
  type Demand,
} from '../demand.entity'
import type { DemandRepository, NewExternalInteraction, RegisterExternalInteractionInput } from '../demand.repository'
import { DemandNotFoundError, InvalidExternalInteractionError } from '../errors/demand.errors'

export class RegisterExternalInteraction {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(demandId: string, input: RegisterExternalInteractionInput): Promise<Demand> {
    const interaction = prepareExternalInteraction(input)
    const demand = await this.repo.registerInteraction(demandId, interaction)
    if (!demand) throw new DemandNotFoundError()
    return demand
  }
}

export function prepareExternalInteraction(input: RegisterExternalInteractionInput): NewExternalInteraction {
  if (Number.isNaN(input.occurredAt.getTime())) {
    throw new InvalidExternalInteractionError('Informe uma data e hora válidas.')
  }
  if (!input.result) {
    throw new InvalidExternalInteractionError('Informe o resultado da interação.')
  }
  if (!isExternalInteractionResult(input.result)) {
    throw new InvalidExternalInteractionError('Resultado da interação inválido.')
  }

  if (input.type != null && !isExternalInteractionType(input.type)) {
    throw new InvalidExternalInteractionError('Tipo de interação inválido.')
  }

  const rules = EXTERNAL_INTERACTION_RESULT_RULES[input.result].fields
  const normalized = {
    type: rules.type.visible && input.type ? input.type : null,
    participants: rules.participants.visible ? normalizeText(input.participants) : null,
    summary: rules.summary.visible ? normalizeText(input.summary) : null,
    nextStep: rules.nextStep.visible ? normalizeText(input.nextStep) : null,
    channel: rules.channel.visible ? normalizeText(input.channel) : null,
    recipient: rules.recipient.visible ? normalizeText(input.recipient) : null,
    body: rules.body.visible ? normalizeText(input.body) : null,
  }

  const [firstError] = Object.values(getExternalInteractionFieldErrors(input.result, normalized))
  if (firstError) throw new InvalidExternalInteractionError(firstError)

  return {
    occurredAt: input.occurredAt,
    recordedBy: normalizeText(input.recordedBy) ?? 'Autoria não informada',
    result: input.result,
    ...normalized,
    origin: 'off_platform',
  }
}

function normalizeText(value: string | null | undefined): string | null {
  return value?.trim() || null
}
