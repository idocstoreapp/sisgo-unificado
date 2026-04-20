/**
 * Server Actions for Orders module
 * These actions are called from client components via React Server Actions
 */

"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/database/supabase/database.types";

// Get Supabase admin client (called within server action, safe to use)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role configuration");
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Server Actions will be added here as needed
export async function testConnection() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("companies").select("count").single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
