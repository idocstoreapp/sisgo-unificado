/**
 * Users management component - CRUD for users
 */

"use client";

import { useState } from "react";
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

// Placeholder data - will be fetched from API in FASE 3
const placeholderUsers = [
  { id: "1", name: "Juan Pérez", email: "juan@example.com", role: "super_admin" as UserRole, isActive: true },
  { id: "2", name: "María González", email: "maria@example.com", role: "technician" as UserRole, isActive: true },
];

export function UsersManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Usuarios</h2>
          <p className="text-muted-foreground">Gestiona los usuarios de tu empresa</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancelar" : "+ Nuevo Usuario"}
        </Button>
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

      {/* Users list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nombre</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Email</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Rol</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {placeholderUsers
              .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((user) => (
                <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-secondary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-foreground">{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {placeholderUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
}
