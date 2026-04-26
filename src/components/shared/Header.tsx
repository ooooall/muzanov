'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getRoleMeta } from '@/lib/permissions'
import { useRole } from '@/hooks/usePermissions'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Settings } from 'lucide-react'
import type { UserRole } from '@/types/roles'
import { appStorage } from '@/lib/storage'

interface HeaderProps {
  role?: UserRole | null
  showAuth?: boolean
}

export function Header({ role: roleProp, showAuth = true }: HeaderProps) {
  const { role: roleHook } = useRole()
  const role = roleProp ?? roleHook
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isProtectedPath = pathname.startsWith('/dashboard')
    || pathname.startsWith('/control')
    || pathname.startsWith('/analytics')
    || pathname.startsWith('/settings')

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && isProtectedPath) {
        appStorage.clearSessionScope()
        router.replace('/auth/login')
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [isProtectedPath, router, supabase.auth])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      appStorage.clearSessionScope()
      router.replace('/auth/login')
      router.refresh()
    }
  }

  const roleMeta = role ? getRoleMeta(role) : null

  return (
    <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-lg border-b border-border-soft">
      <div className="flex items-center gap-3 px-4 h-14 max-w-screen-xl mx-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-[7px] bg-[#1e1e26] border border-border-strong grid place-items-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3"/>
            </svg>
          </span>
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-mono text-[11px] tracking-[0.18em] text-text-1 uppercase">Quarters</span>
            <span className="font-mono text-[8px] tracking-[0.12em] text-text-4 uppercase">Operations</span>
          </div>
        </Link>

        <div className="flex-1" />

        {/* Role badge */}
        {roleMeta && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border-strong font-mono text-[9px] tracking-wide uppercase"
            style={{ color: roleMeta.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: roleMeta.color }} />
            {roleMeta.sub}
          </span>
        )}

        {/* Nav links for TaskMaster */}
        {role === 'taskmaster' && (
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/control',   label: 'Control' },
              { href: '/analytics', label: 'Analytics' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded font-mono text-[10px] tracking-wide uppercase transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-active text-text-1'
                    : 'text-text-3 hover:text-text-2 hover:bg-hover'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Auth actions */}
        {showAuth && (
          <>
            {role && role !== 'viewer' ? (
              <div className="flex items-center gap-1">
                {role === 'taskmaster' && (
                  <Link
                    href="/settings"
                    className="w-8 h-8 grid place-items-center rounded text-text-3 hover:text-text-2 hover:bg-hover transition-colors"
                  >
                    <Settings size={15} />
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 grid place-items-center rounded text-text-3 hover:text-text-2 hover:bg-hover transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : !role ? (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded bg-accent text-black font-mono text-[10px] tracking-wide uppercase hover:bg-accent/90 transition-colors"
              >
                Войти
              </Link>
            ) : null}
          </>
        )}
      </div>
    </header>
  )
}
