import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import type { User } from "@/types";
import KpiCard from "./KpiCard";

interface TechnicianDashboardProps {
  technicianId: string;
  isEncargado?: boolean;
  user?: User;
  onNewOrder?: () => void;
}

export default function TechnicianDashboard({ technicianId, isEncargado, user, onNewOrder }: TechnicianDashboardProps) {
  const [kpis, setKpis] = useState({
    daySales: 0,
    inRepair: 0,
    readyToDeliver: 0,
    inWarranty: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Obtener sucursal_id del usuario
        const sucursalId = user?.sucursal_id;

        // Si no tiene sucursal_id, no mostrar datos
        if (!sucursalId) {
          setKpis({
            daySales: 0,
            inRepair: 0,
            readyToDeliver: 0,
            inWarranty: 0,
          });
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);


        // Ventas del día (órdenes entregadas hoy de esta sucursal)
        const { data: dayOrders } = await supabase
          .from("work_orders")
          .select("total_repair_cost")
          .eq("status", "entregada")
          .eq("sucursal_id", sucursalId)
          .gte("created_at", today.toISOString())
          .lte("created_at", todayEnd.toISOString());

        const daySales = (dayOrders || []).reduce((sum, o) => sum + (o.total_repair_cost || 0), 0);

        // Equipos en reparación de esta sucursal
        const { count: inRepairCount } = await supabase
          .from("work_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "en_proceso")
          .eq("sucursal_id", sucursalId);

        // Equipos listos para entregar de esta sucursal
        const { count: readyCount } = await supabase
          .from("work_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "por_entregar")
          .eq("sucursal_id", sucursalId);

        // Equipos en garantía de esta sucursal
        const { count: warrantyCount } = await supabase
          .from("work_orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "garantia")
          .eq("sucursal_id", sucursalId);

        setKpis({
          daySales,
          inRepair: inRepairCount || 0,
          readyToDeliver: readyCount || 0,
          inWarranty: warrantyCount || 0,
        });
      } catch (error) {
        console.error("Error cargando KPIs:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [technicianId, user]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50 to-violet-100 p-4 shadow-[0_22px_38px_-30px_rgba(79,70,229,0.6)]">
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
            {isEncargado ? "Dashboard de Encargado" : "Mi Dashboard"}
          </h1>
          <p className="text-slate-700">Resumen de tus órdenes</p>
        </div>
        {onNewOrder && (
          <button
            onClick={onNewOrder}
            className="rounded-xl bg-gradient-to-r from-brand-light to-brand-dark px-6 py-2.5 font-medium text-white shadow-md shadow-brand-light/30 transition hover:brightness-105"
          >
            ➕ Nueva Orden
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Ventas del Día"
          value={formatCLP(kpis.daySales)}
          icon="dollar"
          color="emerald"
        />
        <KpiCard
          title="En Reparación"
          value={kpis.inRepair.toString()}
          icon="wrench"
          color="amber"
        />
        <KpiCard
          title="Listos para Entregar"
          value={kpis.readyToDeliver.toString()}
          icon="package"
          color="violet"
        />
        <KpiCard
          title="En Garantía"
          value={kpis.inWarranty.toString()}
          icon="shield"
          color="rose"
        />
      </div>
    </div>
  );
}
