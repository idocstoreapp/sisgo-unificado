"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { currentWeekRange, formatDate } from "@/lib/date";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import type { SalaryAdjustment, SalaryAdjustmentApplication } from "@/types";

// Componente para gestionar préstamos
function LoanManagementCard({ 
  loan, 
  technicianId, 
  onUpdate, 
  canEdit 
}: { 
  loan: AdjustmentWithPending; 
  technicianId: string;
  onUpdate: () => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(loan.amount.toString());
  const [editNote, setEditNote] = useState(loan.note || '');
  const [saving, setSaving] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);

  const handleSaveEdit = async () => {
    if (!canEdit) return;
    setSaving(true);
    const newAmount = parseFloat(editAmount) || 0;
    
    const { error } = await supabase
      .from("salary_adjustments")
      .update({ 
        amount: newAmount,
        note: editNote || null
      })
      .eq("id", loan.id);
    
    if (error) {
      alert(`Error al actualizar préstamo: ${error.message}`);
    } else {
      setIsEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const handleAddPayment = async () => {
    if (!canEdit) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert("El monto del pago debe ser mayor a 0");
      return;
    }
    
    setAddingPayment(true);
    
    // Actualizar el monto del préstamo restando el pago
    const currentAmount = parseFloat(editAmount) || loan.amount;
    const newAmount = Math.max(0, currentAmount - amount);
    
    const paymentInfo = `Pago de ${formatCLP(amount)} el ${formatDate(paymentDate)}${paymentNote ? ` - ${paymentNote}` : ''}`;
    const updatedNote = loan.note 
      ? `${loan.note}\n${paymentInfo}`
      : paymentInfo;
    
    const { error } = await supabase
      .from("salary_adjustments")
      .update({ 
        amount: newAmount,
        note: updatedNote
      })
      .eq("id", loan.id);
    
    if (error) {
      alert(`Error al registrar pago: ${error.message}`);
    } else {
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setEditAmount(newAmount.toString());
      onUpdate();
    }
    setAddingPayment(false);
  };

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
      {!isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-purple-700">💰 Préstamo</span>
                {loan.note && (
                  <span className="text-xs text-purple-600">• {loan.note.split('\n')[0]}</span>
                )}
              </div>
              <div className="text-sm font-semibold text-purple-800 mb-1">
                Saldo pendiente: {formatCLP(loan.amount)}
              </div>
              {loan.amount === 0 && (
                <div className="text-xs text-emerald-600 font-medium">
                  ✅ Préstamo saldado completamente
                </div>
              )}
              {loan.note && loan.note.includes('\n') && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Historial de pagos:</p>
                  <div className="text-xs text-purple-600 space-y-1">
                    {loan.note.split('\n').slice(1).map((line, idx) => (
                      <div key={idx} className="pl-2 border-l-2 border-purple-300">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="ml-3 px-3 py-1 text-xs font-medium rounded-md border border-purple-500 text-purple-600 hover:bg-purple-100"
              >
                ✏️ Editar
              </button>
            )}
          </div>
          
          {canEdit && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-2">Agregar Pago:</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto"
                  value={formatCLPInput(paymentAmount ? parseCLPInput(paymentAmount) : "")}
                  onChange={(e) => {
                    const parsed = parseCLPInput(e.target.value);
                    setPaymentAmount(parsed > 0 ? parsed.toString() : "");
                  }}
                  className="border border-purple-300 rounded px-2 py-1 text-xs"
                />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="border border-purple-300 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="border border-purple-300 rounded px-2 py-1 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPayment}
                disabled={addingPayment || !paymentAmount}
                className="mt-2 px-3 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {addingPayment ? "Guardando..." : "➕ Agregar Pago"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-purple-700 font-medium">Monto del préstamo:</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCLPInput(editAmount ? parseCLPInput(editAmount) : "")}
              onChange={(e) => {
                const parsed = parseCLPInput(e.target.value);
                setEditAmount(parsed > 0 ? parsed.toString() : "");
              }}
              className="w-full border border-purple-300 rounded px-2 py-1 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-purple-700 font-medium">Nota:</label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full border border-purple-300 rounded px-2 py-1 text-sm mt-1"
              rows={3}
              placeholder="Descripción del préstamo..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-3 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "💾 Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditAmount(loan.amount.toString());
                setEditNote(loan.note || '');
              }}
              className="px-3 py-1 text-xs font-medium rounded-md border border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type AdjustmentWithPending = SalaryAdjustment & {
  remaining: number;
  appliedTotal: number;
  isCurrentWeek: boolean;
  availableFromDate: Date;
  isAvailableThisWeek: boolean;
};

interface SalarySettlementPanelProps {
  technicianId: string;
  technicianName?: string;
  baseAmount: number;
  adjustmentTotal: number;
  context: "technician" | "admin";
  onAfterSettlement?: () => void;
}

export default function SalarySettlementPanel({
  technicianId,
  technicianName,
  baseAmount,
  adjustmentTotal,
  context,
  onAfterSettlement,
}: SalarySettlementPanelProps) {
  const [pendingAdjustments, setPendingAdjustments] = useState<AdjustmentWithPending[]>([]);
  // Estado simplificado para selección de adelantos
  const [selectedAdjustments, setSelectedAdjustments] = useState<Record<string, {
    selected: boolean;
    amount: number; // Monto a descontar (puede ser parcial)
  }>>({});
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [applicationsSupported, setApplicationsSupported] = useState(true);
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
  const [settledAmount, setSettledAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "efectivo/transferencia" | "">("");
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [customAmountInput, setCustomAmountInput] = useState(0);
  const [deletingAdjustmentId, setDeletingAdjustmentId] = useState<string | null>(null);
  const [returnedOrders, setReturnedOrders] = useState<any[]>([]);
  const [returnsTotal, setReturnsTotal] = useState(0);
  // Estado para abonos de préstamos durante la liquidación (se descuentan del total pendiente)
  const [loanPayments, setLoanPayments] = useState<Record<string, {
    amount: number;
    date: string;
    note: string;
  }>>({});

  const { start: weekStartDate, end: weekEndDate } = currentWeekRange();
  const weekStartISO = weekStartDate.toISOString().slice(0, 10);

  async function loadPendingAdjustments() {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Consultar si hay liquidaciones registradas para esta semana (obtener created_at, amount y details)
    const { data: settlementsData, error: settlementsError } = await supabase
      .from("salary_settlements")
      .select("created_at, amount, details")
      .eq("technician_id", technicianId)
      .eq("week_start", weekStartISO)
      .order("created_at", { ascending: false });

    // Fecha de la última liquidación de la semana (si existe)
    const lastSettlementDate = settlementsData && settlementsData.length > 0
      ? new Date(settlementsData[0].created_at)
      : null;
    
    // Calcular settledAmount desde settlementsData
    // IMPORTANTE: También debemos considerar los abonos de préstamos que se pagaron
    // Los abonos de préstamos están en details->loan_payments_total de cada settlement
    if (settlementsError) {
      console.error("❌ [SalarySettlementPanel] Error cargando liquidaciones:", settlementsError);
      const msg = settlementsError.message?.toLowerCase() ?? "";
      if (msg.includes("salary_settlements") || msg.includes("does not exist")) {
        setSetupWarning((prev) =>
          prev
            ? prev
            : "Para registrar pagos completos ejecuta el script `database/add_salary_settlements.sql` en Supabase."
        );
        setSettledAmount(0);
      } else {
        setSettledAmount(0);
      }
    } else {
      // Sumar los pagos directos
      const totalSettled = (settlementsData ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0);
      
      // Sumar los adelantos/descuentos descontados en liquidaciones
      const totalAdjustmentsDeducted = (settlementsData ?? []).reduce((sum, s) => {
        const adjustmentsTotal = s.details?.selected_adjustments_total;
        return sum + (typeof adjustmentsTotal === 'number' ? adjustmentsTotal : 0);
      }, 0);
      
      // Sumar los abonos de préstamos pagados en liquidaciones
      const totalLoanPayments = (settlementsData ?? []).reduce((sum, s) => {
        const loanPaymentsTotal = s.details?.loan_payments_total;
        return sum + (typeof loanPaymentsTotal === 'number' ? loanPaymentsTotal : 0);
      }, 0);
      
      // El settledAmount debe incluir:
      // - Pagos directos (amount)
      // - Ajustes descontados (selected_adjustments_total)
      // - Abonos de préstamos (loan_payments_total)
      // Esto representa el total que se le liquidó al técnico
      const finalSettledAmount = totalSettled + totalAdjustmentsDeducted + totalLoanPayments;
      
      console.log("💰 [SalarySettlementPanel] Cálculo de settledAmount:", {
        settlementsCount: settlementsData?.length || 0,
        totalSettled,
        totalAdjustmentsDeducted,
        totalLoanPayments,
        finalSettledAmount,
        calculation: `${totalSettled} + ${totalAdjustmentsDeducted} + ${totalLoanPayments} = ${finalSettledAmount}`,
        settlements: settlementsData?.map(s => ({
          amount: s.amount,
          selected_adjustments_total: s.details?.selected_adjustments_total,
          loan_payments_total: s.details?.loan_payments_total,
          details: s.details
        }))
      });
      
      setSettledAmount(finalSettledAmount);
    }

    async function fetchAdjustments(includeApplications: boolean) {
      const selectClause = includeApplications
        ? "*, applications:salary_adjustment_applications(applied_amount, week_start)"
        : "*";
      // Cargar TODOS los ajustes sin filtrar por fecha
      // El filtrado se hará después basándose en las aplicaciones (remaining > 0)
      const query = supabase
        .from("salary_adjustments")
        .select(selectClause)
        .eq("technician_id", technicianId);
      
      return await query.order("created_at", { ascending: false });
    }

    let adjustmentsResponse = await fetchAdjustments(applicationsSupported);

    if (adjustmentsResponse.error && applicationsSupported) {
      const msg = adjustmentsResponse.error.message?.toLowerCase() ?? "";
      if (msg.includes("salary_adjustment_applications") || msg.includes("does not exist")) {
        setApplicationsSupported(false);
        setSetupWarning(
          "Para usar la liquidación parcial debes ejecutar el script `database/add_salary_adjustment_applications.sql` en Supabase y volver a intentarlo."
        );
        adjustmentsResponse = await fetchAdjustments(false);
      }
    }

    if (adjustmentsResponse.error) {
      console.error("Error cargando ajustes pendientes:", adjustmentsResponse.error);
      setPendingAdjustments([]);
      setAdjustmentDrafts({});
      setErrorMsg("No pudimos cargar los ajustes pendientes. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    const adjustmentsData =
      (adjustmentsResponse.data ?? []) as unknown as (SalaryAdjustment & {
        applications?: SalaryAdjustmentApplication[];
      })[];

    console.log("📊 [SalarySettlementPanel] Cargando ajustes:", {
      totalAjustes: adjustmentsData.length,
      applicationsSupported,
      technicianId,
      primerAjuste: adjustmentsData[0] ? {
        id: adjustmentsData[0].id,
        amount: adjustmentsData[0].amount,
        type: adjustmentsData[0].type,
        applications: (adjustmentsData[0] as any)?.applications
      } : null,
      todosLosAjustes: adjustmentsData.map(adj => ({
        id: adj.id,
        amount: adj.amount,
        type: adj.type,
        note: adj.note,
        applications: (adj as any)?.applications || []
      }))
    });

    const normalized: AdjustmentWithPending[] = adjustmentsData
      .map((adj) => {
        // IMPORTANTE: Procesar préstamos de manera completamente separada
        // Los préstamos NO tienen aplicaciones, NO afectan saldos, solo se muestran para gestión
        if (adj.type === 'loan') {
          const createdDate = new Date(adj.created_at);
          const availableFromDate = adj.available_from
            ? new Date(adj.available_from)
            : createdDate;
          availableFromDate.setHours(0, 0, 0, 0);
          const isAvailableThisWeek = availableFromDate <= weekEndDate;
          
          // Para préstamos, remaining = amount (se actualiza manualmente con pagos)
          // NO se calcula con aplicaciones porque los préstamos no tienen aplicaciones
          return {
            ...adj,
            appliedTotal: 0, // Préstamos no tienen aplicaciones
            remaining: adj.amount ?? 0, // Monto actual del préstamo
            availableFromDate,
            isAvailableThisWeek,
            isCurrentWeek: createdDate >= weekStartDate && createdDate <= weekEndDate,
          };
        }
        
        // Para adelantos y descuentos, calcular normalmente
        const applications = (adj as any)?.applications ?? [];
        const appliedTotal =
          applicationsSupported
            ? (applications as SalaryAdjustmentApplication[]).reduce(
                (sum, app) => sum + (app.applied_amount ?? 0),
                0
              ) ?? 0
            : 0;
        const remaining = Math.max((adj.amount ?? 0) - appliedTotal, 0);
        
        // Calcular isAvailableThisWeek antes de usarlo
        const createdDate = new Date(adj.created_at);
        const availableFromDate = adj.available_from
          ? new Date(adj.available_from)
          : new Date(createdDate);
        availableFromDate.setHours(0, 0, 0, 0);
        const isAvailableThisWeek = availableFromDate <= weekEndDate;
        
        // Log para debugging - mostrar TODOS los ajustes con aplicaciones (excepto préstamos)
        console.log(`🔍 Ajuste ${adj.id}: monto=${adj.amount}, aplicado=${appliedTotal}, restante=${remaining}`, {
          applications: applications.length,
          aplicaciones: applications,
          technician_id: adj.technician_id,
          type: adj.type,
          note: adj.note,
          available_from: adj.available_from,
          isAvailableThisWeek,
          weekEndDate: weekEndDate.toISOString()
        });
        
        // Log especial para adelantos de 100,000
        if (adj.amount === 100000 && adj.type === 'advance') {
          console.warn(`⚠️ ADELANTO DE 100,000 ENCONTRADO:`, {
            id: adj.id,
            amount: adj.amount,
            appliedTotal,
            remaining,
            applications: applications,
            willShow: remaining > 0 && isAvailableThisWeek,
            willShowInSettled: remaining <= 0
          });
        }
        return {
          ...adj,
          appliedTotal,
          remaining,
          availableFromDate,
          isAvailableThisWeek,
          isCurrentWeek: createdDate >= weekStartDate && createdDate <= weekEndDate,
        };
      });
      // CORREGIDO: Mostrar TODOS los ajustes, incluso los completamente aplicados
      // Solo filtrar por remaining > 0 para mostrar en la sección de "pendientes"
      // Pero permitir ver y eliminar todos los ajustes

    // Inicializar selección de ajustes cuando se cargan
    const newSelections: Record<string, { selected: boolean; amount: number }> = {};
    normalized.forEach((adj) => {
      if (!selectedAdjustments[adj.id]) {
        newSelections[adj.id] = {
          selected: false,
          amount: adj.remaining, // Por defecto, el monto completo
        };
      }
    });
    if (Object.keys(newSelections).length > 0) {
      setSelectedAdjustments((prev) => ({ ...prev, ...newSelections }));
    }

    setPendingAdjustments(normalized);
    setAdjustmentDrafts((prev) => {
      const next: Record<string, number> = {};
      normalized.forEach((adj) => {
        const previousValue = prev[adj.id];
        if (!adj.isAvailableThisWeek) {
          next[adj.id] = 0;
          return;
        }
        if (typeof previousValue === "number") {
          next[adj.id] = Math.min(Math.max(previousValue, 0), adj.remaining);
        } else {
          next[adj.id] = adj.remaining;
        }
      });
      return next;
    });
    // NOTA: settledAmount ya se calculó arriba desde settlementsData, no necesitamos duplicar la consulta

    // Cargar devoluciones y cancelaciones de la semana
    // Solo las creadas después de la última liquidación (si existe)
    const { start, end } = currentWeekRange();
    let returnsQuery = supabase
      .from("orders")
      .select("id, commission_amount, status")
      .eq("technician_id", technicianId)
      .in("status", ["returned", "cancelled"])
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());
    
    // Si hay liquidación, solo contar devoluciones creadas DESPUÉS de la liquidación
    if (lastSettlementDate) {
      returnsQuery = returnsQuery.gte("created_at", lastSettlementDate.toISOString());
    }
    
    const { data: returnedData } = await returnsQuery;

    if (returnedData) {
      setReturnedOrders(returnedData);
      const total = returnedData.reduce((sum, order) => sum + (order.commission_amount ?? 0), 0);
      setReturnsTotal(total);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (technicianId) {
      void loadPendingAdjustments();
    }
    
    // Escuchar eventos de liquidación para refrescar el panel
    const handleSettlementCreated = () => {
      if (technicianId) {
        void loadPendingAdjustments();
      }
    };
    
    window.addEventListener('settlementCreated', handleSettlementCreated);
    return () => {
      window.removeEventListener('settlementCreated', handleSettlementCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicianId]);

  // Calcular total de ajustes seleccionados (solo los que están marcados como selected: true)
  // IMPORTANTE: Excluir préstamos (type: 'loan') porque no afectan los saldos
  const selectedAdjustmentsTotal = useMemo(
    () =>
      pendingAdjustments.reduce((sum, adj) => {
        // Excluir préstamos (no afectan saldos)
        if (adj.type === 'loan') {
          return sum;
        }
        if (!adj.isAvailableThisWeek) {
          return sum;
        }
        const selection = selectedAdjustments[adj.id];
        // Solo contar ajustes que están EXPLÍCITAMENTE seleccionados (selected: true)
        if (selection && selection.selected) {
          return sum + Math.min(Math.max(selection.amount, 0), adj.remaining);
        }
        // No incluir ajustes no seleccionados
        return sum;
      }, 0),
    [pendingAdjustments, selectedAdjustments]
  );

  const availableAdjustments = useMemo(
    () => pendingAdjustments.filter((adj) => adj.isAvailableThisWeek),
    [pendingAdjustments]
  );

  const deferredHoldback = useMemo(
    () =>
      pendingAdjustments.reduce((sum, adj) => {
        if (!adj.isAvailableThisWeek && adj.availableFromDate > weekEndDate) {
          return sum + adj.remaining;
        }
        return sum;
      }, 0),
    [pendingAdjustments, weekEndDate]
  );

  const totalAdjustable = useMemo(
    () => availableAdjustments.reduce((sum, adj) => sum + adj.remaining, 0),
    [availableAdjustments]
  );
  
  // Préstamos (separados, no afectan saldos automáticamente, pero pueden tener abonos durante liquidación)
  const loans = useMemo(
    () => pendingAdjustments.filter((adj) => adj.type === 'loan'),
    [pendingAdjustments]
  );
  
  // Calcular total de abonos de préstamos que se pagarán en esta liquidación
  const loanPaymentsTotal = useMemo(
    () => Object.values(loanPayments).reduce((sum, payment) => sum + (payment.amount || 0), 0),
    [loanPayments]
  );
  
  // Calcular ajustes ya aplicados EN ESTA SEMANA (no préstamos, solo adelantos y descuentos)
  // IMPORTANTE: Solo contar aplicaciones de esta semana, no de semanas anteriores
  const totalAppliedAdjustments = useMemo(
    () => pendingAdjustments
      .filter((adj) => adj.type !== 'loan') // Excluir préstamos
      .reduce((sum, adj) => {
        // Solo contar aplicaciones de esta semana
        const thisWeekApplications = (adj as any)?.applications?.filter((app: any) => {
          if (!app.week_start) return false;
          return app.week_start === weekStartISO;
        }) || [];
        const thisWeekApplied = thisWeekApplications.reduce(
          (appSum: number, app: any) => appSum + (app.applied_amount ?? 0),
          0
        );
        return sum + thisWeekApplied;
      }, 0),
    [pendingAdjustments, weekStartISO]
  );
  
  // grossAvailable debe ser: baseAmount - settledAmount
  // NO restar totalAppliedAdjustments aquí porque esos ajustes ya fueron aplicados en liquidaciones anteriores
  // Si los restamos aquí, estaríamos descontándolos dos veces (una vez en grossAvailable y otra vez en netRemaining)
  const grossAvailable = baseAmount - settledAmount;
  
  // Log para debugging
  console.log("📊 [SalarySettlementPanel] Cálculo de grossAvailable:", {
    baseAmount,
    totalAppliedAdjustments,
    settledAmount,
    grossAvailable,
    weekStartISO,
    calculation: `${baseAmount} - ${settledAmount} = ${grossAvailable}`,
    note: "totalAppliedAdjustments NO se resta aquí porque ya están incluidos en settledAmount"
  });
  
  // Log adicional para debugging del cálculo de netRemaining
  console.log("📊 [SalarySettlementPanel] Cálculo de netRemaining:", {
    grossAvailable,
    selectedAdjustmentsTotal,
    loanPaymentsTotal,
    calculation: `netRemaining = ${grossAvailable} - ${selectedAdjustmentsTotal} - ${loanPaymentsTotal}`
  });
  const minPayable = Math.max(grossAvailable - (totalAdjustable + deferredHoldback), 0);
  const maxPayable = Math.max(baseAmount + deferredHoldback, grossAvailable);
  // IMPORTANTE: netRemaining incluye ajustes SELECCIONADOS y abonos de préstamos
  // NO incluir deferredHoldback porque son ajustes que no están disponibles esta semana
  // Si no hay ajustes seleccionados ni abonos, mostrar solo lo que se le debe (grossAvailable)
  const netRemaining = (selectedAdjustmentsTotal > 0 || loanPaymentsTotal > 0)
    ? Math.max(grossAvailable - selectedAdjustmentsTotal - loanPaymentsTotal, 0)
    : grossAvailable;

  // Calcular monto a pagar automáticamente basado en selección de ajustes y abonos de préstamos
  // IMPORTANTE: Si no hay ajustes seleccionados ni abonos, mostrar el saldo completo (grossAvailable)
  // Solo descontar cuando hay ajustes EXPLÍCITAMENTE seleccionados o abonos registrados
  // NO incluir deferredHoldback porque son ajustes que no están disponibles esta semana
  useEffect(() => {
    const totalToPay = (selectedAdjustmentsTotal > 0 || loanPaymentsTotal > 0)
      ? Math.max(0, grossAvailable - selectedAdjustmentsTotal - loanPaymentsTotal)
      : grossAvailable; // Si no hay ajustes seleccionados ni abonos, mostrar todo el saldo
    // Solo forzar el monto automáticamente cuando hay ajustes seleccionados.
    // Los abonos de préstamos NO deben sobrescribir un monto manual de pago parcial.
    if (selectedAdjustmentsTotal > 0) {
      setCustomAmountInput(totalToPay);
    }
    
    // Si es pago mixto y hay ajustes seleccionados, inicializar proporción 50/50
    if (paymentMethod === "efectivo/transferencia" && selectedAdjustmentsTotal > 0) {
      if (totalToPay > 0 && (cashAmount === 0 && transferAmount === 0)) {
        setCashAmount(Math.round(totalToPay / 2));
        setTransferAmount(totalToPay - Math.round(totalToPay / 2));
      } else if (totalToPay > 0 && cashAmount + transferAmount !== totalToPay) {
        // Ajustar proporción si el total cambió pero ya había valores
        const currentTotal = cashAmount + transferAmount;
        if (currentTotal > 0) {
          const ratio = totalToPay / currentTotal;
          setCashAmount(Math.round(cashAmount * ratio));
          setTransferAmount(totalToPay - Math.round(cashAmount * ratio));
    } else {
          setCashAmount(Math.round(totalToPay / 2));
          setTransferAmount(totalToPay - Math.round(totalToPay / 2));
      }
    }
    }
  }, [grossAvailable, selectedAdjustmentsTotal, loanPaymentsTotal, paymentMethod]);

  // Calcular saldo restante después del pago
  const remainingBalance = useMemo(() => {
    const paidAmount = paymentMethod === "efectivo/transferencia" 
      ? cashAmount + transferAmount 
      : customAmountInput;
    return Math.max(0, netRemaining - paidAmount);
  }, [netRemaining, customAmountInput, cashAmount, transferAmount, paymentMethod]);

  const draftPaidAmount = paymentMethod === "efectivo/transferencia"
    ? Math.max(0, cashAmount + transferAmount)
    : Math.max(0, customAmountInput);
  const hasDraftPayment = draftPaidAmount > 0;
  // Mostrar siempre el saldo real tras descuentos seleccionados.
  // El "pendiente tras este pago" se informa por separado para evitar confusión
  // cuando el monto a pagar se autocompleta.
  const pendingToDisplay = netRemaining;

  function distributeDeduction(amountToDeduct: number) {
    let remaining = Math.max(0, Math.min(amountToDeduct, totalAdjustable));
    const next: Record<string, number> = {};
    pendingAdjustments.forEach((adj) => {
      if (!adj.isAvailableThisWeek) {
        next[adj.id] = 0;
        return;
      }
      if (remaining <= 0) {
        next[adj.id] = 0;
        return;
      }
      const apply = Math.min(adj.remaining, remaining);
      next[adj.id] = apply;
      remaining -= apply;
    });
    return next;
  }

  function applyPreset(mode: "net" | "full") {
    const target = mode === "full" ? maxPayable : minPayable;
    applyCustomAmount(target);
  }

  function applyCustomAmount(targetValue?: number) {
    const clamped = Math.max(minPayable, Math.min(targetValue ?? customAmountInput, maxPayable));
    const desiredDeduction = Math.max(
      0,
      Math.min(totalAdjustable, Math.max(grossAvailable - deferredHoldback - clamped, 0))
    );
    const nextDrafts = distributeDeduction(desiredDeduction);
    setCustomAmountInput(clamped);
    setAdjustmentDrafts(nextDrafts);
  }

  // Funciones simplificadas para manejar selección de ajustes
  function handleToggleAdjustmentSelection(adjId: string) {
    const target = pendingAdjustments.find((adj) => adj.id === adjId);
    if (!target || !target.isAvailableThisWeek) return;
    
    setSelectedAdjustments((prev) => {
      const current = prev[adjId];
      return {
        ...prev,
        [adjId]: {
          selected: !current?.selected,
          amount: current?.selected ? 0 : target.remaining, // Si se deselecciona, poner 0; si se selecciona, poner el monto completo
        },
      };
    });
  }

  function handleAdjustmentAmountChange(adjId: string, value: string) {
    const target = pendingAdjustments.find((adj) => adj.id === adjId);
    if (!target || !target.isAvailableThisWeek) return;
    
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      setSelectedAdjustments((prev) => ({
        ...prev,
        [adjId]: { ...prev[adjId], amount: 0 },
      }));
      return;
    }
    
    const clamped = Math.max(0, Math.min(numeric, target.remaining));
    setSelectedAdjustments((prev) => ({
      ...prev,
      [adjId]: { ...prev[adjId], amount: clamped },
    }));
  }

  // Mantener funciones antiguas para compatibilidad
  function handleDraftChange(adjId: string, value: string) {
    handleAdjustmentAmountChange(adjId, value);
  }

  function handleToggleAdjustment(adjId: string, enabled: boolean) {
    if (enabled) {
      handleToggleAdjustmentSelection(adjId);
    } else {
      setSelectedAdjustments((prev) => ({
      ...prev,
        [adjId]: { ...prev[adjId], selected: false, amount: 0 },
    }));
    }
  }

  function formatAmount(amount: number) {
    return formatCLP(amount);
  }
  const canEditAdjustments = context === "admin";

  async function handleDeleteAdjustment(adjustmentId: string) {
    const target = pendingAdjustments.find((adj) => adj.id === adjustmentId);
    if (!target) {
      console.error("❌ No se encontró el ajuste a eliminar:", adjustmentId);
      setErrorMsg("No se encontró el ajuste a eliminar.");
      return;
    }
    
    const confirmed = window.confirm(
      `¿Eliminar este ajuste de sueldo (${target.type === "advance" ? "Adelanto" : "Descuento"} de ${formatAmount(target.amount ?? 0)})?\n\n` +
      `Monto original: ${formatAmount(target.amount)}\n` +
      `Aplicado: ${formatAmount(target.appliedTotal)}\n` +
      `Restante: ${formatAmount(target.remaining)}\n\n` +
      `Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }
    
    setErrorMsg(null);
    setDeletingAdjustmentId(adjustmentId);
    
    console.log("🗑️ Intentando eliminar ajuste:", {
      adjustmentId,
      technicianId,
      amount: target.amount,
      remaining: target.remaining
    });
    
    const { data, error } = await supabase
      .from("salary_adjustments")
      .delete()
      .eq("id", adjustmentId)
      .eq("technician_id", technicianId)
      .select(); // Seleccionar para verificar que se eliminó
    
    setDeletingAdjustmentId(null);
    
    if (error) {
      console.error("❌ Error eliminando ajuste:", error);
      console.error("Detalles del error:", JSON.stringify(error, null, 2));
      
      const errorMsg = error.message?.toLowerCase() || "";
      if (errorMsg.includes("row-level security") || errorMsg.includes("policy")) {
        setErrorMsg("❌ Error de permisos: No tienes permisos para eliminar este ajuste. Verifica que tengas rol de administrador.");
      } else {
        setErrorMsg(`❌ No pudimos eliminar el ajuste: ${error.message || "Error desconocido"}`);
      }
      return;
    }
    
    if (data && data.length > 0) {
      console.log("✅ Ajuste eliminado correctamente:", data);
      setSuccessMsg(`✅ Ajuste eliminado correctamente.`);
    } else {
      console.warn("⚠️ No se recibió confirmación de eliminación, pero no hubo error");
      setSuccessMsg(`⚠️ Ajuste posiblemente eliminado. Verifica en el listado.`);
    }
    
    // Recargar ajustes
    await loadPendingAdjustments();
  }

  async function handleLiquidation() {
    // Validar que netRemaining no sea negativo
    const maxNetRemaining = Math.max(0, netRemaining);
    
    if (maxNetRemaining <= 0) {
      setErrorMsg("El técnico no tiene saldo pendiente. No se puede registrar un pago adicional.");
      return;
    }
    
    // IMPORTANTE: Si hay ajustes seleccionados o abonos de préstamos, 
    // el monto a pagar debe ser automáticamente el resto disponible
    // Esto asegura que se descuenten los ajustes y se pague el resto completo
    let targetAmount = Math.max(0, customAmountInput);
    
    // Si hay ajustes seleccionados, forzar que se pague el resto completo
    // (solo para mantener consistencia con el flujo de descuentos seleccionados)
    if (selectedAdjustmentsTotal > 0) {
      const calculatedRest = Math.max(0, grossAvailable - selectedAdjustmentsTotal - loanPaymentsTotal);
      targetAmount = calculatedRest;
      setCustomAmountInput(calculatedRest);
      
      // Si es pago mixto, ajustar los montos proporcionalmente
    if (paymentMethod === "efectivo/transferencia") {
        // Mantener la proporción si ya hay valores, sino dividir 50/50
        if (cashAmount > 0 || transferAmount > 0) {
          const total = Math.max(0, cashAmount) + Math.max(0, transferAmount);
          if (total > 0) {
            const cashRatio = Math.max(0, cashAmount) / total;
            const transferRatio = Math.max(0, transferAmount) / total;
            setCashAmount(Math.round(calculatedRest * cashRatio));
            setTransferAmount(Math.round(calculatedRest * transferRatio));
          } else {
            setCashAmount(Math.round(calculatedRest / 2));
            setTransferAmount(calculatedRest - Math.round(calculatedRest / 2));
          }
        } else {
          setCashAmount(Math.round(calculatedRest / 2));
          setTransferAmount(calculatedRest - Math.round(calculatedRest / 2));
        }
      }
    } else {
      // Si no hay ajustes seleccionados, usar el monto ingresado manualmente
      if (paymentMethod === "efectivo/transferencia") {
        const mixedTotal = Math.max(0, cashAmount) + Math.max(0, transferAmount);
      if (mixedTotal <= 0) {
        setErrorMsg("Debes ingresar al menos un monto en efectivo o transferencia.");
        return;
      }
        if (mixedTotal > maxNetRemaining) {
          setErrorMsg(`El total de efectivo + transferencia no puede exceder el total a liquidar (${formatCLP(maxNetRemaining)}).`);
        return;
      }
      targetAmount = mixedTotal;
      setCustomAmountInput(mixedTotal);
    } else {
      // Para efectivo o transferencia individual, validar que no exceda el total a liquidar
        if (targetAmount > maxNetRemaining) {
          setErrorMsg(`El monto no puede exceder el total a liquidar (${formatCLP(maxNetRemaining)}).`);
        return;
        }
      }
    }
    
    // Validar que el monto a pagar sea mayor a 0
    if (targetAmount <= 0) {
      if (selectedAdjustmentsTotal > 0 || loanPaymentsTotal > 0) {
        setErrorMsg("No hay monto restante para pagar después de descontar los ajustes seleccionados.");
      } else {
      setErrorMsg("Debes ingresar un monto mayor a 0 para liquidar.");
      }
      return;
    }
    
    if (targetAmount > maxNetRemaining) {
      setErrorMsg(`El monto no puede exceder el total a liquidar (${formatCLP(maxNetRemaining)}).`);
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validar que se haya seleccionado un método de pago
    if (!paymentMethod || (paymentMethod as string) === "") {
      alert("⚠️ Selecciona medio de pago\n\nDebes seleccionar el método de pago antes de registrar la liquidación.\n\nEsto es importante para llevar un registro correcto de cómo se le pagó al técnico.");
      setErrorMsg("Debes seleccionar un método de pago antes de registrar la liquidación.");
      return;
    }

    setSaving(true);
    applyCustomAmount(targetAmount);

    const desiredDeduction = Math.max(
      0,
      Math.min(totalAdjustable, Math.max(grossAvailable - deferredHoldback - targetAmount, 0))
    );
    const draftsForSave = distributeDeduction(desiredDeduction);
    setAdjustmentDrafts(draftsForSave);
    setCustomAmountInput(targetAmount);

    // Usar nuevo sistema de selección de ajustes
    const entriesToApply = pendingAdjustments
      .filter((adj) => adj.isAvailableThisWeek)
      .map((adj) => {
        const selection = selectedAdjustments[adj.id];
        if (selection && selection.selected && selection.amount > 0) {
      return {
        adjustment_id: adj.id,
        technician_id: technicianId,
            applied_amount: Math.min(selection.amount, adj.remaining),
      };
        }
        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => !!entry && entry.applied_amount > 0);

    const appliedById = entriesToApply.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.adjustment_id] = entry.applied_amount;
      return acc;
    }, {});

    const { data: userData } = await supabase.auth.getUser();

    // Preparar aplicaciones para la función transaccional
    const applicationsPayload = entriesToApply.map((entry) => ({
      adjustment_id: entry.adjustment_id,
      applied_amount: entry.applied_amount,
    }));

    const nextWeekStart = new Date(weekStartDate);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    nextWeekStart.setHours(0, 0, 0, 0);
    const nextWeekStartISO = nextWeekStart.toISOString().slice(0, 10);

    const carryOverAdjustments = pendingAdjustments
      .map((adj) => {
        if (!adj.isCurrentWeek || !adj.isAvailableThisWeek) return null;
        const raw = draftsForSave[adj.id] ?? 0;
        const leftover = Math.max(adj.remaining - raw, 0);
        if (leftover <= 0) return null;
        return { adj, leftover };
      })
      .filter((item): item is { adj: AdjustmentWithPending; leftover: number } => !!item);

    const carryOverSummary: { original_id: string; amount: number }[] = [];

    for (const item of carryOverAdjustments) {
      const { error: deferError } = await supabase
        .from("salary_adjustments")
        .update({
          available_from: nextWeekStartISO,
          note: item.adj.note
            ? `${item.adj.note} (pendiente ${formatDate(nextWeekStartISO)})`
            : `Pendiente desde ${formatDate(nextWeekStartISO)}`,
        })
        .eq("id", item.adj.id);

      if (deferError) {
        console.error("Error actualizando ajuste diferido:", deferError);
        setErrorMsg("No pudimos diferir parte de los descuentos. Intenta nuevamente.");
        setSaving(false);
        return;
      }

      carryOverSummary.push({ original_id: item.adj.id, amount: item.leftover });
    }

    // Procesar abonos de préstamos antes de registrar la liquidación
    const loanPaymentPromises = Object.entries(loanPayments).map(async ([loanId, payment]) => {
      if (payment.amount <= 0) return;
      
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;
      
      const newAmount = Math.max(0, loan.amount - payment.amount);
      const paymentDate = payment.date || new Date().toISOString().slice(0, 10);
      const paymentNote = `Abono de ${formatCLP(payment.amount)} el ${paymentDate}${payment.note ? ` - ${payment.note}` : ''}`;
      const updatedNote = loan.note 
        ? `${loan.note}\n${paymentNote}`
        : paymentNote;
      
      const { error: loanError } = await supabase
        .from("salary_adjustments")
        .update({
          amount: newAmount,
          note: updatedNote
        })
        .eq("id", loanId);
      
      if (loanError) {
        console.error(`Error actualizando préstamo ${loanId}:`, loanError);
        throw new Error(`Error al registrar abono del préstamo: ${loanError.message}`);
      }
    });
    
    try {
      await Promise.all(loanPaymentPromises);
    } catch (error) {
      console.error("Error procesando abonos de préstamos:", error);
      setErrorMsg(error instanceof Error ? error.message : "Error al procesar abonos de préstamos");
      setSaving(false);
      return;
    }

    const detailsPayload = {
      base_amount: baseAmount,
      selected_adjustments_total: selectedAdjustmentsTotal,
      loan_payments_total: loanPaymentsTotal,
      settled_amount: targetAmount,
      adjustments: pendingAdjustments.map((adj) => {
        const applied = appliedById[adj.id] ?? 0;
        return {
          id: adj.id,
          type: adj.type,
          note: adj.note,
          amount: adj.amount,
          applied,
          omitted: Math.max(adj.remaining - applied, 0),
          carried_to_next_week:
            carryOverSummary.find((item) => item.original_id === adj.id)?.amount ?? 0,
        };
      }),
      carry_over: carryOverSummary,
      // Si es pago mixto, guardar los montos por separado
      ...(paymentMethod === "efectivo/transferencia" && {
        payment_breakdown: {
          efectivo: cashAmount,
          transferencia: transferAmount,
          total: targetAmount,
        },
      }),
    };
    
    const settlementData = {
      technician_id: technicianId,
      week_start: weekStartISO,
      amount: targetAmount,
      note: null,
      context,
      payment_method: paymentMethod as "efectivo" | "transferencia" | "efectivo/transferencia",
      details: detailsPayload,
      created_by: userData?.user?.id ?? null,
    };
    
    console.log("💾 [SalarySettlementPanel] Guardando liquidación:", {
      settlementData,
      applicationsPayload,
      selectedAdjustments,
      selectedAdjustmentsTotal,
      loanPayments,
      loanPaymentsTotal,
      targetAmount,
      baseAmount,
      grossAvailable,
      netRemaining,
      calculation: `targetAmount = ${targetAmount}, baseAmount = ${baseAmount}, grossAvailable = ${grossAvailable}, netRemaining = ${netRemaining}`
    });
    
    // Intentar usar función transaccional primero
    let insertedData: any[] | null = null;
    let settlementError: any = null;
    
    try {
      const { data, error } = await supabase.rpc('register_settlement_with_applications', {
        p_technician_id: technicianId,
        p_week_start: weekStartISO,
        p_amount: targetAmount,
        p_payment_method: paymentMethod,
        p_details: detailsPayload,
        p_applications: applicationsPayload.length > 0 ? applicationsPayload : null,
        p_created_by: userData?.user?.id ?? null,
      });
      
      if (error) {
        console.warn("Error usando función transaccional, intentando método antiguo:", error);
        console.error("Detalles del error RPC:", JSON.stringify(error, null, 2));
        // Fallback al método antiguo si la función no existe
        settlementError = error;
      } else if (data) {
        console.log("✅ Función transaccional ejecutada correctamente. Settlement ID:", data);
        // La función retorna el ID de la liquidación
        const settlementId = data;
        // Obtener los datos completos
        const { data: settlementData, error: fetchError } = await supabase
          .from("salary_settlements")
          .select("*")
          .eq("id", settlementId)
          .single();
        
        if (fetchError) {
          console.error("Error obteniendo datos del settlement:", fetchError);
          settlementError = fetchError;
        } else {
          console.log("✅ Settlement obtenido:", settlementData);
          insertedData = [settlementData];
          
          // Verificar que las aplicaciones se crearon
          if (applicationsPayload.length > 0) {
            const { data: applicationsData, error: appsError } = await supabase
              .from("salary_adjustment_applications")
              .select("*")
              .eq("technician_id", technicianId)
              .eq("week_start", weekStartISO)
              .order("created_at", { ascending: false })
              .limit(10);
            
            if (appsError) {
              console.error("Error verificando aplicaciones:", appsError);
            } else {
              console.log("✅ Aplicaciones creadas:", applicationsData);
              console.log("📊 Total aplicaciones encontradas:", applicationsData?.length || 0);
              console.log("📊 Aplicaciones esperadas:", applicationsPayload.length);
            }
          }
        }
      }
    } catch (rpcError: any) {
      console.warn("Función transaccional no disponible, usando método antiguo:", rpcError);
      // Fallback: usar método antiguo
      const { data, error } = await supabase
      .from("salary_settlements")
      .insert(settlementData)
        .select();
      
      insertedData = data;
      settlementError = error;
      
      // Si el settlement se guardó, guardar aplicaciones por separado
      if (data && data.length > 0 && applicationsSupported && entriesToApply.length > 0) {
        const payload = entriesToApply.map((entry) => ({
          ...entry,
          week_start: weekStartISO,
          created_by: userData?.user?.id ?? null,
        }));
        
        const { error: appError } = await supabase
          .from("salary_adjustment_applications")
          .insert(payload);
        
        if (appError) {
          console.error("Error guardando aplicaciones:", appError);
          setErrorMsg("⚠️ La liquidación se guardó pero hubo un error al registrar las aplicaciones. Verifica manualmente.");
        }
      }
    }

    setSaving(false);

    if (settlementError) {
      console.error("Error registrando pago:", settlementError);
      console.error("Detalles del error:", JSON.stringify(settlementError, null, 2));
      const msg = settlementError.message?.toLowerCase() ?? "";
      if (msg.includes("salary_settlements") || msg.includes("does not exist")) {
        setSetupWarning(
          "Para registrar pagos completos ejecuta el script `database/add_salary_settlements.sql` en Supabase."
        );
        setErrorMsg(
          "No pudimos registrar el pago porque falta la tabla de liquidaciones. Ejecuta el script indicado y vuelve a intentarlo."
        );
      } else if (msg.includes("row-level security") || msg.includes("policy")) {
        setErrorMsg(
          `Error de seguridad: ${settlementError.message}. Verifica que tengas permisos de administrador para registrar liquidaciones.`
        );
        console.error("Problema con las políticas RLS. Verifica las políticas de inserción en Supabase.");
      } else {
        setErrorMsg(`No pudimos registrar el pago: ${settlementError.message}. Verifica la consola para más detalles.`);
      }
      return;
    }

    if (!insertedData || insertedData.length === 0) {
      console.error("No se recibieron datos de confirmación de la inserción");
      setErrorMsg("❌ ERROR CRÍTICO: La liquidación no se pudo confirmar. NO se guardó. Por favor, intenta nuevamente.");
      // Intentar verificar si se guardó de todas formas consultando la BD
      try {
        const { data: verification, error: verifyError } = await supabase
          .from("salary_settlements")
          .select("id, amount, created_at")
          .eq("technician_id", technicianId)
          .eq("week_start", weekStartISO)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (verification && !verifyError) {
          console.warn("Aunque no se recibió confirmación, se encontró una liquidación en la BD:", verification);
          setSuccessMsg(`⚠️ Liquidación posiblemente guardada (ID: ${verification.id}). Verifica en el historial.`);
        } else {
          setErrorMsg("❌ ERROR: La liquidación NO se guardó. Verifica los logs en la consola e intenta nuevamente.");
        }
      } catch (verifyErr) {
        console.error("Error al verificar liquidación:", verifyErr);
        setErrorMsg("❌ ERROR: No se pudo confirmar si la liquidación se guardó. Verifica en el historial o intenta nuevamente.");
      }
      return;
    }

    // VERIFICACIÓN ADICIONAL: Confirmar que realmente se guardó consultando la BD
    const savedSettlementId = insertedData[0].id;
    console.log("Liquidación insertada, verificando en BD... ID:", savedSettlementId);
    
    try {
      const { data: verification, error: verifyError } = await supabase
        .from("salary_settlements")
        .select("id, amount, created_at, technician_id, week_start")
        .eq("id", savedSettlementId)
        .maybeSingle();
      
      if (verifyError || !verification) {
        console.error("❌ ERROR: La liquidación se insertó pero NO se pudo verificar:", verifyError);
        setErrorMsg(`⚠️ ADVERTENCIA: La liquidación fue insertada (ID: ${savedSettlementId}) pero no se pudo verificar. Por favor, verifica en el historial si aparece correctamente.`);
        // Continuar de todas formas ya que la inserción fue exitosa
      } else {
        console.log("✅ VERIFICACIÓN EXITOSA: La liquidación se guardó correctamente:", verification);
      }
    } catch (verifyErr) {
      console.error("Error en verificación adicional:", verifyErr);
      // Continuar de todas formas
    }

    // Limpiar abonos de préstamos después de guardar
    setLoanPayments({});

    setSuccessMsg(`✅ Liquidación registrada correctamente. ID: ${savedSettlementId} | Monto: ${formatCLP(targetAmount)} | Técnico: ${technicianName || technicianId}`);
    setPaymentMethod(""); // Resetear a "Seleccionar" después de registrar
    setCashAmount(0);
    setTransferAmount(0);
    await loadPendingAdjustments();
    if (onAfterSettlement) {
      onAfterSettlement();
    }
    
    // Disparar evento para actualizar el historial
    window.dispatchEvent(new CustomEvent('settlementCreated'));
    
    // Alert visual adicional para asegurar que el usuario vea el mensaje
    setTimeout(() => {
      alert(`✅ LIQUIDACIÓN GUARDADA\n\nID: ${savedSettlementId}\nMonto: ${formatCLP(targetAmount)}\nTécnico: ${technicianName || technicianId}\n\nPuedes verificar en el historial de liquidaciones.`);
    }, 500);
  }

  const noAdjustments = pendingAdjustments.length === 0;
  const settlementInfo = (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-500">Total ganado</p>
          <p className="text-lg font-semibold text-emerald-600">${formatAmount(baseAmount)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-500">
            {selectedAdjustmentsTotal > 0 ? "Descuentos seleccionados" : "Descuentos disponibles"}
          </p>
          <p className="text-lg font-semibold text-slate-700">
            {selectedAdjustmentsTotal > 0 ? `-${formatAmount(selectedAdjustmentsTotal)}` : `$${formatAmount(totalAdjustable)}`}
          </p>
          {selectedAdjustmentsTotal === 0 && totalAdjustable > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              ↓ Selecciona adelantos abajo para descontar
            </p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-500">Devoluciones</p>
          <p className="text-xs text-slate-400 mb-1">
            {returnedOrders.length} {returnedOrders.length === 1 ? 'orden' : 'órdenes'}
          </p>
          <p className="text-lg font-semibold text-sky-600">${formatAmount(returnsTotal)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <p className="text-xs text-slate-500">
            {hasDraftPayment ? "Saldo pendiente tras este pago" : (selectedAdjustmentsTotal > 0 ? "Total a liquidar" : "Total pendiente")}
          </p>
          <p className="text-lg font-semibold text-brand">${formatAmount(pendingToDisplay)}</p>
          {selectedAdjustmentsTotal === 0 && totalAdjustable > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Selecciona adelantos abajo para ver el total con descuentos
            </p>
          )}
        </div>
      </div>
      {deferredHoldback > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm flex flex-col gap-1">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Pendiente próxima semana
          </p>
          <p className="text-lg font-semibold text-amber-700">
            ${formatAmount(deferredHoldback)}
          </p>
          <p className="text-xs text-amber-700">
            No se pagará esta semana y quedará pendiente para la próxima liquidación.
          </p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="border border-slate-200 rounded-md p-4 text-sm text-slate-500">
        Cargando liquidación...
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50">
      {setupWarning && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          {setupWarning}
        </div>
      )}
      <div>
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            💡 Guía de Pago al Técnico
            {technicianName && <span className="text-xs text-blue-600">• {technicianName}</span>}
          </h5>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>Paso 1:</strong> Revisa el "Total a liquidar" (ganancias menos descuentos)</p>
            <p><strong>Paso 2:</strong> Si el técnico tiene adelantos pendientes, selecciona cuáles descontar</p>
            <p><strong>Paso 3:</strong> Puedes descontar el adelanto completo o solo una parte (pago parcial)</p>
            <p><strong>Paso 4:</strong> Selecciona el medio de pago y confirma el monto final</p>
          </div>
        </div>
        
        <h5 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
          💵 Realizar Pago al Técnico
          {technicianName && <span className="text-xs text-slate-500">• {technicianName}</span>}
        </h5>
        <p className="text-xs text-slate-500 mb-3">
          Este es el pago final que recibirá el técnico. Si tiene adelantos, puedes descontarlos aquí.
        </p>
        
        {/* Selector de tipo de ajuste */}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-500 flex items-center gap-2">
              Medio de pago: <span className="text-red-500">*</span>
              <select
                className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                value={paymentMethod}
                onChange={(e) => {
                  const newMethod = e.target.value as "efectivo" | "transferencia" | "efectivo/transferencia" | "";
                  setPaymentMethod(newMethod);
                  if (newMethod === "" || newMethod === "efectivo" || newMethod === "transferencia") {
                    setCashAmount(0);
                    setTransferAmount(0);
                    // Si cambia a efectivo o transferencia, resetear el monto
                    if (newMethod !== "") {
                      setCustomAmountInput(netRemaining);
                    } else {
                      setCustomAmountInput(0);
                    }
                  } else if (newMethod === "efectivo/transferencia") {
                    // Si cambia a mixto, resetear ambos montos
                    setCashAmount(0);
                    setTransferAmount(0);
                    setCustomAmountInput(0);
                  }
                }}
                required
              >
                <option value="">Seleccionar</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo/transferencia">Efectivo/Transferencia</option>
              </select>
            </label>
            {paymentMethod === "efectivo" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 flex flex-col gap-1">
                  Monto en Efectivo:
                  <input
                    type="text"
                    inputMode="numeric"
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm w-32"
                    value={formatCLPInput(Math.max(0, customAmountInput))}
                    disabled={netRemaining <= 0 || selectedAdjustmentsTotal > 0}
                    onChange={(e) => {
                      // Si hay ajustes seleccionados, no permitir modificar manualmente
                      if (selectedAdjustmentsTotal > 0) {
                        return;
                      }
                      const parsed = parseCLPInput(e.target.value);
                      const maxAmount = Math.max(0, netRemaining);
                      const clamped = Math.max(0, Math.min(parsed, maxAmount));
                      setCustomAmountInput(clamped);
                    }}
                  />
                </label>
                {selectedAdjustmentsTotal > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    💡 El monto se calcula automáticamente después de descontar los ajustes seleccionados
                  </p>
                )}
                {customAmountInput > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-600 font-medium">
                      A pagar: {formatCLP(customAmountInput)}
                    </p>
                    {remainingBalance > 0 && (
                      <p className="text-xs text-amber-600 font-semibold">
                        Saldo restante: {formatCLP(remainingBalance)}
                      </p>
                    )}
                    {remainingBalance === 0 && (
                      <p className="text-xs text-emerald-600">
                        ✓ Liquidación completa
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {paymentMethod === "transferencia" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 flex flex-col gap-1">
                  Monto en Transferencia:
                  <input
                    type="text"
                    inputMode="numeric"
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm w-32"
                    value={formatCLPInput(Math.max(0, customAmountInput))}
                    disabled={netRemaining <= 0 || selectedAdjustmentsTotal > 0}
                    onChange={(e) => {
                      // Si hay ajustes seleccionados, no permitir modificar manualmente
                      if (selectedAdjustmentsTotal > 0) {
                        return;
                      }
                      const parsed = parseCLPInput(e.target.value);
                      const maxAmount = Math.max(0, netRemaining);
                      const clamped = Math.max(0, Math.min(parsed, maxAmount));
                      setCustomAmountInput(clamped);
                    }}
                  />
                </label>
                {selectedAdjustmentsTotal > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    💡 El monto se calcula automáticamente después de descontar los ajustes seleccionados
                  </p>
                )}
                {customAmountInput > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-600 font-medium">
                      A pagar: {formatCLP(customAmountInput)}
                    </p>
                    {remainingBalance > 0 && (
                      <p className="text-xs text-amber-600 font-semibold">
                        Saldo restante: {formatCLP(remainingBalance)}
                      </p>
                    )}
                    {remainingBalance === 0 && (
                      <p className="text-xs text-emerald-600">
                        ✓ Liquidación completa
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {paymentMethod === "efectivo/transferencia" && (
              <div className="flex gap-3 items-end">
                <label className="text-xs text-slate-500 flex flex-col gap-1">
                  Monto en Efectivo:
                  <input
                    type="text"
                    inputMode="numeric"
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm w-32"
                    value={formatCLPInput(Math.max(0, cashAmount))}
                    onChange={(e) => {
                      const parsed = parseCLPInput(e.target.value);
                      const cash = Math.max(0, parsed);
                      const maxNetRemaining = Math.max(0, netRemaining);
                      // Si hay ajustes seleccionados, el total está fijo, solo ajustar proporción
                      if (selectedAdjustmentsTotal > 0) {
                        const totalFixed = Math.max(0, grossAvailable - selectedAdjustmentsTotal - loanPaymentsTotal);
                        const maxCash = Math.max(0, Math.min(cash, totalFixed));
                        setCashAmount(maxCash);
                        const remaining = Math.max(0, totalFixed - maxCash);
                        setTransferAmount(remaining);
                        setCustomAmountInput(totalFixed);
                      } else {
                        // Sin ajustes, comportamiento normal
                        const maxCash = Math.max(0, Math.min(cash, maxNetRemaining));
                        setCashAmount(maxCash);
                        const remaining = Math.max(0, maxNetRemaining - maxCash);
                        const adjustedTransfer = Math.min(Math.max(0, transferAmount), remaining);
                        setTransferAmount(adjustedTransfer);
                        setCustomAmountInput(Math.max(0, maxCash + adjustedTransfer));
                      }
                    }}
                  />
                  {cashAmount > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Restante: {formatCLP(Math.max(0, netRemaining - cashAmount))}
                    </p>
                  )}
                </label>
                <label className="text-xs text-slate-500 flex flex-col gap-1">
                  Monto en Transferencia:
                  <input
                    type="text"
                    inputMode="numeric"
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm w-32"
                    value={formatCLPInput(Math.max(0, transferAmount))}
                    disabled={netRemaining <= 0}
                    onChange={(e) => {
                      const parsed = parseCLPInput(e.target.value);
                      const transfer = Math.max(0, parsed);
                      const maxNetRemaining = Math.max(0, netRemaining);
                      // Si hay ajustes seleccionados, el total está fijo, solo ajustar proporción
                      if (selectedAdjustmentsTotal > 0) {
                        const totalFixed = Math.max(0, grossAvailable - selectedAdjustmentsTotal - loanPaymentsTotal);
                        const maxTransfer = Math.max(0, totalFixed - Math.max(0, cashAmount));
                        const adjustedTransfer = Math.max(0, Math.min(transfer, maxTransfer));
                        setTransferAmount(adjustedTransfer);
                        const remainingCash = Math.max(0, totalFixed - adjustedTransfer);
                        setCashAmount(remainingCash);
                        setCustomAmountInput(totalFixed);
                      } else {
                        // Sin ajustes, comportamiento normal
                        const maxCash = Math.max(0, cashAmount);
                        const maxTransfer = Math.max(0, maxNetRemaining - maxCash);
                        const adjustedTransfer = Math.max(0, Math.min(transfer, maxTransfer));
                        setTransferAmount(adjustedTransfer);
                        setCustomAmountInput(Math.max(0, maxCash + adjustedTransfer));
                      }
                    }}
                  />
                </label>
                <div className="text-xs text-slate-600 pb-1 flex flex-col">
                  <span className="font-semibold text-emerald-600">
                    A pagar: {formatCLP(cashAmount + transferAmount)}
                  </span>
                  {remainingBalance > 0 && (
                    <span className="text-amber-600 font-semibold mt-1">
                      Saldo restante: {formatCLP(remainingBalance)}
                    </span>
                  )}
                  {remainingBalance === 0 && cashAmount + transferAmount > 0 && (
                    <span className="text-emerald-600 mt-1">
                      ✓ Liquidación completa
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {settlementInfo}

      {/* Mostrar resumen del pago y saldo restante */}
      {((paymentMethod === "efectivo" && customAmountInput > 0) ||
        (paymentMethod === "transferencia" && customAmountInput > 0) ||
        (paymentMethod === "efectivo/transferencia" && (cashAmount + transferAmount) > 0)) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Resumen del pago:</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Monto a pagar:</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatCLP(paymentMethod === "efectivo/transferencia" ? cashAmount + transferAmount : customAmountInput)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Saldo restante:</p>
              <p className={`text-lg font-semibold ${remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatCLP(remainingBalance)}
              </p>
            </div>
          </div>
          {remainingBalance > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-amber-700">
                ⚠️ El saldo restante de {formatCLP(remainingBalance)} quedará pendiente para la próxima liquidación.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mostrar TODOS los ajustes, separando pendientes de saldados */}
        <div className="space-y-3">
        {/* DEBUG: Mostrar información de ajustes cargados */}
        {process.env.NODE_ENV === 'development' && pendingAdjustments.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs">
            <p className="font-semibold">🔍 DEBUG: Total ajustes cargados: {pendingAdjustments.length}</p>
            <p>Pendientes (remaining &gt; 0): {pendingAdjustments.filter(adj => adj.remaining > 0).length}</p>
            <p>Saldados (remaining = 0): {pendingAdjustments.filter(adj => adj.remaining <= 0).length}</p>
            <p>Disponibles esta semana: {pendingAdjustments.filter(adj => adj.isAvailableThisWeek).length}</p>
            {pendingAdjustments.filter(adj => adj.amount === 100000 && adj.type === 'advance').length > 0 && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                <p className="text-red-800 font-bold">
                  ⚠️ ADELANTO DE 100,000 ENCONTRADO:
                </p>
                {pendingAdjustments.filter(adj => adj.amount === 100000 && adj.type === 'advance').map(adj => (
                  <div key={adj.id} className="text-red-700 mt-1">
                    ID: {adj.id.slice(0, 8)}... | 
                    Monto: {formatAmount(adj.amount)} | 
                    Aplicado: {formatAmount(adj.appliedTotal)} | 
                    Restante: {formatAmount(adj.remaining)} | 
                    Disponible: {adj.isAvailableThisWeek ? 'Sí' : 'No'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Ajustes pendientes (remaining > 0, excluir préstamos y ajustes saldados) */}
        {pendingAdjustments.filter(adj => adj.remaining > 0 && adj.isAvailableThisWeek && adj.type !== 'loan').length > 0 && (
          <>
          <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Adelantos y Descuentos Pendientes ({pendingAdjustments.filter(a => a.remaining > 0 && a.isAvailableThisWeek && a.type !== 'loan').length})
            </span>
              <span className="text-sm text-slate-600 font-medium">
                Total a descontar: <span className="text-red-600">{formatAmount(selectedAdjustmentsTotal)}</span>
            </span>
          </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <p className="text-xs text-blue-800">
                💡 <strong>Instrucciones:</strong> Marca los adelantos que quieres descontar y ajusta el monto si es necesario. 
                Puedes descontar el monto completo o solo una parte.
              </p>
            </div>

          <div className="space-y-2">
              {pendingAdjustments
                .filter(adj => adj.remaining > 0 && adj.isAvailableThisWeek && adj.type !== 'loan')
                .map((adj) => {
                const selection = selectedAdjustments[adj.id] || { selected: false, amount: adj.remaining };
                const isSelected = selection.selected;
                const amountToDeduct = isSelected ? selection.amount : 0;
                
              return (
                <div
                  key={adj.id}
                    className={`bg-white border-2 rounded-lg p-4 transition-all ${
                      isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox para seleccionar */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAdjustmentSelection(adj.id)}
                          className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Información del ajuste */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                      <span
                            className={`font-semibold text-sm ${
                          adj.type === "advance" ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                            {adj.type === "advance" ? "💰 Adelanto" : "📉 Descuento"}
                      </span>
                          {adj.note && (
                            <span className="text-xs text-slate-500">• {adj.note}</span>
                    )}
                  </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                          <div>
                            <span className="text-slate-500">Monto original:</span>{" "}
                            <span className="font-semibold">{formatAmount(adj.amount)}</span>
                    </div>
                          <div>
                            <span className="text-slate-500">Pendiente:</span>{" "}
                            <span className="font-semibold text-slate-900">{formatAmount(adj.remaining)}</span>
                          </div>
                        </div>
                        
                        {/* Campo para editar monto a descontar */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Monto a descontar (puede ser parcial):
                            </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCLPInput(amountToDeduct)}
                          onChange={(e) => {
                            const parsed = parseCLPInput(e.target.value);
                            const clamped = Math.max(0, Math.min(parsed, adj.remaining));
                            handleAdjustmentAmountChange(adj.id, clamped.toString());
                          }}
                          className="w-32 border border-slate-300 rounded-md px-3 py-2 text-sm font-medium"
                          placeholder="0"
                        />
                              <span className="text-xs text-slate-500">
                                de {formatAmount(adj.remaining)} disponible
                              </span>
                            </div>
                            {amountToDeduct < adj.remaining && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Se descontarán {formatAmount(amountToDeduct)}. 
                                Quedarán {formatAmount(adj.remaining - amountToDeduct)} pendientes para la próxima semana.
                              </p>
                            )}
                            {amountToDeduct === adj.remaining && (
                              <p className="text-xs text-emerald-600 mt-1">
                                ✅ Se descontará el monto completo. No quedará pendiente.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botón eliminar (solo admin) */}
                      {canEditAdjustments && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          disabled={deletingAdjustmentId === adj.id}
                          className="flex-shrink-0 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Eliminar ajuste"
                        >
                          {deletingAdjustmentId === adj.id ? "..." : "🗑️"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Ajustes completamente saldados (remaining = 0) - solo para ver/eliminar */}
        {/* Ajustes Saldados - Ocultar en modal, solo aparecen en historial */}
        {false && pendingAdjustments.filter(adj => adj.remaining <= 0).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Ajustes Saldados ({pendingAdjustments.filter(adj => adj.remaining <= 0).length})
              </p>
              <p className="text-xs text-slate-400">
                Estos ajustes ya fueron completamente aplicados (ver historial)
              </p>
            </div>
            <div className="space-y-2">
              {pendingAdjustments
                .filter(adj => adj.remaining <= 0 && adj.type !== 'loan')
                .map((adj) => (
                  <div
                    key={adj.id}
                    className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`font-semibold ${
                            adj.type === "advance" ? "text-blue-600" : "text-red-600"
                          }`}
                        >
                          {adj.type === "advance" ? "💰 Adelanto" : "📉 Descuento"}
                        </span>
                        {adj.note && (
                          <span className="text-xs text-slate-500">• {adj.note}</span>
                        )}
                        <span className="text-xs text-emerald-600 font-medium">✅ Saldado</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Monto original: {formatAmount(adj.amount)} • 
                        Aplicado: {formatAmount(adj.appliedTotal)} • 
                        Restante: {formatAmount(adj.remaining)}
                      </div>
                    </div>
                    {canEditAdjustments && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          disabled={deletingAdjustmentId === adj.id}
                        className="flex-shrink-0 ml-3 px-3 py-1 text-xs font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar ajuste"
                        >
                        {deletingAdjustmentId === adj.id ? "Eliminando..." : "🗑️ Eliminar"}
                        </button>
                    )}
                      </div>
                ))}
            </div>
                      </div>
                    )}

        {/* Mostrar ajustes diferidos (no disponibles esta semana) */}
        {pendingAdjustments.filter(adj => !adj.isAvailableThisWeek && adj.remaining > 0).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
              Ajustes pendientes para próximas semanas
            </p>
            <div className="space-y-2">
              {pendingAdjustments
                .filter(adj => !adj.isAvailableThisWeek && adj.remaining > 0)
                .map((adj) => (
                  <div
                    key={adj.id}
                    className="bg-amber-50 border border-amber-200 rounded-md p-2 text-xs text-amber-700"
                  >
                    <span className="font-semibold">
                      {adj.type === "advance" ? "Adelanto" : "Descuento"}
                    </span>
                    {" "}de {formatAmount(adj.remaining)} - Disponible desde {formatDate(adj.availableFromDate)}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Sección de Préstamos (pueden tener abonos que se descuentan del total pendiente) */}
        {loans.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                💰 Préstamos ({loans.length})
              </h4>
              <p className="text-xs text-purple-600">
                Puedes registrar abonos que se descontarán del total pendiente
              </p>
            </div>
            
            <div className="space-y-3">
              {loans.map((loan) => {
                const payment = loanPayments[loan.id];
                const paymentAmount = payment?.amount || 0;
                
                return (
                  <div key={loan.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-purple-700">💰 Préstamo</span>
                          {loan.note && (
                            <span className="text-xs text-purple-600">• {loan.note.split('\n')[0]}</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-purple-800 mb-1">
                          Saldo pendiente: {formatCLP(loan.amount)}
                        </div>
                        {paymentAmount > 0 && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            ✓ Abono registrado: {formatCLP(paymentAmount)} (se descontará del total)
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {canEditAdjustments && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs font-semibold text-purple-700 mb-2">Registrar Abono en esta Liquidación:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Monto del abono"
                            value={formatCLPInput(payment?.amount || 0)}
                            onChange={(e) => {
                              const parsed = parseCLPInput(e.target.value);
                              const amount = Math.max(0, Math.min(parsed, loan.amount));
                              setLoanPayments(prev => ({
                                ...prev,
                                [loan.id]: {
                                  amount,
                                  date: payment?.date || new Date().toISOString().slice(0, 10),
                                  note: payment?.note || ''
                                }
                              }));
                            }}
                            className="border border-purple-300 rounded px-2 py-1 text-xs"
                            min="0"
                            max={loan.amount}
                          />
                          <input
                            type="date"
                            value={payment?.date || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => {
                              setLoanPayments(prev => ({
                                ...prev,
                                [loan.id]: {
                                  amount: payment?.amount || 0,
                                  date: e.target.value,
                                  note: payment?.note || ''
                                }
                              }));
                            }}
                            className="border border-purple-300 rounded px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Nota (opcional)"
                            value={payment?.note || ''}
                            onChange={(e) => {
                              setLoanPayments(prev => ({
                                ...prev,
                                [loan.id]: {
                                  amount: payment?.amount || 0,
                                  date: payment?.date || new Date().toISOString().slice(0, 10),
                                  note: e.target.value
                                }
                              }));
                            }}
                            className="border border-purple-300 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        {paymentAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLoanPayments(prev => {
                                const next = { ...prev };
                                delete next[loan.id];
                                return next;
                              });
                            }}
                            className="mt-2 px-3 py-1 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                          >
                            ✖️ Eliminar abono
                          </button>
                        )}
                        <p className="text-xs text-purple-600 mt-2">
                          💡 Este abono se descontará del total pendiente y se registrará en el préstamo
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
            
            {loanPaymentsTotal > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-purple-700">Total de abonos de préstamos:</span>
                  <span className="text-sm font-bold text-purple-800">{formatCLP(loanPaymentsTotal)}</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Este monto se descontará del total pendiente junto con los adelantos seleccionados
                </p>
              </div>
            )}
        </div>
      )}

        {/* Mensaje si no hay ajustes */}
        {pendingAdjustments.filter(adj => adj.type !== 'loan').length === 0 && loans.length === 0 && (
          <div className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-md p-4">
            {netRemaining <= 0
              ? "No hay saldo pendiente. Todo está liquidado 🎉"
              : `No hay ajustes pendientes esta semana. Puedes registrar el pago completo de ${formatAmount(
                  netRemaining
                )} usando el botón.`}
          </div>
        )}
        
        {/* Mostrar Total Pendiente al final */}
        <div className="mt-4 pt-4 border-t-2 border-slate-300">
          {pendingToDisplay > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-50 rounded-md p-3">
                <span className="text-sm font-semibold text-slate-700">Estado del saldo (tras descuentos):</span>
                <span className="text-lg font-bold text-amber-600">{formatAmount(pendingToDisplay)}</span>
              </div>
              {hasDraftPayment && (
                <div className="flex justify-between items-center bg-sky-50 border border-sky-200 rounded-md p-3">
                  <span className="text-sm font-semibold text-sky-700">Pendiente si registras este pago:</span>
                  <span className="text-lg font-bold text-sky-700">{formatAmount(remainingBalance)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-md p-3">
              <span className="text-sm font-semibold text-slate-700">
                {hasDraftPayment ? "Total pendiente tras este pago:" : "Estado del Saldo:"}
              </span>
              <span className="text-lg font-bold text-amber-600">CLP $0</span>
            </div>
          )}
          {netRemaining <= 0 && grossAvailable < 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ El técnico ya recibió más de lo que ganó. Saldo negativo: {formatAmount(Math.abs(grossAvailable))}
              </p>
              <p className="text-xs text-red-600 mt-1">
                No se puede registrar un pago adicional. El monto a pagar es 0.
              </p>
            </div>
          )}
          {pendingToDisplay > 0 && (
            <div className="mt-2 space-y-1">
              {selectedAdjustmentsTotal === 0 && loanPaymentsTotal === 0 && totalAdjustable > 0 && (
                <p className="text-xs text-slate-500 text-center">
                  💡 Selecciona adelantos arriba o registra abonos de préstamos para descontar del total
                </p>
              )}
              {selectedAdjustmentsTotal > 0 && (
                <p className="text-xs text-emerald-600 text-center font-medium">
                  ✓ Descuentos de adelantos: {formatAmount(selectedAdjustmentsTotal)}
                </p>
              )}
              {loanPaymentsTotal > 0 && (
                <p className="text-xs text-purple-600 text-center font-medium">
                  ✓ Abonos de préstamos: {formatAmount(loanPaymentsTotal)}
                </p>
              )}
              {(selectedAdjustmentsTotal > 0 || loanPaymentsTotal > 0) && (
                <p className="text-xs text-slate-600 text-center">
                  Total descontado: {formatAmount(selectedAdjustmentsTotal + loanPaymentsTotal)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}
      {successMsg && <div className="text-xs text-emerald-600">{successMsg}</div>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => void loadPendingAdjustments()}
          className="px-4 py-2 text-xs border border-slate-300 rounded-md hover:bg-slate-100 transition"
          disabled={saving}
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => void handleLiquidation()}
          disabled={saving || !paymentMethod || (paymentMethod as string) === "" || (paymentMethod === "efectivo/transferencia" ? (cashAmount + transferAmount) <= 0 : customAmountInput <= 0)}
          className="px-4 py-2 text-xs font-semibold rounded-md text-white bg-brand-light hover:bg-white hover:text-brand border border-brand-light hover:border-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Registrar liquidación"}
        </button>
      </div>
    </div>
  );
}
