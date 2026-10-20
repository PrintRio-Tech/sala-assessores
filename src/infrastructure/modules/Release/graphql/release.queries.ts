const RELEASE_FIELDS = /* GraphQL */ `
  id
  code
  title
  subtitle
  body
  status
  tags
  publishedAt
  authorUserId
  authorName
  recipients {
    journalistId
    addedAt
    name
    outletName
  }
  createdAt
  updatedAt
`

export const RELEASE_QUERY = /* GraphQL */ `
  query Release($id: ID!) {
    release(id: $id) {
      ${RELEASE_FIELDS}
    }
  }
`

export const RELEASES_QUERY = /* GraphQL */ `
  query Releases($filter: ReleasesFilter) {
    releases(filter: $filter) {
      items {
        ${RELEASE_FIELDS}
      }
      total
    }
  }
`

export const CREATE_RELEASE_MUTATION = /* GraphQL */ `
  mutation CreateRelease($input: CreateReleaseInput!) {
    createRelease(input: $input) {
      ${RELEASE_FIELDS}
    }
  }
`

export const UPDATE_RELEASE_MUTATION = /* GraphQL */ `
  mutation UpdateRelease($id: ID!, $input: UpdateReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      ${RELEASE_FIELDS}
    }
  }
`

export const DELETE_RELEASE_MUTATION = /* GraphQL */ `
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id) {
      ${RELEASE_FIELDS}
    }
  }
`

export const SET_RELEASE_RECIPIENTS_MUTATION = /* GraphQL */ `
  mutation SetReleaseRecipients($id: ID!, $journalistIds: [ID!]!) {
    setReleaseRecipients(id: $id, journalistIds: $journalistIds) {
      ${RELEASE_FIELDS}
    }
  }
`

export const RELEASE_RECIPIENT_IMPORT_TEMPLATE_QUERY = /* GraphQL */ `
  query ReleaseRecipientImportTemplate {
    releaseRecipientImportTemplate {
      filename
      contentType
      contentBase64
    }
  }
`

export const PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION = /* GraphQL */ `
  mutation PreviewReleaseRecipientImport($releaseId: ID!, $filename: String!, $contentBase64: String!) {
    previewReleaseRecipientImport(releaseId: $releaseId, filename: $filename, contentBase64: $contentBase64) {
      matchedCount
      createCount
      errorCount
      skippedCount
      lines {
        rowNumber
        name
        outletName
        email
        phone
        action
        journalistId
        error
      }
    }
  }
`

export const COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION = /* GraphQL */ `
  mutation CommitReleaseRecipientImport($releaseId: ID!, $filename: String!, $contentBase64: String!) {
    commitReleaseRecipientImport(releaseId: $releaseId, filename: $filename, contentBase64: $contentBase64) {
      ${RELEASE_FIELDS}
    }
  }
`
