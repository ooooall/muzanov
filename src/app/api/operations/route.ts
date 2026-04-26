import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('operation_types')
    .select('*')
    .order('is_system', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { label, sub_label } = body
  if (!label?.trim()) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 })

  const code = `USR-${Date.now().toString(36).toUpperCase()}`
  const { data, error } = await supabase
    .from('operation_types')
    .insert({ code, label: label.trim(), sub_label: sub_label?.trim() || null, is_system: false, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
