import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Use Service Role Key for server-side admin database access, fallback to Anon Key if not defined
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseServerClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project')) {
    throw new Error(
      'Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
  }

  if (!supabaseServerClient) {
    supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseServerClient;
};

// Safe helper to check connection readiness without throwing
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseServiceKey.includes('your-supabase')
  );
};
