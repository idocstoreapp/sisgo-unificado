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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">N° Orden</th>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Estado</th>
                  <th className="text-left p-3 text-sm font-medium hidden lg:table-cell">Prioridad</th>
                  <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Fecha Límite</th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                  <th className="text-right p-3 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-accent/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">
                        {customers[order.customer_id] || "Cliente #" + order.customer_id?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status as OrderStatus] || "bg-gray-100"}`}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_COLORS[order.priority as Priority] || "bg-gray-100"}`}>
                        {PRIORITY_LABELS[order.priority as Priority] || order.priority}
                      </span>
                    </td>
                    <td className="p-3 text-sm hidden sm:table-cell">
                      <span className={isOverdue(order) ? "text-red-600 font-medium" : ""}>
                        {formatDate(order.commitment_date)}
                      </span>
                      {isOverdue(order) && (
                        <span className="ml-1 text-xs">⚠️</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCLP(order.total_price)}
                      {order.paid_at && (
                        <div className="text-xs text-green-600">Pagado</div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
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
    </div>
  );
}