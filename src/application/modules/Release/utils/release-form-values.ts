import type { Release, ReleaseStatus } from '@/domain/Release/release.entity'
import type { NewRelease, ReleaseUpdate } from '@/domain/Release/release.repository'
import { parseCivilDate, toCivilDateString } from '@/shared/civil-date'
import { validateReleaseForm, type ReleaseFormValues as DomainFormValues } from '@/domain/Release/use-cases/validate-release-form.use-case'

export type ReleaseFormValues = DomainFormValues

export function createInitialReleaseFormValues(): ReleaseFormValues {
  return {
    title: '',
    subtitle: '',
    body: '<p></p>',
    tags: [],
    status: 'in_progress',
    publishedDate: '',
    journalistIds: [],
  }
}

export function releaseToReleaseFormValues(release: Release): ReleaseFormValues {
  return {
    title: release.title,
    subtitle: release.subtitle,
    body: release.body,
    tags: [...release.tags],
    status: release.status,
    publishedDate: release.publishedAt ? toCivilDateString(release.publishedAt) : '',
    journalistIds: release.recipients.map((item) => item.journalistId),
  }
}

export function releaseFormValuesToNewRelease(
  values: ReleaseFormValues,
  author: { id: string; name: string },
): NewRelease {
  return {
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    body: values.body,
    tags: values.tags,
    status: values.status,
    publishedAt: values.publishedDate ? parseCivilDate(values.publishedDate) : null,
    journalistIds: values.journalistIds,
    authorUserId: author.id,
    authorName: author.name,
  }
}

export function releaseFormValuesToUpdate(values: ReleaseFormValues): ReleaseUpdate {
  return {
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    body: values.body,
    tags: values.tags,
    status: values.status as ReleaseStatus,
    publishedAt: values.publishedDate ? parseCivilDate(values.publishedDate) : null,
  }
}

export { validateReleaseForm }
