/**
 * Finance dashboard page
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import { FinanceDashboard } from "@/presentation/components/finance/FinanceDashboard";

export default async function FinancePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return <div className="min-h-screen bg-background"><FinanceDashboard /></div>;
}
