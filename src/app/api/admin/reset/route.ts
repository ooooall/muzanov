import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { isOwnerEmail } from '@/lib/auth'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await service.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  await service.from('zone_states').update({
    status: 'new',
    operation_type_id: null,
    assigned_worker_id: null,
    notes: null,
    started_at: null,
    updated_at: new Date().toISOString(),
  }).neq('zone_id', '')

  return NextResponse.json({ ok: true })
}
