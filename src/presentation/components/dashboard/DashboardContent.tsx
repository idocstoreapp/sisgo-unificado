/**
 * Dashboard content - main layout with sidebar and content area
 * Fetches real data from work_orders and customers tables.
 */

"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/infrastructure/auth/authService";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/presentation/components/ui/button";
import AdminDashboard from "../financial/AdminDashboard";
import EncargadoDashboard from "../financial/EncargadoDashboard";
import type { User as Profile } from "@/types";
import {
  LayoutDashboard,
  Package,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  ShoppingCart,
  Utensils,
} from "lucide-react";

interface DashboardContentProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/orders", icon: Package, label: "Órdenes" },
  { href: "/quotes", icon: FileText, label: "Cotizaciones" },
  { href: "/inventory", icon: ShoppingCart, label: "Inventario" },
  { href: "/restaurant", icon: Utensils, label: "Restaurante" },
  { href: "/customers", icon: Users, label: "Clientes" },
  { href: "/users", icon: Users, label: "Usuarios" },
  { href: "/branches", icon: Building2, label: "Sucursales" },
  { href: "/finance", icon: DollarSign, label: "Finanzas" },
  { href: "/reports", icon: BarChart3, label: "Reportes" },
  { href: "/settings", icon: Settings, label: "Configuración" },
];

interface QuickStats {
  ordersToday: number;
  totalCustomers: number;
  revenueMonth: number;
  pendingOrders: number;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    ordersToday: 0,
    totalCustomers: 0,
    revenueMonth: 0,
    pendingOrders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load user profile
  useEffect(() => {
    supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [user.id]);

  // Load real stats from work_orders and customers
  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();
        const monthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString();

        // Órdenes creadas hoy
        const { count: ordersToday } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart);

        // Total clientes registrados
        const { count: totalCustomers } = await supabase
          .from("customers")
          .select("id", { count: "exact", head: true });

        // Ingresos del mes (suma de total_cost en órdenes entregadas)
        const { data: monthOrders } = await supabase
          .from("work_orders")
          .select("total_cost")
          .in("status", ["entregada", "por_entregar"])
          .gte("created_at", monthStart);

        const revenueMonth = ((monthOrders as any[]) || []).reduce(
          (sum: number, o: any) => sum + (Number(o.total_cost) || 0),
          0
        );

        // Órdenes pendientes / en proceso (activas)
        const { count: pendingOrders } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendiente", "en_proceso", "en_reparacion"]);

        setStats({
          ordersToday: ordersToday || 0,
          totalCustomers: totalCustomers || 0,
          revenueMonth: revenueMonth || 0,
          pendingOrders: pendingOrders || 0,
        });
      } catch (err) {
        console.error("[DashboardContent] Error loading stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);

  const quickStats = [
    {
      label: "Órdenes Hoy",
      value: statsLoading ? "..." : String(stats.ordersToday),
      color: "bg-blue-500",
    },
    {
      label: "Clientes",
      value: statsLoading ? "..." : String(stats.totalCustomers),
      color: "bg-green-500",
    },
    {
      label: "Ingresos Mes",
      value: statsLoading ? "..." : formatCurrency(stats.revenueMonth),
      color: "bg-yellow-500",
    },
    {
      label: "Pendientes",
      value: statsLoading ? "..." : String(stats.pendingOrders),
      color: "bg-red-500",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          w-64 bg-card border-r border-border flex flex-col
          transition-transform duration-200 ease-in-out
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">SISGO</h1>
              <p className="text-xs text-muted-foreground">Gestión Unificado</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="size-5" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-secondary-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.name || user.email}
              </p>
              {profile && (
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="size-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <button className="hidden lg:block p-2 rounded-lg hover:bg-accent">
            <Menu className="size-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <div className="w-9" />
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ¡Bienvenido{profile?.name ? `, ${profile.name}` : ""}!
              </h3>
              <p className="text-muted-foreground">
                Este es tu panel de control. Desde aquí puedes gestionar órdenes, clientes, finanzas y más.
              </p>
            </div>

            {/* Quick stats — real data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Role-based Dashboard */}
            {(profile?.role === "admin" ||
              profile?.role === "superadmin" ||
              profile?.role === "super_admin") && <AdminDashboard />}

            {profile?.role === "encargado" && <EncargadoDashboard />}

            {profile &&
              profile.role !== "admin" &&
              profile.role !== "superadmin" &&
              profile.role !== "super_admin" &&
              profile.role !== "encargado" && (
                <div className="bg-card border border-border rounded-xl p-8 text-center mt-4">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Dashboard de Técnico
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    Dirígete a la pestaña &ldquo;Órdenes&rdquo; para ver tus trabajos asignados.
                  </p>
                  <a
                    href="/orders/tech"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Package className="size-4" />
                    Ver mis órdenes
                  </a>
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
