/**
 * RestaurantDashboard - Main restaurant management component with tabs
 */

"use client";

import { useState } from "react";
import { useRestaurant } from "@/presentation/hooks/useRestaurant";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";

type RestaurantTab = "tables" | "menu" | "orders" | "ingredients" | "recipes";

export function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<RestaurantTab>("tables");
  const { isLoading, error, createTable, createMenuItem, createOrder, updateIngredientStock, createRecipe } = useRestaurant();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Restaurante</h1>
        <p className="text-muted-foreground">Gestión completa del restaurante</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: "tables" as const, label: "Mesas" },
            { id: "menu" as const, label: "Menú" },
            { id: "orders" as const, label: "Órdenes" },
            { id: "ingredients" as const, label: "Ingredientes" },
            { id: "recipes" as const, label: "Recetas" },
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "tables" && <TablesTab createTable={createTable} isLoading={isLoading} />}
      {activeTab === "menu" && <MenuTab createMenuItem={createMenuItem} isLoading={isLoading} />}
      {activeTab === "orders" && <OrdersTab createOrder={createOrder} isLoading={isLoading} />}
      {activeTab === "ingredients" && <IngredientsTab updateIngredientStock={updateIngredientStock} isLoading={isLoading} />}
      {activeTab === "recipes" && <RecipesTab createRecipe={createRecipe} isLoading={isLoading} />}
    </div>
  );
}

// ==================== TABLES TAB ====================

function TablesTab({ createTable, isLoading }: { createTable: (data: any) => Promise<any>; isLoading: boolean }) {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [location, setLocation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createTable({
      companyId: "placeholder-company-id",
      tableNumber,
      capacity,
      location: location || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nueva Mesa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Número de Mesa *</Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Mesa 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad *</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Terraza, Interior..."
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Mesa"}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Vista de mesas del restaurante aparecerá aquí</p>
      </div>
    </div>
  );
}

// ==================== MENU TAB ====================

function MenuTab({ createMenuItem, isLoading }: { createMenuItem: (data: any) => Promise<any>; isLoading: boolean }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"plato" | "bebida" | "postre" | "entrada">("plato");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMenuItem({
      companyId: "placeholder-company-id",
      categoryId,
      name,
      description: description || undefined,
      price,
      type,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nuevo Item del Menú</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del plato"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className="w-full p-2 border rounded-md"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="plato">Plato Principal</option>
                <option value="entrada">Entrada</option>
                <option value="bebida">Bebida</option>
                <option value="postre">Postre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría ID</Label>
              <Input
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="ID de categoría"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              className="w-full min-h-[80px] p-3 border rounded-md"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del plato..."
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Item"}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Menú digital aparecerá aquí</p>
      </div>
    </div>
  );
}

// ==================== ORDERS TAB ====================

function OrdersTab({ createOrder, isLoading }: { createOrder: (data: any) => Promise<any>; isLoading: boolean }) {
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createOrder({
      companyId: "placeholder-company-id",
      tableId,
      notes: notes || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nueva Orden</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableId">ID de Mesa *</Label>
            <Input
              id="tableId"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="ID de la mesa"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] p-3 border rounded-md"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de la orden..."
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Orden"}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Lista de órdenes aparecerá aquí</p>
      </div>
    </div>
  );
}

// ==================== INGREDIENTS TAB ====================

function IngredientsTab({ updateIngredientStock, isLoading }: { updateIngredientStock: (id: string, qty: number, dir: "IN" | "OUT") => Promise<any>; isLoading: boolean }) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredientId) return;
    await updateIngredientStock(ingredientId, quantity, direction);
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Actualizar Stock de Ingrediente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ingredientId">ID del Ingrediente *</Label>
              <Input
                id="ingredientId"
                value={ingredientId}
                onChange={(e) => setIngredientId(e.target.value)}
                placeholder="ID del ingrediente"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direction">Dirección</Label>
              <select
                id="direction"
                className="w-full p-2 border rounded-md"
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Actualizando..." : "Actualizar Stock"}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Lista de ingredientes con stock aparecerá aquí</p>
      </div>
    </div>
  );
}

// ==================== RECIPES TAB ====================

function RecipesTab({ createRecipe, isLoading }: { createRecipe: (data: any) => Promise<any>; isLoading: boolean }) {
  const [name, setName] = useState("");
  const [menuItemId, setMenuItemId] = useState("");
  const [totalCost, setTotalCost] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRecipe({
      companyId: "placeholder-company-id",
      menuItemId,
      name,
      ingredients: [], // TODO: Add ingredients UI
      totalCost,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nueva Receta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la receta"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuItemId">ID del Plato *</Label>
              <Input
                id="menuItemId"
                value={menuItemId}
                onChange={(e) => setMenuItemId(e.target.value)}
                placeholder="ID del menú item"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCost">Costo Total *</Label>
              <Input
                id="totalCost"
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(Number(e.target.value))}
                min="0"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Receta"}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">Lista de recetas aparecerá aquí</p>
      </div>
    </div>
  );
}
