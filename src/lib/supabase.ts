import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env?.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL =
  typeof envUrl === 'string' && envUrl.startsWith('http')
    ? envUrl
    : 'https://placeholder.supabase.co';

export const SUPABASE_ANON_KEY =
  typeof envAnonKey === 'string' && envAnonKey.length > 20
    ? envAnonKey
    : 'public-anon-placeholder-key';

export const isSupabaseConfigured = Boolean(
  typeof envUrl === 'string' &&
    envUrl.startsWith('http') &&
    typeof envAnonKey === 'string' &&
    envAnonKey.length > 20
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'erikalog_supabase_auth',
  },
});
