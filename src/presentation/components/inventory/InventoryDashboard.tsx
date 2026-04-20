/**
 * InventoryDashboard - Main inventory management component with tabs
 */

"use client";

import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useInventory } from "@/presentation/hooks/useInventory";
import { formatCLP } from "@/shared/utils/currency";

type InventoryTab = "products" | "movements" | "suppliers" | "purchases";

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<InventoryTab>("products");
  const { isLoading, error, createProduct, updateStock, createSupplier, createPurchase } = useInventory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Gestión de inventario del taller mecánico</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: "products" as const, label: "Productos" },
            { id: "movements" as const, label: "Movimientos" },
            { id: "suppliers" as const, label: "Proveedores" },
            { id: "purchases" as const, label: "Compras" },
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
      {activeTab === "products" && (
        <ProductsTab createProduct={createProduct} isLoading={isLoading} />
      )}
      {activeTab === "movements" && (
        <MovementsTab updateStock={updateStock} isLoading={isLoading} />
      )}
      {activeTab === "suppliers" && (
        <SuppliersTab createSupplier={createSupplier} isLoading={isLoading} />
      )}
      {activeTab === "purchases" && (
        <PurchasesTab createPurchase={createPurchase} isLoading={isLoading} />
      )}
    </div>
  );
}

// ==================== PRODUCTS TAB ====================

function ProductsTab({ createProduct, isLoading }: { 
  createProduct: (data: any) => Promise<any>; 
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"producto" | "repuesto" | "insumo">("repuesto");
  const [barcode, setBarcode] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [unitType, setUnitType] = useState<"un" | "kg" | "lt">("un");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await createProduct({
      companyId: "placeholder-company-id",
      name,
      category: category || undefined,
      type,
      barcode: barcode || undefined,
      costPrice,
      salePrice,
      stock,
      minStock,
      unitType,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Categoría"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className="w-full p-2 border rounded-md"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="producto">Producto</option>
                <option value="repuesto">Repuesto</option>
                <option value="insumo">Insumo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Código de barras"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitType">Unidad</Label>
              <select
                id="unitType"
                className="w-full p-2 border rounded-md"
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as any)}
              >
                <option value="un">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="lt">Litro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Precio de Costo</Label>
              <Input
                id="costPrice"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de Venta *</Label>
              <Input
                id="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                min="0"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Producto"}
          </Button>
        </form>
      </div>

      {/* Products List Placeholder */}
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Lista de productos aparecerá aquí (conectar con datos reales)
        </p>
      </div>
    </div>
  );
}

// ==================== MOVEMENTS TAB ====================

function MovementsTab({ updateStock, isLoading }: {
  updateStock: (data: any) => Promise<any>;
  isLoading: boolean;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [direction, setDirection] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [reason, setReason] = useState<"PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT" | "MANUAL">("MANUAL");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await updateStock({
      companyId: "placeholder-company-id",
      productId,
      quantity,
      direction,
      reason,
      notes,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Registrar Movimiento de Stock</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">ID del Producto *</Label>
            <Input
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="ID del producto"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                <option value="ADJUST">Ajuste</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Razón</Label>
              <select
                id="reason"
                className="w-full p-2 border rounded-md"
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
              >
                <option value="MANUAL">Manual</option>
                <option value="PURCHASE">Compra</option>
                <option value="SALE">Venta</option>
                <option value="RETURN">Devolución</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] p-3 border rounded-md"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas del movimiento..."
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Movimiento"}
          </Button>
        </form>
      </div>

      {/* Movements List Placeholder */}
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Historial de movimientos aparecerá aquí
        </p>
      </div>
    </div>
  );
}

// ==================== SUPPLIERS TAB ====================

function SuppliersTab({ createSupplier, isLoading }: {
  createSupplier: (data: any) => Promise<any>;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [rut, setRut] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await createSupplier({
      companyId: "placeholder-company-id",
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      rut: rut || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nuevo Proveedor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del proveedor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="12.345.678-9"
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Proveedor"}
          </Button>
        </form>
      </div>

      {/* Suppliers List Placeholder */}
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Lista de proveedores aparecerá aquí
        </p>
      </div>
    </div>
  );
}

// ==================== PURCHASES TAB ====================

function PurchasesTab({ createPurchase, isLoading }: {
  createPurchase: (data: any) => Promise<any>;
  isLoading: boolean;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await createPurchase({
      companyId: "placeholder-company-id",
      supplierId,
      invoiceNumber: invoiceNumber || undefined,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
      items: [], // TODO: Add items UI
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Nueva Compra</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierId">ID del Proveedor *</Label>
            <Input
              id="supplierId"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              placeholder="ID del proveedor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Número de factura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pago</Label>
              <Input
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Efectivo, Transferencia, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] p-3 border rounded-md"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de la compra..."
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Compra"}
          </Button>
        </form>
      </div>

      {/* Purchases List Placeholder */}
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          Historial de compras aparecerá aquí
        </p>
      </div>
    </div>
  );
}
