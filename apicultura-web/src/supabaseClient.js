import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://htypsfjkqyugbbvinkdl.supabase.co'
const supabaseAnonKey = 'sb_publishable_OzOxywVI0FtYBdH97khBRA_c-1ayw80'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'apicultura' }
})