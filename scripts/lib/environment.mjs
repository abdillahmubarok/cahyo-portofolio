import nextEnv from '@next/env'
import { createClient } from '@supabase/supabase-js'

nextEnv.loadEnvConfig(process.cwd())
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Missing public Supabase environment variables')
export const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
export const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3100'
export const client = () => createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
export function check(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`)
  return result.data
}
export async function adminClient() {
  if (!process.env.TEMP_ADMIN_EMAIL || !process.env.TEMP_ADMIN_PASSWORD) throw new Error('Set TEMP_ADMIN_EMAIL and TEMP_ADMIN_PASSWORD in the process environment; no credentials are bundled.')
  const admin = client()
  check(await admin.auth.signInWithPassword({ email: process.env.TEMP_ADMIN_EMAIL, password: process.env.TEMP_ADMIN_PASSWORD }), 'Admin sign in')
  if (!check(await admin.rpc('is_admin'), 'Admin membership')) throw new Error('Authenticated user is not an admin')
  return admin
}
export function requireMutationTarget() {
  // Obtain VERIFIED_SUPABASE_PROJECT_REF from the independently verified MCP or
  // linked CLI target, never automatically copy it from NEXT_PUBLIC_SUPABASE_URL.
  if (process.env.VERIFIED_SUPABASE_PROJECT_REF !== projectRef) throw new Error('Mutation blocked: independently verify the MCP/CLI target and set VERIFIED_SUPABASE_PROJECT_REF to the matching .env.local project ref.')
  console.log(`Verified mutation target: ${projectRef}`)
}

export async function listStorage(supabase, prefix = '') {
  const paths = []
  for (let offset = 0;; offset += 100) {
    const entries = check(await supabase.storage.from('portfolio-images').list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }), `List Storage ${prefix}`)
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id) paths.push(path)
      else paths.push(...await listStorage(supabase, path))
    }
    if (entries.length < 100) return paths
  }
}

export async function allRows(supabase, table, columns = '*') {
  const rows = []
  for(let offset=0;;offset+=500) {
    const page = check(await supabase.from(table).select(columns).order('id').range(offset,offset+499), `Read ${table}`)
    rows.push(...page)
    if(page.length<500) return rows
  }
}
