/**
 * Supabase client for use in Server Actions ONLY
 * This file should NEVER be imported by client components or hooks
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Get Supabase admin client with service role key
 * Use this ONLY in Server Actions and Server Components
 * NEVER import this in client components
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}
