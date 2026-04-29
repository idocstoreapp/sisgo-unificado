/**
 * Dashboard content - main layout with sidebar and content area
 * Fetches real data from work_orders table.
 */

"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminDashboard from "../financial/AdminDashboard";
import EncargadoDashboard from "../financial/EncargadoDashboard";
import type { User as Profile } from "@/types";
import {
  Wrench,
  Wallet,
  Trophy,
  ListTodo,
  ArrowRight,
  Clock3,
  X,
} from "lucide-react";

interface DashboardContentProps {
  user: User;
}

interface TechnicianKpis {
  availableOrders: number;
  activeRepairs: number;
  completedThisWeek: number;
  weekEarned: number;
  pendingBalance: number;
}

interface TechnicianOrderItem {
  id: string;
  order_number: string;
  total_cost?: number | null;
  created_at: string;
  updated_at?: string | null;
  status: string;
  priority?: string | null;
  device_model?: string | null;
  metadata?: Record<string, any> | null;
  customers?: { name?: string | null } | null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [techLoading, setTechLoading] = useState(false);
  const [techKpis, setTechKpis] = useState<TechnicianKpis>({
    availableOrders: 0,
    activeRepairs: 0,
    completedThisWeek: 0,
    weekEarned: 0,
    pendingBalance: 0,
  });
  const [topOrders, setTopOrders] = useState<TechnicianOrderItem[]>([]);
  const [repairedOrders, setRepairedOrders] = useState<TechnicianOrderItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<TechnicianOrderItem[]>([]);

  // Load user profile
  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [user.id]);

  useEffect(() => {
    if (!profile) return;
    const currentProfile = profile as Profile & { branch_id?: string | null };
    const role = String(currentProfile.role || "");
    const isAdminLike =
      role === "admin" || role === "superadmin" || role === "super_admin";

    if (isAdminLike || currentProfile.role === "encargado") return;

    async function loadTechnicianOverview() {
      setTechLoading(true);
      try {
        const now = new Date();
        const currentDay = now.getDay();
        const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysSinceMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 5);
        weekEnd.setHours(23, 59, 59, 999);

        let availableCountQuery = supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendiente", "en_proceso"]);

        let topOrdersQuery = supabase
          .from("work_orders")
          .select("id, order_number, total_cost, created_at, status, priority, device_model, metadata, customers:customer_id(name)")
          .in("status", ["pendiente", "en_proceso"])
          .order("created_at", { ascending: false })
          .limit(30);

        if (currentProfile.branch_id) {
          availableCountQuery = availableCountQuery.eq("branch_id", currentProfile.branch_id);
          topOrdersQuery = topOrdersQuery.eq("branch_id", currentProfile.branch_id);
        }

        const [{ count: availableOrders }, { count: activeRepairs }, { count: completedThisWeek }] =
          await Promise.all([
            availableCountQuery,
            supabase
              .from("work_orders")
              .select("id", { count: "exact", head: true })
              .eq("assigned_to", currentProfile.id)
              .eq("status", "en_reparacion"),
            supabase
              .from("work_orders")
              .select("id", { count: "exact", head: true })
              .eq("assigned_to", currentProfile.id)
              .in("status", ["por_entregar", "entregada"])
              .gte("updated_at", weekStart.toISOString()),
          ]);

        const [
          { data: pendingPayments },
          { data: legacyPendingCommissions },
          { data: weekCommissions },
          { data: profitableOrders },
          { data: myRepairedOrders },
          { data: myActiveOrders },
        ] =
          await Promise.all([
            supabase
              .from("employee_payments")
              .select("work_order_id, commission_amount")
              .eq("technician_id", currentProfile.id)
              .eq("payment_status", "pending"),
            supabase
              .from("technician_commissions")
              .select("work_order_id, commission_amount")
              .eq("technician_id", currentProfile.id)
              .eq("payment_status", "pending"),
            supabase
              .from("technician_commissions")
              .select("commission_amount")
              .eq("technician_id", currentProfile.id)
              .gte("created_at", weekStart.toISOString())
              .lte("created_at", weekEnd.toISOString()),
            topOrdersQuery,
            supabase
              .from("work_orders")
              .select("id, order_number, total_cost, created_at, updated_at, status, priority, device_model, metadata, customers:customer_id(name)")
              .eq("assigned_to", currentProfile.id)
              .in("status", ["por_entregar", "entregada"])
              .order("updated_at", { ascending: false })
              .limit(30),
            supabase
              .from("work_orders")
              .select("id, order_number, total_cost, created_at, updated_at, status, priority, device_model, metadata, customers:customer_id(name)")
              .eq("assigned_to", currentProfile.id)
              .in("status", ["en_reparacion", "por_entregar"])
              .order("updated_at", { ascending: false })
              .limit(12),
          ]);

        const employeeRows = (pendingPayments as any[]) || [];
        const legacyRows = (legacyPendingCommissions as any[]) || [];
        const byOrder = new Map<string, number>();
        employeeRows.forEach((row: any, idx: number) => {
          const key = row.work_order_id || `emp-${idx}`;
          byOrder.set(key, Number(row.commission_amount) || 0);
        });
        legacyRows.forEach((row: any, idx: number) => {
          const key = row.work_order_id || `leg-${idx}`;
          const current = byOrder.get(key) || 0;
          byOrder.set(key, Math.max(current, Number(row.commission_amount) || 0));
        });
        const weekEarned = ((weekCommissions as any[]) || []).reduce(
          (sum: number, row: any) => sum + (Number(row.commission_amount) || 0),
          0,
        );
        let pendingBalance = Array.from(byOrder.values()).reduce((sum, value) => sum + value, 0);
        if (pendingBalance <= 0 && weekEarned > 0) pendingBalance = weekEarned;

        setTechKpis({
          availableOrders: availableOrders || 0,
          activeRepairs: activeRepairs || 0,
          completedThisWeek: completedThisWeek || 0,
          weekEarned,
          pendingBalance,
        });

        const sortedTopOrders = ((profitableOrders as TechnicianOrderItem[]) || [])
          .sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0))
          .slice(0, 12);
        const sortedRepairedOrders = ((myRepairedOrders as TechnicianOrderItem[]) || [])
          .sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0))
          .slice(0, 20);

        setTopOrders(sortedTopOrders);
        setRepairedOrders(sortedRepairedOrders);
        setActiveOrders((myActiveOrders as TechnicianOrderItem[]) || []);
      } catch (error) {
        console.error("[DashboardContent] Error loading technician overview:", error);
      } finally {
        setTechLoading(false);
      }
    }

    loadTechnicianOverview();
  }, [profile]);

  useEffect(() => {
    const key = `dashboard-welcome-dismissed-${user.id}`;
    setWelcomeDismissed(localStorage.getItem(key) === "1");
  }, [user.id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);

  const isAdminRole = ["admin", "superadmin", "super_admin"].includes(String(profile?.role || ""));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
            {!welcomeDismissed && (
              <div className="from-primary/10 to-primary/5 border-primary/20 relative rounded-2xl border bg-gradient-to-r p-6">
                <button
                  type="button"
                  className="hover:bg-accent absolute right-3 top-3 rounded-md p-1"
                  onClick={() => {
                    const key = `dashboard-welcome-dismissed-${user.id}`;
                    localStorage.setItem(key, "1");
                    setWelcomeDismissed(true);
                  }}
                  aria-label="Ocultar bienvenida"
                >
                  <X className="size-4" />
                </button>
                <h3 className="text-foreground mb-2 text-xl font-semibold">
                  ¡Bienvenido{profile?.name ? `, ${profile.name}` : ""}!
                </h3>
                <p className="text-muted-foreground">
                  Este es tu panel de control. Desde aquí puedes gestionar órdenes, clientes, finanzas
                  y más.
                </p>
              </div>
            )}

            {/* Role-based Dashboard */}
            {isAdminRole && <AdminDashboard />}

            {profile?.role === "encargado" && <EncargadoDashboard />}

            {profile && !isAdminRole && profile.role !== "encargado" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-sm text-emerald-600">
                      <Wallet className="size-4" />
                      Saldo Disponible
                    </div>
                    <p className="text-foreground text-2xl font-bold">
                      {techLoading ? "..." : formatCurrency(techKpis.pendingBalance)}
                    </p>
                  </div>
                  <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-sm text-indigo-600">
                      <Trophy className="size-4" />
                      Ganado (Semana)
                    </div>
                    <p className="text-foreground text-2xl font-bold">
                      {techLoading ? "..." : formatCurrency(techKpis.weekEarned)}
                    </p>
                  </div>
                  <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-sm text-amber-600">
                      <Wrench className="size-4" />
                      En Reparación
                    </div>
                    <p className="text-foreground text-2xl font-bold">
                      {techLoading ? "..." : String(techKpis.activeRepairs)}
                    </p>
                  </div>
                  <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 text-sm text-sky-600">
                      <ListTodo className="size-4" />
                      Completadas (Semana)
                    </div>
                    <p className="text-foreground text-2xl font-bold">
                      {techLoading ? "..." : String(techKpis.completedThisWeek)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="bg-card border-border rounded-xl border xl:col-span-2">
                    <div className="border-border flex items-center justify-between border-b p-4">
                      <div>
                        <h4 className="text-foreground text-base font-semibold">
                          Órdenes disponibles
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Priorizadas para que tomes primero las de más valor.
                        </p>
                      </div>
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                        {techLoading ? "..." : `${techKpis.availableOrders} disponibles`}
                      </span>
                    </div>
                    <div className="relative p-4">
                      <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">
                        {topOrders.slice(0, 12).map((order, idx) => {
                          const model =
                            order.metadata?.device_model || order.device_model || "Equipo";
                          return (
                            <div
                              key={order.id}
                              className={`border-border bg-background flex items-center justify-between rounded-lg border p-3 ${
                                idx === 5 && topOrders.length > 6 ? "opacity-70" : ""
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-foreground truncate text-sm font-semibold">
                                  #{order.order_number} · {model}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {order.customers?.name || "Cliente"} ·{" "}
                                  {new Date(order.created_at).toLocaleDateString("es-CL")}
                                </p>
                              </div>
                              <p className="text-foreground text-sm font-bold">
                                {formatCurrency(Number(order.total_cost) || 0)}
                              </p>
                            </div>
                          );
                        })}
                        {!techLoading && topOrders.length === 0 && (
                          <p className="text-muted-foreground py-6 text-center text-sm">
                            No hay órdenes disponibles ahora mismo.
                          </p>
                        )}
                      </div>
                      {topOrders.length > 6 && (
                        <div className="from-background pointer-events-none absolute inset-x-4 bottom-4 h-10 bg-gradient-to-t to-transparent" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-card border-border rounded-xl border">
                      <div className="border-border border-b p-4">
                        <h4 className="text-foreground text-base font-semibold">Mis órdenes activas</h4>
                      </div>
                      <div className="max-h-[246px] space-y-3 overflow-y-auto p-4">
                        {activeOrders.map((order) => (
                          <div key={order.id} className="bg-background border-border rounded-lg border p-3">
                            <p className="text-foreground text-sm font-semibold">#{order.order_number}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {order.metadata?.problem_description ||
                                order.device_model ||
                                "Reparación en curso"}
                            </p>
                            <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                              <Clock3 className="size-3.5" />
                              Actualizada{" "}
                              {new Date(order.updated_at || order.created_at).toLocaleDateString("es-CL")}
                            </div>
                          </div>
                        ))}
                        {!techLoading && activeOrders.length === 0 && (
                          <p className="text-muted-foreground py-4 text-sm">
                            No tienes reparaciones activas por ahora.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-card border-border rounded-xl border">
                      <div className="border-border border-b p-4">
                        <h4 className="text-foreground text-base font-semibold">
                          Órdenes reparadas por mí
                        </h4>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Ordenadas por monto de mayor a menor.
                        </p>
                      </div>
                      <div className="relative p-4">
                        <div className="max-h-[246px] space-y-3 overflow-y-auto pr-1">
                          {repairedOrders.map((order, idx) => (
                            <div
                              key={order.id}
                              className={`bg-background border-border rounded-lg border p-3 ${
                                idx === 5 && repairedOrders.length > 6 ? "opacity-70" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-foreground text-sm font-semibold">#{order.order_number}</p>
                                <p className="text-foreground text-sm font-bold">
                                  {formatCurrency(Number(order.total_cost) || 0)}
                                </p>
                              </div>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {order.customers?.name || "Cliente"} ·{" "}
                                {new Date(order.updated_at || order.created_at).toLocaleDateString("es-CL")}
                              </p>
                            </div>
                          ))}
                          {!techLoading && repairedOrders.length === 0 && (
                            <p className="text-muted-foreground py-4 text-sm">
                              Aun no tienes órdenes reparadas para mostrar.
                            </p>
                          )}
                        </div>
                        {repairedOrders.length > 6 && (
                          <div className="from-background pointer-events-none absolute inset-x-4 bottom-4 h-10 bg-gradient-to-t to-transparent" />
                        )}
                      </div>
                    </div>

                    <div className="bg-card border-border rounded-xl border p-4">
                      <h4 className="text-foreground mb-3 text-base font-semibold">Accesos rápidos</h4>
                      <div className="space-y-2">
                        <Link
                          href="/orders/tech"
                          className="hover:bg-accent flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          Ver panel de órdenes
                          <ArrowRight className="size-4" />
                        </Link>
                        <Link
                          href="/orders"
                          className="hover:bg-accent flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          Historial de órdenes
                          <ArrowRight className="size-4" />
                        </Link>
                        <Link
                          href="/quotes"
                          className="hover:bg-accent flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          Ir a cotizaciones
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}
