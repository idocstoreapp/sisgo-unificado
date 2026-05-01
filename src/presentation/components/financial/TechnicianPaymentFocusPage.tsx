"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import type { Profile } from "@/types";
import SalarySettlementPanel from "./SalarySettlementPanel";
import { ArrowRight, HandCoins, Sparkles, Wallet } from "lucide-react";

type SummaryByTech = Record<
  string,
  {
    baseAmount: number;
    availableToSettle: number;
    adjustmentTotal: number;
    weekEarned: number;
    historicalPaid: number;
  }
>;

export default function TechnicianPaymentFocusPage({
  initialTechnicianId,
}: {
  initialTechnicianId?: string;
}) {
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(initialTechnicianId || null);
  const [summaryByTech, setSummaryByTech] = useState<SummaryByTech>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: techs } = await supabase
        .from("users")
        .select("*")
        .eq("role", "technician")
        .order("name");

      const list = (techs as Profile[]) || [];
      setTechnicians(list);
      if (!selectedTechId && list.length > 0) {
        setSelectedTechId(list[0].id);
      }

      const now = new Date();
      const nextSummary: SummaryByTech = {};

      const day = now.getDay();
      const daysSinceMonday = day === 0 ? 6 : day - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysSinceMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5);
      weekEnd.setHours(23, 59, 59, 999);

      await Promise.all(
        list.map(async (tech) => {
          const [
            { data: employeePendingPayments },
            { data: legacyPendingCommissions },
            { data: adjustments },
            { data: weekCommissions },
            { data: historicalSettlements },
          ] =
            await Promise.all([
              supabase
                .from("employee_payments")
                .select("commission_amount")
                .eq("technician_id", tech.id)
                .eq("payment_status", "pending"),
              supabase
                .from("technician_commissions")
                .select("commission_amount")
                .eq("technician_id", tech.id)
                .eq("payment_status", "pending"),
              supabase
                .from("salary_adjustments")
                .select("amount, created_at, available_from, applications:salary_adjustment_applications(applied_amount)")
                .eq("technician_id", tech.id),
              supabase
                .from("technician_commissions")
                .select("commission_amount")
                .eq("technician_id", tech.id)
                .gte("created_at", weekStart.toISOString())
                .lte("created_at", weekEnd.toISOString()),
              supabase
                .from("salary_settlements")
                .select("amount")
                .eq("technician_id", tech.id),
            ]);

          const employeeRows = (employeePendingPayments as any[]) || [];
          const legacyRows = (legacyPendingCommissions as any[]) || [];

          const byOrder = new Map<string, number>();
          employeeRows.forEach((row: any, idx: number) => {
            const key = row.work_order_id || `emp-${idx}`;
            byOrder.set(key, Number(row.commission_amount) || 0);
          });
          legacyRows.forEach((row: any, idx: number) => {
            const key = row.work_order_id || `leg-${idx}`;
            const current = byOrder.get(key) || 0;
            byOrder.set(key, Math.max(current, Number(row.commission_amount) || 0));
          });
          const baseAmount = Array.from(byOrder.values()).reduce((sum, amount) => sum + amount, 0);

          const adjustmentTotal = ((adjustments as any[]) || [])
            .map((adj: any) => {
              const applied = (adj.applications || []).reduce(
                (sum: number, app: any) => sum + (Number(app.applied_amount) || 0),
                0,
              );
              const remaining = Math.max((Number(adj.amount) || 0) - applied, 0);
              const availableFrom = new Date(adj.available_from || adj.created_at);
              return { remaining, isAvailable: availableFrom <= now };
            })
            .filter((adj) => adj.isAvailable && adj.remaining > 0)
            .reduce((sum, adj) => sum + adj.remaining, 0);

          const weekEarned = ((weekCommissions as any[]) || []).reduce(
            (sum: number, row: any) => sum + (Number(row.commission_amount) || 0),
            0,
          );
          const historicalPaid = ((historicalSettlements as any[]) || []).reduce(
            (sum: number, row: any) => sum + (Number(row.amount) || 0),
            0,
          );
          const availableToSettle = baseAmount;

          nextSummary[tech.id] = {
            baseAmount,
            availableToSettle,
            adjustmentTotal,
            weekEarned,
            historicalPaid,
          };
        }),
      );

      setSummaryByTech(nextSummary);
      setLoading(false);
    }

    loadData();
  }, [selectedTechId]);

  const selectedTech = useMemo(
    () => technicians.find((tech) => tech.id === selectedTechId) || null,
    [technicians, selectedTechId],
  );
  const selectedSummary = selectedTechId
    ? summaryByTech[selectedTechId] || {
        baseAmount: 0,
        availableToSettle: 0,
        adjustmentTotal: 0,
        weekEarned: 0,
        historicalPaid: 0,
      }
    : { baseAmount: 0, availableToSettle: 0, adjustmentTotal: 0, weekEarned: 0, historicalPaid: 0 };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Pago a Técnicos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selecciona un técnico y registra su liquidación con flujo guiado.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Técnicos visibles</p>
            <p className="text-xl font-bold text-slate-900">{technicians.length}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Total por liquidar</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCLP(
                Object.values(summaryByTech).reduce((sum, item) => sum + item.availableToSettle, 0),
              )}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white/90 p-3">
            <p className="text-xs text-slate-500">Ganado semana (global)</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCLP(Object.values(summaryByTech).reduce((sum, item) => sum + item.weekEarned, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Seleccionar técnico
          </h2>
          <div className="max-h-[65vh] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
            {loading && <p className="text-sm text-slate-500">Cargando técnicos...</p>}
            {!loading &&
              technicians.map((tech) => {
                const summary = summaryByTech[tech.id] || {
                  baseAmount: 0,
                  availableToSettle: 0,
                  adjustmentTotal: 0,
                  weekEarned: 0,
                  historicalPaid: 0,
                };
                const isActive = selectedTechId === tech.id;
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => setSelectedTechId(tech.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {tech.name?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{tech.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Saldo:{" "}
                          <span className="font-semibold">{formatCLP(summary.availableToSettle)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <span className="rounded bg-slate-100 px-2 py-1">
                        Sem: {formatCLP(summary.weekEarned)}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-1">
                        Desc: {formatCLP(summary.adjustmentTotal)}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-2">
          {selectedTech ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-sm text-slate-500">Técnico seleccionado</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedTech.name}</p>
                  <p className="text-xs text-slate-500">
                    Saldo disponible: {formatCLP(selectedSummary.availableToSettle)} · Descuentos:{" "}
                    {formatCLP(selectedSummary.adjustmentTotal)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ganado semana (lun-sab): {formatCLP(selectedSummary.weekEarned)} · Historial pagado
                    completo: {formatCLP(selectedSummary.historicalPaid)}
                  </p>
                </div>
                <Link
                  href="/finance"
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver módulo financiero completo
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  href={`/finance/payments?tech=${selectedTech.id}`}
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"
                >
                  Pago rápido
                  <HandCoins className="size-4" />
                </Link>
                <Link
                  href="/finance"
                  className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm font-semibold text-indigo-700"
                >
                  Ver finanzas
                  <Wallet className="size-4" />
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm font-semibold text-sky-700"
                >
                  Analizar reportes
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              <SalarySettlementPanel
                technicianId={selectedTech.id}
                technicianName={selectedTech.name}
                baseAmount={selectedSummary.availableToSettle}
                adjustmentTotal={selectedSummary.adjustmentTotal}
                weekEarnedAmount={selectedSummary.weekEarned}
                context="admin"
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              <Sparkles className="mx-auto mb-2 size-4 text-slate-400" />
              Selecciona un técnico para comenzar el pago.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
