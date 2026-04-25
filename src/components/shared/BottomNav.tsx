'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Map, Activity, LayoutGrid, Settings2 } from 'lucide-react'
import type { UserRole } from '@/types/roles'

interface BottomNavProps {
  role?: UserRole | null
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: '/',          icon: Map,       label: 'Карта',     roles: ['viewer', 'worker', 'taskmaster', null] },
    { href: '/dashboard', icon: Activity,  label: 'Работа',    roles: ['worker', 'taskmaster'] },
    { href: '/control',   icon: LayoutGrid,label: 'Контроль',  roles: ['taskmaster'] },
    { href: '/settings',  icon: Settings2, label: 'Настройки', roles: ['taskmaster'] },
  ] as const

  const visibleTabs = tabs.filter(t => t.roles.includes(role as never))

  if (visibleTabs.length <= 1) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-panel/90 backdrop-blur-lg border-t border-border-soft pb-safe">
      <div className="flex items-center max-w-screen-xl mx-auto">
        {visibleTabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors',
                active ? 'text-accent' : 'text-text-4'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="font-mono text-[9px] tracking-wide uppercase">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
