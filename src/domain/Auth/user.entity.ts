const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface User {
  id: string
  personId: string
  email: string
  emails: string[]
  name: string | null
  role: string
  app: string
  isAdmin: boolean
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

export function displayName(user: Pick<User, 'email' | 'name'>): string {
  const name = user.name?.trim()
  return name ? name : user.email
}
