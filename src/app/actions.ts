/**
 * Server Actions for all modules
 * These actions bridge client components with server-side domain logic
 */

"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/database/supabase/database.types";

// Helper to get admin client (only runs on server)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase service role configuration");
  }
  
  return createAdminClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Export empty object for now - will be populated as needed
export const serverActions = {
  testConnection: async () => {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("companies").select("count").single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },
};
