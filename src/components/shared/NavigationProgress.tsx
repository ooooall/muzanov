'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const prev = useRef(pathname)

  // Detect internal link clicks → start bar
  useEffect(() => {
    function onAnchorClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      // Only internal relative paths that actually change the route
      if (!href.startsWith('/') || href === prev.current) return
      setActive(true)
    }
    document.addEventListener('click', onAnchorClick)
    return () => document.removeEventListener('click', onAnchorClick)
  }, [])

  // Pathname changed → route loaded → stop bar
  useEffect(() => {
    if (pathname === prev.current) return
    prev.current = pathname
    setActive(false)
  }, [pathname])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-[2px] bg-[#f5c518] origin-left transition-all"
      style={{
        transform: active ? 'scaleX(0.85)' : 'scaleX(0)',
        opacity: active ? 1 : 0,
        transitionDuration: active ? '600ms' : '200ms',
        transitionTimingFunction: active ? 'ease-out' : 'ease-in',
      }}
    />
  )
}
