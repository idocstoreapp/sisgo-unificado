"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import type { GeneralExpense, Branch, Profile } from "@/types";

interface GeneralExpensesProps {
  sucursalId?: string; // Opcional: si se pasa, filtra por sucursal
  refreshKey?: number;
  dateFilter?: {
    start: string;
    end: string;
    startDate: Date;
    endDate: Date;
  };
  userRole?: string; // Para permitir edición/eliminación solo a admins
}

export default function GeneralExpenses({ sucursalId, refreshKey = 0, dateFilter, userRole }: GeneralExpensesProps) {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allCustomTypes, setAllCustomTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GeneralExpense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    branch_id: sucursalId || "",
    tipo: "arriendo",
    tipoPersonalizado: "",
    usarTipoPersonalizado: false,
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    payment_method: "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = userRole === "admin";

  useEffect(() => {
    loadData();
  }, [sucursalId, refreshKey, dateFilter, showAllHistory, localDateFilter]);

  // Sincronizar formData.branch_id con sucursalId cuando cambia (solo si no estamos editando)
  useEffect(() => {
    if (sucursalId && !editingExpense) {
      setFormData(prev => ({
        ...prev,
        branch_id: sucursalId
      }));
    }
  }, [sucursalId, editingExpense]);

  async function loadData() {
    setLoading(true);
    try {
      // Cargar sucursales primero
      const { data: branchesData } = await supabase
        .from("branches")
        .select("*")
        .order("name");

      setBranches(branchesData || []);

      // Cargar gastos generales
      let query = supabase
        .from("general_expenses")
        .select(`
          *,
          branch:branches(*),
          user:users(id, name, email)
        `);

      if (sucursalId) {
        query = query.eq("branch_id", sucursalId);
      }

      // Aplicar filtros de fecha
      if (!showAllHistory) {
        if (localDateFilter) {
          query = query.gte("fecha", localDateFilter.start).lte("fecha", localDateFilter.end);
        } else if (dateFilter) {
          query = query.gte("fecha", dateFilter.start).lte("fecha", dateFilter.end);
        }
      }

      const { data: expensesData, error: expensesError } = await query
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;

      setExpenses(expensesData || []);

      // Cargar todos los tipos personalizados únicos (sin filtro de fecha para que siempre estén disponibles)
      let allExpensesQuery = supabase
        .from("general_expenses")
        .select("tipo");
      
      if (sucursalId) {
        allExpensesQuery = allExpensesQuery.eq("branch_id", sucursalId);
      }

      const { data: allExpensesData } = await allExpensesQuery;

      const tiposUnicos = Array.from(new Set((allExpensesData || []).map(exp => exp.tipo))).filter(Boolean);
      const tiposPredefinidos = ["arriendo", "internet", "luz", "agua", "facturas", "servicios"];
      const tiposPersonalizados = tiposUnicos.filter(tipo => !tiposPredefinidos.includes(tipo));
      setAllCustomTypes(tiposPersonalizados);
    } catch (err) {
      console.error("Error cargando gastos generales:", err);
      setError("Error al cargar los gastos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (editingExpense) {
      await handleUpdate(e);
      return;
    }

    if (!formData.branch_id) {
      setError("Debes seleccionar una sucursal");
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const tipoFinal = formData.usarTipoPersonalizado 
        ? formData.tipoPersonalizado.trim() 
        : formData.tipo;

      if (!tipoFinal || tipoFinal.length === 0) {
        setError("Debes seleccionar o ingresar un tipo de gasto");
        return;
      }

      const { error: insertError } = await supabase
        .from("general_expenses")
        .insert({
          branch_id: formData.branch_id,
          user_id: user.id,
          tipo: tipoFinal,
          monto: parseFloat(formData.monto),
          fecha: formData.fecha,
          descripcion: formData.descripcion.trim() || null,
          payment_method: formData.payment_method,
        });

      if (insertError) throw insertError;

      // Limpiar formulario
      setFormData({
        branch_id: sucursalId || "",
        tipo: "arriendo",
        tipoPersonalizado: "",
        usarTipoPersonalizado: false,
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        payment_method: "EFECTIVO",
      });
      setShowForm(false);
      setEditingExpense(null);
      await loadData();
    } catch (err: any) {
      console.error("Error guardando gasto:", err);
      // Mostrar mensaje de error más descriptivo
      if (err.message && err.message.includes("constraint")) {
        setError("Error: El tipo de gasto no es válido. Asegúrate de ingresar un tipo válido o contacta al administrador para actualizar los permisos de tipos personalizados.");
      } else {
        setError(err.message || "Error al guardar el gasto. Intenta nuevamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(expense: GeneralExpense) {
    setEditingExpense(expense);
    const tipoEsPersonalizado = !["arriendo", "internet", "luz", "agua", "facturas", "servicios"].includes(expense.tipo);
    setFormData({
      branch_id: expense.branch_id,
      tipo: tipoEsPersonalizado ? "arriendo" : expense.tipo,
      tipoPersonalizado: tipoEsPersonalizado ? expense.tipo : "",
      usarTipoPersonalizado: tipoEsPersonalizado,
      monto: expense.monto.toString(),
      fecha: expense.fecha,
      descripcion: expense.descripcion || "",
      payment_method: expense.payment_method || "EFECTIVO",
    });
    setShowForm(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpense) return;

    setError(null);

    if (!formData.branch_id) {
      setError("Debes seleccionar una sucursal");
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const tipoFinal = formData.usarTipoPersonalizado 
        ? formData.tipoPersonalizado.trim() 
        : formData.tipo;

      if (!tipoFinal || tipoFinal.length === 0) {
        setError("Debes seleccionar o ingresar un tipo de gasto");
        return;
      }

      const { error: updateError } = await supabase
        .from("general_expenses")
        .update({
          branch_id: formData.branch_id,
          tipo: tipoFinal,
          monto: parseFloat(formData.monto),
          fecha: formData.fecha,
          descripcion: formData.descripcion.trim() || null,
          payment_method: formData.payment_method,
        })
        .eq("id", editingExpense.id);

      if (updateError) throw updateError;

      setShowForm(false);
      setEditingExpense(null);
      setFormData({
        branch_id: sucursalId || "",
        tipo: "arriendo",
        tipoPersonalizado: "",
        usarTipoPersonalizado: false,
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        payment_method: "EFECTIVO",
      });
      await loadData();
    } catch (err: any) {
      console.error("Error actualizando gasto:", err);
      setError(err.message || "Error al actualizar el gasto. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.")) {
      return;
    }

    setDeletingExpenseId(expenseId);
    try {
      const { error: deleteError } = await supabase
        .from("general_expenses")
        .delete()
        .eq("id", expenseId);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err: any) {
      console.error("Error eliminando gasto:", err);
      setError(err.message || "Error al eliminar el gasto. Intenta nuevamente.");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  const totalByType = expenses.reduce((acc, exp) => {
    const tipo = exp.tipo || "otros";
    acc[tipo] = (acc[tipo] || 0) + exp.monto;
    return acc;
  }, {} as Record<string, number>);

  // Usar los tipos personalizados cargados (sin filtro de fecha)
  const tiposPersonalizados = allCustomTypes;

  const total = expenses.reduce((sum, exp) => sum + exp.monto, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-slate-600">Cargando gastos generales...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-slate-900">
          Gastos Generales {sucursalId ? "(Filtrado por Sucursal)" : "(Todas las Sucursales)"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className={`px-3 py-2 rounded-md transition font-medium text-sm ${
              showAllHistory
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {showAllHistory ? "📅 Ver Filtrado" : "📋 Ver Todo el Historial"}
          </button>
          <button
            onClick={() => {
              if (!showForm) {
                // Al abrir el formulario, asegurar que branch_id esté sincronizado
                setFormData(prev => ({
                  ...prev,
                  branch_id: sucursalId || prev.branch_id
                }));
              }
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition font-medium"
          >
            {showForm ? "Cancelar" : "+ Nuevo Gasto"}
          </button>
        </div>
      </div>

      {/* Filtro de fecha local (solo si showAllHistory está activo) */}
      {showAllHistory && (
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-700">Filtrar por rango de fechas:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Desde</label>
              <input
                type="date"
                value={localDateFilter?.start || ""}
                onChange={(e) =>
                  setLocalDateFilter({
                    start: e.target.value,
                    end: localDateFilter?.end || e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Hasta</label>
              <input
                type="date"
                value={localDateFilter?.end || ""}
                onChange={(e) =>
                  setLocalDateFilter({
                    start: localDateFilter?.start || e.target.value,
                    end: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded-md px-2 py-1 text-sm"
              />
            </div>
          </div>
          {localDateFilter && (
            <button
              onClick={() => setLocalDateFilter(null)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg space-y-4">
          {editingExpense && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <p className="text-sm text-blue-800 font-medium">
                ✏️ Editando gasto del {formatDate(editingExpense.fecha)} - {formatCLP(editingExpense.monto)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setFormData({
                    branch_id: sucursalId || "",
                    tipo: "arriendo",
                    tipoPersonalizado: "",
                    usarTipoPersonalizado: false,
                    monto: "",
                    fecha: new Date().toISOString().split("T")[0],
                    descripcion: "",
                    payment_method: "EFECTIVO",
                  });
                }}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                Cancelar edición
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!sucursalId ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sucursal *
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sucursal
                </label>
                <div className="w-full border border-slate-300 rounded-md px-3 py-2 bg-slate-100 text-slate-700">
                  {branches.find(b => b.id === sucursalId)?.name || "Sucursal seleccionada"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  La sucursal está determinada por la selección en la parte superior
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Gasto *
              </label>
              <div className="space-y-2">
                <select
                  value={formData.usarTipoPersonalizado ? "personalizado" : formData.tipo}
                  onChange={(e) => {
                    if (e.target.value === "personalizado") {
                      setFormData({ ...formData, usarTipoPersonalizado: true });
                    } else {
                      setFormData({ ...formData, tipo: e.target.value, usarTipoPersonalizado: false });
                    }
                  }}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                  required
                >
                  <optgroup label="Tipos Predefinidos">
                    <option value="arriendo">Arriendo</option>
                    <option value="internet">Internet</option>
                    <option value="luz">Luz</option>
                    <option value="agua">Agua</option>
                    <option value="facturas">Facturas</option>
                    <option value="servicios">Servicios</option>
                  </optgroup>
                  {tiposPersonalizados.length > 0 && (
                    <optgroup label="Tipos Personalizados">
                      {tiposPersonalizados.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Nuevo">
                    <option value="personalizado">+ Otro (Personalizado)</option>
                  </optgroup>
                </select>
                {formData.usarTipoPersonalizado && (
                  <input
                    type="text"
                    value={formData.tipoPersonalizado}
                    onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                    placeholder="Ingresa el tipo de gasto"
                    required
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Monto (CLP) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.monto ? formatCLPInput(parseCLPInput(formData.monto)) : ""}
                onChange={(e) => {
                  const parsed = parseCLPInput(e.target.value);
                  setFormData({ ...formData, monto: parsed > 0 ? parsed.toString() : "" });
                }}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
                placeholder="Ej: Pago de factura de servicios"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Medio de Pago *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO" })}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
                required
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-brand-light text-white rounded-md hover:bg-brand transition font-medium disabled:opacity-50"
          >
            {saving ? (editingExpense ? "Actualizando..." : "Guardando...") : (editingExpense ? "Actualizar Gasto" : "Guardar Gasto")}
          </button>
        </form>
      )}

      {/* Resumen por tipo */}
      <div className="space-y-4">
        {/* Tipos predefinidos - Layout mejorado */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-600 mb-2 leading-tight">Arriendo</p>
            <p className="text-base font-bold text-slate-900 leading-tight break-words">
              {formatCLP(totalByType["arriendo"] || 0)}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-600 mb-2 leading-tight">Internet</p>
            <p className="text-base font-bold text-slate-900 leading-tight break-words">
              {formatCLP(totalByType["internet"] || 0)}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-600 mb-2 leading-tight">Luz</p>
            <p className="text-base font-bold text-slate-900 leading-tight break-words">
              {formatCLP(totalByType["luz"] || 0)}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-600 mb-2 leading-tight">Agua</p>
            <p className="text-base font-bold text-slate-900 leading-tight break-words">
              {formatCLP(totalByType["agua"] || 0)}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg shadow-sm border border-slate-200 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-600 mb-2 leading-tight">
              Facturas/<br />Servicios
            </p>
            <p className="text-base font-bold text-slate-900 leading-tight break-words">
              {formatCLP((totalByType["facturas"] || 0) + (totalByType["servicios"] || 0))}
            </p>
          </div>
          <div className="bg-brand-light/10 p-4 rounded-lg border-2 border-brand-light shadow-sm min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-700 mb-2 leading-tight">Total</p>
            <p className="text-base font-bold text-brand leading-tight break-words">
              {formatCLP(total)}
            </p>
          </div>
        </div>
        
        {/* Tipos personalizados */}
        {tiposPersonalizados.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Tipos Personalizados:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tiposPersonalizados.map((tipo) => (
                <div key={tipo} className="bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm min-h-[100px] flex flex-col justify-between">
                  <p className="text-xs font-semibold text-slate-700 mb-2 leading-tight break-words">{tipo}</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">
                    {formatCLP(totalByType[tipo] || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabla de gastos */}
      {/* Vista de Cards para Móvil */}
      <div className="lg:hidden space-y-3">
        {expenses.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
            No hay gastos registrados
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-0.5">Fecha</div>
                  <div className="text-sm font-medium text-slate-900">{formatDate(exp.fecha)}</div>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  {exp.tipo === "arriendo" ? "Arriendo" :
                   exp.tipo === "internet" ? "Internet" :
                   exp.tipo === "luz" ? "Luz" :
                   exp.tipo === "agua" ? "Agua" :
                   exp.tipo === "facturas" ? "Facturas" :
                   exp.tipo === "servicios" ? "Servicios" :
                   exp.tipo}
                </span>
              </div>
              <div className="mb-2">
                <div className="text-xs text-slate-500 mb-0.5">Sucursal</div>
                <div className="text-sm text-slate-900">{(exp.branch as Branch)?.name || "N/A"}</div>
              </div>
              <div className="mb-2">
                <div className="text-xs text-slate-500 mb-0.5">Descripción</div>
                <div className="text-sm text-slate-900">{exp.descripcion || "-"}</div>
              </div>
              <div className="mb-2">
                <div className="text-xs text-slate-500 mb-0.5">Medio de Pago</div>
                <div className="text-sm font-medium text-slate-900">
                  {exp.payment_method === "EFECTIVO" ? "💵 Efectivo" :
                   exp.payment_method === "TRANSFERENCIA" ? "🏦 Transferencia" :
                   exp.payment_method === "DEBITO" ? "💳 Débito" :
                   exp.payment_method === "CREDITO" ? "💳 Crédito" : exp.payment_method || "-"}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Registrado por: <span className="text-slate-900">{(exp.user as Profile)?.name || "N/A"}</span>
                </div>
                <div className="text-base font-bold text-brand">{formatCLP(exp.monto)}</div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deletingExpenseId === exp.id}
                    className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {deletingExpenseId === exp.id ? "Eliminando..." : "🗑️ Eliminar"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vista de Tabla para Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Fecha</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Sucursal</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Tipo</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Descripción</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Medio de Pago</th>
              <th className="text-right py-2 px-2 font-semibold text-slate-700">Monto</th>
              <th className="text-left py-2 px-2 font-semibold text-slate-700">Registrado por</th>
              {isAdmin && <th className="text-left py-2 px-2 font-semibold text-slate-700">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center py-4 text-slate-500">
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2">{formatDate(exp.fecha)}</td>
                  <td className="py-2 px-2">
                    {(exp.branch as Branch)?.name || "N/A"}
                  </td>
                  <td className="py-2 px-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {exp.tipo === "arriendo" ? "Arriendo" :
                       exp.tipo === "internet" ? "Internet" :
                       exp.tipo === "luz" ? "Luz" :
                       exp.tipo === "agua" ? "Agua" :
                       exp.tipo === "facturas" ? "Facturas" :
                       exp.tipo === "servicios" ? "Servicios" :
                       exp.tipo}
                    </span>
                  </td>
                  <td className="py-2 px-2">{exp.descripcion || "-"}</td>
                  <td className="py-2 px-2">
                    <span className="text-xs font-medium">
                      {exp.payment_method === "EFECTIVO" ? "💵 Efectivo" :
                       exp.payment_method === "TRANSFERENCIA" ? "🏦 Transferencia" :
                       exp.payment_method === "DEBITO" ? "💳 Débito" :
                       exp.payment_method === "CREDITO" ? "💳 Crédito" : exp.payment_method || "-"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-medium">{formatCLP(exp.monto)}</td>
                  <td className="py-2 px-2 text-xs text-slate-600">
                    {(exp.user as Profile)?.name || "N/A"}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingExpenseId === exp.id}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                        >
                          {deletingExpenseId === exp.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


