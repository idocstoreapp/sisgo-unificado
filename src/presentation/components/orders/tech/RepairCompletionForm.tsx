"use client";

import { useState, useEffect } from "react";
import {
  X, Plus, Trash2, CheckCircle, Package,
  CreditCard, Banknote, Smartphone, Building,
  DollarSign, Wrench, ChevronDown
} from "lucide-react";
import type { WorkOrder } from "@/types";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepairCompletionFormProps {
  order: WorkOrder;
  technicianId: string;
  companyId: string;
  commissionPercentage?: number | null; // From user profile
  onClose: () => void;
  onSuccess: () => void;
}

interface RepairPart {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  supplierId: string;
}

interface Supplier {
  id: string;
  name: string;
}

type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "";

// ─── Payment Method Button ────────────────────────────────────────────────────

function PaymentMethodBtn({
  method, selected, onClick, icon, label
}: {
  method: PaymentMethod; selected: PaymentMethod;
  onClick: (m: PaymentMethod) => void;
  icon: React.ReactNode; label: string;
}) {
  const isSelected = method === selected;
  return (
    <button
      type="button"
      onClick={() => onClick(method)}
      className={`
        flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150
        ${isSelected
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
        }
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-indigo-100" : "bg-slate-100"}`}>
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RepairCompletionForm({
  order, technicianId, companyId, commissionPercentage, onClose, onSuccess
}: RepairCompletionFormProps) {
  const [parts, setParts] = useState<RepairPart[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [laborCostStr, setLaborCostStr] = useState(formatCLPInput(order.labor_cost || 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commissionPct, setCommissionPct] = useState<number>(
    commissionPercentage ?? 40
  );

  const laborCost = parseCLPInput(laborCostStr);
  const replacementCost = parts.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);
  const totalCost = laborCost + replacementCost;
  const commissionAmount = Math.round(laborCost * (commissionPct / 100));

  // Load suppliers from company
  useEffect(() => {
    async function loadSuppliers() {
      const { data } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("company_id", companyId)
        .order("name");
      if (data) setSuppliers(data as Supplier[]);
    }
    loadSuppliers();
  }, [companyId]);

  // Load company commission if user doesn't have one
  useEffect(() => {
    if (commissionPercentage != null) return;
    async function loadCompanyCommission() {
      const { data } = await supabase
        .from("companies")
        .select("commission_percentage")
        .eq("id", companyId)
        .single();
      if (data?.commission_percentage) setCommissionPct(Number(data.commission_percentage));
    }
    loadCompanyCommission();
  }, [companyId, commissionPercentage]);

  const handleAddPart = () => {
    setParts([...parts, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, supplierId: "" }]);
  };

  const handleRemovePart = (id: string) => setParts(parts.filter((p) => p.id !== id));

  const handlePartChange = (id: string, field: keyof RepairPart, value: string | number) => {
    setParts(parts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!paymentMethod) {
      setError("Debes seleccionar un método de pago del cliente.");
      return;
    }
    for (const part of parts) {
      if (!part.description.trim()) {
        setError("Todos los repuestos deben tener una descripción.");
        return;
      }
      if (part.quantity <= 0) { setError("La cantidad debe ser mayor a 0."); return; }
      if (part.unitPrice < 0) { setError("El precio no puede ser negativo."); return; }
    }

    setLoading(true);
    try {
      // 1. Insertar repuestos en repair_parts
      if (parts.length > 0) {
        const { error: partsError } = await supabase
          .from("repair_parts")
          .insert(
            parts.map((p) => ({
              work_order_id: order.id,
              description: p.description,
              quantity: p.quantity,
              unit_price: p.unitPrice,
              total_price: p.quantity * p.unitPrice,
              ...(p.supplierId ? { supplier_id: p.supplierId } : {}),
            })) as any
          );
        if (partsError) throw partsError;
      }

      // 2. Insertar nota si hay
      if (notes.trim()) {
        await supabase.from("order_notes" as any).insert({
          order_id: order.id,
          note: `[REPARACIÓN COMPLETADA] ${notes}`,
          note_type: "interno",
          user_id: technicianId,
        });
      }

      // 3. Actualizar la orden
      const { error: orderError } = await supabase
        .from("work_orders")
        .update({
          status: "por_entregar",
          labor_cost: laborCost,
          replacement_cost: replacementCost,
          total_cost: totalCost,
          payment_method: paymentMethod,
          ...(receiptNumber.trim() ? { receipt_number: receiptNumber.trim() } : {}),
          repair_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", order.id);
      if (orderError) throw orderError;

      // 4. Registrar comisión del técnico
      if (commissionAmount > 0) {
        const { error: commErr } = await supabase
          .from("technician_commissions")
          .insert({
            work_order_id: order.id,
            technician_id: technicianId,
            commission_amount: commissionAmount,
            payment_status: "pending",
          } as any);
        if (commErr) console.error("[RepairCompletion] Commission insert error:", commErr);
      }

      onSuccess();
    } catch (err: any) {
      console.error("[RepairCompletion] Error:", err);
      setError(err.message || "Error al completar la reparación. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Completar Reparación</h2>
              <p className="text-xs text-slate-500">
                #{order.order_number} · {order.metadata?.device_model || order.device_model || "Equipo"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-start gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* ── Método de Pago ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                Método de Pago del Cliente
                <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">¿Cómo pagó el cliente?</p>
            </div>
            <div className="flex gap-3">
              <PaymentMethodBtn
                method="EFECTIVO" selected={paymentMethod}
                onClick={setPaymentMethod}
                icon={<Banknote className="w-5 h-5" />}
                label="Efectivo"
              />
              <PaymentMethodBtn
                method="TARJETA" selected={paymentMethod}
                onClick={setPaymentMethod}
                icon={<CreditCard className="w-5 h-5" />}
                label="Tarjeta"
              />
              <PaymentMethodBtn
                method="TRANSFERENCIA" selected={paymentMethod}
                onClick={setPaymentMethod}
                icon={<Smartphone className="w-5 h-5" />}
                label="Transferencia"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nº Boleta / Recibo <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="Ej: 00123456"
              />
            </div>
          </div>

          {/* ── Repuestos ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-500" />
                  Repuestos Utilizados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Agrega los materiales usados en esta reparación</p>
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>

            {parts.length === 0 ? (
              <div
                className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                onClick={handleAddPart}
              >
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">Sin repuestos — <span className="text-indigo-500 font-medium">Click para agregar</span></p>
              </div>
            ) : (
              <div className="space-y-3">
                {parts.map((part, idx) => (
                  <div key={part.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Repuesto #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(part.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Descripción *</label>
                      <input
                        type="text"
                        required
                        value={part.description}
                        onChange={(e) => handlePartChange(part.id, "description", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Ej: Pantalla OLED iPhone 13"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={part.quantity}
                          onChange={(e) => handlePartChange(part.id, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Precio Unitario</label>
                        <input
                          type="text"
                          required
                          value={formatCLPInput(part.unitPrice)}
                          onChange={(e) => handlePartChange(part.id, "unitPrice", parseCLPInput(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          placeholder="$0"
                        />
                      </div>
                    </div>

                    {/* Supplier selector */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Proveedor <span className="text-slate-400">(opcional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={part.supplierId}
                          onChange={(e) => handlePartChange(part.id, "supplierId", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none bg-white pr-8"
                        >
                          <option value="">Sin proveedor</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Part subtotal */}
                    {part.unitPrice > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="text-xs text-slate-500">Subtotal repuesto</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {formatCLP(part.quantity * part.unitPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Costos y Comisión ─────────────────────────────────────────── */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Resumen de Costos
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Repuestos</span>
                <span className="font-semibold text-slate-800">{formatCLP(replacementCost)}</span>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-600">Mano de Obra</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="text"
                    value={laborCostStr}
                    onChange={(e) => setLaborCostStr(formatCLPInput(parseCLPInput(e.target.value)))}
                    className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-right font-semibold focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total a Cobrar</span>
                <span className="font-bold text-indigo-600 text-xl">{formatCLP(totalCost)}</span>
              </div>

              {/* Comisión */}
              <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Tu Comisión</p>
                    <p className="text-xs text-emerald-600">{commissionPct}% de mano de obra</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-emerald-600">{formatCLP(commissionAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── Notas ─────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas de la reparación <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
              placeholder="Qué se reparó, observaciones, recomendaciones para el cliente..."
            />
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !paymentMethod}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Marcar como Lista
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
