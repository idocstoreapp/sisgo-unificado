/**
 * Re-export the browser Supabase client for components that import from @/lib/supabase
 * This is a convenience barrel that points to the actual client location
 */

export { supabase } from "@/infrastructure/database/supabase/client";
