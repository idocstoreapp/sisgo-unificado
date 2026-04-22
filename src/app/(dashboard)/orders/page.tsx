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

  return (
    <div className="min-h-screen bg-background">
      <OrdersList />
    </div>
  );
}
