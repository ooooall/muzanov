export function PageLoader({ overlay = false }: { overlay?: boolean }) {
  return (
    <div
      className={
        overlay
          ? 'fixed inset-0 z-[90] flex items-center justify-center bg-canvas/95'
          : 'flex min-h-dvh items-center justify-center bg-canvas'
      }
    >
      <div className="flex flex-col items-center gap-5">
        {/* Logo — CSS pulse, no Framer Motion RAF */}
        <div className="logo-pulse grid h-12 w-12 place-items-center rounded-[14px] border border-border-strong bg-[#1e1e26]">
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3" />
          </svg>
        </div>

        {/* Dots — CSS animation with staggered delays */}
        <div className="flex items-center gap-1.5">
          <span className="dot-pulse-0 h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="dot-pulse-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="dot-pulse-2 h-1.5 w-1.5 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  )
}
