import { InvalidJournalistError } from './errors/journalist.errors'
import type {
  CreateJournalistInput,
  UpdateJournalistInput,
} from './journalist.repository'

type JournalistProfileInput = CreateJournalistInput | UpdateJournalistInput

export function normalizeJournalistTopics(values: string[]): string[] {
  const unique = new Map<string, string>()
  for (const value of values) {
    const normalized = value.trim().replace(/\s+/g, ' ')
    const key = normalized.toLocaleLowerCase('pt-BR')
    if (normalized && !unique.has(key)) unique.set(key, normalized)
  }
  return [...unique.values()]
}

export function normalizeAndValidateJournalistProfile<T extends JournalistProfileInput>(input: T): T {
  const normalized = {
    ...input,
    name: input.name.trim(),
    roleTitle: input.roleTitle.trim(),
    outletName: input.outletName.trim(),
    desk: input.desk.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    topics: normalizeJournalistTopics(input.topics),
    ...('bestContactWindow' in input
      ? { bestContactWindow: input.bestContactWindow.trim() }
      : {}),
  } as T

  if (!normalized.name) throw new InvalidJournalistError('Informe o nome completo.')
  if (!normalized.outletName) throw new InvalidJournalistError('Informe o veículo ou redação.')
  if (!normalized.email && !normalized.phone) {
    throw new InvalidJournalistError('Informe pelo menos um e-mail ou telefone.')
  }

  return normalized
}
