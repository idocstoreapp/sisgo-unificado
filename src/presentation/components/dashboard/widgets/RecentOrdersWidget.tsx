"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, CheckCircle, AlertTriangle, Package, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { ORDER_STATUS_LABELS } from "@/shared/constants";
import OrderDetailPanel from "@/presentation/components/orders/OrderDetailPanel";

type OrderTab = "recientes" | "en_reparacion" | "por_entregar" | "garantia";

export default function RecentOrdersWidget() {
  const [activeTab, setActiveTab] = useState<OrderTab>("recientes");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (data?.role) setUserRole(String(data.role));
    }
    loadRole();
  }, []);

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

  const formatCLP = (amount: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);

  const canQuickUpdate = ["admin", "superadmin", "super_admin", "encargado", "technician"].includes(
    userRole,
  );

  async function handleQuickStatusChange(order: any, nextStatus: string) {
    if (!canQuickUpdate) return;
    setUpdatingOrderId(order.id);
    const { error } = await supabase
      .from("work_orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setUpdatingOrderId(null);
    if (!error) {
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)),
      );
    }
  }

  async function handleInlineStatusChange(order: any, nextStatus: string) {
    if (!canQuickUpdate || order.status === nextStatus) return;
    await handleQuickStatusChange(order, nextStatus);
  }

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
              <div key={order.id} className="p-4 transition-colors hover:bg-slate-50 group">
                <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-600 flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{order.order_number}</span>
                      {canQuickUpdate ? (
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleInlineStatusChange(order, value)}
                          disabled={updatingOrderId === order.id}
                        >
                          <SelectTrigger className="h-7 min-w-[140px] rounded-full border px-2 py-0 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                        </span>
                      )}
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
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-11">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Ver detalle
                  </button>
                  {canQuickUpdate && ["en_proceso", "en_reparacion"].includes(order.status) && (
                    <button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => handleQuickStatusChange(order, "por_entregar")}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updatingOrderId === order.id ? "Guardando..." : "Marcar por entregar"}
                    </button>
                  )}
                  {canQuickUpdate && order.status === "por_entregar" && (
                    <button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => handleQuickStatusChange(order, "entregada")}
                      className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updatingOrderId === order.id ? "Guardando..." : "Completar entrega"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className="hover:bg-accent absolute right-3 top-3 z-10 rounded-md p-1"
              aria-label="Cerrar detalle"
            >
              <X className="size-4" />
            </button>
            <OrderDetailPanel
              orderId={selectedOrderId}
              embedded
              onClose={() => setSelectedOrderId(null)}
              onSaved={async () => {
                const { data } = await supabase
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
                  `)
                  .in("id", orders.map((o) => o.id));
                if (data) setOrders(data);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
