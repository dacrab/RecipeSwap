import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// Validate Supabase configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration')
}

// Create and export Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)