'use client'

import { motion } from 'framer-motion'

export function PageLoader({ overlay = false }: { overlay?: boolean }) {
  const base = overlay
    ? 'fixed inset-0 z-[90] flex items-center justify-center bg-canvas/70 backdrop-blur-xl'
    : 'flex min-h-dvh items-center justify-center bg-canvas'

  return (
    <div className={base}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex flex-col items-center gap-5"
      >
        {/* Logo */}
        <motion.div
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="grid h-12 w-12 place-items-center rounded-[14px] border border-border-strong bg-[#1e1e26]"
        >
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3" />
          </svg>
        </motion.div>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-slate-300"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
