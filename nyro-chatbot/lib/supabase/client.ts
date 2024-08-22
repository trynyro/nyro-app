import { createBrowserClient } from "@supabase/ssr"

export const createClient = () =>
  console.log("Supabase URL client:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Anon Key client:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
