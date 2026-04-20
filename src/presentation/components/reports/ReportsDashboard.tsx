/**
 * ReportsDashboard - Main reports component with tabs and charts
 */

"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatCLP } from "@/shared/utils/currency";

type ReportTab = "executive" | "financial" | "orders" | "inventory" | "quotes" | "restaurant";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<ReportTab>("executive");
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Análisis y reportes del negocio</p>
        </div>
        <select
          className="px-4 py-2 border rounded-md"
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
        >
          <option value="week">Última Semana</option>
          <option value="month">Último Mes</option>
          <option value="year">Último Año</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: "executive" as const, label: "Ejecutivo" },
            { id: "financial" as const, label: "Financiero" },
            { id: "orders" as const, label: "Órdenes" },
            { id: "inventory" as const, label: "Inventario" },
            { id: "quotes" as const, label: "Cotizaciones" },
            { id: "restaurant" as const, label: "Restaurante" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "executive" && <ExecutiveSummary />}
      {activeTab === "financial" && <FinancialReports period={period} />}
      {activeTab === "orders" && <OrdersReport period={period} />}
      {activeTab === "inventory" && <InventoryReport />}
      {activeTab === "quotes" && <QuotesReport period={period} />}
      {activeTab === "restaurant" && <RestaurantReport period={period} />}
    </div>
  );
}

// ==================== EXECUTIVE SUMMARY ====================

function ExecutiveSummary() {
  // Placeholder data - will be replaced with real data
  const summary = {
    totalRevenue: 15000000,
    totalExpenses: 8000000,
    netProfit: 7000000,
    totalOrders: 125,
    pendingOrders: 15,
    completedOrders: 98,
    totalQuotes: 45,
    approvedQuotes: 28,
    totalProducts: 234,
    lowStockProducts: 12,
    currentMonthRevenue: 5000000,
    previousMonthRevenue: 4500000,
    revenueGrowth: 11.1,
  };

  const kpis = [
    { label: "Ingresos Totales", value: formatCLP(summary.totalRevenue), color: "bg-blue-500" },
    { label: "Gastos Totales", value: formatCLP(summary.totalExpenses), color: "bg-red-500" },
    { label: "Ganancia Neta", value: formatCLP(summary.netProfit), color: "bg-green-500" },
    { label: "Crecimiento", value: `${summary.revenueGrowth}%`, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${kpi.color}`} />
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-3xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Órdenes</h3>
          <div className="space-y-2">
            <p className="text-sm">Total: <span className="font-semibold">{summary.totalOrders}</span></p>
            <p className="text-sm">Pendientes: <span className="text-yellow-600">{summary.pendingOrders}</span></p>
            <p className="text-sm">Completadas: <span className="text-green-600">{summary.completedOrders}</span></p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Cotizaciones</h3>
          <div className="space-y-2">
            <p className="text-sm">Total: <span className="font-semibold">{summary.totalQuotes}</span></p>
            <p className="text-sm">Aprobadas: <span className="text-green-600">{summary.approvedQuotes}</span></p>
            <p className="text-sm">Conversión: <span className="font-semibold">{((summary.approvedQuotes / summary.totalQuotes) * 100).toFixed(1)}%</span></p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Inventario</h3>
          <div className="space-y-2">
            <p className="text-sm">Productos: <span className="font-semibold">{summary.totalProducts}</span></p>
            <p className="text-sm">Stock Bajo: <span className="text-yellow-600">{summary.lowStockProducts}</span></p>
            <p className="text-sm">Valor Total: <span className="font-semibold">{formatCLP(summary.totalProducts * 50000)}</span></p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos Mensuales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { month: "Ene", revenue: 4000000 },
            { month: "Feb", revenue: 4500000 },
            { month: "Mar", revenue: 4200000 },
            { month: "Abr", revenue: 5000000 },
            { month: "May", revenue: 4800000 },
            { month: "Jun", revenue: 5200000 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(value: any) => formatCLP(value)} />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== FINANCIAL REPORTS ====================

function FinancialReports({ period }: { period: "week" | "month" | "year" }) {
  // Placeholder data
  const financialData = [
    { month: "Ene", income: 5000000, expenses: 3000000, profit: 2000000 },
    { month: "Feb", income: 5500000, expenses: 3200000, profit: 2300000 },
    { month: "Mar", income: 5200000, expenses: 3100000, profit: 2100000 },
    { month: "Abr", income: 6000000, expenses: 3500000, profit: 2500000 },
    { month: "May", income: 5800000, expenses: 3300000, profit: 2500000 },
    { month: "Jun", income: 6200000, expenses: 3600000, profit: 2600000 },
  ];

  const incomeSources = [
    { source: "Órdenes", amount: 8000000, percentage: 60 },
    { source: "Cotizaciones", amount: 3000000, percentage: 22 },
    { source: "Restaurante", amount: 2000000, percentage: 15 },
    { source: "Otros", amount: 400000, percentage: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ingresos Totales</p>
          <p className="text-3xl font-bold text-green-600">{formatCLP(15000000)}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Gastos Totales</p>
          <p className="text-3xl font-bold text-red-600">{formatCLP(8000000)}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ganancia Neta</p>
          <p className="text-3xl font-bold text-blue-600">{formatCLP(7000000)}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Comisiones Pagadas</p>
          <p className="text-3xl font-bold">{formatCLP(2800000)}</p>
        </div>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos vs Gastos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(value: any) => formatCLP(value)} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Ingresos" />
            <Bar dataKey="expenses" fill="#ef4444" name="Gastos" />
            <Bar dataKey="profit" fill="#3b82f6" name="Ganancia" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income Sources Pie Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos por Fuente</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={incomeSources}
              dataKey="amount"
              nameKey="source"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ source, percentage }) => `${source}: ${percentage}%`}
            >
              {incomeSources.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatCLP(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== ORDERS REPORT ====================

function OrdersReport({ period }: { period: "week" | "month" | "year" }) {
  // Placeholder data
  const ordersByStatus = [
    { status: "En Proceso", count: 15, percentage: 12 },
    { status: "Por Entregar", count: 8, percentage: 6.4 },
    { status: "Entregada", count: 85, percentage: 68 },
    { status: "Garantía", count: 3, percentage: 2.4 },
    { status: "Rechazada", count: 2, percentage: 1.6 },
    { status: "Sin Solución", count: 12, percentage: 9.6 },
  ];

  const ordersByDay = [
    { date: "Lun", count: 8, revenue: 400000 },
    { date: "Mar", count: 12, revenue: 600000 },
    { date: "Mié", count: 10, revenue: 500000 },
    { date: "Jue", count: 15, revenue: 750000 },
    { date: "Vie", count: 18, revenue: 900000 },
    { date: "Sáb", count: 14, revenue: 700000 },
    { date: "Dom", count: 5, revenue: 250000 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Órdenes</p>
          <p className="text-3xl font-bold">125</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">15</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Completadas</p>
          <p className="text-3xl font-bold text-green-600">98</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ingreso Total</p>
          <p className="text-3xl font-bold">{formatCLP(4100000)}</p>
        </div>
      </div>

      {/* Orders by Status Pie Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Órdenes por Estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={ordersByStatus}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ status, count }) => `${status}: ${count}`}
            >
              {ordersByStatus.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Orders by Day Line Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Órdenes por Día</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ordersByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCLP(value)} />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Cantidad" />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Ingreso" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== INVENTORY REPORT ====================

function InventoryReport() {
  // Placeholder data
  const productsByCategory = [
    { category: "Repuestos", count: 85, totalStock: 450, totalValue: 4500000 },
    { category: "Productos", count: 65, totalStock: 320, totalValue: 6400000 },
    { category: "Insumos", count: 84, totalStock: 180, totalValue: 900000 },
  ];

  const lowStockAlerts = [
    { productName: "Filtro de Aceite KTM", currentStock: 2, minStock: 10, deficit: 8 },
    { productName: "Pastillas de Freno", currentStock: 3, minStock: 15, deficit: 12 },
    { productName: "Aceite 10W-40", currentStock: 5, minStock: 20, deficit: 15 },
  ];

  const stockMovements = [
    { date: "Lun", incoming: 50, outgoing: 30, netChange: 20 },
    { date: "Mar", incoming: 35, outgoing: 40, netChange: -5 },
    { date: "Mié", incoming: 45, outgoing: 25, netChange: 20 },
    { date: "Jue", incoming: 60, outgoing: 45, netChange: 15 },
    { date: "Vie", incoming: 40, outgoing: 35, netChange: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Productos</p>
          <p className="text-3xl font-bold">234</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Stock Bajo</p>
          <p className="text-3xl font-bold text-yellow-600">12</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Sin Stock</p>
          <p className="text-3xl font-bold text-red-600">3</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-3xl font-bold">{formatCLP(11800000)}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Alertas de Stock Bajo</h3>
        <div className="space-y-2">
          {lowStockAlerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div>
                <p className="font-medium">{alert.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Stock actual: <span className="text-red-600 font-semibold">{alert.currentStock}</span> / Mínimo: {alert.minStock}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Déficit</p>
                <p className="text-lg font-bold text-red-600">-{alert.deficit}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Movements Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Movimientos de Stock</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockMovements}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Legend />
            <Bar dataKey="incoming" fill="#10b981" name="Entradas" />
            <Bar dataKey="outgoing" fill="#ef4444" name="Salidas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== QUOTES REPORT ====================

function QuotesReport({ period }: { period: "week" | "month" | "year" }) {
  // Placeholder data
  const quotesByStatus = [
    { status: "Borrador", count: 5, totalValue: 500000 },
    { status: "Enviada", count: 12, totalValue: 1800000 },
    { status: "Aprobada", count: 28, totalValue: 4200000 },
    { status: "Rechazada", count: 8, totalValue: 900000 },
  ];

  const quotesByMonth = [
    { month: "Ene", count: 8, totalValue: 1200000, approvedCount: 5 },
    { month: "Feb", count: 10, totalValue: 1500000, approvedCount: 6 },
    { month: "Mar", count: 12, totalValue: 1800000, approvedCount: 7 },
    { month: "Abr", count: 15, totalValue: 2200000, approvedCount: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
          <p className="text-3xl font-bold">45</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Aprobadas</p>
          <p className="text-3xl font-bold text-green-600">28</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
          <p className="text-3xl font-bold text-blue-600">62.2%</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Valor Aprobado</p>
          <p className="text-3xl font-bold">{formatCLP(4200000)}</p>
        </div>
      </div>

      {/* Quotes by Status Pie Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cotizaciones por Estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={quotesByStatus}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ status, count }) => `${status}: ${count}`}
            >
              {quotesByStatus.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Quotes Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cotizaciones por Mes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={quotesByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Total" />
            <Bar dataKey="approvedCount" fill="#10b981" name="Aprobadas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==================== RESTAURANT REPORT ====================

function RestaurantReport({ period }: { period: "week" | "month" | "year" }) {
  // Placeholder data
  const popularDishes = [
    { dishName: "Cordero Halal", count: 45, revenue: 675000, percentage: 25 },
    { dishName: "Shawarma", count: 38, revenue: 380000, percentage: 21 },
    { dishName: "Hummus", count: 32, revenue: 256000, percentage: 18 },
    { dishName: "Falafel", count: 28, revenue: 224000, percentage: 16 },
    { dishName: "Kebabs", count: 22, revenue: 220000, percentage: 12 },
  ];

  const revenueByHour = [
    { hour: "12:00", revenue: 150000, orderCount: 10 },
    { hour: "13:00", revenue: 250000, orderCount: 18 },
    { hour: "14:00", revenue: 200000, orderCount: 15 },
    { hour: "19:00", revenue: 180000, orderCount: 12 },
    { hour: "20:00", revenue: 300000, orderCount: 22 },
    { hour: "21:00", revenue: 350000, orderCount: 25 },
    { hour: "22:00", revenue: 200000, orderCount: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Total Mesas</p>
          <p className="text-3xl font-bold">20</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ocupación</p>
          <p className="text-3xl font-bold text-green-600">65%</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ingreso Total</p>
          <p className="text-3xl font-bold">{formatCLP(2000000)}</p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
          <p className="text-3xl font-bold">{formatCLP(15000)}</p>
        </div>
      </div>

      {/* Popular Dishes Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Platos Más Populares</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularDishes} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <YAxis dataKey="dishName" type="category" width={100} />
            <Tooltip formatter={(value: any) => formatCLP(value)} />
            <Bar dataKey="revenue" fill="#3b82f6" name="Ingreso" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Hour Line Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ingreso por Hora</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueByHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => formatCLP(value)} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Ingreso" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
