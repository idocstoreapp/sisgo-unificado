/**
 * New order page
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import OrderWizard from "@/presentation/components/orders/wizard/OrderWizard";

export default async function NewOrderPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <OrderWizard technicianId={user.id} />
    </div>
  );
}
