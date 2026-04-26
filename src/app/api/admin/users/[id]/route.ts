import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isOwnerEmail } from '@/lib/auth'
import type { Database } from '@/types/database.types'

type ProfileRole = Database['public']['Enums']['user_role']
type ProfileStatus = 'pending' | 'active' | 'rejected'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOwnerEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { role?: ProfileRole; status?: ProfileStatus } | null = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (!body?.role && !body?.status) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const update: Record<string, string> = { updated_at: new Date().toISOString() }
  if (body.role) update.role = body.role
  if (body.status) update.status = body.status

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('id, role, status')
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json(updated)
}
