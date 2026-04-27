/**
 * Orders list page
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import { OrdersList } from "@/presentation/components/orders/OrdersList";

export default async function OrdersPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = data as any;

  if (profile?.role === "technician") {
    redirect("/orders/tech");
  }

  return (
    <div className="min-h-screen bg-background">
      <OrdersList />
    </div>
  );
}
