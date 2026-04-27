"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { ORDER_STATUS_LABELS, PRIORITY_LABELS } from "@/shared/constants";

interface OrderDetailViewProps {
  orderId: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  commitment_date: string | null;
  receipt_url: string | null;
  notes: string | null;
  total_price: number | null;
  total_cost: number | null;
  created_at: string;
  customer_id: string;
  customers?: { name?: string | null; phone?: string | null } | null;
}

function formatOrderLoadError(error: unknown) {
  if (!error) return { message: "Unknown error", raw: error };

  if (typeof error === "object") {
    const supabaseError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      name?: string;
      stack?: string;
    };

    return {
      message: supabaseError.message || "Unknown error",
      details: supabaseError.details || null,
      hint: supabaseError.hint || null,
      code: supabaseError.code || null,
      name: supabaseError.name || null,
      stack: supabaseError.stack || null,
      raw: error,
    };
  }

  return { message: String(error), raw: error };
}

export default function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("en_proceso");
  const [priority, setPriority] = useState<string>("media");
  const [commitmentDate, setCommitmentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select("id, order_number, status, priority, commitment_date, receipt_url, notes, total_price, total_cost, created_at, customer_id, customers:customer_id(name, phone)")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("[OrderDetailView] Error loading order", formatOrderLoadError(error));
      setOrder(null);
      setLoading(false);
      return;
    }

    const loaded = data as unknown as OrderDetail;
    setOrder(loaded);
    setStatus(loaded.status || "en_proceso");
    setPriority(loaded.priority || "media");
    setCommitmentDate(loaded.commitment_date ? loaded.commitment_date.slice(0, 10) : "");
    setNotes(loaded.notes || "");
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const createdAt = useMemo(() => {
    if (!order?.created_at) return "-";
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.created_at));
  }, [order?.created_at]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);

    const payload = {
      status,
      priority,
      commitment_date: commitmentDate || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("work_orders" as any)
      .update(payload as any)
      .eq("id", order.id);

    setSaving(false);

    if (error) {
      alert(`No se pudo guardar: ${error.message}`);
      return;
    }

    alert("Orden actualizada correctamente");
    loadOrder();
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl p-8 text-muted-foreground">Cargando orden...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-8">
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <p className="text-muted-foreground">La orden no existe o no tienes permisos para verla.</p>
        <Button asChild>
          <Link href="/orders">Volver a órdenes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Orden</p>
          <h1 className="font-mono text-2xl font-bold">{order.order_number}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/orders">Volver</Link>
          </Button>
          {order.receipt_url ? (
            <Button asChild>
              <a href={order.receipt_url} target="_blank" rel="noopener noreferrer">
                Ver PDF
              </a>
            </Button>
          ) : (
            <Button disabled>PDF no disponible</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="font-medium">{order.customers?.name || `Cliente #${order.customer_id.slice(0, 8)}`}</p>
          {order.customers?.phone && <p className="text-sm text-muted-foreground">{order.customers.phone}</p>}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fecha creación</p>
          <p className="font-medium">{createdAt}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-medium">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(order.total_price || order.total_cost || 0)}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Editar orden</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Estado</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Prioridad</p>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Fecha compromiso</p>
            <Input type="date" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Notas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Notas internas de la orden"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}
