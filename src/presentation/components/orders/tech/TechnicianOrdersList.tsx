"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, Smartphone, Wrench, Search, Play, CheckCircle } from "lucide-react";
import type { WorkOrder } from "@/types";
import OrderCard from "./OrderCard";
import RepairCompletionForm from "./RepairCompletionForm";

interface TechnicianOrdersListProps {
  technicianId: string;
  branchId: string | null;
  companyId?: string | null;
}

export default function TechnicianOrdersList({ technicianId, branchId, companyId }: TechnicianOrdersListProps) {
  const [activeTab, setActiveTab] = useState<"pendientes" | "en_reparacion">("pendientes");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("work_orders")
        .select(`
          *,
          customers:customer_id(id, name, phone)
        `)
        .order("created_at", { ascending: false });

      // Filtrar por sucursal si el técnico tiene una asignada
      if (branchId) {
        q = q.eq("branch_id", branchId);
      }

      // Filtrar por estados del técnico:
      // - "pendiente": creada con el nuevo flujo (script 11)
      // - "en_proceso": creada con el flujo original (default del enum)
      // - "en_reparacion": ya tomada por alguien
      q = q.in("status", ["pendiente", "en_proceso", "en_reparacion"]);

      const { data, error } = await q;

      if (error) {
        console.error("[TechnicianOrdersList] Query error:", error);
        throw error;
      }

      // Mapear los datos al tipo WorkOrder
      const mappedOrders = (data || []).map((order) => ({
        ...order,
        device_type: order.metadata?.device_type || "Desconocido",
        device_model: order.metadata?.device_model || "Desconocido",
        problem_description:
          order.metadata?.problem_description || order.notes || "Sin descripción",
        customer: order.customers,
      })) as WorkOrder[];

      setOrders(mappedOrders);
    } catch (error) {
      console.error("[TechnicianOrdersList] Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadOrders();
  }, [technicianId, branchId]);

  const handleTakeOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("work_orders")
        .update({
          status: "en_reparacion",
          assigned_to: technicianId,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;
      
      await loadOrders();
      setActiveTab("en_reparacion");
    } catch (error) {
      console.error("Error taking order:", error);
      alert("Hubo un error al intentar tomar la orden.");
    }
  };

  const handleCompleteRepair = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const onRepairCompleted = () => {
    setSelectedOrder(null);
    loadOrders();
  };

  // Filtrado por tab activo
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pendientes") {
      // Mostrar órdenes sin técnico asignado (pendiente o en_proceso = disponibles para tomar)
      const isAvailable =
        order.status === "pendiente" || order.status === "en_proceso";
      if (!isAvailable) return false;
      const assignedId = (order as any).assigned_to || order.technician_id;
      if (assignedId) return false;
    }

    if (activeTab === "en_reparacion") {
      if (order.status !== "en_reparacion") return false;
      // Solo las asignadas al técnico actual
      const assignedId = (order as any).assigned_to || order.technician_id;
      if (assignedId !== technicianId) return false;
    }

    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.device_model.toLowerCase().includes(query) ||
        (order.customer?.name || "").toLowerCase().includes(query)
      );
    }

    return true;
  });


  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("pendientes")}
            className={`${
              activeTab === "pendientes"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
          >
            <Clock className="h-4 w-4" />
            Pendientes
            <span className="bg-slate-100 text-slate-600 ml-2 py-0.5 px-2.5 rounded-full text-xs">
              {orders.filter((o) => o.status === "pendiente" || o.status === "en_proceso").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("en_reparacion")}
            className={`${
              activeTab === "en_reparacion"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2`}
          >
            <Wrench className="h-4 w-4" />
            Mis Reparaciones
            <span className="bg-slate-100 text-slate-600 ml-2 py-0.5 px-2.5 rounded-full text-xs">
              {orders.filter((o) => o.status === "en_reparacion" && ((o as any).assigned_to === technicianId || o.technician_id === technicianId)).length}
            </span>
          </button>
        </nav>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-slate-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Buscar orden, modelo, cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
          <Smartphone className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No hay órdenes</h3>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === "pendientes" 
              ? "No hay órdenes pendientes de asignación en este momento." 
              : "No tienes reparaciones activas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onTake={() => handleTakeOrder(order.id)}
              onComplete={() => handleCompleteRepair(order.id)}
              isActiveTab={activeTab === "en_reparacion"}
            />
          ))}
        </div>
      )}

      {/* Modal Cierre Reparación */}
      {selectedOrder && companyId && (
        <RepairCompletionForm 
          order={selectedOrder} 
          technicianId={technicianId}
          companyId={companyId}
          onClose={() => setSelectedOrder(null)} 
          onSuccess={onRepairCompleted} 
        />
      )}
    </div>
  );
}
