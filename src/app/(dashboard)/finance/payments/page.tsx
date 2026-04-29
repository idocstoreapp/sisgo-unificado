import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import TechnicianPaymentFocusPage from "@/presentation/components/financial/TechnicianPaymentFocusPage";

export default async function FinancePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  return <TechnicianPaymentFocusPage initialTechnicianId={params.tech} />;
}
