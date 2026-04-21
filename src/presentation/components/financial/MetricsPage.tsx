"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import { formatDate, dateToUTCStart, dateToUTCEnd } from "@/lib/date";
import { getWeeksInRange, formatDateForInput } from "@/lib/metrics";
import { getPayoutWeekStart, getPayoutWeekRange } from "@/lib/payoutWeek";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell } from "recharts";
import type { Profile, Branch } from "@/types";

interface WeekMetric {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  label: string;
  sales: number;
  orders: number;
  earnings?: number;
  works?: number;
  warranties?: number;
  paid?: number; // Dinero pagado a técnicos
  created?: number; // Órdenes creadas (todas, no solo pagadas)
}

interface BranchMetrics {
  branchId: string;
  branchName: string;
  weeks: WeekMetric[];
  totalSales: number;
  totalOrders: number;
  totalWarranties: number;
  totalPaid: number; // Total pagado a técnicos
  totalCreated: number; // Total órdenes creadas
  totalProfit: number; // Ganancias finales (después de descontar repuestos y comisiones)
  paymentMethods: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
    mixto: number;
  };
}

interface TechnicianMetrics {
  technicianId: string;
  technicianName: string;
  weeks: WeekMetric[];
  totalEarnings: number;
  totalWorks: number;
  totalSales: number;
  totalWarranties: number;
  totalPaid: number;
  paymentMethods: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
    mixto: number;
  };
}

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"branches" | "technician">("branches");
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return formatDateForInput(monthStart);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return formatDateForInput(monthEnd);
  });
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [branchMetrics, setBranchMetrics] = useState<BranchMetrics[]>([]);
  const [technicianMetrics, setTechnicianMetrics] = useState<TechnicianMetrics | null>(null);
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<BranchMetrics[] | TechnicianMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calcular semanas en el rango
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return [];
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validar que las fechas sean válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("[MetricsPage] Fechas inválidas:", { startDate, endDate });
        return [];
      }
      
      // Validar que la fecha de inicio sea anterior a la de fin
      if (start > end) {
        console.error("[MetricsPage] Fecha de inicio posterior a fecha de fin:", { start, end });
        return [];
      }
      
      return getWeeksInRange(start, end);
    } catch (error) {
      console.error("[MetricsPage] Error calculando semanas:", error);
      return [];
    }
  }, [startDate, endDate]);

  // Calcular período anterior para comparación
  const previousPeriod = useMemo(() => {
    if (!compareWithPrevious || !startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - daysDiff - 1);
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    
    return {
      start: prevStart,
      end: prevEnd,
      weeks: getWeeksInRange(prevStart, prevEnd)
    };
  }, [compareWithPrevious, startDate, endDate]);

  // Cargar sucursales y técnicos
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: branchesData } = await supabase
          .from("branches")
          .select("*")
          .order("name");
        
        if (branchesData) {
          setBranches(branchesData as Branch[]);
          // Por defecto, NO seleccionar ninguna sucursal (el usuario debe seleccionar manualmente)
          // Solo seleccionar si no hay ninguna seleccionada previamente
          if (selectedBranches.length === 0) {
            // No seleccionar ninguna por defecto
            setSelectedBranches([]);
          }
        }

        const { data: techniciansData } = await supabase
          .from("users")
          .select("*")
          .eq("role", "technician")
          .order("name");
        
        if (techniciansData) {
          setTechnicians(techniciansData as Profile[]);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cargar métricas de sucursales
  useEffect(() => {
    if (viewMode !== "branches" || selectedBranches.length === 0 || !startDate || !endDate) {
      setBranchMetrics([]);
      return;
    }

    async function loadBranchMetrics() {
      setLoading(true);
      try {
        // Validar fechas antes de usarlas
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          console.error("[MetricsPage] Fechas inválidas al cargar métricas:", { startDate, endDate });
          setBranchMetrics([]);
          setLoading(false);
          return;
        }
        
        if (startDateObj > endDateObj) {
          console.error("[MetricsPage] Fecha de inicio posterior a fecha de fin");
          setBranchMetrics([]);
          setLoading(false);
          return;
        }
        
        const start = dateToUTCStart(startDateObj);
        const end = dateToUTCEnd(endDateObj);

        const metrics: BranchMetrics[] = [];

        for (const branchId of selectedBranches) {
          const branch = branches.find(b => b.id === branchId);
          if (!branch) continue;

          // Obtener técnicos de esta sucursal
          const { data: branchTechnicians } = await supabase
            .from("users")
            .select("id")
            .eq("branch_id", branchId)
            .eq("role", "technician");

          const technicianIds = (branchTechnicians || []).map(t => t.id);

          if (technicianIds.length === 0) {
            metrics.push({
              branchId: branch.id,
              branchName: branch.name,
              weeks: [],
              totalSales: 0,
              totalOrders: 0,
              totalWarranties: 0,
              totalPaid: 0,
              totalCreated: 0,
              totalProfit: 0,
              paymentMethods: { efectivo: 0, transferencia: 0, tarjeta: 0, mixto: 0 }
            });
            continue;
          }

          // Obtener órdenes pagadas (usar paid_at o created_at como fallback)
          let paidOrders: any[] = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;

          // Consulta 1: Órdenes pagadas con paid_at
          while (hasMore) {
            const { data: ordersPage, error } = await supabase
              .from("orders")
              .select("id, repair_cost, replacement_cost, commission_amount, status, paid_at, created_at, payment_method, branch_id")
              .in("technician_id", technicianIds)
              .eq("status", "paid")
              .not("paid_at", "is", null)
              .gte("paid_at", start.toISOString())
              .lte("paid_at", end.toISOString())
              .range(from, from + pageSize - 1)
              .order("paid_at", { ascending: false });

            if (error) {
              console.error(`[MetricsPage] Error cargando órdenes pagadas (con paid_at) para ${branch.name}:`, error);
              break;
            }

            if (ordersPage && ordersPage.length > 0) {
              paidOrders = [...paidOrders, ...ordersPage];
              from += pageSize;
              hasMore = ordersPage.length === pageSize;
            } else {
              hasMore = false;
            }
          }

          // Consulta 2: Órdenes pagadas sin paid_at (retrocompatibilidad)
          from = 0;
          hasMore = true;
          while (hasMore) {
            const { data: ordersPage, error } = await supabase
              .from("orders")
              .select("id, repair_cost, replacement_cost, commission_amount, status, paid_at, created_at, payment_method, branch_id")
              .in("technician_id", technicianIds)
              .eq("status", "paid")
              .is("paid_at", null)
              .gte("created_at", start.toISOString())
              .lte("created_at", end.toISOString())
              .range(from, from + pageSize - 1)
              .order("created_at", { ascending: false });

            if (error) {
              console.error(`[MetricsPage] Error cargando órdenes pagadas (sin paid_at) para ${branch.name}:`, error);
              break;
            }

            if (ordersPage && ordersPage.length > 0) {
              const existingIds = new Set(paidOrders.map(o => o.id));
              const newOrders = ordersPage.filter(o => !existingIds.has(o.id));
              paidOrders = [...paidOrders, ...newOrders];
              from += pageSize;
              hasMore = ordersPage.length === pageSize;
            } else {
              hasMore = false;
            }
          }

          // Consulta 3: Todas las órdenes creadas (para totalCreated)
          from = 0;
          hasMore = true;
          let createdOrders: any[] = [];
          while (hasMore) {
            const { data: ordersPage, error } = await supabase
              .from("orders")
              .select("id, repair_cost, replacement_cost, commission_amount, status, paid_at, created_at, payment_method, branch_id")
              .in("technician_id", technicianIds)
              .gte("created_at", start.toISOString())
              .lte("created_at", end.toISOString())
              .range(from, from + pageSize - 1)
              .order("created_at", { ascending: false });

            if (error) {
              console.error(`[MetricsPage] Error cargando órdenes creadas para ${branch.name}:`, error);
              break;
            }

            if (ordersPage && ordersPage.length > 0) {
              createdOrders = [...createdOrders, ...ordersPage];
              from += pageSize;
              hasMore = ordersPage.length === pageSize;
            } else {
              hasMore = false;
            }
          }

          // Consulta 4: Órdenes en garantía
          from = 0;
          hasMore = true;
          let warrantyOrders: any[] = [];
          while (hasMore) {
            const { data: ordersPage, error } = await supabase
              .from("orders")
              .select("id, repair_cost, replacement_cost, commission_amount, status, paid_at, created_at, payment_method, branch_id")
              .in("technician_id", technicianIds)
              .in("status", ["returned", "cancelled"])
              .gte("created_at", start.toISOString())
              .lte("created_at", end.toISOString())
              .range(from, from + pageSize - 1)
              .order("created_at", { ascending: false });

            if (error) {
              console.error(`[MetricsPage] Error cargando órdenes en garantía para ${branch.name}:`, error);
              break;
            }

            if (ordersPage && ordersPage.length > 0) {
              warrantyOrders = [...warrantyOrders, ...ordersPage];
              from += pageSize;
              hasMore = ordersPage.length === pageSize;
            } else {
              hasMore = false;
            }
          }

          console.log(`[MetricsPage] ${branch.name} - Órdenes cargadas:`, {
            pagadas: paidOrders.length,
            garantia: warrantyOrders.length,
            creadas: createdOrders.length,
            rango: `${startDate} a ${endDate}`
          });

          const totalSales = paidOrders.reduce((sum, o) => sum + (o.repair_cost ?? 0), 0);
          const totalOrders = paidOrders.length;
          const totalCreated = createdOrders.length;
          const totalWarranties = warrantyOrders.length;
          
          // Calcular total de repuestos descontados
          const totalReplacementCost = paidOrders.reduce((sum, o) => sum + (o.replacement_cost ?? 0), 0);
          
          // Calcular comisiones del técnico (después de descontar repuestos)
          // Esto es la suma de commission_amount de todas las órdenes pagadas
          const totalCommissions = paidOrders.reduce((sum, o) => sum + (o.commission_amount ?? 0), 0);
          
          // Calcular ganancias finales: repair_cost - replacement_cost - commission_amount
          const totalProfit = paidOrders.reduce((sum, o) => {
            const repairCost = o.repair_cost ?? 0;
            const replacementCost = o.replacement_cost ?? 0;
            const commission = o.commission_amount ?? 0;
            // Ganancias = Total cobrado - Costo repuesto - Comisión técnico
            const profit = repairCost - replacementCost - commission;
            return sum + Math.max(0, profit); // Asegurar que no sea negativo
          }, 0);

          console.log(`[MetricsPage] ${branch.name}:`, {
            totalSales,
            totalOrders,
            totalCreated,
            totalWarranties,
            paidOrdersCount: paidOrders.length,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          });

          // Calcular total pagado a técnicos (desde salary_settlements) - sin límite
          let allSettlements: any[] = [];
          let settlementsFrom = 0;
          let settlementsHasMore = true;

          while (settlementsHasMore) {
            const { data: settlementsPage, error } = await supabase
              .from("salary_settlements")
              .select("amount, payment_method, created_at")
              .in("technician_id", technicianIds)
              .gte("created_at", start.toISOString())
              .lte("created_at", end.toISOString())
              .range(settlementsFrom, settlementsFrom + pageSize - 1)
              .order("created_at", { ascending: false });

            if (error) {
              console.error("Error cargando settlements:", error);
              break;
            }

            if (settlementsPage && settlementsPage.length > 0) {
              allSettlements = [...allSettlements, ...settlementsPage];
              settlementsFrom += pageSize;
              settlementsHasMore = settlementsPage.length === pageSize;
            } else {
              settlementsHasMore = false;
            }
          }

          const settlements = allSettlements;

          // Usar totalCommissions calculado desde órdenes en lugar de settlements
          // totalCommissions ya fue calculado arriba como suma de commission_amount

          // Calcular medios de pago desde las órdenes pagadas (no desde settlements)
          // Sumar el repair_cost de cada orden según su payment_method
          const paymentMethods = {
            efectivo: paidOrders
              .filter(o => o.payment_method === "EFECTIVO")
              .reduce((sum, o) => sum + (o.repair_cost ?? 0), 0),
            transferencia: paidOrders
              .filter(o => o.payment_method === "TRANSFERENCIA")
              .reduce((sum, o) => sum + (o.repair_cost ?? 0), 0),
            tarjeta: paidOrders
              .filter(o => o.payment_method === "TARJETA" || o.payment_method === "DEBITO" || o.payment_method === "CREDITO")
              .reduce((sum, o) => sum + (o.repair_cost ?? 0), 0),
            mixto: paidOrders
              .filter(o => !o.payment_method || o.payment_method === "" || 
                (o.payment_method !== "EFECTIVO" && o.payment_method !== "TRANSFERENCIA" && 
                 o.payment_method !== "TARJETA" && o.payment_method !== "DEBITO" && o.payment_method !== "CREDITO"))
              .reduce((sum, o) => sum + (o.repair_cost ?? 0), 0)
          };

          console.log(`[MetricsPage] ${branch.name} - Medios de pago:`, {
            efectivo: paymentMethods.efectivo,
            transferencia: paymentMethods.transferencia,
            tarjeta: paymentMethods.tarjeta,
            mixto: paymentMethods.mixto,
            totalOrdenes: paidOrders.length
          });

          // Calcular por semana para el gráfico
          const weekData: WeekMetric[] = weeks.map(week => ({
            weekNumber: week.weekNumber,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            label: week.label,
            sales: 0,
            orders: 0,
            warranties: 0,
            paid: 0,
            created: 0
          }));

          for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const weekStartUTC = dateToUTCStart(week.weekStart);
            const weekEndUTC = dateToUTCEnd(week.weekEnd);

            // Órdenes pagadas de esta semana
            const weekPaidOrders = paidOrders.filter(o => {
              const paidDate = o.paid_at ? new Date(o.paid_at) : new Date(o.created_at);
              return paidDate >= weekStartUTC && paidDate <= weekEndUTC;
            });

            // Órdenes creadas de esta semana
            const weekCreatedOrders = createdOrders.filter(o => {
              const createdDate = new Date(o.created_at);
              return createdDate >= weekStartUTC && createdDate <= weekEndUTC;
            });

            // Órdenes en garantía de esta semana
            const weekWarrantyOrders = warrantyOrders.filter(o => {
              const warrantyDate = o.returned_at ? new Date(o.returned_at) : 
                                 (o.cancelled_at ?? o.canceled_at) ? new Date((o.cancelled_at ?? o.canceled_at)!) : 
                                 new Date(o.created_at);
              return warrantyDate >= weekStartUTC && warrantyDate <= weekEndUTC;
            });

            // Pagos de esta semana
            const weekSettlements = (settlements || []).filter(s => {
              const settlementDate = new Date(s.created_at);
              return settlementDate >= weekStartUTC && settlementDate <= weekEndUTC;
            });

            weekData[i].sales = weekPaidOrders.reduce((sum, o) => sum + (o.repair_cost ?? 0), 0);
            weekData[i].orders = weekPaidOrders.length;
            weekData[i].created = weekCreatedOrders.length;
            weekData[i].warranties = weekWarrantyOrders.length;
            weekData[i].paid = weekSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
          }

          metrics.push({
            branchId: branch.id,
            branchName: branch.name,
            weeks: weekData,
            totalSales,
            totalOrders,
            totalWarranties,
            totalPaid: totalCommissions, // Usar comisiones calculadas desde órdenes
            totalCreated,
            totalProfit,
            paymentMethods
          });
        }

        setBranchMetrics(metrics);
        setError(null); // Limpiar error si la carga fue exitosa
      } catch (error) {
        console.error("Error cargando métricas de sucursales:", error);
        // En caso de error, limpiar métricas para evitar estado inconsistente
        setBranchMetrics([]);
        setError(error instanceof Error ? error.message : "Error al cargar métricas. Por favor, recarga la página.");
      } finally {
        setLoading(false);
      }
    }

    // Usar un timeout para evitar múltiples llamadas rápidas
    const timeoutId = setTimeout(() => {
      loadBranchMetrics();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [viewMode, selectedBranches, weeks, startDate, endDate, branches]);

  // Cargar métricas de técnico
  useEffect(() => {
    if (viewMode !== "technician" || !selectedTechnician || !startDate || !endDate) {
      if (viewMode === "technician") {
        setTechnicianMetrics(null);
      }
      return;
    }

    // No resetear métricas al cambiar fechas, solo cargar nuevas
    async function loadTechnicianMetrics() {
      setLoading(true);
      try {
        // Validar fechas antes de usarlas
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          console.error("[MetricsPage] Fechas inválidas al cargar métricas de técnico:", { startDate, endDate });
          setTechnicianMetrics(null);
          setLoading(false);
          return;
        }
        
        if (startDateObj > endDateObj) {
          console.error("[MetricsPage] Fecha de inicio posterior a fecha de fin");
          setTechnicianMetrics(null);
          setLoading(false);
          return;
        }
        
        const start = dateToUTCStart(startDateObj);
        const end = dateToUTCEnd(endDateObj);

        // Obtener TODAS las órdenes del técnico en el rango completo (sin límite)
        // Usar paid_at o created_at como fallback
        let allOrders: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: ordersPage, error } = await supabase
            .from("orders")
              .select("id, repair_cost, commission_amount, status, paid_at, created_at")
            .eq("technician_id", selectedTechnician)
            .or(`and(paid_at.gte.${start.toISOString()},paid_at.lte.${end.toISOString()}),and(paid_at.is.null,created_at.gte.${start.toISOString()},created_at.lte.${end.toISOString()})`)
            .range(from, from + pageSize - 1)
            .order("created_at", { ascending: false });

          if (error) {
            console.error(`[MetricsPage] Error cargando órdenes del técnico:`, error);
            break;
          }

          if (ordersPage && ordersPage.length > 0) {
            allOrders = [...allOrders, ...ordersPage];
            from += pageSize;
            hasMore = ordersPage.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        console.log(`[MetricsPage] Técnico - Órdenes cargadas:`, allOrders.length);

        // Filtrar órdenes pagadas que estén dentro del rango
        const paidOrders = (allOrders || []).filter(o => {
          if (o.status !== "paid") return false;
          const orderDate = o.paid_at ? new Date(o.paid_at) : new Date(o.created_at);
          return orderDate >= start && orderDate <= end;
        });
        
        // Órdenes en garantía en el rango
        const warrantyOrders = (allOrders || []).filter(o => {
          if (o.status !== "returned" && o.status !== "cancelled") return false;
          const warrantyDate = new Date(o.created_at);
          return warrantyDate >= start && warrantyDate <= end;
        });

        const totalSales = paidOrders.reduce((sum, o) => sum + (o.repair_cost ?? 0), 0);
        const totalEarnings = paidOrders.reduce((sum, o) => sum + (o.commission_amount ?? 0), 0);
        const totalWorks = paidOrders.length;
        const totalWarranties = warrantyOrders.length;
        
        // Obtener todas las semanas que cubren el rango de fechas
        const weeksInRange = getWeeksInRange(start, end);
        const weekStartDates = weeksInRange.map(w => {
          const weekStart = new Date(w.weekStart);
          weekStart.setHours(0, 0, 0, 0);
          return weekStart.toISOString().slice(0, 10); // Formato YYYY-MM-DD
        });
        
        // Obtener las semanas únicas de las órdenes pagadas (usando payout_week si existe, o calcular desde paid_at)
        // Estas son las semanas REALES de las órdenes, que pueden diferir de las semanas del rango de fechas
        const paidOrderWeeks = new Set<string>();
        paidOrders.forEach(o => {
          if (o.payout_week && o.payout_year) {
            // Si tiene payout_week, calcular el week_start desde ahí
            const weekRange = getPayoutWeekRange(o.payout_week, o.payout_year);
            const weekStartStr = weekRange.start.toISOString().slice(0, 10);
            paidOrderWeeks.add(weekStartStr);
          } else if (o.paid_at) {
            // Si no tiene payout_week, calcular desde paid_at
            const paidDate = new Date(o.paid_at);
            const weekStart = getPayoutWeekStart(paidDate);
            const weekStartStr = weekStart.toISOString().slice(0, 10);
            paidOrderWeeks.add(weekStartStr);
          }
        });
        
        // Combinar las semanas del rango con las semanas de las órdenes pagadas
        const allWeekStartDates = Array.from(new Set([...weekStartDates, ...Array.from(paidOrderWeeks)]));
        
        console.log(`[MetricsPage] Técnico - Semanas de órdenes pagadas:`, {
          paidOrdersCount: paidOrders.length,
          paidOrderWeeks: Array.from(paidOrderWeeks),
          weekStartDates_calculadas: weekStartDates,
          allWeekStartDates_combinadas: allWeekStartDates,
          rango_buscado: `${startDate} a ${endDate}`,
          start: start.toISOString(),
          end: end.toISOString()
        });
        
        // Log detallado de las primeras 5 órdenes pagadas para ver sus semanas
        console.log(`[MetricsPage] Técnico - Primeras 5 órdenes pagadas:`, paidOrders.slice(0, 5).map(o => ({
          id: o.id,
          paid_at: o.paid_at,
          payout_week: o.payout_week,
          payout_year: o.payout_year,
          commission_amount: o.commission_amount
        })));

        // Calcular total pagado (sin límite)
        // IMPORTANTE: Buscar settlements que correspondan a las órdenes pagadas en el rango
        // Los settlements tienen week_start que corresponde a la semana de las órdenes pagadas
        // Usamos allWeekStartDates que ya incluye las semanas del rango Y las semanas de las órdenes pagadas
        
        // Cargar TODOS los settlements del técnico y filtrar en memoria
        let allSettlementsRaw: any[] = [];
        let settlementsFrom = 0;
        let settlementsHasMore = true;

        while (settlementsHasMore) {
          const { data: settlementsPage, error } = await supabase
            .from("salary_settlements")
            .select("id, amount, payment_method, created_at, week_start")
            .eq("technician_id", selectedTechnician)
            .range(settlementsFrom, settlementsFrom + pageSize - 1)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error cargando settlements:", error);
            break;
          }

          if (settlementsPage && settlementsPage.length > 0) {
            allSettlementsRaw = [...allSettlementsRaw, ...settlementsPage];
            settlementsFrom += pageSize;
            settlementsHasMore = settlementsPage.length === pageSize;
          } else {
            settlementsHasMore = false;
          }
        }

        console.log(`[MetricsPage] Técnico - Settlements cargados (antes de filtrar):`, {
          total: allSettlementsRaw.length,
          settlements: allSettlementsRaw.map(s => ({
            id: s.id,
            week_start: s.week_start,
            amount: s.amount,
            payment_method: s.payment_method,
            created_at: s.created_at
          })),
          semanas_buscadas: allWeekStartDates,
          rango_created_at: `${start.toISOString()} a ${end.toISOString()}`
        });

        // Filtrar settlements que corresponden al rango:
        // 1. week_start está en las semanas de las órdenes pagadas, O
        // 2. created_at está en el rango de fechas
        const filteredSettlements = allSettlementsRaw.filter(s => {
          const weekStartMatch = allWeekStartDates.includes(s.week_start);
          const createdAtDate = new Date(s.created_at);
          const createdAtMatch = createdAtDate >= start && createdAtDate <= end;
          const matches = weekStartMatch || createdAtMatch;
          
          if (!matches) {
            console.log(`[MetricsPage] Settlement NO coincide:`, {
              id: s.id,
              week_start: s.week_start,
              week_start_match: weekStartMatch,
              created_at: s.created_at,
              created_at_match: createdAtMatch,
              semanas_buscadas: allWeekStartDates
            });
          }
          
          return matches;
        });
        
        console.log(`[MetricsPage] Técnico - Settlements después de filtrar:`, {
          count: filteredSettlements.length,
          settlements: filteredSettlements.map(s => ({
            id: s.id,
            week_start: s.week_start,
            amount: s.amount,
            payment_method: s.payment_method,
            created_at: s.created_at
          }))
        });
        
        const settlements = filteredSettlements;

        console.log(`[MetricsPage] Técnico - Settlements cargados:`, {
          count: settlements.length,
          settlements: settlements.map(s => ({
            id: s.id,
            amount: s.amount,
            payment_method: s.payment_method,
            payment_method_type: typeof s.payment_method,
            created_at: s.created_at
          })),
          rangoFechas: `${startDate} a ${endDate}`,
          startUTC: start.toISOString(),
          endUTC: end.toISOString()
        });

        // Calcular total pagado: suma de todos los amounts de settlements
        const totalPaid = (settlements || []).reduce((sum, s) => sum + (s.amount || 0), 0);

        // Calcular medios de pago desde los settlements (cómo se le pagó al técnico)
        // Sumar los amounts de cada settlement según su payment_method
        let paymentMethods = {
          efectivo: 0,
          transferencia: 0,
          mixto: 0
        };

        if (settlements.length > 0) {
          // Log detallado de cada settlement antes de calcular
          settlements.forEach((s, index) => {
            console.log(`[MetricsPage] Settlement ${index + 1}:`, {
              id: s.id,
              amount: s.amount,
              payment_method: s.payment_method,
              payment_method_type: typeof s.payment_method,
              is_efectivo: s.payment_method === "efectivo",
              is_transferencia: s.payment_method === "transferencia",
              is_mixto: s.payment_method === "efectivo/transferencia",
              is_null: s.payment_method === null,
              is_undefined: s.payment_method === undefined
            });
          });

          // Si hay settlements, calcular desde los amounts reales
          // Manejar casos donde payment_method puede ser null o undefined
          const efectivoSettlements = settlements.filter(s => {
            const pm = s.payment_method;
            return pm === "efectivo" || pm === "EFECTIVO";
          });
          const transferenciaSettlements = settlements.filter(s => {
            const pm = s.payment_method;
            return pm === "transferencia" || pm === "TRANSFERENCIA";
          });
          const mixtoSettlements = settlements.filter(s => {
            const pm = s.payment_method;
            return pm === "efectivo/transferencia" || 
                   pm === "EFECTIVO/TRANSFERENCIA" ||
                   (pm && pm !== "efectivo" && pm !== "EFECTIVO" && pm !== "transferencia" && pm !== "TRANSFERENCIA");
          });
          
          // Settlements sin payment_method (se contabilizan aparte en logs, pero NO se asumen como efectivo)
          const sinPaymentMethod = settlements.filter(s => {
            const pm = s.payment_method;
            return (!pm || pm === null || pm === undefined) && s.amount && s.amount > 0;
          });

          paymentMethods = {
            efectivo: efectivoSettlements.reduce((sum, s) => sum + (s.amount || 0), 0),
            transferencia: transferenciaSettlements.reduce((sum, s) => sum + (s.amount || 0), 0),
            mixto: mixtoSettlements.reduce((sum, s) => sum + (s.amount || 0), 0)
          };

          console.log(`[MetricsPage] Técnico - Cálculo de medios de pago:`, {
            efectivoSettlements: efectivoSettlements.length,
            transferenciaSettlements: transferenciaSettlements.length,
            mixtoSettlements: mixtoSettlements.length,
            sinPaymentMethod: sinPaymentMethod.length,
            paymentMethods
          });

          // Si los amounts suman 0 pero hay settlements, distribuir las ganancias proporcionalmente
          const totalSettlementsAmount = paymentMethods.efectivo + paymentMethods.transferencia + paymentMethods.mixto;
          if (totalSettlementsAmount === 0 && totalEarnings > 0) {
            console.log(`[MetricsPage] Técnico - Settlements sin amount, distribuyendo proporcionalmente`);
            const efectivoCount = efectivoSettlements.length + sinPaymentMethod.length;
            const transferenciaCount = transferenciaSettlements.length;
            const mixtoCount = mixtoSettlements.length;
            const totalCount = settlements.length;
            
            if (totalCount > 0) {
              paymentMethods.efectivo = (efectivoCount / totalCount) * totalEarnings;
              paymentMethods.transferencia = (transferenciaCount / totalCount) * totalEarnings;
              paymentMethods.mixto = (mixtoCount / totalCount) * totalEarnings;
            }
          }
        } else if (totalEarnings > 0) {
          // Si no hay settlements pero hay ganancias, mostrar 0 en medios de pago
          // (aún no se ha pagado o no se registraron los pagos)
          console.log(`[MetricsPage] Técnico - No hay settlements pero hay ganancias. Esto significa que no se han registrado pagos para este período.`);
          paymentMethods = {
            efectivo: 0,
            transferencia: 0,
            mixto: 0
          };
        }

        console.log(`[MetricsPage] Técnico - Medios de pago:`, {
          totalEarnings,
          totalPaid,
          settlementsCount: settlements.length,
          settlements: settlements.map(s => ({ 
            id: s.id,
            amount: s.amount, 
            payment_method: s.payment_method,
            created_at: s.created_at
          })),
          paymentMethods,
          rangoFechas: `${startDate} a ${endDate}`,
          startUTC: start.toISOString(),
          endUTC: end.toISOString()
        });

        // Log detallado de cada settlement
        settlements.forEach((s, index) => {
          console.log(`[MetricsPage] Settlement ${index + 1}:`, {
            id: s.id,
            amount: s.amount,
            payment_method: s.payment_method,
            payment_method_type: typeof s.payment_method,
            created_at: s.created_at,
            matches_efectivo: s.payment_method === "efectivo",
            matches_transferencia: s.payment_method === "transferencia",
            matches_mixto: s.payment_method === "efectivo/transferencia" || 
                          (s.payment_method && s.payment_method !== "efectivo" && s.payment_method !== "transferencia")
          });
        });

        // Calcular por semana
        const weekData: WeekMetric[] = weeks.map(week => ({
          weekNumber: week.weekNumber,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
          label: week.label,
          sales: 0,
          orders: 0,
          earnings: 0,
          works: 0,
          warranties: 0,
          paid: 0,
          created: 0
        }));

        for (let i = 0; i < weeks.length; i++) {
          const week = weeks[i];
          const weekStartUTC = dateToUTCStart(week.weekStart);
          const weekEndUTC = dateToUTCEnd(week.weekEnd);

          const weekPaidOrders = paidOrders.filter(o => {
            const paidDate = o.paid_at ? new Date(o.paid_at) : new Date(o.created_at);
            return paidDate >= weekStartUTC && paidDate <= weekEndUTC;
          });

          const weekWarrantyOrders = warrantyOrders.filter(o => {
            const warrantyDate = o.returned_at ? new Date(o.returned_at) : 
                               (o.cancelled_at ?? o.canceled_at) ? new Date((o.cancelled_at ?? o.canceled_at)!) : 
                               new Date(o.created_at);
            return warrantyDate >= weekStartUTC && warrantyDate <= weekEndUTC;
          });

          const weekSettlements = (settlements || []).filter(s => {
            const settlementDate = new Date(s.created_at);
            return settlementDate >= weekStartUTC && settlementDate <= weekEndUTC;
          });

          weekData[i].sales = weekPaidOrders.reduce((sum, o) => sum + (o.repair_cost ?? 0), 0);
          weekData[i].orders = weekPaidOrders.length;
          weekData[i].earnings = weekPaidOrders.reduce((sum, o) => sum + (o.commission_amount ?? 0), 0);
          weekData[i].works = weekPaidOrders.length;
          weekData[i].warranties = weekWarrantyOrders.length;
          weekData[i].paid = weekSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
        }

        const technician = technicians.find(t => t.id === selectedTechnician);
        // Helper para asegurar que siempre sea string
        const getTechnicianName = (): string => {
          if (!technician) return "Técnico";
          const name = technician.name;
          return name != null && typeof name === 'string' ? name : "Técnico";
        };
        const technicianName = getTechnicianName();
        setTechnicianMetrics({
          technicianId: selectedTechnician as string,
          technicianName: technicianName as string,
          weeks: weekData,
          totalEarnings,
          totalWorks,
          totalSales,
          totalWarranties,
          totalPaid,
          paymentMethods: {
            efectivo: paymentMethods.efectivo,
            transferencia: paymentMethods.transferencia,
            tarjeta: 0, // Los técnicos no reciben pagos en tarjeta, solo efectivo/transferencia
            mixto: paymentMethods.mixto
          }
        });
        setError(null); // Limpiar error si la carga fue exitosa
      } catch (error) {
        console.error("Error cargando métricas de técnico:", error);
        // En caso de error, limpiar métricas para evitar estado inconsistente
        setTechnicianMetrics(null);
        setError(error instanceof Error ? error.message : "Error al cargar métricas. Por favor, recarga la página.");
      } finally {
        setLoading(false);
      }
    }

    // Usar un timeout para evitar múltiples llamadas rápidas
    const timeoutId = setTimeout(() => {
      loadTechnicianMetrics();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [viewMode, selectedTechnician, weeks, startDate, endDate, technicians]);

  // Preparar datos para gráfico de dona (distribución de ventas)
  const donutChartData = useMemo(() => {
    if (viewMode !== "branches" || branchMetrics.length === 0) return [];
    
    return branchMetrics
      .map(branch => ({
        name: branch.branchName,
        value: branch.totalSales
      }))
      .sort((a, b) => b.value - a.value);
  }, [branchMetrics, viewMode]);

  // Preparar datos para gráfico de barras
  const branchChartData = useMemo(() => {
    if (branchMetrics.length === 0) return [];

    return weeks.map((week, weekIndex) => {
      const dataPoint: Record<string, any> = {
        week: `Semana ${weekIndex + 1}`,
        weekLabel: week.label
      };

      branchMetrics.forEach(branch => {
        const weekData = branch.weeks[weekIndex];
        if (weekData) {
          dataPoint[`${branch.branchName} - Ventas`] = weekData.sales;
          dataPoint[`${branch.branchName} - Órdenes`] = weekData.orders;
        }
      });

      return dataPoint;
    });
  }, [branchMetrics, weeks]);

  // Preparar datos para gráfico de técnico
  const technicianChartData = useMemo(() => {
    if (!technicianMetrics) return [];

    return weeks.map((week, weekIndex) => {
      const weekData = technicianMetrics.weeks[weekIndex];
      return {
        week: `Semana ${weekIndex + 1}`,
        weekLabel: week.label,
        "Ganancias": weekData?.earnings || 0,
        "Trabajos": weekData?.works || 0,
        "Ventas": weekData?.sales || 0,
        "Pagado": weekData?.paid || 0
      };
    });
  }, [technicianMetrics, weeks]);

  if (loading && branchMetrics.length === 0 && !technicianMetrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-600">Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Recargar página
            </button>
          </div>
        </div>
      )}
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Filtros de Métricas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vista</label>
            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value as "branches" | "technician");
                setSelectedTechnician(null);
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="branches">Por Sucursal</option>
              <option value="technician">Por Técnico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStartDate = e.target.value;
                // Validar que la fecha sea válida antes de actualizar
                if (newStartDate) {
                  const dateObj = new Date(newStartDate);
                  if (!isNaN(dateObj.getTime())) {
                    setStartDate(newStartDate);
                  }
                } else {
                  setStartDate(newStartDate);
                }
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const newEndDate = e.target.value;
                // Validar que la fecha sea válida antes de actualizar
                if (newEndDate) {
                  const dateObj = new Date(newEndDate);
                  if (!isNaN(dateObj.getTime())) {
                    setEndDate(newEndDate);
                  }
                } else {
                  setEndDate(newEndDate);
                }
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareWithPrevious}
                onChange={(e) => setCompareWithPrevious(e.target.checked)}
                className="w-4 h-4 text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-slate-700">
                Comparar con período anterior
              </span>
            </label>
          </div>
        </div>

        {viewMode === "branches" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Sucursales a Comparar
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBranches(branches.map(b => b.id))}
                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Seleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBranches([])}
                  className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Deseleccionar Todas
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
              {branches.map(branch => {
                const isSelected = selectedBranches.includes(branch.id);
                return (
                  <label
                    key={branch.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-brand/10 border-brand shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBranches([...selectedBranches, branch.id]);
                        } else {
                          setSelectedBranches(selectedBranches.filter(id => id !== branch.id));
                        }
                      }}
                      className="w-5 h-5 text-brand focus:ring-brand focus:ring-2 rounded border-slate-300 cursor-pointer flex-shrink-0"
                    />
                    <span className={`
                      flex-1 text-sm font-medium select-none
                      ${isSelected ? 'text-brand font-semibold' : 'text-slate-700'}
                    `}>
                      {branch.name}
                    </span>
                    {isSelected && (
                      <svg 
                        className="w-5 h-5 text-brand flex-shrink-0" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2.5" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {selectedBranches.length === 0 ? (
                  <span className="text-amber-600 font-semibold">⚠️ Selecciona al menos una sucursal para ver métricas</span>
                ) : (
                  <span className="text-slate-600">
                    <span className="font-semibold text-brand">{selectedBranches.length}</span> de {branches.length} sucursales seleccionadas
                  </span>
                )}
              </p>
              {selectedBranches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBranches([])}
                  className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors"
                >
                  Limpiar selección
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Técnico</label>
            <select
              value={selectedTechnician || ""}
              onChange={(e) => setSelectedTechnician(e.target.value || null)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Seleccionar técnico...</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vista de Sucursales */}
      {viewMode === "branches" && branchMetrics.length > 0 && (
        <>
          {/* Resumen General de Ganancias */}
          {branchMetrics.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg shadow-md p-6 border-2 border-emerald-300">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                💎 Resumen de Ganancias
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-sm text-slate-600 mb-1">Total Vendido</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCLP(branchMetrics.reduce((sum, b) => sum + b.totalSales, 0))}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <p className="text-sm text-slate-600 mb-1">Comisiones a Técnicos</p>
                  <p className="text-2xl font-bold text-sky-600">
                    {formatCLP(branchMetrics.reduce((sum, b) => sum + b.totalPaid, 0))}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    (Después de descontar repuestos)
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-emerald-400">
                  <p className="text-sm font-semibold text-slate-700 mb-1">💎 Ganancias Finales</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {formatCLP(branchMetrics.reduce((sum, b) => sum + b.totalProfit, 0))}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    (Después de descontar repuestos y comisiones)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de Dona - Distribución de Ventas */}
          {donutChartData.length > 0 && donutChartData.some(d => d.value > 0) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                Ventas por Sucursal
                <span className="text-sm font-normal text-slate-500">(Distribución)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center min-h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={donutChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {donutChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number | undefined, name?: string) => [
                          value !== undefined ? formatCLP(value) : "", 
                          name ?? ""
                        ]}
                        labelFormatter={(label) => label ?? ""}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-3">
                  {[...donutChartData]
                    .sort((a, b) => b.value - a.value)
                    .map((item, index) => {
                      const originalIndex = donutChartData.findIndex(d => d.name === item.name);
                      return (
                        <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <div 
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: COLORS[originalIndex % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-slate-700 flex-1">{item.name}</span>
                          <span className="text-sm font-bold text-slate-900">{formatCLP(item.value)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Medios de Pago por Sucursal */}
          {branchMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Formas de Pago por Sucursal</h2>
              <div className="space-y-4">
                {branchMetrics.map(branch => {
                  const totalPaymentMethods = branch.paymentMethods.efectivo + branch.paymentMethods.transferencia + branch.paymentMethods.tarjeta + branch.paymentMethods.mixto;
                  const maxPayment = Math.max(
                    branch.paymentMethods.efectivo,
                    branch.paymentMethods.transferencia,
                    branch.paymentMethods.tarjeta,
                    branch.paymentMethods.mixto,
                    1
                  );

                  return (
                    <div key={branch.branchId} className="border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3">{branch.branchName}</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-600">Efectivo</span>
                            <span className="text-sm font-bold text-slate-900">{formatCLP(branch.paymentMethods.efectivo)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-4">
                            <div
                              className="bg-emerald-500 h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(branch.paymentMethods.efectivo / maxPayment) * 100}%` }}
                            >
                              {branch.paymentMethods.efectivo > 0 && (
                                <span className="text-xs text-white font-semibold">
                                  {totalPaymentMethods > 0 ? `${((branch.paymentMethods.efectivo / totalPaymentMethods) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-600">Transferencia</span>
                            <span className="text-sm font-bold text-slate-900">{formatCLP(branch.paymentMethods.transferencia)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-4">
                            <div
                              className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(branch.paymentMethods.transferencia / maxPayment) * 100}%` }}
                            >
                              {branch.paymentMethods.transferencia > 0 && (
                                <span className="text-xs text-white font-semibold">
                                  {totalPaymentMethods > 0 ? `${((branch.paymentMethods.transferencia / totalPaymentMethods) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-600">Tarjeta (Débito/Crédito)</span>
                            <span className="text-sm font-bold text-slate-900">{formatCLP(branch.paymentMethods.tarjeta)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-4">
                            <div
                              className="bg-orange-500 h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(branch.paymentMethods.tarjeta / maxPayment) * 100}%` }}
                            >
                              {branch.paymentMethods.tarjeta > 0 && (
                                <span className="text-xs text-white font-semibold">
                                  {totalPaymentMethods > 0 ? `${((branch.paymentMethods.tarjeta / totalPaymentMethods) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-600">Mixto/Otro</span>
                            <span className="text-sm font-bold text-slate-900">{formatCLP(branch.paymentMethods.mixto)}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-4">
                            <div
                              className="bg-purple-500 h-4 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(branch.paymentMethods.mixto / maxPayment) * 100}%` }}
                            >
                              {branch.paymentMethods.mixto > 0 && (
                                <span className="text-xs text-white font-semibold">
                                  {totalPaymentMethods > 0 ? `${((branch.paymentMethods.mixto / totalPaymentMethods) * 100).toFixed(1)}%` : '0%'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">Total Pagado:</span>
                            <span className="text-sm font-bold text-slate-900">{formatCLP(totalPaymentMethods)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumen por Sucursal - Tarjetas Comparativas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumen Comparativo por Sucursal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchMetrics.map(branch => (
                <div key={branch.branchId} className="border-2 border-slate-200 rounded-lg p-4 bg-gradient-to-br from-slate-50 to-white">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{branch.branchName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">💰 Total Vendido:</span>
                      <span className="font-bold text-emerald-600 text-base">{formatCLP(branch.totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">📋 Órdenes Pagadas:</span>
                      <span className="font-bold text-blue-600 text-base">{branch.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">📝 Órdenes Creadas:</span>
                      <span className="font-bold text-purple-600 text-base">{branch.totalCreated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">💵 Comisiones Técnicos:</span>
                      <span className="font-bold text-sky-600 text-base">{formatCLP(branch.totalPaid)}</span>
                    </div>
                    <div className="text-xs text-slate-500 italic pl-2">
                      (Después de descontar repuestos)
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">🔄 Garantías:</span>
                      <span className="font-bold text-amber-600 text-base">{branch.totalWarranties}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-emerald-300">
                      <span className="text-slate-700 font-semibold">💎 Ganancias Finales:</span>
                      <span className="font-bold text-emerald-700 text-lg">{formatCLP(branch.totalProfit)}</span>
                    </div>
                    <div className="text-xs text-slate-500 italic pt-1">
                      (Después de descontar repuestos y comisiones)
                    </div>
                    {branch.totalOrders > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-xs">Promedio por orden:</span>
                          <span className="font-semibold text-slate-700 text-xs">{formatCLP(branch.totalSales / branch.totalOrders)}</span>
                        </div>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                      <p className="text-xs font-semibold text-slate-600">Medios de Pago:</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Efectivo:</span>
                          <span className="font-semibold">{formatCLP(branch.paymentMethods.efectivo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transferencia:</span>
                          <span className="font-semibold">{formatCLP(branch.paymentMethods.transferencia)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tarjeta:</span>
                          <span className="font-semibold">{formatCLP(branch.paymentMethods.tarjeta)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mixto/Otro:</span>
                          <span className="font-semibold">{formatCLP(branch.paymentMethods.mixto)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </>
      )}

      {/* Vista de Técnico */}
      {viewMode === "technician" && technicianMetrics && (
        <>
          {/* Resumen del Técnico */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Resumen de {technicianMetrics.technicianName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <h3 className="font-semibold text-slate-900 mb-2">💰 Total Ganancias</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCLP(technicianMetrics.totalEarnings)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Comisiones ganadas</p>
              </div>
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-slate-900 mb-2">📋 Total Trabajos</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {technicianMetrics.totalWorks}
                </p>
                <p className="text-xs text-slate-500 mt-1">Órdenes completadas</p>
              </div>
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-slate-900 mb-2">💵 Total Ventas</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCLP(technicianMetrics.totalSales)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Ventas generadas</p>
              </div>
              <div className="border-2 border-sky-200 rounded-lg p-4 bg-sky-50">
                <h3 className="font-semibold text-slate-900 mb-2">💸 Total Pagado</h3>
                <p className="text-2xl font-bold text-sky-600">
                  {formatCLP(technicianMetrics.totalPaid)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Dinero recibido</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">Medios de Pago:</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Efectivo:</span>
                  <span className="font-bold text-slate-900 ml-2">{formatCLP(technicianMetrics.paymentMethods.efectivo)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Transferencia:</span>
                  <span className="font-bold text-slate-900 ml-2">{formatCLP(technicianMetrics.paymentMethods.transferencia)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Mixto:</span>
                  <span className="font-bold text-slate-900 ml-2">{formatCLP(technicianMetrics.paymentMethods.mixto)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas Semanales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Desglose Semanal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {technicianMetrics.weeks.map((week, index) => (
                <div key={index} className="border-2 border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">{week.label}</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">📋 Órdenes:</span>
                      <span className="font-bold text-blue-600">{week.orders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">💰 Ganancias:</span>
                      <span className="font-bold text-emerald-600">{formatCLP(week.earnings || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">💵 Ventas:</span>
                      <span className="font-bold text-purple-600">{formatCLP(week.sales)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">💸 Pagado:</span>
                      <span className="font-bold text-sky-600">{formatCLP(week.paid || 0)}</span>
                    </div>
                    {week.warranties && week.warranties > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">🔄 Garantías:</span>
                        <span className="font-bold text-amber-600">{week.warranties}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Técnico */}
          {technicianChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Evolución Semanal</h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={technicianChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="weekLabel" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Ganancias/Ventas/Pagado (CLP)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Trabajos', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    formatter={(value: number | undefined, name?: string) => {
                      const nameStr = name ?? "";
                      if (value === undefined) return ["", nameStr];
                      if (nameStr.includes("Ganancias") || nameStr.includes("Ventas") || nameStr.includes("Pagado")) {
                        return [formatCLP(value), nameStr];
                      }
                      return [value, nameStr];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="Ganancias"
                    fill="#10b981"
                    name="Ganancias (Comisión)"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Ventas"
                    fill="#8b5cf6"
                    name="Ventas Totales"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="Pagado"
                    fill="#3b82f6"
                    name="Dinero Pagado"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Trabajos"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Trabajos Realizados"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
