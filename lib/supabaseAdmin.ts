import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client if Service Role Key is configured, fallback to anon client otherwise
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Return standard client in browser, though this file should only be loaded on the server
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  console.warn(
    "⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local.\n" +
    "Server routes will fall back to the public anon key. Writes will fail if Row Level Security (RLS) is active."
  );
  return createClient(supabaseUrl, supabaseAnonKey);
})();
