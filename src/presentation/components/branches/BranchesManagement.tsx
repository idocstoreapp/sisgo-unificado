/**
 * Branches management component - CRUD for branches
 */

"use client";

import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

// Placeholder data
const placeholderBranches = [
  { id: "1", name: "Sucursal Central", code: "SUC-01", address: "Av. Principal 123", isActive: true },
  { id: "2", name: "Sucursal Norte", code: "SUC-02", address: "Calle Norte 456", isActive: true },
];

export function BranchesManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sucursales</h2>
          <p className="text-muted-foreground">Gestiona las sucursales de tu empresa</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancelar" : "+ Nueva Sucursal"}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Crear Sucursal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Nombre</Label>
              <Input id="branch-name" placeholder="Nombre de la sucursal" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-code">Código</Label>
              <Input id="branch-code" placeholder="SUC-01" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="branch-address">Dirección</Label>
              <Input id="branch-address" placeholder="Dirección completa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-phone">Teléfono</Label>
              <Input id="branch-phone" placeholder="+56912345678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-email">Email</Label>
              <Input id="branch-email" type="email" placeholder="sucursal@ejemplo.com" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </Button>
            <Button>Crear Sucursal</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar sucursales..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Branches grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placeholderBranches
          .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((branch) => (
            <div key={branch.id} className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground">{branch.code}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${branch.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {branch.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{branch.address}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Editar</Button>
                <Button variant="outline" size="sm">Desactivar</Button>
              </div>
            </div>
          ))}
      </div>

      {placeholderBranches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          No hay sucursales registradas
        </div>
      )}
    </div>
  );
}
