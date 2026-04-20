"use client";
/**
 * Orders list component with filters and actions
 */

"use client";

import { useState } from "react";
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

// Placeholder data
const placeholderOrders = [
  {
    id: "1",
    orderNumber: "OT-2026-0001",
    customerName: "Juan PÃ©rez",
    businessType: "servicio_tecnico",
    status: "en_proceso" as OrderStatus,
    priority: "urgente" as Priority,
    totalPrice: 150000,
    commitmentDate: new Date("2026-04-15"),
    createdAt: new Date("2026-04-10"),
    isOverdue: false,
    isPaid: false,
  },
  {
    id: "2",
    orderNumber: "OT-2026-0002",
    customerName: "MarÃ­a GonzÃ¡lez",
    businessType: "servicio_tecnico",
    status: "por_entregar" as OrderStatus,
    priority: "media" as Priority,
    totalPrice: 85000,
    commitmentDate: new Date("2026-04-12"),
    createdAt: new Date("2026-04-08"),
    isOverdue: true,
    isPaid: true,
  },
  {
    id: "3",
    orderNumber: "OT-2026-0003",
    customerName: "Carlos Rivas",
    businessType: "servicio_tecnico",
    status: "entregada" as OrderStatus,
    priority: "baja" as Priority,
    totalPrice: 45000,
    commitmentDate: null,
    createdAt: new Date("2026-04-05"),
    isOverdue: false,
    isPaid: true,
  },
];

export function OrdersList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredOrders = placeholderOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  function formatCLP(amount: number): string {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date: Date | null): string {
    if (!date) return "-";
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ã“rdenes de Trabajo</h2>
          <p className="text-muted-foreground">Gestiona las Ã³rdenes de servicio</p>
        </div>
        <Button asChild>
          <a href="/orders/new">+ Nueva Orden</a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nÃºmero o cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">NÂ° Orden</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Prioridad</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Fecha LÃ­mite</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-accent/50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-foreground">{order.orderNumber}</span>
                    {order.isOverdue && (
                      <span className="ml-2 text-xs text-destructive">âš ï¸ Vencida</span>
                    )}
                  </td>
                  <td className="p-4 text-foreground">{order.customerName}</td>
                  <td className="p-4 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[order.priority]}`}>
                      {PRIORITY_LABELS[order.priority]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">
                    {formatDate(order.commitmentDate)}
                  </td>
                  <td className="p-4 text-right font-medium text-foreground">
                    {formatCLP(order.totalPrice)}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/orders/${order.id}`}>Ver</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay Ã³rdenes que coincidan con los filtros
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "En Proceso", count: placeholderOrders.filter((o) => o.status === "en_proceso").length, color: "bg-yellow-500" },
          { label: "Por Entregar", count: placeholderOrders.filter((o) => o.status === "por_entregar").length, color: "bg-blue-500" },
          { label: "Entregadas", count: placeholderOrders.filter((o) => o.status === "entregada").length, color: "bg-green-500" },
          { label: "Vencidas", count: placeholderOrders.filter((o) => o.isOverdue).length, color: "bg-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
