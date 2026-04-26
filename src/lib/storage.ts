type AppStorageValue = string | number | boolean | null | Record<string, unknown> | Array<unknown>

const APP_PREFIX = 'muzanov_ops'
export const ROLE_STORAGE_KEY = 'auth:role'

function getSafeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function scopedKey(key: string): string {
  return `${APP_PREFIX}:${key}`
}

export const appStorage = {
  get<T>(key: string, fallback: T): T {
    const storage = getSafeStorage()
    if (!storage) return fallback

    try {
      const raw = storage.getItem(scopedKey(key))
      if (raw === null) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },

  set(key: string, value: AppStorageValue) {
    const storage = getSafeStorage()
    if (!storage) return

    try {
      storage.setItem(scopedKey(key), JSON.stringify(value))
    } catch {
      // Ignore quota and serialization errors in client-only cache
    }
  },

  remove(key: string) {
    const storage = getSafeStorage()
    if (!storage) return
    storage.removeItem(scopedKey(key))
  },

  has(key: string) {
    const storage = getSafeStorage()
    if (!storage) return false
    return storage.getItem(scopedKey(key)) !== null
  },

  clearSessionScope() {
    const storage = getSafeStorage()
    if (!storage) return

    const keysToRemove: string[] = []
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key?.startsWith(`${APP_PREFIX}:`)) keysToRemove.push(key)
    }

    keysToRemove.forEach((key) => storage.removeItem(key))
  },
}
