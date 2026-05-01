"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generatePDFBlob } from "@/lib/generate-pdf-blob";
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

interface OrderDetailPanelProps {
  orderId: string;
  embedded?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
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

async function resolveReceiptUrlFallback(orderNumber: string): Promise<string | null> {
  if (!orderNumber) return null;
  const searchPrefix = `orden-${orderNumber}-`;
  const { data: files, error } = await supabase.storage
    .from("order-pdfs")
    .list("orders", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error || !files) return null;
  const match = files.find((file) => file.name.startsWith(searchPrefix));
  if (!match) return null;
  const { data: publicUrlData } = supabase.storage
    .from("order-pdfs")
    .getPublicUrl(`orders/${match.name}`);
  return publicUrlData?.publicUrl || null;
}

export default function OrderDetailPanel({
  orderId,
  embedded = false,
  onClose,
  onSaved,
}: OrderDetailPanelProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("en_proceso");
  const [priority, setPriority] = useState<string>("media");
  const [commitmentDate, setCommitmentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("work_orders")
      .select("id, order_number, status, priority, commitment_date, receipt_url, notes, total_price, total_cost, created_at, customer_id")
      .eq("id", orderId)
      .single();

    if (error) {
      setOrder(null);
      setLoadError("No se pudo cargar la orden. Verifica permisos o si la orden existe.");
      setLoading(false);
      return;
    }

    const loaded = data as unknown as OrderDetail;

    if (loaded.customer_id) {
      const { data: customerData } = await supabase
        .from("customers")
        .select("name, phone")
        .eq("id", loaded.customer_id)
        .maybeSingle();

      loaded.customers = customerData || null;
    }

    if (!loaded.receipt_url && loaded.order_number) {
      const fallbackUrl = await resolveReceiptUrlFallback(loaded.order_number);
      if (fallbackUrl) {
        loaded.receipt_url = fallbackUrl;
        // Guardar de vuelta en la orden para evitar buscar cada vez.
        await supabase
          .from("work_orders")
          .update({ receipt_url: fallbackUrl })
          .eq("id", loaded.id);
      }
    }

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
    onSaved?.();
  }

  async function handleGeneratePdfNow() {
    if (!order) return;
    setGeneratingPdf(true);
    try {
      const [{ data: fullOrder }, { data: customer }, { data: branch }, { data: orderItems }] =
        await Promise.all([
          supabase.from("work_orders").select("*").eq("id", order.id).single(),
          supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle(),
          supabase.from("branches").select("*").eq("id", (order as any).branch_id).maybeSingle(),
          supabase.from("order_items").select("*").eq("order_id", order.id),
        ]);

      const normalizedOrder: any = {
        ...(fullOrder || order),
        customer: customer || undefined,
        sucursal: branch || undefined,
        device_type: (fullOrder as any)?.device_type || (fullOrder as any)?.metadata?.device_type || "iphone",
        device_model:
          (fullOrder as any)?.device_model || (fullOrder as any)?.metadata?.device_model || "Equipo",
        problem_description:
          (fullOrder as any)?.problem_description ||
          (fullOrder as any)?.metadata?.problem_description ||
          "Diagnóstico técnico",
      };

      const services = ((orderItems as any[]) || []).map((item, index) => ({
        id: item.id || `item-${index}`,
        name: item.name || item.service_name || "Servicio",
        description: item.description || null,
        default_price: Number(item.unit_price || item.total_price || 0),
        created_at: item.created_at || new Date().toISOString(),
      }));

      const serviceValue = services.reduce((sum, service) => sum + (service.default_price || 0), 0);
      const replacementCost = Number((fullOrder as any)?.replacement_cost || 0);
      const warrantyDays = Number((fullOrder as any)?.warranty_days || 90);
      const checklistData = (fullOrder as any)?.metadata?.checklist_data || null;

      const blob = await generatePDFBlob(
        normalizedOrder,
        services as any,
        serviceValue,
        replacementCost,
        warrantyDays,
        checklistData,
        [],
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert("No se pudo generar el PDF en este momento.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (loading) {
    return <div className={`${embedded ? "p-4" : "mx-auto max-w-5xl p-8"} text-muted-foreground`}>Cargando orden...</div>;
  }

  if (!order) {
    return (
      <div className={`${embedded ? "space-y-4 p-4" : "mx-auto max-w-5xl space-y-4 p-8"}`}>
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <p className="text-muted-foreground">
          {loadError || "La orden no existe o no tienes permisos para verla."}
        </p>
        {embedded ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <Button asChild>
            <Link href="/orders">Volver a órdenes</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`${embedded ? "space-y-6 p-4" : "mx-auto max-w-5xl space-y-6 p-4 lg:p-8"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Orden</p>
          <h1 className="font-mono text-2xl font-bold">{order.order_number}</h1>
        </div>
        <div className="flex gap-2">
          {embedded ? (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/orders">Volver</Link>
            </Button>
          )}
          {order.receipt_url ? (
            <Button asChild>
              <a href={order.receipt_url} target="_blank" rel="noopener noreferrer">
                Ver PDF
              </a>
            </Button>
          ) : (
            <Button onClick={handleGeneratePdfNow} disabled={generatingPdf}>
              {generatingPdf ? "Generando PDF..." : "Generar PDF ahora"}
            </Button>
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
