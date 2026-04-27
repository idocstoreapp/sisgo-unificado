"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import KpiCard from "./KpiCard";
import AdminReports from "./AdminReports";
import RecentOrdersWidget from "../dashboard/widgets/RecentOrdersWidget";
import TopTechniciansWidget from "../dashboard/widgets/TopTechniciansWidget";
import BranchMetricsWidget from "../dashboard/widgets/BranchMetricsWidget";
import { TrendingUp, Package, ShieldCheck, Users } from "lucide-react";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({
    monthRevenue: 0,
    pendingCommissions: 0,
    warrantyOrders: 0,
    activeOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshKPIs = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // 1. Ingresos del mes (sum total_cost de órdenes entregadas/por_entregar este mes)
        const { data: monthOrders } = await supabase
          .from("work_orders")
          .select("total_cost")
          .in("status", ["entregada", "por_entregar"])
          .gte("updated_at", monthStart)
          .lte("updated_at", monthEnd);

        const monthRevenue = ((monthOrders as any[]) || []).reduce(
          (s: number, r: any) => s + (Number(r.total_cost) || 0),
          0
        );

        // 2. Comisiones pendientes de pago a técnicos
        const { data: pendingComm } = await supabase
          .from("technician_commissions")
          .select("commission_amount")
          .eq("payment_status", "pending");

        const pendingCommissions = ((pendingComm as any[]) || []).reduce(
          (s: number, r: any) => s + (Number(r.commission_amount) || 0),
          0
        );

        // 3. Órdenes en garantía
        const { count: warrantyOrders } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "garantia");

        // 4. Órdenes activas (en proceso de reparación)
        const { count: activeOrders } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendiente", "en_proceso", "en_reparacion"]);

        setKpis({
          monthRevenue,
          pendingCommissions,
          warrantyOrders: warrantyOrders || 0,
          activeOrders: activeOrders || 0,
        });
      } catch (error) {
        console.error("[AdminDashboard] Error cargando KPIs:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Visión General del Administrador
        </h1>
        <p className="text-slate-500 max-w-2xl">
          Monitorea el rendimiento de tus sucursales, el progreso de las órdenes y la productividad de tu equipo en tiempo real.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ingresos del Mes"
          value={loading ? "..." : formatCLP(kpis.monthRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Comisiones Pendientes"
          value={loading ? "..." : formatCLP(kpis.pendingCommissions)}
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          title="Órdenes Activas"
          value={loading ? "..." : String(kpis.activeOrders)}
          icon={<Package className="w-5 h-5" />}
        />
        <KpiCard
          title="En Garantía"
          value={loading ? "..." : String(kpis.warrantyOrders)}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Recent Orders (2/3 width) */}
        <div className="xl:col-span-2 h-[500px]">
          <RecentOrdersWidget />
        </div>

        {/* Right: Top Techs + Branch Metrics (1/3 width) */}
        <div className="flex flex-col gap-6 h-[500px]">
          <div className="flex-1">
            <TopTechniciansWidget />
          </div>
          <div className="flex-1">
            <BranchMetricsWidget />
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <AdminReports key={refreshKey} />
      </div>
    </div>
  );
}
