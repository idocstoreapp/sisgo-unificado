"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wrench, CheckCircle, Clock, DollarSign, Package,
  ChevronRight, Zap, Star, TrendingUp, AlertCircle,
  User, Smartphone, Calendar, ArrowRight, Play
} from "lucide-react";
import RepairCompletionForm from "@/presentation/components/orders/tech/RepairCompletionForm";
import type { WorkOrder } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TechProfile {
  id: string;
  name: string;
  branch_id: string | null;
  company_id: string;
  commission_percentage: number | null;
}

interface TechStats {
  availableOrders: number;
  activeRepairs: number;
  completedThisWeek: number;
  weekEarned: number;
  pendingBalance: number;
}

interface OrderWithCustomer extends WorkOrder {
  customers?: { id: string; name: string; phone?: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);

const timeAgo = (dateStr: string) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: "Urgente", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  media: { label: "Normal", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  baja: { label: "Baja", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pendiente: { label: "Pendiente", color: "text-slate-600", dot: "bg-slate-400" },
  en_proceso: { label: "Disponible", color: "text-blue-600", dot: "bg-blue-400" },
  en_reparacion: { label: "En Reparación", color: "text-amber-600", dot: "bg-amber-400" },
  por_entregar: { label: "Lista", color: "text-emerald-600", dot: "bg-emerald-400" },
};

// ─── OrderCard Component ──────────────────────────────────────────────────────

function TechOrderCard({
  order,
  tab,
  technicianId,
  onTake,
  onComplete,
}: {
  order: OrderWithCustomer;
  tab: "disponibles" | "activas" | "completadas";
  technicianId: string;
  onTake: (id: string) => void;
  onComplete: (order: OrderWithCustomer) => void;
}) {
  const priority = priorityConfig[order.priority || "media"] || priorityConfig.media;
  const deviceModel = order.metadata?.device_model || order.device_model || "Equipo";
  const deviceType = order.metadata?.device_type || order.device_type || "";
  const problem = order.metadata?.problem_description || order.problem_description || "Sin descripción";

  return (
    <div className={`
      group relative bg-white rounded-2xl border-2 p-5 shadow-sm 
      hover:shadow-md transition-all duration-200 cursor-default
      ${tab === "disponibles" ? "hover:border-indigo-200" : ""}
      ${tab === "activas" ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}
    `}>
      {/* Priority badge */}
      <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${priority.bg} ${priority.color}`}>
        {priority.label}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3 pr-20">
        <div className={`
          w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          ${tab === "activas" ? "bg-amber-100" : tab === "completadas" ? "bg-emerald-100" : "bg-indigo-50"}
        `}>
          <Smartphone className={`w-5 h-5 ${tab === "activas" ? "text-amber-600" : tab === "completadas" ? "text-emerald-600" : "text-indigo-500"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">#{order.order_number}</span>
            {tab === "activas" && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                En Reparación
              </span>
            )}
            {tab === "completadas" && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Lista para Entrega
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-800 mt-0.5">{deviceModel}</p>
          {deviceType && <p className="text-xs text-slate-400">{deviceType}</p>}
        </div>
      </div>

      {/* Problem */}
      <div className="bg-slate-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-medium text-slate-500 mb-0.5">Problema reportado</p>
        <p className="text-sm text-slate-700 line-clamp-2">{problem}</p>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {order.customers?.name && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{order.customers.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(order.created_at || "")}</span>
          </div>
        </div>

        {/* Action button */}
        {tab === "disponibles" && (
          <button
            onClick={() => onTake(order.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Tomar
          </button>
        )}
        {tab === "activas" && (
          <button
            onClick={() => onComplete(order)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Completar
          </button>
        )}
        {tab === "completadas" && (
          <div className="text-sm font-semibold text-emerald-600">
            {formatCLP(Number(order.total_cost) || 0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, gradient, loading
}: {
  label: string; value: string; icon: React.ReactNode;
  gradient: string; loading?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient}`}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10 translate-x-4 -translate-y-4">
        <div className="w-full h-full rounded-full bg-white" />
      </div>
      <div className="relative">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="text-2xl font-bold mb-0.5">
          {loading ? <span className="opacity-60 animate-pulse">...</span> : value}
        </p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = "disponibles" | "activas" | "completadas";

export default function TechnicianDashboardPage() {
  const [profile, setProfile] = useState<TechProfile | null>(null);
  const [stats, setStats] = useState<TechStats>({ availableOrders: 0, activeRepairs: 0, completedThisWeek: 0, weekEarned: 0, pendingBalance: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("disponibles");
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Load authenticated user profile
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPageLoading(false); return; }

      const { data } = await supabase
        .from("users")
        .select("id, name, branch_id, company_id, commission_percentage")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data as TechProfile);
      setPageLoading(false);
    }
    init();
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!profile) return;
    setStatsLoading(true);
    try {
      const now = new Date();
      // Semana comercial solicitada: lunes -> sábado
      // getDay(): 0 domingo, 1 lunes, ..., 6 sábado
      const currentDay = now.getDay();
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysSinceMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5); // sábado
      weekEnd.setHours(23, 59, 59, 999);

      // 1. Órdenes disponibles (de su sucursal, sin asignar)
      let availQuery = supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pendiente", "en_proceso"]);
      if (profile.branch_id) availQuery = availQuery.eq("branch_id", profile.branch_id);
      const { count: availableOrders } = await availQuery;

      // 2. Reparaciones activas mías
      const { count: activeRepairs } = await supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", profile.id)
        .eq("status", "en_reparacion");

      // 3. Completadas esta semana
      const { count: completedThisWeek } = await supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", profile.id)
        .in("status", ["por_entregar", "entregada"])
        .gte("updated_at", weekStart.toISOString());

      // 4. Saldo disponible (comisiones pendientes)
      // Fuente única: employee_payments (modelo unificado),
      // para mantener consistencia con el panel admin/finanzas.
      const { data: pendingPayments } = await supabase
        .from("employee_payments")
        .select("work_order_id, commission_amount")
        .eq("technician_id", profile.id)
        .eq("payment_status", "pending");
      const { data: legacyPendingCommissions } = await supabase
        .from("technician_commissions")
        .select("work_order_id, commission_amount")
        .eq("technician_id", profile.id)
        .eq("payment_status", "pending");
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

      let pendingBalance = Array.from(byOrder.values()).reduce((sum, value) => sum + value, 0);

      // 5. Total ganado en la semana (lunes a sábado), independiente del pago.
      // Fuente: technician_commissions (evento de comisión generado por orden completada).
      const { data: weekCommissions } = await supabase
        .from("technician_commissions")
        .select("commission_amount")
        .eq("technician_id", profile.id)
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const weekEarned = ((weekCommissions as any[]) || []).reduce(
        (s: number, c: any) => s + (Number(c.commission_amount) || 0),
        0
      );

      if (pendingBalance <= 0 && weekEarned > 0) pendingBalance = weekEarned;

      setStats({
        availableOrders: availableOrders || 0,
        activeRepairs: activeRepairs || 0,
        completedThisWeek: completedThisWeek || 0,
        weekEarned,
        pendingBalance,
      });
    } catch (e) {
      console.error("[TechDashboard] Stats error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, [profile]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Load orders by tab
  const loadOrders = useCallback(async () => {
    if (!profile) return;
    setOrdersLoading(true);
    try {
      let q = supabase
        .from("work_orders")
        .select(`*, customers:customer_id(id, name, phone)`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (activeTab === "disponibles") {
        q = q.in("status", ["pendiente", "en_proceso"]);
        if (profile.branch_id) q = q.eq("branch_id", profile.branch_id);
      } else if (activeTab === "activas") {
        q = q.eq("assigned_to", profile.id).eq("status", "en_reparacion");
      } else {
        q = q.eq("assigned_to", profile.id).in("status", ["por_entregar", "entregada"]).limit(10);
      }

      const { data, error } = await q;
      if (error) { console.error("[TechDashboard] Orders error:", error); return; }

      const mapped = (data || []).map((o: any) => ({
        ...o,
        device_model: o.metadata?.device_model || "Desconocido",
        device_type: o.metadata?.device_type || "",
        problem_description: o.metadata?.problem_description || o.notes || "",
        customer: o.customers,
      })) as OrderWithCustomer[];

      setOrders(mapped);
    } finally {
      setOrdersLoading(false);
    }
  }, [profile, activeTab]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleTakeOrder = async (orderId: string) => {
    if (!profile) return;
    // Nota: en algunos entornos el tipo generado de Supabase para `update()` se degrada a `never`
    // (schema cache / types desincronizados). Forzamos el builder a `any` para no bloquear el build.
    await (supabase.from("work_orders") as any)
      .update({ status: "en_reparacion", assigned_to: profile.id, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    await loadOrders();
    await loadStats();
    setActiveTab("activas");
  };

  const handleRepairCompleted = () => {
    setSelectedOrder(null);
    loadOrders();
    loadStats();
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
        No se pudo cargar tu perfil. Intenta recargar la página.
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "disponibles", label: "Disponibles", icon: <Package className="w-4 h-4" />, count: stats.availableOrders },
    { id: "activas", label: "Mis Reparaciones", icon: <Wrench className="w-4 h-4" />, count: stats.activeRepairs },
    { id: "completadas", label: "Completadas", icon: <CheckCircle className="w-4 h-4" />, count: stats.completedThisWeek },
  ];

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekLabel = `Semana del ${weekStart.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-10 translate-y-10" />
        </div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-indigo-200 text-sm font-medium">En línea</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              ¡Hola, {profile.name?.split(" ")[0] || "Técnico"}! 👋
            </h1>
            <p className="text-indigo-200 text-sm">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
            <Wrench className="w-4 h-4 text-indigo-200" />
            <span className="text-sm font-medium">Técnico de Servicio</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Disponible"
          value={formatCLP(stats.pendingBalance)}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          loading={statsLoading}
        />
        <StatCard
          label="En Reparación"
          value={String(stats.activeRepairs)}
          icon={<Wrench className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          loading={statsLoading}
        />
        <StatCard
          label="Ganado (Semana)"
          value={formatCLP(stats.weekEarned)}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          loading={statsLoading}
        />
        <StatCard
          label="Disponibles"
          value={String(stats.availableOrders)}
          icon={<Package className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-slate-600 to-slate-800"
          loading={statsLoading}
        />
      </div>

      {/* ── Orders Section ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap
                border-b-2 transition-all duration-150
                ${activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}
                `}>
                  {statsLoading ? "·" : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              {activeTab === "disponibles" && <Package className="w-14 h-14 mb-4 opacity-30" />}
              {activeTab === "activas" && <Wrench className="w-14 h-14 mb-4 opacity-30" />}
              {activeTab === "completadas" && <CheckCircle className="w-14 h-14 mb-4 opacity-30" />}
              <p className="font-semibold text-slate-600 mb-1">
                {activeTab === "disponibles" && "No hay órdenes disponibles"}
                {activeTab === "activas" && "No tienes reparaciones activas"}
                {activeTab === "completadas" && "Sin reparaciones completadas esta semana"}
              </p>
              <p className="text-sm text-center max-w-xs">
                {activeTab === "disponibles" && "Las órdenes nuevas aparecerán aquí cuando sean asignadas a tu sucursal."}
                {activeTab === "activas" && "Toma una orden disponible para comenzar a reparar."}
                {activeTab === "completadas" && "Las órdenes que marques como listas aparecerán aquí."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => (
                <TechOrderCard
                  key={order.id}
                  order={order}
                  tab={activeTab}
                  technicianId={profile.id}
                  onTake={handleTakeOrder}
                  onComplete={(o) => setSelectedOrder(o)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Repair Completion Modal ─────────────────────────────────────────── */}
      {selectedOrder && (
        <RepairCompletionForm
          order={selectedOrder}
          technicianId={profile.id}
          companyId={profile.company_id}
          commissionPercentage={profile.commission_percentage}
          onClose={() => setSelectedOrder(null)}
          onSuccess={handleRepairCompleted}
        />
      )}
    </div>
  );
}
