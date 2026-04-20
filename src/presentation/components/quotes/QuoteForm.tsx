/**
 * QuoteForm - Multi-step wizard for creating furniture quotes
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuotes } from "@/presentation/hooks/useQuotes";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { formatCLP } from "@/shared/utils/currency";

type WizardStep = "customer" | "details" | "items" | "summary";

interface QuoteItem {
  id: string;
  itemType: "material" | "servicio" | "mueble";
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function QuoteForm() {
  const router = useRouter();
  const { createQuote, isLoading } = useQuotes();

  const [currentStep, setCurrentStep] = useState<WizardStep>("customer");
  const [error, setError] = useState<string | null>(null);

  // Customer info
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Quote details
  const [profitMargin, setProfitMargin] = useState(0);
  const [ivaPercentage, setIvaPercentage] = useState(19);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  // Quote items
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemType, setNewItemType] = useState<"material" | "servicio" | "mueble">("material");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(0);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const profitAmount = subtotal * (profitMargin / 100);
  const subtotalWithMargin = subtotal + profitAmount;
  const ivaAmount = subtotalWithMargin * (ivaPercentage / 100);
  const total = subtotalWithMargin + ivaAmount;

  function canProceedToNextStep(): boolean {
    switch (currentStep) {
      case "customer":
        return customerName.trim().length > 0;
      case "details":
        return true;
      case "items":
        return items.length > 0;
      case "summary":
        return true;
      default:
        return false;
    }
  }

  function addNewItem() {
    if (!newItemName.trim()) return;

    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      itemType: newItemType,
      name: newItemName.trim(),
      description: newItemDescription.trim(),
      quantity: newItemQuantity,
      unitPrice: newItemUnitPrice,
    };

    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  }

  function removeItem(itemId: string) {
    setItems(items.filter((item) => item.id !== itemId));
  }

  async function handleSubmit() {
    setError(null);

    const result = await createQuote({
      companyId: "placeholder-company-id", // TODO: Get from session/context
      customerId: customerId || "temp-customer-id",
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      profitMargin,
      ivaPercentage,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      items: items.map((item) => ({
        itemType: item.itemType,
        name: item.name,
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    if (!result.success) {
      setError(result.error ?? "Error al crear cotización");
      return;
    }

    router.push("/quotes");
  }

  const steps: WizardStep[] = ["customer", "details", "items", "summary"];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nueva Cotización</h1>
        <p className="text-muted-foreground">Cotización de mueblería profesional</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const stepLabels = ["Cliente", "Detalles", "Items", "Resumen"];

          return (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  isCurrent ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                {stepLabels[index]}
              </span>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-muted mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-card border rounded-lg p-6">
        {/* Step 1: Customer */}
        {currentStep === "customer" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Información del Cliente</h2>
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre del Cliente *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Teléfono</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === "details" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Detalles de la Cotización</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margen de Ganancia (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ivaPercentage">IVA (%)</Label>
                <Input
                  id="ivaPercentage"
                  type="number"
                  value={ivaPercentage}
                  onChange={(e) => setIvaPercentage(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válida Hasta</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] p-3 border rounded-md"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Términos y Condiciones</Label>
              <textarea
                id="terms"
                className="w-full min-h-[100px] p-3 border rounded-md"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Términos de la cotización..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Items */}
        {currentStep === "items" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Items de la Cotización</h2>
            
            {/* Add new item form */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Agregar Item</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="itemType">Tipo</Label>
                  <select
                    id="itemType"
                    className="w-full p-2 border rounded-md"
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                  >
                    <option value="material">Material</option>
                    <option value="servicio">Servicio</option>
                    <option value="mueble">Mueble</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemName">Nombre *</Label>
                  <Input
                    id="itemName"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Nombre del item"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Descripción</Label>
                <Input
                  id="itemDescription"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Descripción del item"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Cantidad</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemPrice">Precio Unitario</Label>
                  <Input
                    id="itemPrice"
                    type="number"
                    value={newItemUnitPrice}
                    onChange={(e) => setNewItemUnitPrice(Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
              <Button onClick={addNewItem} disabled={!newItemName.trim()}>
                Agregar Item
              </Button>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Items Agregados ({items.length})</h3>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.itemType} - {item.quantity} x {formatCLP(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCLP(item.quantity * item.unitPrice)}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Summary */}
        {currentStep === "summary" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resumen de la Cotización</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Cliente</h3>
                <p>{customerName}</p>
                {customerEmail && <p className="text-sm text-muted-foreground">{customerEmail}</p>}
                {customerPhone && <p className="text-sm text-muted-foreground">{customerPhone}</p>}
              </div>

              <div>
                <h3 className="font-semibold">Items ({items.length})</h3>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id} className="text-sm">
                      {item.name} - {item.quantity} x {formatCLP(item.unitPrice)} ={" "}
                      <span className="font-semibold">{formatCLP(item.quantity * item.unitPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCLP(subtotal)}</span>
                </div>
                {profitMargin > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Ganancia ({profitMargin}%):</span>
                    <span>+ {formatCLP(profitAmount)}</span>
                  </div>
                )}
                {ivaPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>IVA ({ivaPercentage}%):</span>
                    <span>+ {formatCLP(ivaAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCLP(total)}</span>
                </div>
              </div>

              {notes && (
                <div>
                  <h3 className="font-semibold">Notas</h3>
                  <p className="text-sm text-muted-foreground">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStepIndex > 0) {
              setCurrentStep(steps[currentStepIndex - 1]);
            } else {
              router.back();
            }
          }}
        >
          {currentStepIndex === 0 ? "Cancelar" : "Anterior"}
        </Button>

        {currentStep === "summary" ? (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Cotización"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep(steps[currentStepIndex + 1])}
            disabled={!canProceedToNextStep()}
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
