/**
 * Dashboard content - main layout with sidebar and content area
 * Fetches real data from work_orders table.
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
  revenueMonth: number;
  pendingOrders: number;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    ordersToday: 0,
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

  // Load real stats from work_orders
  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ).toISOString();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        // Órdenes creadas hoy
        const { count: ordersToday } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart);

        // Ingresos del mes (suma de total_cost en órdenes entregadas)
        const { data: monthOrders } = await supabase
          .from("work_orders")
          .select("total_cost")
          .in("status", ["entregada", "por_entregar"])
          .gte("created_at", monthStart);

        const revenueMonth = ((monthOrders as any[]) || []).reduce(
          (sum: number, o: any) => sum + (Number(o.total_cost) || 0),
          0,
        );

        // Órdenes pendientes / en proceso (activas)
        const { count: pendingOrders } = await supabase
          .from("work_orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pendiente", "en_proceso", "en_reparacion"]);

        setStats({
          ordersToday: ordersToday || 0,
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

  const isAdminRole =
    profile?.role === "admin" || profile?.role === "superadmin" || profile?.role === "super_admin";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} bg-card border-border flex w-64 flex-col border-r transition-transform duration-200 ease-in-out lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="border-border border-b p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <span className="text-primary-foreground text-lg font-bold">S</span>
            </div>
            <div>
              <h1 className="text-foreground font-bold">SISGO</h1>
              <p className="text-muted-foreground text-xs">Gestión Unificado</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="size-5" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User section */}
        <div className="border-border border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-secondary-foreground text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {profile?.name || user.email}
              </p>
              {profile && (
                <p className="text-muted-foreground text-xs capitalize">{profile.role}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-border bg-card flex items-center justify-between border-b p-4">
          <button
            className="hover:bg-accent rounded-lg p-2 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <button className="hover:bg-accent hidden rounded-lg p-2 lg:block">
            <Menu className="size-5" />
          </button>
          <h2 className="text-foreground text-lg font-semibold">Dashboard</h2>
          <div className="w-9" />
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Welcome */}
            <div className="from-primary/10 to-primary/5 border-primary/20 rounded-2xl border bg-gradient-to-r p-6">
              <h3 className="text-foreground mb-2 text-xl font-semibold">
                ¡Bienvenido{profile?.name ? `, ${profile.name}` : ""}!
              </h3>
              <p className="text-muted-foreground">
                Este es tu panel de control. Desde aquí puedes gestionar órdenes, clientes, finanzas
                y más.
              </p>
            </div>

            {/* Quick stats — real data (solo roles no-admin para evitar duplicar KPIs) */}
            {!isAdminRole && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card border-border rounded-xl border p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stat.color}`} />
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                    </div>
                    <p className="text-foreground text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Role-based Dashboard */}
            {isAdminRole && <AdminDashboard />}

            {profile?.role === "encargado" && <EncargadoDashboard />}

            {profile && !isAdminRole && profile.role !== "encargado" && (
              <div className="bg-card border-border mt-4 rounded-xl border p-8 text-center">
                <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h4 className="text-foreground mb-2 text-lg font-semibold">Dashboard de Técnico</h4>
                <p className="text-muted-foreground mb-4">
                  Dirígete a la pestaña &ldquo;Órdenes&rdquo; para ver tus trabajos asignados.
                </p>
                <a
                  href="/orders/tech"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
