'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutGrid, Map, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/roles'

interface BottomNavProps {
  role?: UserRole | null
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: '/', icon: Map, label: 'Карта', roles: ['viewer', null] },
    { href: '/dashboard', icon: Activity, label: 'Работа', roles: ['worker', 'taskmaster'] },
    { href: '/control', icon: LayoutGrid, label: 'Контроль', roles: ['taskmaster'] },
    { href: '/settings', icon: Settings2, label: 'Настройки', roles: ['taskmaster'] },
  ] as const

  const visibleTabs = tabs.filter((tab) => tab.roles.includes(role as never))
  if (visibleTabs.length <= 1) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white pb-safe">
      <div className="mx-auto flex max-w-screen-xl items-center">
        {visibleTabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-200',
                active ? 'text-slate-950' : 'text-slate-400 hover:text-slate-700',
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.1 : 1.7} />
              <span className="font-mono text-[9px] uppercase tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
