import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function AppButton({
  className,
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl border font-mono uppercase tracking-wide transition-all duration-200 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-[11px]',
        variant === 'primary' && 'border-transparent bg-accent text-black hover:bg-accent/90 shadow-sm',
        variant === 'secondary' && 'border-slate-100 bg-white text-text-2 hover:border-slate-200 hover:text-text-1 shadow-sm',
        variant === 'success' && 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm',
        variant === 'danger' && 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-sm',
        variant === 'ghost' && 'border-transparent bg-transparent text-text-3 hover:bg-slate-50 hover:text-text-1',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
