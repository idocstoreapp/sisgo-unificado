"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import { currentMonthRange, currentWeekRange, formatDate, dateStringToUTCStart, dateStringToUTCEnd } from "@/lib/date";
import type { Branch, BranchExpensesSummary } from "@/types";
import SmallExpenses from "./SmallExpenses";
import GeneralExpenses from "./GeneralExpenses";
import KpiCard from "./KpiCard";

interface BranchExpensesPageProps {
  userRole?: string;
  refreshKey?: number;
  isAdmin?: boolean;
}

export default function BranchExpensesPage({ userRole = "admin", refreshKey = 0, isAdmin = false }: BranchExpensesPageProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branchSummary, setBranchSummary] = useState<BranchExpensesSummary | null>(null);
  const [globalSummary, setGlobalSummary] = useState({
    total_small_expenses: 0,
    total_general_expenses: 0,
    total_repuestos: 0,
    total_pagos_tecnicos: 0,
    total_pagos_encargados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [encargadoBranchId, setEncargadoBranchId] = useState<string | null>(null);

  // Filtros de fecha
  const currentMonth = currentMonthRange();
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [dateRange, setDateRange] = useState({
    start: currentMonth.start.toISOString().split("T")[0],
    end: currentMonth.end.toISOString().split("T")[0],
  });

  const combinedRefreshKey = refreshKey + localRefreshKey;

  // Calcular fechas de filtro
  const getFilterDates = () => {
    if (filterMode === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      // Último día del mes: new Date(año, mes, 0) da el último día del mes anterior
      // Entonces new Date(año, mesActual+1, 0) da el último día del mes actual
      const lastDayOfMonth = new Date(year, month, 0);
      const end = new Date(year, month - 1, lastDayOfMonth.getDate(), 23, 59, 59, 999);
      
      // Formatear fechas sin convertir a UTC (para evitar cambios de día por zona horaria)
      const formatDateLocal = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };
      
      const result = {
        start: formatDateLocal(start),
        end: formatDateLocal(end),
        startDate: start,
        endDate: end,
      };
      console.log(`[getFilterDates] Mes seleccionado: ${selectedMonth}`, result);
      return result;
    } else {
      return {
        start: dateRange.start,
        end: dateRange.end,
        startDate: new Date(dateRange.start),
        endDate: new Date(dateRange.end + "T23:59:59"),
      };
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      loadBranches();
      loadGlobalSummary();
    } else {
      // Encargado: cargar solo su sucursal
      loadEncargadoBranch();
    }
  }, [combinedRefreshKey, userRole, filterMode, selectedMonth, dateRange]);

  useEffect(() => {
    if (userRole === "admin" && selectedBranch) {
      loadBranchSummary(selectedBranch);
    } else if (userRole === "encargado" && encargadoBranchId) {
      loadBranchSummary(encargadoBranchId);
    }
  }, [selectedBranch, encargadoBranchId, combinedRefreshKey, filterMode, selectedMonth, dateRange, userRole]);

  async function loadBranches() {
    setLoading(true);
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error cargando sucursales:", error);
    } else {
      setBranches(data || []);
      if (data && data.length > 0 && !selectedBranch) {
        setSelectedBranch(data[0].id);
      }
    }
    setLoading(false);
  }

  async function loadEncargadoBranch() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("users")
        .select("branch_id")
        .eq("id", user.id)
        .single();

      if (profileData?.branch_id) {
        setEncargadoBranchId(profileData.branch_id);
        const { data: branchData } = await supabase
          .from("branches")
          .select("*")
          .eq("id", profileData.branch_id)
          .single();
        
        if (branchData) {
          setBranches([branchData]);
        }
      }
    } catch (err) {
      console.error("Error cargando sucursal del encargado:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadGlobalSummary() {
    try {
      const { start, end } = getFilterDates();

      // Gastos hormiga (todas las sucursales) - filtrado por fecha
      const { data: smallExpenses } = await supabase
        .from("small_expenses")
        .select("amount")
        .gte("expense_date", start)
        .lte("expense_date", end);

      const total_small_expenses = (smallExpenses || []).reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0
      );

      // Gastos generales (todas las sucursales) - filtrado por fecha
      const { data: generalExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", start)
        .lte("expense_date", end);

      const total_general_expenses = (generalExpenses || []).reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0
      );

      // Repuestos (de órdenes pagadas, todas las sucursales) - filtrado por paid_at del mes
      const { data: orders } = await supabase
        .from("work_orders")
        .select("replacement_cost, paid_at")
        .not("paid_at", "is", null)
        .gte("paid_at", start + "T00:00:00")
        .lte("paid_at", end + "T23:59:59");

      const total_repuestos = (orders || []).reduce(
        (sum, order) => sum + (order.replacement_cost || 0),
        0
      );

      // Pagos a técnicos: resumen calculado desde comisiones de órdenes pendientes/pagadas en el rango
      
      // Obtener todos los técnicos de todas las sucursales
      const { data: allTechnicians, error: allTechniciansError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "technician");

      if (allTechniciansError) {
        console.error("Error cargando técnicos para resumen global:", allTechniciansError);
      }

      const technicianIds = (allTechnicians || []).map((u) => u.id);
      let total_pagos_tecnicos = 0;
      if (technicianIds.length > 0) {
        // Calcular desde pagos de empleados en el rango de fechas
        // IMPORTANTE: Simplificar la consulta - solo buscar en el rango de paid_at
        const startUTC = dateStringToUTCStart(start);
        const endUTC = dateStringToUTCEnd(end);
        
        // Buscar pagos registrados en el rango
        let { data: paidOrders, error: ordersError } = await supabase
          .from("employee_payments")
          .select("commission_amount")
          .in("technician_id", technicianIds)
          .eq("payment_status", "paid")
          .gte("paid_at", startUTC.toISOString())
          .lte("paid_at", endUTC.toISOString());

        if (ordersError) {
          console.error("Error cargando pagos técnicos globales, intentando consulta simple:", ordersError);
          // Fallback: intentar sin filtro de rango
          const fallbackResult = await supabase
            .from("employee_payments")
            .select("commission_amount")
            .in("technician_id", technicianIds)
            .eq("payment_status", "paid");
          paidOrders = fallbackResult.data;
          ordersError = fallbackResult.error;
        }

        if (ordersError) {
          console.error("Error cargando pagos técnicos globales (fallback):", ordersError);
        }

        // Sumar comisiones de pagos (total por pagar/pagado a técnicos)
        total_pagos_tecnicos = (paidOrders || []).reduce(
          (sum, order) => sum + (order.commission_amount || 0),
          0
        );

        console.log(`[BranchExpensesPage] Pagos técnicos global (calculado desde employee_payments):`, {
          start,
          end,
          technicianIds: technicianIds.length,
          paidOrdersCount: paidOrders?.length || 0,
          total: total_pagos_tecnicos
        });
      }

      // Pagos a encargados (de salary_settlements) - filtrado por fecha seleccionada
      const { data: allEncargados, error: allEncargadosError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "encargado");

      if (allEncargadosError) {
        console.error("Error cargando encargados para resumen global:", allEncargadosError);
      }

      const encargadoIds = (allEncargados || []).map((u) => u.id);
      let total_pagos_encargados = 0;
      if (encargadoIds.length > 0) {
        // Usar funciones helper para evitar problemas de zona horaria
        const startUTC = dateStringToUTCStart(start);
        const endUTC = dateStringToUTCEnd(end);
        const { data: settlements } = await supabase
          .from("salary_settlements")
          .select("amount, week_start, created_at")
          .in("technician_id", encargadoIds)
          .gte("created_at", startUTC.toISOString())
          .lte("created_at", endUTC.toISOString());

        total_pagos_encargados = (settlements || []).reduce(
          (sum, s) => sum + (s.amount || 0),
          0
        );
      }

      setGlobalSummary({
        total_small_expenses,
        total_general_expenses,
        total_repuestos,
        total_pagos_tecnicos,
        total_pagos_encargados,
      });
    } catch (err) {
      console.error("Error cargando resumen global:", err);
    }
  }

  async function loadBranchSummary(branchId: string) {
    setLoadingSummary(true);
    try {
      const { start, end } = getFilterDates();

      // Gastos hormiga de la sucursal - filtrado por fecha
      const { data: smallExpenses } = await supabase
        .from("small_expenses")
        .select("amount, category")
        .eq("branch_id", branchId)
        .gte("expense_date", start)
        .lte("expense_date", end);

      const smallExpensesByType: Record<string, number> = {};
      (smallExpenses || []).forEach((exp) => {
        const tipo = exp.category || "otros";
        smallExpensesByType[tipo] = (smallExpensesByType[tipo] || 0) + (exp.amount || 0);
      });

      // Gastos generales de la sucursal - filtrado por fecha
      const { data: generalExpenses } = await supabase
        .from("expenses")
        .select("amount, category")
        .eq("branch_id", branchId)
        .gte("expense_date", start)
        .lte("expense_date", end);

      const generalExpensesByType: Record<string, number> = {};
      (generalExpenses || []).forEach((exp) => {
        const tipo = exp.category || "otros";
        generalExpensesByType[tipo] = (generalExpensesByType[tipo] || 0) + (exp.amount || 0);
      });

      // Repuestos de la sucursal (de órdenes pagadas) - filtrado por paid_at del mes
      const { data: orders } = await supabase
        .from("work_orders")
        .select("replacement_cost, paid_at")
        .eq("branch_id", branchId)
        .not("paid_at", "is", null)
        .gte("paid_at", start + "T00:00:00")
        .lte("paid_at", end + "T23:59:59");

      const total_repuestos = (orders || []).reduce(
        (sum, order) => sum + (order.replacement_cost || 0),
        0
      );

      // Pagos a técnicos de la sucursal - CALCULADO DESDE ÓRDENES PAGADAS
      const { data: branchTechnicians, error: branchTechniciansError } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", branchId)
        .eq("role", "technician");

      if (branchTechniciansError) {
        console.error("Error cargando técnicos de sucursal:", branchTechniciansError);
      }

      const technicianIds = (branchTechnicians || []).map((u) => u.id);
      let total_pagos_tecnicos = 0;
      if (technicianIds.length > 0) {
        // Calcular desde pagos de empleados en el rango de fechas
        // IMPORTANTE: Simplificar - solo buscar en el rango de paid_at
        const startUTC = dateStringToUTCStart(start);
        const endUTC = dateStringToUTCEnd(end);
        
        // Buscar pagos registrados en el rango de técnicos de esta sucursal
        let { data: paidOrders, error: ordersError } = await supabase
          .from("employee_payments")
          .select("commission_amount")
          .in("technician_id", technicianIds)
          .eq("payment_status", "paid")
          .gte("paid_at", startUTC.toISOString())
          .lte("paid_at", endUTC.toISOString());

        if (ordersError) {
          console.error("Error cargando pagos técnicos de sucursal, intentando consulta simple:", ordersError);
          // Fallback: intentar sin filtro de rango
          const fallbackResult = await supabase
            .from("employee_payments")
            .select("commission_amount")
            .in("technician_id", technicianIds)
            .eq("payment_status", "paid");
          paidOrders = fallbackResult.data;
          ordersError = fallbackResult.error;
        }

        if (ordersError) {
          console.error("Error cargando pagos técnicos de sucursal (fallback):", ordersError);
        }

        // Sumar comisiones de pagos
        total_pagos_tecnicos = (paidOrders || []).reduce(
          (sum, order) => sum + (order.commission_amount || 0),
          0
        );

        console.log(`[BranchExpensesPage] Pagos técnicos sucursal ${branchId} (calculado desde employee_payments):`, {
          start,
          end,
          technicianIdsCount: technicianIds.length,
          paidOrdersCount: paidOrders?.length || 0,
          total: total_pagos_tecnicos
        });
      }

      // Pagos a encargados de la sucursal - filtrado por fecha seleccionada
      const { data: branchEncargados, error: branchEncargadosError } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", branchId)
        .eq("role", "encargado");

      if (branchEncargadosError) {
        console.error("Error cargando encargados de sucursal:", branchEncargadosError);
      }

      const encargadoIds = (branchEncargados || []).map((u) => u.id);
      let total_pagos_encargados = 0;
      if (encargadoIds.length > 0) {
        // Usar funciones helper para evitar problemas de zona horaria
        const startUTC = dateStringToUTCStart(start);
        const endUTC = dateStringToUTCEnd(end);
        const { data: settlements } = await supabase
          .from("salary_settlements")
          .select("amount, week_start, created_at")
          .in("technician_id", encargadoIds)
          .gte("created_at", startUTC.toISOString())
          .lte("created_at", endUTC.toISOString());

        total_pagos_encargados = (settlements || []).reduce(
          (sum, s) => sum + (s.amount || 0),
          0
        );
      }

      setBranchSummary({
        total_small_expenses: Object.values(smallExpensesByType).reduce((a, b) => a + b, 0),
        small_expenses_by_type: smallExpensesByType,
        total_general_expenses: Object.values(generalExpensesByType).reduce((a, b) => a + b, 0),
        general_expenses_by_type: generalExpensesByType,
        total_repuestos,
        total_pagos_tecnicos,
        total_pagos_encargados,
      });
    } catch (err) {
      console.error("Error cargando resumen de sucursal:", err);
    } finally {
      setLoadingSummary(false);
    }
  }

  const handleRefresh = () => {
    setLocalRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  const filterDates = getFilterDates();
  const filterLabel = filterMode === "month" 
    ? `Mes: ${new Date(filterDates.startDate).toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`
    : `Rango: ${formatDate(filterDates.startDate)} - ${formatDate(filterDates.endDate)}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {userRole === "admin" 
            ? "Gestión de Sucursales y Gastos"
            : "Gastos Hormiga de tu Sucursal"}
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          {userRole === "admin"
            ? "Administra sucursales, gastos hormiga, gastos generales y visualiza KPIs por sucursal"
            : "Gestiona los gastos hormiga de tu sucursal"}
        </p>
      </div>

      {/* Filtros de Fecha (solo admin) */}
      {userRole === "admin" && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Filtros de Período</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Modo de Filtro
              </label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
              >
                <option value="month">Por Mes</option>
                <option value="range">Por Rango de Fechas</option>
              </select>
            </div>

            {filterMode === "month" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleccionar Mes
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={() => {
                  const currentMonth = currentMonthRange();
                  setFilterMode("month");
                  setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
                  setDateRange({
                    start: currentMonth.start.toISOString().split("T")[0],
                    end: currentMonth.end.toISOString().split("T")[0],
                  });
                }}
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition font-medium"
              >
                Mes Actual
              </button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-brand-light/10 rounded-md">
            <p className="text-sm font-medium text-slate-700">
              📅 Período seleccionado: <span className="text-brand">{filterLabel}</span>
            </p>
          </div>
        </div>
      )}

      {/* KPIs Globales (solo admin) */}
      {userRole === "admin" && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Resumen Global</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              title="Total Gastos Hormiga"
              value={formatCLP(globalSummary.total_small_expenses)}
              icon="🐜"
            />
            <KpiCard
              title="Total Gastos Generales"
              value={formatCLP(globalSummary.total_general_expenses)}
              icon="🏢"
            />
            <KpiCard
              title="Total Repuestos"
              value={formatCLP(globalSummary.total_repuestos)}
              icon="🔧"
            />
            <KpiCard
              title="Total Pagos Técnicos"
              value={formatCLP(globalSummary.total_pagos_tecnicos)}
              icon="👨‍🔧"
            />
          </div>
        </div>
      )}

      {/* Selector de Sucursal (solo admin) */}
      {userRole === "admin" && branches.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Seleccionar Sucursal
          </label>
          <select
            value={selectedBranch || ""}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full md:w-64 border border-slate-300 rounded-md px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {selectedBranch && (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">Sucursal seleccionada:</span>{" "}
              {branches.find((b) => b.id === selectedBranch)?.name || "N/A"}
            </p>
          )}
        </div>
      )}

      {/* KPIs de Sucursal Seleccionada (solo admin) */}
      {userRole === "admin" && selectedBranch && branchSummary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Resumen de Sucursal
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">{branches.find((b) => b.id === selectedBranch)?.name || "N/A"}</span>
          </p>
          {loadingSummary ? (
            <p className="text-slate-600">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                title="Gastos Hormiga"
                value={formatCLP(branchSummary.total_small_expenses)}
                icon="🐜"
              />
              <KpiCard
                title="Gastos Generales"
                value={formatCLP(branchSummary.total_general_expenses)}
                icon="🏢"
              />
              <KpiCard
                title="Repuestos"
                value={formatCLP(branchSummary.total_repuestos)}
                icon="🔧"
              />
              <KpiCard
                title="Pagos Técnicos"
                value={formatCLP(branchSummary.total_pagos_tecnicos)}
                icon="👨‍🔧"
              />
            </div>
          )}
        </div>
      )}

      {/* Componentes de Gastos */}
      {userRole === "admin" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gastos Hormiga */}
          {selectedBranch ? (
            <SmallExpenses
              sucursalId={selectedBranch}
              refreshKey={combinedRefreshKey}
              dateFilter={filterDates}
              userRole={userRole}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-slate-600">Selecciona una sucursal para ver gastos hormiga</p>
            </div>
          )}

          {/* Gastos Generales */}
          {selectedBranch ? (
            <GeneralExpenses
              sucursalId={selectedBranch}
              refreshKey={combinedRefreshKey}
              dateFilter={filterDates}
              userRole={userRole}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-slate-600">Selecciona una sucursal para ver gastos generales</p>
            </div>
          )}
        </div>
      ) : (
        // Encargado: puede ver/agregar gastos hormiga y generales de su sucursal
        encargadoBranchId ? (
          <>
            <SmallExpenses
              sucursalId={encargadoBranchId}
              refreshKey={combinedRefreshKey}
              dateFilter={filterDates}
              userRole={userRole}
            />
            <GeneralExpenses
              sucursalId={encargadoBranchId}
              refreshKey={combinedRefreshKey}
              dateFilter={filterDates}
              userRole={userRole}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600">No tienes una sucursal asignada.</p>
          </div>
        )
      )}

      {/* Botón para refrescar */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-brand-light text-white rounded-md hover:bg-brand transition font-medium"
        >
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  );
}
