"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, CheckCircle, AlertTriangle, Package } from "lucide-react";

type OrderTab = "recientes" | "en_reparacion" | "por_entregar" | "garantia";

export default function RecentOrdersWidget() {
  const [activeTab, setActiveTab] = useState<OrderTab>("recientes");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        // Supabase necesita los nombres de la FK para hacer el join.
        // work_orders tiene: branch_id -> branches(id), customer_id -> customers(id)
        let query = supabase
          .from("work_orders")
          .select(`
            id,
            order_number,
            status,
            total_cost,
            created_at,
            metadata,
            branch_id,
            customer_id,
            branches:branch_id ( name ),
            customers:customer_id ( name )
          `);

        if (activeTab === "recientes") {
          query = query.order("created_at", { ascending: false }).limit(10);
        } else if (activeTab === "en_reparacion") {
          query = query
            .in("status", ["en_proceso", "en_reparacion"])
            .order("created_at", { ascending: false })
            .limit(10);
        } else if (activeTab === "por_entregar") {
          query = query
            .eq("status", "por_entregar")
            .order("created_at", { ascending: false })
            .limit(10);
        } else if (activeTab === "garantia") {
          query = query
            .eq("status", "garantia")
            .order("created_at", { ascending: false })
            .limit(10);
        }

        const { data, error } = await query;

        if (error) {
          console.error("[RecentOrdersWidget] Query error:", error);
          return;
        }

        setOrders(data || []);
      } catch (err) {
        console.error("[RecentOrdersWidget] Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [activeTab]);

  const tabs = [
    { id: "recientes", label: "Últimas Ingresadas", icon: Clock, color: "text-blue-500" },
    { id: "en_reparacion", label: "En Reparación", icon: AlertTriangle, color: "text-amber-500" },
    { id: "por_entregar", label: "Por Entregar", icon: CheckCircle, color: "text-emerald-500" },
    { id: "garantia", label: "En Garantía", icon: Package, color: "text-purple-500" },
  ] as const;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">Pendiente</span>;
      case "en_proceso":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">En Proceso</span>;
      case "en_reparacion":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">En Reparación</span>;
      case "por_entregar":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Por Entregar</span>;
      case "entregada":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Entregada</span>;
      case "garantia":
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Garantía</span>;
      case "rechazada":
      case "sin_solucion":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">{status}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatCLP = (amount: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-lg">Actividad de Órdenes</h3>
        <p className="text-sm text-slate-500">Monitorea el estado en tiempo real de los equipos</p>
      </div>

      <div className="flex border-b border-slate-100 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ""}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Package className="w-8 h-8 mb-2 text-slate-300" />
            <p>No hay órdenes en esta categoría</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-600 flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-medium text-slate-700">
                        {(order.customers as any)?.name || "Sin cliente"}
                      </span>
                      {order.metadata?.device_model && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="truncate max-w-[150px]">{order.metadata.device_model}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(order.created_at).toLocaleDateString("es-CL")} a las{" "}
                        {new Date(order.created_at).toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {(order.branches as any)?.name && (
                        <>
                          <span className="text-slate-300 mx-1">•</span>
                          <span>Suc: {(order.branches as any).name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-semibold text-slate-700">
                    {formatCLP(Number(order.total_cost) || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
