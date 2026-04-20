/**
 * QuotesList - List of quotes with filters and status badges
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { formatCLP } from "@/shared/utils/currency";
import type { QuoteStatus } from "@/domain/entities/Quote";

// Placeholder data - will be replaced with real data from repository
interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  createdAt: Date;
  validUntil?: Date;
}

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

export function QuotesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");

  // Placeholder data - will be replaced with real data
  const quotes: Quote[] = [
    // TODO: Replace with real data from quoteRepository.findByCompany()
  ];

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      !search ||
      quote.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Summary counts
  const summaryCounts = {
    borrador: quotes.filter((q) => q.status === "borrador").length,
    enviada: quotes.filter((q) => q.status === "enviada").length,
    aprobada: quotes.filter((q) => q.status === "aprobada").length,
    rechazada: quotes.filter((q) => q.status === "rechazada").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestión de cotizaciones de mueblería</p>
        </div>
        <Link href="/quotes/new">
          <Button>Nueva Cotización</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Borrador</p>
          <p className="text-2xl font-bold">{summaryCounts.borrador}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enviadas</p>
          <p className="text-2xl font-bold">{summaryCounts.enviada}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Aprobadas</p>
          <p className="text-2xl font-bold">{summaryCounts.aprobada}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Rechazadas</p>
          <p className="text-2xl font-bold">{summaryCounts.rechazada}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Número de cotización o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              className="w-full p-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | "all")}
            >
              <option value="all">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No hay cotizaciones aún. ¡Crea tu primera cotización!
          </p>
          <Link href="/quotes/new" className="mt-4 inline-block">
            <Button>Nueva Cotización</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Número</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Total</th>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-mono text-sm">{quote.quoteNumber}</td>
                  <td className="p-3">{quote.customerName}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[quote.status]
                      }`}
                    >
                      {STATUS_LABELS[quote.status]}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatCLP(quote.total)}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {quote.createdAt.toLocaleDateString("es-CL")}
                  </td>
                  <td className="p-3">
                    <Link href={`/quotes/${quote.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
