'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const prev = useRef(pathname)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pathname === prev.current) return
    prev.current = pathname
    setVisible(false)
    setWidth(0)
  }, [pathname])

  useEffect(() => {
    // Show bar when navigation starts (link clicked)
    function onStart() {
      if (timer.current) clearTimeout(timer.current)
      setWidth(0)
      setVisible(true)
      // Animate quickly to 85% then stall
      timer.current = setTimeout(() => setWidth(85), 30)
    }
    function onEnd() {
      setWidth(100)
      timer.current = setTimeout(() => setVisible(false), 350)
    }

    window.addEventListener('navigationstart', onStart)
    window.addEventListener('navigationend', onEnd)
    return () => {
      window.removeEventListener('navigationstart', onStart)
      window.removeEventListener('navigationend', onEnd)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-[2px] origin-left bg-[#f5c518]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: width / 100 }}
          exit={{ opacity: 0 }}
          transition={{ duration: width === 100 ? 0.2 : 0.8, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  )
}
