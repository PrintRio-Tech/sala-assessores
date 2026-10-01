const USER_FIELDS = /* GraphQL */ `
  id
  personId
  email
  emails
  name
  role
  app
  isAdmin
`

const SESSION_FIELDS = /* GraphQL */ `
  user {
    ${USER_FIELDS}
  }
  accessToken
  refreshToken
`

export const REQUEST_MAGIC_LINK_MUTATION = /* GraphQL */ `
  mutation RequestMagicLink($email: String!) {
    requestMagicLink(email: $email) {
      ok
    }
  }
`

export const VERIFY_MAGIC_LINK_MUTATION = /* GraphQL */ `
  mutation VerifyMagicLink($email: String!, $token: String!) {
    verifyMagicLink(email: $email, token: $token) {
      ${SESSION_FIELDS}
    }
  }
`

export const REFRESH_SESSION_MUTATION = /* GraphQL */ `
  mutation RefreshSession($refreshToken: String!) {
    refreshSession(refreshToken: $refreshToken) {
      ${SESSION_FIELDS}
    }
  }
`

export const LOGOUT_MUTATION = /* GraphQL */ `
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      ok
    }
  }
`

export const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
`
