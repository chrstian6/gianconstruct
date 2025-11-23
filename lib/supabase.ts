// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = process.env.SUPABASE_URL as string;
const supabaseKey: string = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceKey: string = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Anon Key is missing");
}

// Client for client-side operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Server client for server-side operations (bypasses RLS)
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey, // Fallback to anon key if service key not available
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
