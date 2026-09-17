// scripts/reset-admin-password.mjs

import { createClient } from '@supabase/supabase-js'
import readline from 'node:readline'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ADMIN_EMAIL = 'admin@cahyo-architecture.com'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('New admin password: ', async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (error) throw error

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    )

    if (!user) {
      throw new Error(`Admin user not found: ${ADMIN_EMAIL}`)
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      })

    if (updateError) throw updateError

    console.log(`Password successfully changed for ${ADMIN_EMAIL}`)
  } catch (error) {
    console.error('Password reset failed:', error.message)
    process.exitCode = 1
  } finally {
    rl.close()
  }
})



// $env:NEXT_PUBLIC_SUPABASE_URL="" 
// $env:SUPABASE_SERVICE_ROLE_KEY="" 
// node scripts/reset-admin-password.mjs