/**
 * Dashboard content - main layout with sidebar and content area
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
import type { Profile } from "@/types";
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
  FileText,
  Warehouse,
  UtensilsCrossed,
} from "lucide-react";

interface DashboardContentProps {
  user: User;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Órdenes", href: "/orders" },
  { icon: FileText, label: "Cotizaciones", href: "/quotes" },
  { icon: Warehouse, label: "Inventario", href: "/inventory" },
  { icon: UtensilsCrossed, label: "Restaurante", href: "/restaurant" },
  { icon: Users, label: "Clientes", href: "/customers" },
  { icon: Users, label: "Usuarios", href: "/users" },
  { icon: Package, label: "Sucursales", href: "/branches" },
  { icon: DollarSign, label: "Finanzas", href: "/finance" },
  { icon: BarChart3, label: "Reportes", href: "/reports" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.from("users").select("*").eq("id", user.id).single().then(({data}) => {
      if (data) setProfile(data as Profile);
    });
  }, [user.id]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu overlay */}
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
                {user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
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
          <button
            className="hidden lg:block p-2 rounded-lg hover:bg-accent"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="size-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            Dashboard
          </h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome message */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ¡Bienvenido!
              </h3>
              <p className="text-muted-foreground">
                Este es tu panel de control. Desde aquí puedes gestionar órdenes, clientes, finanzas y más.
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Órdenes Hoy", value: "0", color: "bg-blue-500" },
                { label: "Clientes", value: "0", color: "bg-green-500" },
                { label: "Ingresos Mes", value: "$0", color: "bg-yellow-500" },
                { label: "Pendientes", value: "0", color: "bg-red-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Conditional Dashboard Render */}
            {profile?.role === "admin" && <AdminDashboard />}
            {profile?.role === "encargado" && <EncargadoDashboard />}
            {profile?.role !== "admin" && profile?.role !== "encargado" && (
              <div className="bg-card border border-border rounded-xl p-8 text-center mt-4">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Dashboard de Técnico
                </h4>
                <p className="text-muted-foreground mb-4">
                  Dirígete a la pestaña "Órdenes" para ver tus trabajos asignados.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
