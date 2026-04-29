"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/infrastructure/auth/authService";
import { supabase } from "@/lib/supabase";
import { Button } from "@/presentation/components/ui/button";
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
  Plus,
} from "lucide-react";

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
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

const configNavItems = [
  { href: "/branches", icon: Building2, label: "Sucursales" },
  { href: "/users", icon: Users, label: "Usuarios" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
];

const mainNavItems = navItems.filter(
  (item) => !["/branches", "/users", "/settings"].includes(item.href),
);

const titleByPrefix: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Órdenes",
  "/quotes": "Cotizaciones",
  "/inventory": "Inventario",
  "/restaurant": "Restaurante",
  "/customers": "Clientes",
  "/users": "Usuarios",
  "/branches": "Sucursales",
  "/finance": "Finanzas",
  "/reports": "Reportes",
  "/settings": "Configuración",
};

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const pageTitle = useMemo(() => {
    const matchedPrefix = Object.keys(titleByPrefix).find((prefix) => pathname.startsWith(prefix));
    return matchedPrefix ? titleByPrefix[matchedPrefix] : "Panel";
  }, [pathname]);

  const isAdminRole = ["admin", "superadmin", "super_admin"].includes(String(profile?.role || ""));
  const payTechniciansHref = isAdminRole ? "/finance/payments" : "/finance";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} bg-card border-border flex w-64 flex-col border-r transition-transform duration-200 ease-in-out lg:translate-x-0`}
      >
        <div className="border-border border-b p-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <span className="text-primary-foreground text-lg font-bold">S</span>
            </div>
            <div>
              <h1 className="text-foreground font-bold">SISGO</h1>
              <p className="text-muted-foreground text-xs">Sistema de Gestión</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <a
            href="/orders/new"
            className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Plus className="size-4" />
            Nueva Orden
          </a>

          <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider">
            Principal
          </p>
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="border-border my-4 border-t" />

          <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider">
            Configuración
          </p>
          <div className="space-y-1">
            {configNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            );
            })}
          </div>

          <a
            href={payTechniciansHref}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <DollarSign className="size-4" />
            Ir a pagar a técnicos
          </a>
        </nav>

        <div className="border-border border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-secondary-foreground text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">{profile?.name || user.email}</p>
              {profile && <p className="text-muted-foreground text-xs capitalize">{profile.role}</p>}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
          <h2 className="text-foreground text-lg font-semibold">{pageTitle}</h2>
          <div className="w-9" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
