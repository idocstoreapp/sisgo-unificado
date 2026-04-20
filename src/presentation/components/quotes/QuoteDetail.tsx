/**
 * QuoteDetail - Detailed view of a quote with items breakdown
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/presentation/components/ui/button";
import { formatCLP } from "@/shared/utils/currency";
import type { QuoteStatus } from "@/domain/entities/Quote";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  anulada: "Anulada",
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  borrador: "bg-gray-100 text-gray-800",
  enviada: "bg-blue-100 text-blue-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  anulada: "bg-black text-white",
};

// Placeholder data - will be replaced with real data
interface QuoteItem {
  id: string;
  itemType: "material" | "servicio" | "mueble";
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  profitMargin: number;
  profitAmount: number;
  ivaPercentage: number;
  ivaAmount: number;
  total: number;
  notes?: string;
  terms?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export function QuoteDetail({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Placeholder data - will be replaced with real data from quoteRepository.findById()
  const quote: QuoteDetail | null = null; // TODO: Fetch real data

  if (!quote) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Cotización No Encontrada</h1>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">La cotización no existe o no tienes acceso.</p>
          <Link href="/quotes" className="mt-4 inline-block">
            <Button>Volver a Cotizaciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  async function handleChangeStatus(newStatus: QuoteStatus) {
    setIsChangingStatus(true);
    // TODO: Call changeQuoteStatusUseCase
    // const result = await changeQuoteStatusUseCase.execute(quote.id, newStatus);
    setIsChangingStatus(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/quotes">
              <Button variant="outline" size="sm">← Volver</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Cotización {quote.quoteNumber}</h1>
              <p className="text-muted-foreground">
                Creada el {quote.createdAt.toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              STATUS_COLORS[quote.status]
            }`}
          >
            {STATUS_LABELS[quote.status]}
          </span>
          {quote.status === "borrador" && (
            <Button
              variant="outline"
              onClick={() => handleChangeStatus("enviada")}
              disabled={isChangingStatus}
            >
              Marcar como Enviada
            </Button>
          )}
          {quote.status === "enviada" && (
            <>
              <Button
                variant="default"
                onClick={() => handleChangeStatus("aprobada")}
                disabled={isChangingStatus}
              >
                Aprobar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleChangeStatus("rechazada")}
                disabled={isChangingStatus}
              >
                Rechazar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Quote Details */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Nombre:</span> {quote.customerName}
              </p>
              {quote.customerEmail && (
                <p>
                  <span className="text-muted-foreground">Email:</span> {quote.customerEmail}
                </p>
              )}
              {quote.customerPhone && (
                <p>
                  <span className="text-muted-foreground">Teléfono:</span> {quote.customerPhone}
                </p>
              )}
            </div>
          </div>

          {/* Quote Details */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Detalles de la Cotización</h2>
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Margen de Ganancia:</span>{" "}
                {quote.profitMargin}%
              </p>
              <p>
                <span className="text-muted-foreground">IVA:</span> {quote.ivaPercentage}%
              </p>
              {quote.validUntil && (
                <p>
                  <span className="text-muted-foreground">Válida Hasta:</span>{" "}
                  {quote.validUntil.toLocaleDateString("es-CL")}
                </p>
              )}
              {quote.notes && (
                <div>
                  <p className="text-muted-foreground">Notas:</p>
                  <p className="mt-1">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <p className="text-muted-foreground">Términos:</p>
                  <p className="mt-1">{quote.terms}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Items & Totals */}
        <div className="space-y-6">
          {/* Items */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Items ({quote.items.length})</h2>
            <div className="space-y-3">
              {quote.items.map((item) => (
                <div key={item.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.itemType} - {item.quantity} x {formatCLP(item.unitPrice)}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <p className="font-semibold">{formatCLP(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Resumen Financiero</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCLP(quote.subtotal)}</span>
              </div>
              {quote.profitMargin > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Ganancia ({quote.profitMargin}%):</span>
                  <span className="text-green-600">+ {formatCLP(quote.profitAmount)}</span>
                </div>
              )}
              {quote.ivaPercentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span>IVA ({quote.ivaPercentage}%):</span>
                  <span>+ {formatCLP(quote.ivaAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span className="text-primary">{formatCLP(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
