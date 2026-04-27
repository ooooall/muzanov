'use client'

import { useEffect } from 'react'

export function PwaInit() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates when user reopens the app
        reg.update().catch(() => {})
      })
      .catch(() => {})
  }, [])

  return null
}
