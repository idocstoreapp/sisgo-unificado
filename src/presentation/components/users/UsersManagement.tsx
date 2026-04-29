/**
 * Users management component - CRUD for users
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import type { UserRole } from "@/shared/kernel/types";
import { ArrowRight, BadgeCheck, Phone, UserPlus, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador",
  technician: "Técnico",
  mechanic: "Mecánico",
  vendedor: "Vendedor",
  mesero: "Mesero",
  cocina: "Cocina",
  encargado: "Encargado",
  recepcionista: "Recepcionista",
  responsable: "Responsable",
};

interface UserCard {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function UsersManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUsers([]);
      setLoading(false);
      setLoadError("No hay sesión activa.");
      return;
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", authUser.id)
      .single();

    let query = supabase
      .from("users")
      .select("id, name, email, role, is_active")
      .order("name", { ascending: true });

    if (currentUser?.company_id) {
      query = query.eq("company_id", currentUser.company_id);
    }

    const { data, error } = await query;

    if (error) {
      setLoadError("No se pudieron cargar los usuarios.");
      setUsers([]);
    } else {
      const mapped = (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name || "Sin nombre",
        email: row.email || "Sin email",
        role: row.role || "technician",
        isActive: Boolean(row.is_active ?? true),
      }));
      setUsers(mapped);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [users, searchQuery],
  );

  const roleTone: Record<string, string> = {
    super_admin: "bg-violet-100 text-violet-700",
    admin: "bg-blue-100 text-blue-700",
    technician: "bg-emerald-100 text-emerald-700",
    encargado: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Usuarios</h2>
            <p className="text-muted-foreground">
              Gestiona roles, estado operativo y accesos prioritarios del equipo.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <UserPlus className="size-4" />
            {showCreateForm ? "Cancelar" : "Nuevo Usuario"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-muted-foreground">Usuarios activos</p>
            <p className="text-xl font-bold text-foreground">
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-muted-foreground">Total de usuarios</p>
            <p className="text-xl font-bold text-foreground">{users.length}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-muted-foreground">Roles distintos</p>
            <p className="text-xl font-bold text-foreground">
              {new Set(users.map((u) => u.role)).size}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Accesos rápidos</h3>
          <p className="text-sm text-muted-foreground">Tareas clave para operar sin fricción.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Invitar técnico</Button>
          <Button variant="outline" size="sm">Asignar rol</Button>
          <Button variant="outline" size="sm">Revisar permisos</Button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Crear Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input id="user-name" placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select defaultValue="technician">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Teléfono</Label>
              <Input id="user-phone" placeholder="+56912345678" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </Button>
            <Button>Crear Usuario</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
            Cargando usuarios...
          </div>
        )}
        {!loading && loadError && (
          <div className="col-span-full rounded-xl border border-rose-200 bg-rose-50 py-8 text-center text-rose-700">
            {loadError}
          </div>
        )}
        {filteredUsers.map((user) => (
          <div key={user.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <span className="text-sm font-bold text-secondary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {user.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mb-4 space-y-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  roleTone[user.role] || "bg-slate-100 text-slate-700"
                }`}
              >
                {ROLE_LABELS[user.role as UserRole] || user.role}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BadgeCheck className="size-3.5" />
                Permisos sincronizados con su rol
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="size-3.5" />
                Contacto operativo disponible
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button variant="outline" size="sm">Permisos</Button>
              <Button variant="ghost" size="sm" className="col-span-2 justify-between">
                Ver ficha completa
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
          <UsersRound className="mx-auto mb-2 size-5" />
          No hay usuarios para esta búsqueda
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-muted-foreground">
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
}
