const { createClient: createSupabaseClient } = require('@supabase/supabase-js')

const createClient = (
  supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
) => createSupabaseClient(supabaseUrl, supabaseKey)

const supabase = createClient()

module.exports = { supabase, createClient }
