const JOURNALIST_FIELDS = /* GraphQL */ `
  id
  name
  roleTitle
  outletName
  desk
  email
  phone
  preferredChannel
  bestContactWindow
  topics
  isActive
  createdAt
  updatedAt
  objectiveStats {
    totalDemands
    solicitedCount
    proactiveCount
    successRate
    positioningUsageRate
  }
  demandHistory {
    demandId
    title
    status
    occurredAt
    kindLabel
    outcomeLabel
  }
  relationshipEvaluations {
    id
    authorUserId
    authorName
    recordedAt
    score
    traits
    editorialToneLabel
    notes
  }
`

export const JOURNALIST_QUERY = /* GraphQL */ `
  query Journalist($id: ID!) {
    journalist(id: $id) {
      ${JOURNALIST_FIELDS}
    }
  }
`

export const JOURNALISTS_QUERY = /* GraphQL */ `
  query Journalists($search: String, $isActive: Boolean) {
    journalists(search: $search, isActive: $isActive) {
      items {
        ${JOURNALIST_FIELDS}
      }
      total
    }
  }
`

export const CREATE_JOURNALIST_MUTATION = /* GraphQL */ `
  mutation CreateJournalist($input: CreateJournalistInput!) {
    createJournalist(input: $input) {
      ${JOURNALIST_FIELDS}
    }
  }
`

export const UPDATE_JOURNALIST_MUTATION = /* GraphQL */ `
  mutation UpdateJournalist($id: ID!, $input: UpdateJournalistInput!) {
    updateJournalist(id: $id, input: $input) {
      ${JOURNALIST_FIELDS}
    }
  }
`

export const ADD_RELATIONSHIP_EVALUATION_MUTATION = /* GraphQL */ `
  mutation AddRelationshipEvaluation($input: AddRelationshipEvaluationInput!) {
    addRelationshipEvaluation(input: $input) {
      ${JOURNALIST_FIELDS}
    }
  }
`
