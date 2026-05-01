"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/infrastructure/auth/authService";
import {
  getCompanyCapabilities,
  isCompanyCapabilityEnabled,
  isCompanyRouteEnabled,
  type CompanyCapability,
} from "@/lib/company-capabilities";
import { resolveTrialState, type TrialState } from "@/lib/trial-gating";
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

type ProfileRow = Profile & {
  company_id?: string | null;
  branch_id?: string | null;
};

const defaultCompanyCapabilities = getCompanyCapabilities(null);

const navItems: Array<{
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  capability: CompanyCapability;
}> = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", capability: "dashboard" },
  { href: "/orders", icon: Package, label: "Órdenes", capability: "orders" },
  { href: "/quotes", icon: FileText, label: "Cotizaciones", capability: "quotes" },
  { href: "/inventory", icon: ShoppingCart, label: "Inventario", capability: "inventory" },
  { href: "/restaurant", icon: Utensils, label: "Restaurante", capability: "restaurant" },
  { href: "/customers", icon: Users, label: "Clientes", capability: "customers" },
  { href: "/users", icon: Users, label: "Usuarios", capability: "users" },
  { href: "/branches", icon: Building2, label: "Sucursales", capability: "branches" },
  { href: "/finance", icon: DollarSign, label: "Finanzas", capability: "finance" },
  { href: "/reports", icon: BarChart3, label: "Reportes", capability: "reports" },
  { href: "/settings", icon: Settings, label: "Configuración", capability: "settings" },
];

const configNavItems: Array<{
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  capability: CompanyCapability;
}> = [
  { href: "/branches", icon: Building2, label: "Sucursales", capability: "branches" },
  { href: "/users", icon: Users, label: "Usuarios", capability: "users" },
  { href: "/settings", icon: Settings, label: "Ajustes", capability: "settings" },
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
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [companyCapabilities, setCompanyCapabilities] = useState(defaultCompanyCapabilities);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [trialState, setTrialState] = useState<TrialState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCompanyCapabilities() {
      setCapabilitiesLoaded(false);

      const { data: profileData } = await supabase
        .from("users")
        .select("*, company_id")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      const nextProfile = profileData as ProfileRow | null;
      if (nextProfile) setProfile(nextProfile);

      if (!nextProfile?.company_id) {
        setCompanyCapabilities(defaultCompanyCapabilities);
        setTrialState(null);
        setCapabilitiesLoaded(true);
        return;
      }

      const { data: companyData } = await supabase
        .from("companies")
        .select("config")
        .eq("id", nextProfile.company_id)
        .single();

      if (cancelled) return;

      const companyConfig = (companyData as { config?: Record<string, unknown> } | null)?.config;
      setCompanyCapabilities(getCompanyCapabilities(companyConfig));
      setTrialState(resolveTrialState(companyConfig));
      setCapabilitiesLoaded(true);
    }

    loadCompanyCapabilities();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const pageTitle = useMemo(() => {
    const matchedPrefix = Object.keys(titleByPrefix).find((prefix) => pathname.startsWith(prefix));
    return matchedPrefix ? titleByPrefix[matchedPrefix] : "Panel";
  }, [pathname]);

  const isAdminRole = ["admin", "superadmin", "super_admin"].includes(String(profile?.role || ""));
  const payTechniciansHref = isAdminRole ? "/finance/payments" : "/finance";
  const visibleMainNavItems = mainNavItems.filter((item) =>
    isCompanyCapabilityEnabled(companyCapabilities, item.capability),
  );
  const visibleConfigNavItems = configNavItems.filter((item) =>
    isCompanyCapabilityEnabled(companyCapabilities, item.capability),
  );
  const isTrialExpired = trialState?.status === "expired";
  const isBillingRoute = pathname.startsWith("/billing/activate");
  const canShowTechnicianPayments =
    !isTrialExpired &&
    isCompanyCapabilityEnabled(companyCapabilities, "finance") &&
    isCompanyCapabilityEnabled(companyCapabilities, "technicianPayments");
  const canCreateOrders =
    !isTrialExpired && isCompanyCapabilityEnabled(companyCapabilities, "orders");
  const canRenderCurrentRoute =
    !capabilitiesLoaded ||
    isBillingRoute ||
    (!isTrialExpired && isCompanyRouteEnabled(companyCapabilities, pathname));

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="bg-background flex h-screen overflow-hidden">
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
          {canCreateOrders && (
            <a
              href="/orders/new"
              className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Plus className="size-4" />
              Nueva Orden
            </a>
          )}

          <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-wider uppercase">
            Principal
          </p>
          <div className="space-y-1">
            {visibleMainNavItems.map((item) => {
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

          {visibleConfigNavItems.length > 0 && (
            <>
              <div className="border-border my-4 border-t" />

              <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-wider uppercase">
                Configuración
              </p>
              <div className="space-y-1">
                {visibleConfigNavItems.map((item) => {
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
            </>
          )}

          {canShowTechnicianPayments && (
            <a
              href={payTechniciansHref}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DollarSign className="size-4" />
              Ir a pagar a técnicos
            </a>
          )}
        </nav>

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

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {trialState?.status === "active" && trialState.daysRemaining <= 3 && (
            <div className="border-border bg-card mb-4 flex flex-col gap-3 rounded-lg border p-4 text-sm md:flex-row md:items-center md:justify-between">
              <p className="text-muted-foreground">
                Quedan{" "}
                <span className="text-foreground font-semibold">{trialState.daysRemaining}</span>{" "}
                días de prueba. Tus datos se mantienen al activar un plan.
              </p>
              <Button size="sm" onClick={() => router.push("/billing/activate")}>
                Activar plan
              </Button>
            </div>
          )}

          {canRenderCurrentRoute ? (
            children
          ) : isTrialExpired ? (
            <div className="border-border bg-card mx-auto flex min-h-[340px] max-w-xl flex-col items-center justify-center rounded-lg border p-8 text-center">
              <DollarSign className="text-primary mb-4 size-9" />
              <h3 className="text-foreground text-lg font-semibold">Tu prueba finalizó</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                El acceso operativo queda pausado hasta activar un plan. Puedes conservar tus datos
                y coordinar la activación desde la pantalla de pago.
              </p>
              <Button className="mt-5" onClick={() => router.push("/billing/activate")}>
                Activar SISGO
              </Button>
            </div>
          ) : (
            <div className="border-border bg-card mx-auto flex min-h-[320px] max-w-lg flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-foreground text-lg font-semibold">Pantalla no habilitada</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Esta empresa no tiene activa esta sección en su modo de operación actual.
              </p>
              <Button className="mt-5" onClick={() => router.push("/dashboard")}>
                Volver al dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
