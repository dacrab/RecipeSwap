import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)