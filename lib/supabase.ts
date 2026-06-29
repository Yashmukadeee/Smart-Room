import { createBrowserClient } from '@supabase/ssr';

// Replace these with your actual Supabase Project URL and Anon Key in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export interface ApplianceDevice {
  id: string;
  name: string;
  category: 'light' | 'ac' | 'fan' | 'lock';
  status: boolean;
  value: number;
  color?: string; // Hex color for RGB lights
  room: string;
  updated_at: string;
}
