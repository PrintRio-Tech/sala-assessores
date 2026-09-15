export function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function collectDemandTags(items: Array<{ enrichment?: { tags?: string[] } | null }>): string[] {
  const seen = new Map<string, string>()
  for (const item of items) {
    for (const tag of item.enrichment?.tags ?? []) {
      const normalized = normalizeTag(tag)
      if (!normalized) continue
      const key = normalized.toLocaleLowerCase('pt-BR')
      if (!seen.has(key)) seen.set(key, normalized)
    }
  }
  return [...seen.values()]
}
