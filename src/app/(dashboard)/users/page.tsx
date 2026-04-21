/**
 * Users management page
 */

import { getSupabaseServerClient } from "@/infrastructure/database/supabase/server";
import { redirect } from "next/navigation";
import { UsersManagement } from "@/presentation/components/users/UsersManagement";

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO: Fetch users from database
  // const users = await fetchUsers(user.id);

  return (
    <div className="min-h-screen bg-background">
      <UsersManagement />
    </div>
  );
}
