import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase client-side environment variables.");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
});



