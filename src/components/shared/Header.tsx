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
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/control') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/settings')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
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
    <header
      className="sticky top-0 z-30 border-b border-white/10 bg-[#1e1e26]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center gap-3 px-4 max-w-screen-xl mx-auto">
        {/* Brand */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-[7px] border border-white/20 bg-white/5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3" />
            </svg>
          </span>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">Quarters</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/40">Operations</span>
          </div>
        </Link>

        <div className="flex-1" />

        {/* Role badge */}
        {roleMeta && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 rounded border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wide"
            style={{ color: roleMeta.color }}
          >
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: roleMeta.color }} />
            {roleMeta.sub}
          </span>
        )}

        {/* Desktop nav links (TaskMaster only) */}
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
                  'rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white/80',
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
                    className="grid h-8 w-8 place-items-center rounded text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                  >
                    <Settings size={15} />
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="grid h-8 w-8 place-items-center rounded text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : !role ? (
              <Link
                href="/auth/login"
                className="rounded bg-[#f5c518] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[#1e1e26] transition-opacity hover:opacity-90"
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
