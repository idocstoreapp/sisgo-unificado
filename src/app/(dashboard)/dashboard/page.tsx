/**
 * Dashboard page - main landing after login
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/presentation/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardContent user={session.user} />
    </div>
  );
}
