import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const createClient = () => createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const supabase = createClient()

export { supabase, createClient }
