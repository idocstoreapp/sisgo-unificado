"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/shared/constants";
import type { OrderStatus, Priority } from "@/shared/kernel/types";
import Link from "next/link";
import { CalendarClock, ClipboardList, Sparkles, X } from "lucide-react";
import OrderDetailPanel from "./OrderDetailPanel";

interface WorkOrder {
  id: string;
  order_number: string;
  customer_id: string;
  branch_id: string | null;
  assigned_to: string | null;
  business_type: string;
  status: string;
  priority: string;
  commitment_date: string | null;
  created_at: string;
  total_price: number;
  replacement_cost: number;
  labor_cost: number;
  paid_at: string | null;
}

interface CustomerMap {
  [key: string]: string;
}

export function OrdersList() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    const { data } = await supabase.from("customers").select("id, name");
    if (data) {
      const map: CustomerMap = {};
      data.forEach((c: any) => { map[c.id] = c.name; });
      setCustomers(map);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("work_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      if (branchFilter !== "all") {
        query = query.eq("branch_id", branchFilter);
      }

      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        query = query.gte("created_at", from.toISOString());
      }

      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query = query.lte("created_at", to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading orders:", error);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, branchFilter, dateFrom, dateTo]);

  const loadBranches = useCallback(async () => {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .order("name");
    if (data) setBranches(data);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  function formatCLP(amount: number): string {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  function formatDate(date: string | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function isOverdue(order: WorkOrder): boolean {
    if (!order.commitment_date) return false;
    const commitment = new Date(order.commitment_date);
    const now = new Date();
    return (
      order.status !== "entregada" &&
      order.status !== "rechazada" &&
      commitment < now
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  async function quickUpdateOrderStatus(orderId: string, status: string) {
    setUpdatingOrderId(orderId);
    const { error } = await supabase
      .from("work_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setUpdatingOrderId(null);
    if (!error) {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Órdenes de Trabajo</h2>
          <p className="text-muted-foreground">Gestiona las órdenes de servicio</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">+ Nueva Orden</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Input
          placeholder="Buscar por número..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-600" />
          <p className="text-sm font-semibold text-slate-800">Historial de órdenes</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Órdenes visibles</p>
            <p className="text-xl font-bold text-slate-900">{filteredOrders.length}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Vencidas</p>
            <p className="text-xl font-bold text-rose-600">
              {filteredOrders.filter((order) => isOverdue(order)).length}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Pagadas</p>
            <p className="text-xl font-bold text-emerald-600">
              {filteredOrders.filter((order) => Boolean(order.paid_at)).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-background p-3 transition hover:border-indigo-200 hover:bg-accent/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground">{order.order_number}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {customers[order.customer_id] || "Cliente #" + order.customer_id?.slice(0, 8)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status as OrderStatus] || "bg-gray-100"}`}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_COLORS[order.priority as Priority] || "bg-gray-100"}`}>
                        {PRIORITY_LABELS[order.priority as Priority] || order.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCLP(order.total_price)}</p>
                    {order.paid_at && <p className="text-xs text-emerald-600">Pagado</p>}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                        Ver detalle
                      </Button>
                      {["en_proceso", "en_reparacion"].includes(order.status) && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={updatingOrderId === order.id}
                          onClick={() => quickUpdateOrderStatus(order.id, "por_entregar")}
                        >
                          {updatingOrderId === order.id ? "..." : "Por entregar"}
                        </Button>
                      )}
                      {order.status === "por_entregar" && (
                        <Button
                          size="sm"
                          disabled={updatingOrderId === order.id}
                          onClick={() => quickUpdateOrderStatus(order.id, "entregada")}
                        >
                          {updatingOrderId === order.id ? "..." : "Completar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  <span className={isOverdue(order) ? "font-semibold text-rose-600" : ""}>
                    Fecha límite: {formatDate(order.commitment_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="mx-auto mb-2 size-5" />
            No hay órdenes que coincidan con los filtros
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: "En Proceso", status: "en_proceso", color: "bg-yellow-500" },
          { label: "Por Entregar", status: "por_entregar", color: "bg-blue-500" },
          { label: "Entregada", status: "entregada", color: "bg-green-500" },
          { label: "Rechazada", status: "rechazada", color: "bg-red-500" },
          { label: "Garantía", status: "garantia", color: "bg-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.status === stat.status).length}
            </p>
          </div>
        ))}
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
              onSaved={loadOrders}
            />
          </div>
        </div>
      )}
    </div>
  );
}