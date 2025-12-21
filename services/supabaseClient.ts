import { createClient } from "@supabase/supabase-js";

// TODO: Move these to a safer config/env in a real app.
const SUPABASE_URL = "https://mrxuawirygwcmxxexrlk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RYjzhGnXjLIkPXw83aY-rA_FNU_3Dt1";

// Supabase automatically detects and uses AsyncStorage in React Native
// No custom storage adapter needed - Supabase handles it automatically
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
