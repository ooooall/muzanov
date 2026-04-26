export const OWNER_EMAIL = (process.env.NEXT_PUBLIC_OWNER_EMAIL ?? 'muzanovstepan60@gmail.com').trim().toLowerCase()

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === OWNER_EMAIL
}
