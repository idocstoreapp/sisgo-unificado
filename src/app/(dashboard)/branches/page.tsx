/**
 * Branches management page
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import { BranchesManagement } from "@/presentation/components/branches/BranchesManagement";

export default async function BranchesPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <BranchesManagement />
    </div>
  );
}
