import { cn } from '@/lib/utils'

interface AppSurfaceProps {
  className?: string
  children: React.ReactNode
}

export function AppSurface({ className, children }: AppSurfaceProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}
