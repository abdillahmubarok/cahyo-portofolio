import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AdminProfile } from '@/lib/types'

export async function getAuthenticatedAdmin(): Promise<{
  userId: string
  profile: AdminProfile
}> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/admin/login?error=not_admin')
  }

  return { userId: user.id, profile }
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return false

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  return !!profile
}
