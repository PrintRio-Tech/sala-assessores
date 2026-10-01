import { auth } from '@/application/composition'
import type { User } from '@/domain/Auth/user.entity'
import { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'

export const FAKE_MEMBER_EMAIL = 'ana@imprensa.gov.br'

export function fakeMember(partial: Partial<User> = {}): User {
  return {
    id: 'user-1',
    personId: 'person-1',
    email: FAKE_MEMBER_EMAIL,
    emails: [FAKE_MEMBER_EMAIL],
    name: 'Ana',
    role: 'advisor',
    app: 'imprensa',
    isAdmin: false,
    ...partial,
  }
}

export function installFakeAuth(members: User[] = [fakeMember()]) {
  const fake = new FakeAuthRepository({ members })
  auth.use(fake)
  return fake
}
