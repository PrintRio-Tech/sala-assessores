import type { Journalist, RelationshipEvaluation } from './journalist.entity'

export interface Paginated<T> {
  items: T[]
  total: number
}

export type CreateJournalistInput = Pick<
  Journalist,
  | 'name'
  | 'roleTitle'
  | 'outletName'
  | 'desk'
  | 'email'
  | 'phone'
  | 'preferredChannel'
  | 'bestContactWindow'
  | 'topics'
  | 'isActive'
> & {
  initialScore?: number | null
  initialScoreAuthorName?: string
}

export type UpdateJournalistInput = Pick<
  Journalist,
  | 'name'
  | 'roleTitle'
  | 'outletName'
  | 'desk'
  | 'email'
  | 'phone'
  | 'preferredChannel'
  | 'bestContactWindow'
  | 'topics'
  | 'isActive'
>

export type NewRelationshipEvaluation = Omit<RelationshipEvaluation, 'id'>

export type NewJournalist = Omit<Journalist, 'id'>

export interface JournalistRepository {
  list(): Promise<Paginated<Journalist>>
  getById(id: string): Promise<Journalist | null>
  create(input: NewJournalist): Promise<Journalist>
  updateProfile(id: string, input: UpdateJournalistInput): Promise<Journalist | null>
  addRelationshipEvaluation(id: string, input: NewRelationshipEvaluation): Promise<Journalist | null>
}
