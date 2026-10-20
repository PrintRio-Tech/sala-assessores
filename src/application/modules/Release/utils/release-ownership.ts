export function canManageRelease(sessionUserId: string | null | undefined, authorUserId: string) {
  return Boolean(sessionUserId) && sessionUserId === authorUserId
}
