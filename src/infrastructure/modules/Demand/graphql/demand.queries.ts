const POSITIONING_FIELDS = /* GraphQL */ `
  state
  versions {
    id
    body
    author
    savedAt
    attachment {
      filename
      contentType
      sizeBytes
      objectKey
      downloadUrl
    }
  }
  approval {
    approvedBy
    opinion
    approvedAt
    versionId
  }
`

const DEMAND_FIELDS = /* GraphQL */ `
  id
  code
  title
  requestSummary
  factContext
  journalistId
  contactMode
  contactName
  contactOutlet
  journalistName
  outletName
  responsibleUserId
  responsibleName
  deadlineAt
  channel
  origin
  priority
  status
  tags
  topics
  relatedAreas
  confirmedFacts
  pendingFacts
  enrichmentNextStep
  positioningState
  positioning {
    ${POSITIONING_FIELDS}
  }
  interactions {
    id
    occurredAt
    recordedBy
    recordedByUserId
    type
    result
    participants
    summary
    nextStep
    channel
    recipient
    body
    origin
    positioningVersionId
  }
  outcome {
    toneScore
    published
    usageScore
    resultSummary
    recordedBy
    recordedByUserId
    recordedAt
  }
  stateTransitions {
    id
    fromStatus
    toStatus
    occurredAt
    recordedBy
    recordedByUserId
    trigger
  }
  createdAt
  updatedAt
`

export const DEMAND_QUERY = /* GraphQL */ `
  query Demand($id: ID!) {
    demand(id: $id) {
      ${DEMAND_FIELDS}
    }
  }
`

export const DEMANDS_QUERY = /* GraphQL */ `
  query Demands($filter: DemandsFilter) {
    demands(filter: $filter) {
      items {
        ${DEMAND_FIELDS}
      }
      total
      activeCount
      historyCount
    }
  }
`

export const CREATE_DEMAND_MUTATION = /* GraphQL */ `
  mutation CreateDemand($input: CreateDemandInput!) {
    createDemand(input: $input) {
      ${DEMAND_FIELDS}
    }
  }
`

export const REVISE_DEMAND_CAPTURE_MUTATION = /* GraphQL */ `
  mutation ReviseDemandCapture($id: ID!, $input: ReviseDemandCaptureInput!) {
    reviseDemandCapture(id: $id, input: $input) {
      ${DEMAND_FIELDS}
    }
  }
`

export const REGISTER_EXTERNAL_INTERACTION_MUTATION = /* GraphQL */ `
  mutation RegisterExternalInteraction($input: RegisterExternalInteractionInput!) {
    registerExternalInteraction(input: $input) {
      ${DEMAND_FIELDS}
    }
  }
`

export const SAVE_POSITIONING_MUTATION = /* GraphQL */ `
  mutation SavePositioning($input: SavePositioningInput!) {
    savePositioning(input: $input) {
      ${DEMAND_FIELDS}
    }
  }
`

export const REGISTER_DEMAND_OUTCOME_MUTATION = /* GraphQL */ `
  mutation RegisterDemandOutcome($input: RegisterDemandOutcomeInput!) {
    registerDemandOutcome(input: $input) {
      ${DEMAND_FIELDS}
    }
  }
`

export const DELETE_DEMAND_MUTATION = /* GraphQL */ `
  mutation DeleteDemand($id: ID!) {
    deleteDemand(id: $id) {
      id
    }
  }
`

export const DEMAND_RESPONSIBLES_QUERY = /* GraphQL */ `
  query DemandResponsibles {
    demandResponsibles {
      id
      name
    }
  }
`

export const CREATE_ATTACHMENT_UPLOAD_MUTATION = /* GraphQL */ `
  mutation CreateAttachmentUpload($filename: String!, $contentType: String!, $sizeBytes: Int!) {
    createAttachmentUpload(filename: $filename, contentType: $contentType, sizeBytes: $sizeBytes) {
      objectKey
      uploadUrl
      headers {
        name
        value
      }
    }
  }
`
