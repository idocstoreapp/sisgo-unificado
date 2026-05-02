import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { isTrialBlocked } from "@/lib/trial-gating";
import DashboardShell from "@/presentation/components/layout/DashboardShell";

async function checkTrialAndRedirect(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (!profile?.company_id) return;

  const { data: company } = await supabase
    .from("companies")
    .select("config")
    .eq("id", profile.company_id)
    .single();

  const companyConfig = (company as { config?: Record<string, unknown> } | null)?.config;

  if (isTrialBlocked(companyConfig)) {
    redirect("/billing/activate?reason=trial_expired");
  }
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await checkTrialAndRedirect(user.id);

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
