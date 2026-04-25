'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import type { TablesUpdate } from '@/types/database.types'

interface Props {
  profile: Profile
  email: string
}

export default function SettingsForm({ profile, email }: Props) {
  const [name, setName] = useState(profile.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const update: TablesUpdate<'profiles'> = { display_name: name, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id)
    setSaving(false)
    if (!error) {
      toast.success('Профиль обновлён')
      router.refresh()
    } else {
      toast.error('Ошибка сохранения')
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 p-5 rounded-lg bg-elevated border border-border">
        <h2 className="font-mono text-[11px] tracking-wide text-text-4 uppercase">Профиль</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase block">Отображаемое имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full px-4 py-3 rounded-lg bg-base border border-border text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase block">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-lg bg-base border border-border text-text-3 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-accent text-black font-mono text-[11px] tracking-wide uppercase disabled:opacity-50"
          >
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </form>
      </section>

      <section className="space-y-3 p-5 rounded-lg bg-elevated border border-border">
        <h2 className="font-mono text-[11px] tracking-wide text-text-4 uppercase">Система</h2>
        <div className="space-y-2">
          <InfoRow label="Роль"    value="TaskMaster" />
          <InfoRow label="Версия"  value="0.1.0" />
          <InfoRow label="Стек"    value="Next.js 16 + Supabase" />
        </div>
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
      <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">{label}</span>
      <span className="text-[12px] text-text-2 font-mono">{value}</span>
    </div>
  )
}
