import type { Release } from '@/domain/Release/release.entity'
import type { NewRelease, ReleaseListParams, ReleaseUpdate } from '@/domain/Release/release.repository'
import type { GraphQLReleaseDto } from '../DTOs/graphql-release.dto'

export function toDomain(dto: GraphQLReleaseDto): Release {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    subtitle: dto.subtitle,
    body: dto.body,
    status: dto.status,
    tags: dto.tags,
    publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    authorUserId: dto.authorUserId,
    authorName: dto.authorName,
    recipients: dto.recipients.map((item) => ({
      journalistId: item.journalistId,
      addedAt: new Date(item.addedAt),
      name: item.name,
      outletName: item.outletName,
    })),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  }
}

function emptyToUndefined(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function toReleasesFilter(params: ReleaseListParams = {}) {
  return {
    search: emptyToUndefined(params.search),
    status: params.status,
    journalistId: emptyToUndefined(params.journalistId),
    publishedFrom: emptyToUndefined(params.publishedFrom),
    publishedTo: emptyToUndefined(params.publishedTo),
  }
}

export function toCreateReleaseInput(input: NewRelease) {
  return {
    title: input.title,
    subtitle: input.subtitle,
    body: input.body,
    tags: input.tags,
    status: input.status,
    journalistIds: input.journalistIds,
  }
}

export function toUpdateReleaseInput(input: ReleaseUpdate) {
  return {
    title: input.title,
    subtitle: input.subtitle,
    body: input.body,
    tags: input.tags,
    status: input.status,
  }
}
