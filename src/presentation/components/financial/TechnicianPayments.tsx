"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { currentWeekRange, formatDate, getWeekRangeFromStart } from "@/lib/date";
import { formatCLP } from "@/lib/currency";
import type { Profile, SalaryAdjustment, Order, SalarySettlement, Role } from "@/types";
import SalarySettlementPanel from "./SalarySettlementPanel";
import WeeklyReport from "./WeeklyReport";
import WeeklySummary from "./WeeklySummary";
import OrdersTable from "./OrdersTable";

interface TechnicianPaymentsProps {
  refreshKey?: number;
  branchId?: string; // Opcional: filtrar por sucursal
  technicianIds?: string[]; // Opcional: lista de IDs de técnicos a mostrar
}

export default function TechnicianPayments({ refreshKey = 0, branchId, technicianIds }: TechnicianPaymentsProps) {
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [technicianOptions, setTechnicianOptions] = useState<Profile[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [adjustmentsByTech, setAdjustmentsByTech] = useState<Record<string, SalaryAdjustment[]>>({});
  const [returnsByTech, setReturnsByTech] = useState<Record<string, Order[]>>({});
  const [weeklyTotals, setWeeklyTotals] = useState<Record<string, number>>({});
  const [weeklyAdjustmentTotals, setWeeklyAdjustmentTotals] = useState<Record<string, number>>({});
  const [weeklyReturnsTotals, setWeeklyReturnsTotals] = useState<Record<string, number>>({});
  const [weeklyPendingTotals, setWeeklyPendingTotals] = useState<Record<string, number>>({});
  const [openSettlementPanels, setOpenSettlementPanels] = useState<Record<string, boolean>>({});
  const [deletingAdjustmentId, setDeletingAdjustmentId] = useState<string | null>(null);
  const [loadingDetailsByTech, setLoadingDetailsByTech] = useState<Record<string, boolean>>({});
  const [settlingAdjustmentsByTech, setSettlingAdjustmentsByTech] = useState<Record<string, boolean>>({});
  const [settlingReturnsByTech, setSettlingReturnsByTech] = useState<Record<string, boolean>>({});
  const [actionErrorsByTech, setActionErrorsByTech] = useState<Record<string, string | null>>({});
  const [deletingReturnId, setDeletingReturnId] = useState<string | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyResults, setHistoryResults] = useState<SalarySettlement[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{
    technicianId: string;
    paymentMethod: "all" | "efectivo" | "transferencia" | "efectivo/transferencia";
    startDate: string;
    endDate: string;
  }>({
    technicianId: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
  });
  const [historyAggregates, setHistoryAggregates] = useState<{
    efectivo: number;
    transferencia: number;
    efectivo_transferencia: number;
  }>({
    efectivo: 0,
    transferencia: 0,
    efectivo_transferencia: 0,
  });
  const [editingSettlementId, setEditingSettlementId] = useState<string | null>(null);
  const [editingSettlementAmount, setEditingSettlementAmount] = useState<string>("");
  const [editingSettlementNote, setEditingSettlementNote] = useState<string>("");
  const [savingSettlementEdit, setSavingSettlementEdit] = useState(false);
  const [deletingSettlementId, setDeletingSettlementId] = useState<string | null>(null);
  const [techModalOpen, setTechModalOpen] = useState<string | null>(null);
  const technicianNameMap = useMemo(
    () =>
      technicians.reduce<Record<string, string>>((acc, tech) => {
        acc[tech.id] = tech.name;
        return acc;
      }, {}),
    [technicians]
  );

  // Cargar técnicos adicionales que tengan liquidaciones pero que no estén en la lista principal
  const loadSettlementTechnicians = useCallback(async () => {
    // Obtener todos los IDs únicos de técnicos que tienen liquidaciones
    const { data: settlements } = await supabase
      .from("salary_settlements")
      .select("technician_id");
    
    if (settlements && settlements.length > 0) {
      const uniqueTechIds = [...new Set(settlements.map(s => s.technician_id))];
      // Obtener información de esos técnicos que no estén ya en la lista
      const missingTechIds = uniqueTechIds.filter(id => !technicianNameMap[id]);
      
      if (missingTechIds.length > 0) {
        const { data: missingTechs } = await supabase
          .from("users")
          .select("id, name")
          .in("id", missingTechIds);
        
        if (missingTechs && missingTechs.length > 0) {
          console.log("Técnicos adicionales encontrados en liquidaciones:", missingTechs);
          // Agregar estos técnicos al mapa si no están ya presentes
          setTechnicians(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newTechs = missingTechs.filter(t => !existingIds.has(t.id))
              .map(t => ({ ...t, role: "technician" as Role, email: "" }));
            return [...prev, ...newTechs];
          });
        }
      }
    }
  }, [technicianNameMap]);

  // Cargar técnicos adicionales cuando se carga el componente o cuando cambian las liquidaciones
  useEffect(() => {
    if (technicians.length > 0) {
      loadSettlementTechnicians();
    }
  }, [technicians.length, loadSettlementTechnicians]);

  const loadTechnicians = useCallback(async () => {
    let query = supabase
      .from("users")
      .select("*")
      .eq("role", "technician");
    
    // Filtrar por sucursal si se proporciona
    if (branchId) {
      query = query.eq("sucursal_id", branchId);
    }
    
    // Filtrar por lista de IDs si se proporciona
    if (technicianIds && technicianIds.length > 0) {
      query = query.in("id", technicianIds);
    }
    
    const { data } = await query.order("name");
    
    if (data) {
      setTechnicians(data);
      setTechnicianOptions(data);
      // Limpiar la selección si el técnico seleccionado ya no existe
      // No establecer fechas por defecto - dejar vacías para mostrar todas las liquidaciones
      setSelectedTech((currentSelected) => {
        if (currentSelected && !data.find((tech) => tech.id === currentSelected)) {
          return null;
        }
        return currentSelected;
      });
    }
  }, [branchId, technicianIds]);

  useEffect(() => {
    loadTechnicians();
  }, [refreshKey, loadTechnicians]);

  // Escuchar eventos de actualización de usuarios
  useEffect(() => {
    window.addEventListener('userCreated', loadTechnicians);
    window.addEventListener('userDeleted', loadTechnicians);
    window.addEventListener('userUpdated', loadTechnicians);

    return () => {
      window.removeEventListener('userCreated', loadTechnicians);
      window.removeEventListener('userDeleted', loadTechnicians);
      window.removeEventListener('userUpdated', loadTechnicians);
    };
  }, [loadTechnicians]);

  const loadWeeklyData = useCallback(async () => {
    if (technicians.length === 0) return;
      const totals: Record<string, number> = {};
      const adjustmentTotals: Record<string, number> = {};
      const returnsTotals: Record<string, number> = {};
      const pendingTotals: Record<string, number> = {};
      const { start } = currentWeekRange();
      const weekStartISO = start.toISOString().slice(0, 10);

      await Promise.all(
        technicians.map(async (tech) => {
        // IMPORTANTE:
        // El saldo no debe resetearse por cambio de semana.
        // Se calcula con TODO lo ganado/ajustado/liquidado históricamente.
        const ordersQuery = supabase
          .from("orders")
          .select("commission_amount")
          .eq("technician_id", tech.id)
          .eq("status", "paid");

        // Devoluciones/cancelaciones acumuladas (descuentan del saldo)
        const returnsQuery = supabase
          .from("orders")
          .select("commission_amount")
          .eq("technician_id", tech.id)
          .in("status", ["returned", "cancelled"]);

        // Consulta para ajustes - CORREGIDO: Cargar TODOS los ajustes y filtrar por remaining > 0
        // IMPORTANTE: Incluir aplicaciones para calcular el saldo restante correctamente
        // NO filtrar por fecha de creación, solo por saldo pendiente
        const adjustmentsQuery = supabase
          .from("salary_adjustments")
          .select("amount, available_from, created_at, id, type, note, applications:salary_adjustment_applications(applied_amount)")
          .eq("technician_id", tech.id);

        const [
          { data: paidOrders },
          { data: returnedData },
          { data: adjustmentsData, error: adjustmentsError },
          { data: weekSettlements },
        ] = await Promise.all([
          ordersQuery,
          returnsQuery,
          adjustmentsQuery.order("created_at", { ascending: false }),
          supabase
            .from("salary_settlements")
            .select("amount, details")
            .eq("technician_id", tech.id)
            .eq("week_start", weekStartISO),
        ]);

        // Si hay error al cargar aplicaciones, intentar sin aplicaciones (retrocompatibilidad)
        let adjustmentsWithApplications = adjustmentsData;
        if (adjustmentsError) {
          console.warn("No se pudieron cargar aplicaciones de ajustes, usando monto total:", adjustmentsError);
          // Intentar cargar sin aplicaciones
          const { data: adjustmentsWithoutApps } = await supabase
            .from("salary_adjustments")
            .select("amount, available_from, created_at, id, type, note")
            .eq("technician_id", tech.id);
          
          // Agregar aplicaciones vacías para mantener la estructura
          adjustmentsWithApplications = (adjustmentsWithoutApps || []).map((adj: any) => ({
            ...adj,
            applications: [] // Agregar aplicaciones vacías
          }));
        }

        totals[tech.id] = (paidOrders ?? []).reduce((s, o) => s + (o.commission_amount ?? 0), 0);
        
        // CORREGIDO: Calcular total de ajustes disponibles RESTANDO las aplicaciones ya hechas
        // Filtrar solo por remaining > 0, NO por fecha de creación
        const now = new Date();
        const adjustmentsForWeek = (adjustmentsWithApplications || [])
          .map((adj: any) => {
            // Calcular aplicaciones totales para este ajuste
            const applications = adj.applications || [];
            const appliedTotal = applications.reduce(
              (appSum: number, app: any) => appSum + (app.applied_amount || 0),
              0
            );
            // Restar aplicaciones del monto total para obtener el saldo restante
            const remaining = Math.max((adj.amount || 0) - appliedTotal, 0);
            return {
              ...adj,
              remaining,
              appliedTotal
            };
          })
          .filter((adj: any) => {
            // Solo incluir ajustes con saldo pendiente
            if (adj.remaining <= 0) return false;
            // Verificar disponibilidad por fecha
            const availableFrom = adj.available_from
              ? new Date(adj.available_from)
              : new Date(adj.created_at);
            return availableFrom <= now;
          })
          .reduce((sum: number, adj: any) => sum + adj.remaining, 0);

        adjustmentTotals[tech.id] = adjustmentsForWeek;
        returnsTotals[tech.id] =
          returnedData?.reduce((s, o) => s + (o.commission_amount ?? 0), 0) ?? 0;
        const weekSettled = (weekSettlements ?? []).reduce((sum: number, settlement: any) => {
          const adjustmentsTotal = settlement?.details?.selected_adjustments_total;
          const loanPaymentsTotal = settlement?.details?.loan_payments_total;
          const discountedAdjustments = typeof adjustmentsTotal === "number" ? adjustmentsTotal : 0;
          const loanPayments = typeof loanPaymentsTotal === "number" ? loanPaymentsTotal : 0;
          return sum + (settlement?.amount ?? 0) + discountedAdjustments + loanPayments;
        }, 0);
        // Debe coincidir con el KPI "Total pendiente" del detalle:
        // baseAmount (total ganado acumulado) - settledAmount (liquidado semana actual).
        pendingTotals[tech.id] = Math.max((totals[tech.id] ?? 0) - weekSettled, 0);
        })
      );

      setWeeklyTotals(totals);
      setWeeklyAdjustmentTotals(adjustmentTotals);
      setWeeklyReturnsTotals(returnsTotals);
      setWeeklyPendingTotals(pendingTotals);
  }, [technicians]);

  useEffect(() => {
    if (technicians.length > 0) {
      void loadWeeklyData();
    }
  }, [technicians, loadWeeklyData]);

  const loadAdjustmentsForTech = useCallback(
    async (techId: string | null, force = false) => {
      if (!techId) return;
      if (!force && adjustmentsByTech[techId] && returnsByTech[techId]) {
        return;
      }

      setActionErrorsByTech((prev) => ({ ...prev, [techId]: null }));
      setLoadingDetailsByTech((prev) => ({ ...prev, [techId]: true }));
      // No usar filtro de semana - cargar todos los ajustes y devoluciones pendientes
      // Los ajustes y devoluciones persisten hasta que se liquiden manualmente

      try {
        // Intentar cargar con aplicaciones primero
        let adjustmentsResponse = await supabase
          .from("salary_adjustments")
          .select("*, applications:salary_adjustment_applications(applied_amount)")
          .eq("technician_id", techId)
          .order("created_at", { ascending: false });

        // Si falla, cargar sin aplicaciones (retrocompatibilidad)
        if (adjustmentsResponse.error) {
          console.warn("No se pudieron cargar aplicaciones, usando monto total:", adjustmentsResponse.error);
          adjustmentsResponse = await supabase
            .from("salary_adjustments")
            .select("*")
            .eq("technician_id", techId)
            .order("created_at", { ascending: false });
        }

        const [{ data: returnedData, error: retError }] = await Promise.all([
          supabase
            .from("orders")
            .select("*")
            .eq("technician_id", techId)
            .in("status", ["returned", "cancelled"])
            // No filtrar por semana - cargar TODAS las devoluciones pendientes
            // Las devoluciones persisten hasta que se liquiden manualmente
            .order("created_at", { ascending: false }),
        ]);

        if (adjustmentsResponse.error || retError) {
          throw adjustmentsResponse.error || retError;
        }

        // Calcular saldo restante para cada ajuste restando las aplicaciones
        const adjustmentsWithRemaining = (adjustmentsResponse.data || []).map((adj: any) => {
          const applications = adj.applications || [];
          const appliedTotal = applications.reduce(
            (sum: number, app: any) => sum + (app.applied_amount || 0),
            0
          );
          const remaining = Math.max((adj.amount || 0) - appliedTotal, 0);
          
          // Solo incluir ajustes que aún tienen saldo pendiente
          return {
            ...adj,
            remaining,
            appliedTotal,
          };
        }).filter((adj: any) => adj.remaining > 0); // Solo mostrar ajustes con saldo pendiente

        setAdjustmentsByTech((prev) => ({
          ...prev,
          [techId]: adjustmentsWithRemaining as SalaryAdjustment[],
        }));
        setReturnsByTech((prev) => ({
          ...prev,
          [techId]: (returnedData as Order[]) ?? [],
        }));
      } catch (error) {
        console.error("Error cargando ajustes/devoluciones:", error);
        setActionErrorsByTech((prev) => ({
          ...prev,
          [techId]: "No pudimos cargar los ajustes. Intenta nuevamente.",
        }));
      } finally {
        setLoadingDetailsByTech((prev) => ({ ...prev, [techId]: false }));
      }
    },
    [adjustmentsByTech, returnsByTech]
  );

  const toggleSettlementPanel = useCallback(
    (techId: string) => {
      setOpenSettlementPanels((prev) => {
        const nextOpen = !prev[techId];
        if (nextOpen) {
          void loadAdjustmentsForTech(techId);
        }
        return {
          ...prev,
          [techId]: nextOpen,
        };
      });
    },
    [loadAdjustmentsForTech]
  );

  const fetchHistoryWithFilters = useCallback(
    async (filters: typeof historyFilters) => {
      setHistoryLoading(true);
      setHistoryError(null);
      // Intentar obtener la información del técnico mediante relación
      // Si la relación no existe, usaremos el technicianNameMap del frontend
      let query = supabase
        .from("salary_settlements")
        .select("*")
        .order("created_at", {
        ascending: false,
      });
      if (filters.technicianId !== "all") {
        query = query.eq("technician_id", filters.technicianId);
      }
      if (filters.paymentMethod !== "all") {
        query = query.eq("payment_method", filters.paymentMethod);
      }
      if (filters.startDate && filters.startDate.trim() !== "") {
        query = query.gte("created_at", `${filters.startDate}T00:00:00.000Z`);
      }
      if (filters.endDate && filters.endDate.trim() !== "") {
        query = query.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
      }

      // NO limitar resultados - mostrar TODAS las liquidaciones históricas
      const { data, error } = await query;

      if (error) {
        console.error("Error cargando historial de liquidaciones:", error);
        console.error("Detalles del error:", JSON.stringify(error, null, 2));
        setHistoryResults([]);
        setHistoryAggregates({ efectivo: 0, transferencia: 0, efectivo_transferencia: 0 });
        setHistoryError(`No pudimos cargar el historial: ${error.message}. Verifica la consola para más detalles.`);
      } else {
        const list = (data as SalarySettlement[]) ?? [];
        
        // Solo mostrar liquidaciones registradas (sin autogenerar pagos desde órdenes)
        const hasDateFilters = filters.startDate && filters.endDate && filters.startDate.trim() !== "" && filters.endDate.trim() !== "";
        let filteredList = list;
        if (hasDateFilters) {
          const filterStartDate = new Date(`${filters.startDate}T00:00:00.000Z`);
          const filterEndDate = new Date(`${filters.endDate}T23:59:59.999Z`);
          
          filteredList = list.filter(settlement => {
            if (!settlement.created_at) return false;
            const createdDate = new Date(settlement.created_at);
            return createdDate >= filterStartDate && createdDate <= filterEndDate;
          });
          
          console.log(`📝 Liquidaciones registradas filtradas: ${filteredList.length} de ${list.length}`);
        }
        
        const combinedList = [...filteredList].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Más recientes primero
        });
        
        console.log(`✅ Total liquidaciones a mostrar: ${combinedList.length}`);
        
        // Verificar si hay liquidaciones sin nombre de técnico
        const liquidacionesSinNombre = combinedList.filter(entry => !technicianNameMap[entry.technician_id]);
        if (liquidacionesSinNombre.length > 0) {
          console.warn("⚠️ Liquidaciones sin nombre de técnico encontradas:", liquidacionesSinNombre);
          console.warn("IDs de técnicos no encontrados:", liquidacionesSinNombre.map(e => e.technician_id));
        }
        
        setHistoryResults(combinedList);
        const aggregates = combinedList.reduce(
          (acc, entry) => {
            if (entry.payment_method === "transferencia") {
              acc.transferencia += entry.amount ?? 0;
            } else if (entry.payment_method === "efectivo") {
              acc.efectivo += entry.amount ?? 0;
            } else if (entry.payment_method === "efectivo/transferencia") {
              acc.efectivo_transferencia += entry.amount ?? 0;
              // También agregar a efectivo y transferencia si hay breakdown
              const breakdown = (entry.details as any)?.payment_breakdown;
              if (breakdown) {
                acc.efectivo += breakdown.efectivo ?? 0;
                acc.transferencia += breakdown.transferencia ?? 0;
              }
            }
            return acc;
          },
          { efectivo: 0, transferencia: 0, efectivo_transferencia: 0 }
        );
        setHistoryAggregates(aggregates);
      }
      setHistoryLoading(false);
    },
    [technicianNameMap]
  );

  const handleManualHistorySearch = useCallback(() => {
    setHistoryPanelOpen(true);
    void fetchHistoryWithFilters(historyFilters);
  }, [historyFilters, fetchHistoryWithFilters]);

  const handleResetHistoryFilters = useCallback(() => {
    // Limpiar filtros para mostrar todas las liquidaciones
    const next = {
      technicianId: "all",
      paymentMethod: "all" as const,
      startDate: "",
      endDate: "",
    };
    setHistoryFilters(next);
    setHistoryPanelOpen(true);
    void fetchHistoryWithFilters(next);
  }, [fetchHistoryWithFilters]);

  const handleOpenHistoryForTech = useCallback(
    (techId: string) => {
      const next = { ...historyFilters, technicianId: techId };
      setHistoryFilters(next);
      setHistoryPanelOpen(true);
      void fetchHistoryWithFilters(next);
    },
    [historyFilters, fetchHistoryWithFilters]
  );

  const toggleHistoryPanel = useCallback(() => {
    setHistoryPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        // Siempre buscar todas las liquidaciones cuando se abre el panel (sin filtros de fecha)
        const filtersToUse = { 
          technicianId: "all", 
          paymentMethod: "all" as const, 
          startDate: "", 
          endDate: "" 
        };
        setHistoryFilters(filtersToUse);
        void fetchHistoryWithFilters(filtersToUse);
      }
      return next;
    });
  }, [fetchHistoryWithFilters]);

  // Escuchar eventos de creación de liquidaciones para actualizar el historial
  // Este useEffect debe estar después de la definición de fetchHistoryWithFilters
  useEffect(() => {
    const handleSettlementCreated = () => {
      console.log("Nueva liquidación creada, actualizando historial...");
      // Si el panel de historial está abierto, actualizar los resultados
      if (historyPanelOpen) {
        void fetchHistoryWithFilters(historyFilters);
      }
      // También recargar los datos semanales
      void loadWeeklyData();
    };

    window.addEventListener('settlementCreated', handleSettlementCreated);

    return () => {
      window.removeEventListener('settlementCreated', handleSettlementCreated);
    };
  }, [historyPanelOpen, historyFilters, fetchHistoryWithFilters, loadWeeklyData]);

  useEffect(() => {
    if (selectedTech) {
      void loadAdjustmentsForTech(selectedTech);
    }
  }, [selectedTech, loadAdjustmentsForTech]);

  const startEditingSettlement = useCallback((entry: SalarySettlement) => {
    setEditingSettlementId(entry.id);
    setEditingSettlementAmount(String(Math.max(0, entry.amount ?? 0)));
    setEditingSettlementNote(entry.note ?? "");
    setHistoryError(null);
  }, []);

  const cancelEditingSettlement = useCallback(() => {
    setEditingSettlementId(null);
    setEditingSettlementAmount("");
    setEditingSettlementNote("");
  }, []);

  const handleSaveSettlementEdit = useCallback(
    async (entry: SalarySettlement) => {
      const parsedAmount = Number(editingSettlementAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setHistoryError("El monto editado debe ser mayor a 0.");
        return;
      }

      setSavingSettlementEdit(true);
      setHistoryError(null);

      const { error } = await supabase
        .from("salary_settlements")
        .update({
          amount: Math.round(parsedAmount),
          note: editingSettlementNote.trim() || null,
        })
        .eq("id", entry.id)
        .eq("technician_id", entry.technician_id);

      setSavingSettlementEdit(false);

      if (error) {
        console.error("Error editando liquidación:", error);
        setHistoryError(`No pudimos editar el pago: ${error.message}`);
        return;
      }

      cancelEditingSettlement();
      await fetchHistoryWithFilters(historyFilters);
      await loadWeeklyData();
    },
    [editingSettlementAmount, editingSettlementNote, cancelEditingSettlement, fetchHistoryWithFilters, historyFilters, loadWeeklyData]
  );

  const handleDeleteSettlement = useCallback(
    async (entry: SalarySettlement) => {
      const confirmed = window.confirm(
        `¿Eliminar este pago por ${formatCLP(entry.amount)} del historial? Esta acción no se puede deshacer.`
      );
      if (!confirmed) return;

      setDeletingSettlementId(entry.id);
      setHistoryError(null);

      const { error } = await supabase
        .from("salary_settlements")
        .delete()
        .eq("id", entry.id)
        .eq("technician_id", entry.technician_id);

      setDeletingSettlementId(null);

      if (error) {
        console.error("Error eliminando liquidación:", error);
        setHistoryError(`No pudimos eliminar el pago: ${error.message}`);
        return;
      }

      if (editingSettlementId === entry.id) {
        cancelEditingSettlement();
      }
      await fetchHistoryWithFilters(historyFilters);
      await loadWeeklyData();
    },
    [cancelEditingSettlement, editingSettlementId, fetchHistoryWithFilters, historyFilters, loadWeeklyData]
  );

  const handleDeleteAdjustment = useCallback(
    async (techId: string, adjustmentId: string) => {
      const techAdjustments = adjustmentsByTech[techId] ?? [];
      const target = techAdjustments.find((adj) => adj.id === adjustmentId);
      if (!target) return;

      const confirmed = window.confirm("¿Eliminar este ajuste de sueldo?");
      if (!confirmed) return;

      setActionErrorsByTech((prev) => ({ ...prev, [techId]: null }));
      setDeletingAdjustmentId(adjustmentId);
      const { error } = await supabase
        .from("salary_adjustments")
        .delete()
        .eq("id", adjustmentId)
        .eq("technician_id", techId);
      setDeletingAdjustmentId(null);

      if (error) {
        console.error("Error eliminando ajuste:", error);
        setActionErrorsByTech((prev) => ({
          ...prev,
          [techId]: "No pudimos eliminar el ajuste. Intenta nuevamente.",
        }));
        return;
      }

      setAdjustmentsByTech((prev) => ({
        ...prev,
        [techId]: techAdjustments.filter((adj) => adj.id !== adjustmentId),
      }));
      setWeeklyAdjustmentTotals((prev) => {
        const next = { ...prev };
        next[techId] = Math.max((next[techId] ?? 0) - (target.amount ?? 0), 0);
        return next;
      });
      void loadWeeklyData();
    },
    [adjustmentsByTech, loadWeeklyData]
  );

  const handleSettleAdjustments = useCallback(
    async (techId: string) => {
      const techAdjustments = adjustmentsByTech[techId] ?? [];
      if (techAdjustments.length === 0) return;

      const confirmed = window.confirm("¿Seguro que quieres saldar todos los ajustes de esta semana?");
      if (!confirmed) return;

      setActionErrorsByTech((prev) => ({ ...prev, [techId]: null }));
      setSettlingAdjustmentsByTech((prev) => ({ ...prev, [techId]: true }));
      const { start, end } = currentWeekRange();

      const { error } = await supabase
        .from("salary_adjustments")
        .delete()
        .eq("technician_id", techId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      setSettlingAdjustmentsByTech((prev) => ({ ...prev, [techId]: false }));

      if (error) {
        console.error("Error al saldar ajustes:", error);
        setActionErrorsByTech((prev) => ({
          ...prev,
          [techId]: "No pudimos saldar los ajustes. Intenta nuevamente.",
        }));
        return;
      }

      setAdjustmentsByTech((prev) => ({ ...prev, [techId]: [] }));
      setWeeklyAdjustmentTotals((prev) => ({ ...prev, [techId]: 0 }));
      void loadWeeklyData();
    },
    [adjustmentsByTech, loadWeeklyData]
  );

  const handleDeleteReturn = useCallback(
    async (techId: string, orderId: string) => {
      const techReturns = returnsByTech[techId] ?? [];
      const target = techReturns.find((order) => order.id === orderId);
      if (!target) return;

      const confirmed = window.confirm("¿Eliminar esta devolución/cancelación del historial?");
      if (!confirmed) return;

      setActionErrorsByTech((prev) => ({ ...prev, [techId]: null }));
      setDeletingReturnId(orderId);
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .eq("technician_id", techId)
        .in("status", ["returned", "cancelled"]);
      setDeletingReturnId(null);

      if (error) {
        console.error("Error eliminando devolución:", error);
        setActionErrorsByTech((prev) => ({
          ...prev,
          [techId]: "No pudimos eliminar la devolución. Intenta nuevamente.",
        }));
        return;
      }

      setReturnsByTech((prev) => ({
        ...prev,
        [techId]: techReturns.filter((order) => order.id !== orderId),
      }));
      setWeeklyReturnsTotals((prev) => {
        const next = { ...prev };
        next[techId] = Math.max((next[techId] ?? 0) - (target.commission_amount ?? 0), 0);
        return next;
      });
      void loadWeeklyData();
    },
    [returnsByTech, loadWeeklyData]
  );

  const handleSettleReturns = useCallback(
    async (techId: string) => {
      const techReturns = returnsByTech[techId] ?? [];
      if (techReturns.length === 0) return;

      const confirmed = window.confirm(
        "¿Seguro que quieres eliminar todas las devoluciones/cancelaciones de esta semana?"
      );
      if (!confirmed) return;

      setActionErrorsByTech((prev) => ({ ...prev, [techId]: null }));
      setSettlingReturnsByTech((prev) => ({ ...prev, [techId]: true }));
      const { start, end } = currentWeekRange();

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("technician_id", techId)
        .in("status", ["returned", "cancelled"])
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      setSettlingReturnsByTech((prev) => ({ ...prev, [techId]: false }));

      if (error) {
        console.error("Error al eliminar devoluciones:", error);
        setActionErrorsByTech((prev) => ({
          ...prev,
          [techId]: "No pudimos eliminar las devoluciones. Intenta nuevamente.",
        }));
        return;
      }

      setReturnsByTech((prev) => ({ ...prev, [techId]: [] }));
      setWeeklyReturnsTotals((prev) => ({ ...prev, [techId]: 0 }));
      void loadWeeklyData();
    },
    [returnsByTech, loadWeeklyData]
  );

  return (
    <div className="p-6 bg-white">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Historial y filtros de liquidaciones</p>
            <p className="text-xs text-slate-500">Busca pagos anteriores por técnico, medio de pago o rango de fechas.</p>
          </div>
          <button
            type="button"
            onClick={toggleHistoryPanel}
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-white"
          >
            {historyPanelOpen ? "Ocultar historial" : "Mostrar historial"}
          </button>
        </div>

        {historyPanelOpen && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Técnico</label>
                <select
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  value={historyFilters.technicianId}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({ ...prev, technicianId: e.target.value }))
                  }
                >
                  <option value="all">Todos</option>
                  {technicianOptions.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Medio de pago</label>
                <select
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  value={historyFilters.paymentMethod}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as "all" | "efectivo" | "transferencia" | "efectivo/transferencia",
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo/transferencia">Efectivo/Transferencia</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Desde</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  value={historyFilters.startDate}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Hasta</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  value={historyFilters.endDate}
                  onChange={(e) =>
                    setHistoryFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleManualHistorySearch}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-brand-light text-white hover:bg-brand/90"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleResetHistoryFilters}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-600 hover:bg-white"
              >
                Limpiar
              </button>
            </div>
            <div className="text-xs text-slate-500">
              <span className="mr-4">
                Efectivo:{" "}
                <span className="font-semibold text-emerald-600">{formatCLP(historyAggregates.efectivo)}</span>
              </span>
              <span className="mr-4">
                Transferencia:{" "}
                <span className="font-semibold text-sky-600">
                  {formatCLP(historyAggregates.transferencia)}
                </span>
              </span>
              <span>
                Mixto (Ef./Trans.):{" "}
                <span className="font-semibold text-purple-600">{formatCLP(historyAggregates.efectivo_transferencia)}</span>
              </span>
            </div>
            {historyError && <p className="text-xs text-red-600">{historyError}</p>}
            {historyLoading ? (
              <p className="text-sm text-slate-500">Cargando liquidaciones...</p>
            ) : historyResults.length === 0 ? (
              <div className="space-y-2">
              <p className="text-sm text-slate-500">No hay liquidaciones para los filtros seleccionados.</p>
                <p className="text-xs text-slate-400">Intenta limpiar los filtros de fecha para ver todas las liquidaciones históricas.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {historyResults.map((entry) => {
                  const paymentMethodLabel =
                    entry.payment_method === "transferencia"
                      ? "Transferencia"
                      : entry.payment_method === "efectivo"
                      ? "Efectivo"
                      : entry.payment_method === "efectivo/transferencia"
                      ? "Efectivo/Transferencia"
                      : "Sin dato";
                  // Si es pago mixto, mostrar los montos por separado
                  const paymentBreakdown = (entry.details as any)?.payment_breakdown;
                  const isMixedPayment = entry.payment_method === "efectivo/transferencia" && paymentBreakdown;
                  
                  return (
                    <div key={entry.id} className="bg-white border border-slate-200 rounded-md p-3 text-sm">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {technicianNameMap[entry.technician_id] || `Técnico (${entry.technician_id.slice(0, 8)}...)`}
                          </p>
                          <div className="text-xs text-slate-500 space-y-1">
                            {entry.created_at && (
                              <p className="font-medium text-slate-700">
                                📅 Fecha del pago: {formatDate(entry.created_at)} • {new Date(entry.created_at).toLocaleTimeString("es-CL", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            )}
                            {entry.week_start && (
                              <p>
                                📆 Período: {(() => {
                                  try {
                                    const weekRange = getWeekRangeFromStart(entry.week_start);
                                    return `${formatDate(weekRange.start)} al ${formatDate(weekRange.end)}`;
                                  } catch (e) {
                                    return `${formatDate(entry.week_start)}`;
                                  }
                                })()} • 💳 Medio: {paymentMethodLabel}
                              </p>
                            )}
                            {entry.note && (
                              <p className="text-slate-600">ℹ️ {entry.note}</p>
                            )}
                            {/* Desglose de pago mixto */}
                            {isMixedPayment && (
                              <p>
                                <span className="text-emerald-600">
                                  💵 Efectivo: {formatCLP(paymentBreakdown.efectivo || 0)}
                                </span>
                                {" • "}
                                <span className="text-sky-600">
                                  🏦 Transferencia: {formatCLP(paymentBreakdown.transferencia || 0)}
                                </span>
                              </p>
                            )}
                            
                            {/* Detalles adicionales del pago */}
                            {(entry.details as any)?.adjustments && Array.isArray((entry.details as any).adjustments) && (entry.details as any).adjustments.length > 0 && (
                              <p className="text-xs text-slate-400">
                                Ajustes aplicados: {(entry.details as any).adjustments.length}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-semibold text-brand">{formatCLP(entry.amount)}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                              onClick={() => startEditingSettlement(entry)}
                              disabled={savingSettlementEdit || deletingSettlementId === entry.id}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => void handleDeleteSettlement(entry)}
                              disabled={savingSettlementEdit || deletingSettlementId === entry.id}
                            >
                              {deletingSettlementId === entry.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </div>
                      </div>
                      {editingSettlementId === entry.id && (
                        <div className="mt-3 p-3 rounded-md border border-amber-200 bg-amber-50 space-y-2">
                          <p className="text-xs font-semibold text-amber-700">Editar pago</p>
                          <label className="text-xs text-slate-600 flex flex-col gap-1">
                            Monto
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                              value={editingSettlementAmount}
                              onChange={(e) => setEditingSettlementAmount(e.target.value)}
                            />
                          </label>
                          <label className="text-xs text-slate-600 flex flex-col gap-1">
                            Nota
                            <input
                              type="text"
                              className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                              value={editingSettlementNote}
                              onChange={(e) => setEditingSettlementNote(e.target.value)}
                              placeholder="Opcional"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs px-3 py-1.5 rounded bg-brand-light text-white hover:bg-brand/90"
                              onClick={() => void handleSaveSettlementEdit(entry)}
                              disabled={savingSettlementEdit}
                            >
                              {savingSettlementEdit ? "Guardando..." : "Guardar cambios"}
                            </button>
                            <button
                              type="button"
                              className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-white"
                              onClick={cancelEditingSettlement}
                              disabled={savingSettlementEdit}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {technicians.map((tech) => {
          const weeklyTotal = weeklyTotals[tech.id] ?? 0;
          const adjustmentTotal = weeklyAdjustmentTotals[tech.id] ?? 0;
          const returnsTotal = weeklyReturnsTotals[tech.id] ?? 0;
          // Saldo semanal disponible para liquidar (alineado con el cálculo semanal del detalle).
          const pendingToSettle = weeklyPendingTotals[tech.id] ?? 0;
          const isSelected = selectedTech === tech.id;
          const isSettlementOpen = openSettlementPanels[tech.id] ?? false;
          const cardAdjustments = adjustmentsByTech[tech.id] ?? [];
          const cardReturns = returnsByTech[tech.id] ?? [];
          const cardLoading = loadingDetailsByTech[tech.id] ?? false;
          const cardActionError = actionErrorsByTech[tech.id];
          const isSettlingAdj = settlingAdjustmentsByTech[tech.id] ?? false;
          const isSettlingRet = settlingReturnsByTech[tech.id] ?? false;

          return (
            <div
              key={tech.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => {
                setTechModalOpen(tech.id);
                setHistoryFilters((prev) => ({
                  ...prev,
                  technicianId: tech.id,
                }));
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-900">{tech.name}</div>
                  <div className="text-sm text-slate-600">
                    Total ganado acumulado (con recibo): {formatCLP(weeklyTotal)}
                    {returnsTotal > 0 && (
                      <span className="ml-2 text-xs text-red-600">
                        (Devoluciones: -{formatCLP(returnsTotal)})
                      </span>
                    )}
                    {adjustmentTotal > 0 && (
                      <span className="ml-2 text-xs text-slate-500">
                        (Descuentos pendientes: {formatCLP(adjustmentTotal)})
                      </span>
                    )}
                    <span className="ml-2 text-xs text-slate-500">
                      (Saldo disponible para liquidar: {formatCLP(pendingToSettle, { withLabel: true })})
                    </span>
                  </div>
                </div>
                <div className="text-2xl">▶</div>
              </div>

              {/* Sección expandible removida - usar el modal en su lugar (click en la tarjeta abre el modal) */}
            </div>
          );
        })}
      </div>

      {/* Modal de Vista del Técnico */}
      {techModalOpen && (() => {
        const tech = technicians.find(t => t.id === techModalOpen);
        if (!tech) return null;
        
        return (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setTechModalOpen(null)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{tech.name}</h2>
                  <p className="text-sm text-slate-500">Vista completa del técnico</p>
                </div>
                <button
                  onClick={() => setTechModalOpen(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* KPIs del Técnico */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen de la Semana</h3>
                  <WeeklySummary technicianId={tech.id} refreshKey={refreshKey} />
                </div>

                {/* Panel de Liquidación y Gestión de Préstamos */}
                <div>
                  <SalarySettlementPanel
                    technicianId={tech.id}
                    technicianName={tech.name}
                    baseAmount={weeklyTotals[tech.id] ?? 0}
                    adjustmentTotal={weeklyAdjustmentTotals[tech.id] ?? 0}
                    context="admin"
                    onAfterSettlement={() => {
                      void loadWeeklyData();
                      void loadAdjustmentsForTech(tech.id, true);
                      if (historyPanelOpen) {
                        void fetchHistoryWithFilters({
                          ...historyFilters,
                          technicianId: tech.id,
                        });
                      }
                    }}
                  />
                </div>

                {/* Historial de Pagos con Filtros */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Historial de Pagos</p>
                      <p className="text-xs text-slate-500">Filtra los pagos realizados a este técnico por rango de fechas</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleHistoryPanel}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-white"
                    >
                      {historyPanelOpen ? "Ocultar historial" : "Mostrar historial"}
                    </button>
                  </div>

                  {historyPanelOpen && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Desde</label>
                          <input
                            type="date"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            value={historyFilters.startDate}
                            onChange={(e) =>
                              setHistoryFilters((prev) => ({ ...prev, startDate: e.target.value, technicianId: tech.id }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 mb-1 block">Hasta</label>
                          <input
                            type="date"
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                            value={historyFilters.endDate}
                            onChange={(e) =>
                              setHistoryFilters((prev) => ({ ...prev, endDate: e.target.value, technicianId: tech.id }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryFilters((prev) => ({ ...prev, technicianId: tech.id }));
                            handleManualHistorySearch();
                          }}
                          className="px-4 py-2 text-xs font-semibold rounded-md bg-brand-light text-white hover:bg-brand/90"
                        >
                          Buscar Pagos
                        </button>
                        <button
                          type="button"
                          onClick={handleResetHistoryFilters}
                          className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-600 hover:bg-white"
                        >
                          Limpiar
                        </button>
                      </div>
                      {historyError && <p className="text-xs text-red-600">{historyError}</p>}
                      {historyLoading ? (
                        <p className="text-sm text-slate-500">Cargando pagos...</p>
                      ) : historyResults.length === 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">No hay pagos para los filtros seleccionados.</p>
                          <p className="text-xs text-slate-400">Intenta limpiar los filtros de fecha para ver todos los pagos.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {historyResults.map((entry) => {
                            const paymentMethodLabel =
                              entry.payment_method === "transferencia"
                                ? "Transferencia"
                                : entry.payment_method === "efectivo"
                                ? "Efectivo"
                                : entry.payment_method === "efectivo/transferencia"
                                ? "Efectivo/Transferencia"
                                : "Sin dato";
                            const paymentBreakdown = (entry.details as any)?.payment_breakdown;
                            const isMixedPayment = entry.payment_method === "efectivo/transferencia" && paymentBreakdown;
                            
                            return (
                              <div key={entry.id} className="bg-white border border-slate-200 rounded-md p-3 text-sm">
                                <div className="flex justify-between items-start gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-800 text-lg">
                                      {formatCLP(entry.amount)}
                                    </p>
                                    <div className="text-xs text-slate-500 space-y-1 mt-2">
                                      {entry.created_at && (
                                        <p className="font-medium text-slate-700">
                                          📅 Fecha del pago: {formatDate(entry.created_at)} • {new Date(entry.created_at).toLocaleTimeString("es-CL", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })}
                                        </p>
                                      )}
                                      {entry.week_start && (
                                        <p className="font-medium text-slate-700">
                                          📆 Período pagado: {(() => {
                                            try {
                                              const weekRange = getWeekRangeFromStart(entry.week_start);
                                              return `${formatDate(weekRange.start)} al ${formatDate(weekRange.end)}`;
                                            } catch (e) {
                                              return `${formatDate(entry.week_start)}`;
                                            }
                                          })()} • 💳 {paymentMethodLabel}
                                        </p>
                                      )}
                                      <p className="text-emerald-600 font-semibold">
                                        💵 Monto pagado: {formatCLP(entry.amount)}
                                      </p>
                                      {isMixedPayment && (
                                        <p className="text-purple-600">
                                          💵 Efectivo: {formatCLP(paymentBreakdown.efectivo)} • 
                                          💸 Transferencia: {formatCLP(paymentBreakdown.transferencia)}
                                        </p>
                                      )}
                                      {entry.note && (
                                        <p className="text-slate-600">📝 {entry.note}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                                        onClick={() => startEditingSettlement(entry)}
                                        disabled={savingSettlementEdit || deletingSettlementId === entry.id}
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() => void handleDeleteSettlement(entry)}
                                        disabled={savingSettlementEdit || deletingSettlementId === entry.id}
                                      >
                                        {deletingSettlementId === entry.id ? "Eliminando..." : "Eliminar"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                {editingSettlementId === entry.id && (
                                  <div className="mt-3 p-3 rounded-md border border-amber-200 bg-amber-50 space-y-2">
                                    <p className="text-xs font-semibold text-amber-700">Editar pago</p>
                                    <label className="text-xs text-slate-600 flex flex-col gap-1">
                                      Monto
                                      <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                                        value={editingSettlementAmount}
                                        onChange={(e) => setEditingSettlementAmount(e.target.value)}
                                      />
                                    </label>
                                    <label className="text-xs text-slate-600 flex flex-col gap-1">
                                      Nota
                                      <input
                                        type="text"
                                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                                        value={editingSettlementNote}
                                        onChange={(e) => setEditingSettlementNote(e.target.value)}
                                        placeholder="Opcional"
                                      />
                                    </label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        className="text-xs px-3 py-1.5 rounded bg-brand-light text-white hover:bg-brand/90"
                                        onClick={() => void handleSaveSettlementEdit(entry)}
                                        disabled={savingSettlementEdit}
                                      >
                                        {savingSettlementEdit ? "Guardando..." : "Guardar cambios"}
                                      </button>
                                      <button
                                        type="button"
                                        className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-white"
                                        onClick={cancelEditingSettlement}
                                        disabled={savingSettlementEdit}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Listado de Órdenes */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Órdenes de Reparación</h3>
                  <OrdersTable 
                    technicianId={tech.id} 
                    refreshKey={refreshKey}
                    isAdmin={true}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
