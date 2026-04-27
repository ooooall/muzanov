import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isOwnerEmail } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_ZONE_STATUS } from '@/lib/zone-workflow'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Only owner can reset all data' }, { status: 403 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: activityError } = await service.from('activity_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (activityError) return NextResponse.json({ error: activityError.message }, { status: 500 })

  const { error: zoneError } = await service.from('zone_states').update({
    status: DEFAULT_ZONE_STATUS,
    operation_type_id: null,
    assigned_worker_id: null,
    notes: null,
    started_at: null,
    updated_at: new Date().toISOString(),
  }).neq('zone_id', '')
  if (zoneError) return NextResponse.json({ error: zoneError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
