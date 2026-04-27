"use client";
import { useState, useEffect, useRef, Fragment, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import type { Customer, Service, DeviceChecklistItem, DeviceType, User } from "@/types";
import { detectDeviceTypeWithCustom, getSmartSuggestions } from "@/lib/deviceDatabase";
import {
  buildDeviceDisplayName,
  ensureCatalogChain,
  fetchCatalogSnapshot,
  type CatalogSnapshot,
} from "@/lib/device-catalog";

import DeviceChecklist from "../DeviceChecklist";
import CustomerSearch from "../CustomerSearch";
import PatternDrawer from "../PatternDrawer";
import PatternViewer from "../PatternViewer";
import ServiceSelector from "../ServiceSelector";
import PDFPreview from "../PDFPreview";

import { useOrderWizard } from "./OrderWizardContext";
import { useOrderSubmit } from "./useOrderSubmit";
import {
  Check,
  CircleHelp,
  Grip,
  KeyRound,
  Lock,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Wrench,
  Inbox,
} from "lucide-react";

interface OrderWizardContentProps {
  onSaved: () => void;
}

interface DeviceCatalogCard {
  id: number;
  device_type_id: number;
  brand_id: number;
  product_line_id: number;
  model_id: number;
  variant_id: number | null;
  display_name: string;
  image_url: string | null;
  is_active: boolean;
}
function AdaptiveWizardCardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mb-2 flex h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm md:h-64 lg:h-72">
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" loading="lazy" />
    </div>
  );
}

// Interfaz para un equipo individual
interface DeviceItem {
  id: string; // ID único para cada equipo
  deviceType: DeviceType | null;
  deviceModel: string;
  deviceSerial: string;
  unlockType: "code" | "pattern" | "none";
  deviceUnlockCode: string;
  deviceUnlockPattern: number[];
  problemDescription: string;
  checklistData: Record<string, string>;
  selectedServices: Service[];
  replacementCost: number;
  serviceValue: number; // DEPRECADO: mantener por compatibilidad, usar servicePrices en su lugar
  servicePrices: Record<string, number>; // Mapa de precios: serviceId -> price
}

export default function OrderWizardContent({ onSaved }: { onSaved: () => void }) {
  const context = useOrderWizard();
  const {
    technicianId,
    selectedCustomer,
    setSelectedCustomer,
    devices,
    priority,
    setPriority,
    commitmentDate,
    setCommitmentDate,
    warrantyDays,
    setWarrantyDays,
    responsibleUserName,
    setResponsibleUserName,
    updateDevice,
    resetDevice,
    addNewDevice,
    removeDevice,
    wizardStepByDevice,
    setWizardStepByDevice,
    flowStepByDevice,
    setFlowStepByDevice,
    finalizedDeviceById,
    setFinalizedDeviceById,
    manualEntryByDevice,
    setManualEntryByDevice,
    selectedBrandByDevice,
    setSelectedBrandByDevice,
    selectedSeriesByDevice,
    setSelectedSeriesByDevice,
    selectedModelByDevice,
    setSelectedModelByDevice,
    selectedVariantByDevice,
    setSelectedVariantByDevice,
    customCatalogFormByDevice,
    setCustomCatalogFormByDevice,
    detailsOpenByDevice,
    setDetailsOpenByDevice,
    serialFieldOpenByDevice,
    setSerialFieldOpenByDevice,
    unlockFieldOpenByDevice,
    setUnlockFieldOpenByDevice,
    manualEditOpenByDevice,
    setManualEditOpenByDevice,
    showPatternDrawer,
    setShowPatternDrawer,
    showDeviceCategoryModal,
    setShowDeviceCategoryModal,
    catalog,
    catalogCards,
    catalogLoaded,
    customDeviceTypes,
    recentDeviceModels,
    deviceSuggestions,
    setDeviceSuggestions,
    showDeviceSuggestions,
    setShowDeviceSuggestions,
    loading,
    setLoading,
    isSubmitting,
    setIsSubmitting,
    responsibleUsers,
    setResponsibleUsers,
    loadingResponsibleUsers,
    setLoadingResponsibleUsers,
    orderStep,
    setOrderStep,
    showPDFPreview,
    setShowPDFPreview,
    createdOrder,
    setCreatedOrder,
    createdOrderServices,
    setCreatedOrderServices,
    applyDeviceType,
    applyBrand,
    getCombinedSuggestions,
    applySuggestedModel,
    addCustomModelToCatalog,
    getTypeIdForDevice,
    getBrandsForDevice,
    getLinesForDevice,
    getModelsForDevice,
    getVariantsForModel,
    getCardImage,
    mapCatalogCodeToDeviceType,
    wizardTypeOptions,
  } = context;

  const setDevices = () => {}; // Used inside helper functions which were moved.
  const MAX_DESCRIPTION_LENGTH = 500;
  const QUICK_PROBLEM_SYMPTOMS = [
    "No enciende",
    "Pantalla dañada",
    "No carga",
    "Batería dura poco",
    "Sin señal",
    "Sin audio en llamada",
    "Lento / se reinicia",
    "Mojado",
  ];
  const getDeviceServiceTotal = (device: any): number => {
    if (!device) return 0;
    return (device.selectedServices || []).reduce((sum: number, service: any) => {
      return sum + (device.servicePrices?.[service.id] || service.price || 0);
    }, 0);
  };

  const wizardPanelRef = useRef<HTMLDivElement | null>(null);
  const deviceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const deviceSuggestionsRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeStageByDevice, setActiveStageByDevice] = useState<
    Record<string, "unlock" | "checklist" | "services">
  >({});
  const [isAddingServiceByDevice, setIsAddingServiceByDevice] = useState<Record<string, boolean>>({});
  const [savingDeviceId, setSavingDeviceId] = useState<string | null>(null);
  const [showAddDevicePrompt, setShowAddDevicePrompt] = useState(false);
  const keepScrollPosition = (fn: () => void) => {
    if (typeof window === "undefined") {
      fn();
      return;
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const currentScrollY = window.scrollY;
    fn();
    const restore = () => {
      if (wizardPanelRef.current) wizardPanelRef.current.focus({ preventScroll: true });
      window.scrollTo({ top: currentScrollY, behavior: "auto" });
    };
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 15);
      setTimeout(restore, 100);
    });
  };
  const getWizardStep = (deviceId: string): number => wizardStepByDevice[deviceId] ?? 1;
  const getFlowStep = (deviceId: string): 1 | 2 | 3 => flowStepByDevice[deviceId] ?? 1;
  const isDeviceFinalized = (deviceId: string): boolean => Boolean(finalizedDeviceById[deviceId]);
  const patternDrawerDevice = showPatternDrawer
    ? devices.find((d) => d.id === showPatternDrawer.deviceId)
    : null;
  const wizardCardButtonClass =
    "group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/60 p-2 text-left shadow-[0_18px_35px_-28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-24px_rgba(15,23,42,0.14)] min-h-[320px]";
  const wizardCardInnerTextClass = "text-sm font-semibold text-slate-900";

  // Cerrar sugerencias al hacer click fuera (para todos los equipos)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      devices.forEach((device) => {
        const inputRef = deviceInputRefs.current[device.id];
        const suggestionsRef = deviceSuggestionsRefs.current[device.id];
        if (
          inputRef &&
          suggestionsRef &&
          !inputRef.contains(event.target as Node) &&
          !suggestionsRef.contains(event.target as Node)
        ) {
          setShowDeviceSuggestions((prev) => ({ ...prev, [device.id]: false }));
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [devices.map((d) => d.id).join(",")]);

  // Cargar encargados de la sucursal cuando es una sucursal
  // Cargar responsables de la sucursal cuando es una sucursal
  useEffect(() => {
    async function loadResponsibleUsers() {
      // Verificar si es una sucursal
      if (typeof window === "undefined") return;

      const branchSessionStr = localStorage.getItem("branchSession");
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          // Si hay sesión de sucursal, cargar responsables de esa sucursal
          if (branchSession.type === "branch" && branchSession.branchId) {
            const sucursalId = branchSession.branchId;
            console.log("[OrderForm] Cargando responsables para sucursal:", sucursalId);

            setLoadingResponsibleUsers(true);

            // Primero, verificar todos los responsables para debug
            console.log(
              "[OrderForm] DEBUG - Verificando auth.uid():",
              (await supabase.auth.getUser()).data.user?.id || "NULL",
            );

            const { data: allResponsables, error: allError } = await supabase
              .from("users")
              .select("id, name, role, branch_id")
              .eq("role", "responsable");

            console.log("[OrderForm] DEBUG - Consulta todos los responsables - Error:", allError);
            console.log(
              "[OrderForm] DEBUG - Todos los responsables en el sistema:",
              allResponsables,
            );
            console.log("[OrderForm] DEBUG - Buscando responsables con branch_id:", sucursalId);
            console.log("[OrderForm] DEBUG - Tipo de sucursalId:", typeof sucursalId);

            if (allError) {
              console.error(
                "[OrderForm] ERROR CRÍTICO - No se pueden leer responsables debido a RLS:",
                allError,
              );
              console.error("[OrderForm] Código de error:", allError.code);
              console.error("[OrderForm] Mensaje:", allError.message);
              console.error("[OrderForm] Detalles:", allError.details);
              console.error("[OrderForm] Hint:", allError.hint);
            }

            // Cargar usuarios responsables asignados a esta sucursal
            const { data, error } = await supabase
              .from("users")
              .select("*")
              .eq("role", "responsable")
              .eq("branch_id", sucursalId)
              .order("name");

            if (error) {
              console.error("[OrderForm] Error cargando responsables filtrados:", error);
              console.error("[OrderForm] Código de error:", error.code);
              console.error("[OrderForm] Mensaje:", error.message);
              console.error("[OrderForm] Detalles:", error.details);
              console.error("[OrderForm] Hint:", error.hint);
              setResponsibleUsers([]);
            } else {
              console.log(
                "[OrderForm] Responsables encontrados para sucursal",
                sucursalId,
                ":",
                data?.length || 0,
              );
              if (data && data.length > 0) {
                console.log(
                  "[OrderForm] Responsables encontrados:",
                  data.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    branch_id: u.branch_id,
                    branch_id_type: typeof u.branch_id,
                  })),
                );
              } else {
                // Si no hay responsables, mostrar información de debug
                console.warn(
                  "[OrderForm] No se encontraron responsables para sucursal:",
                  sucursalId,
                );
                if (allResponsables && allResponsables.length > 0) {
                  console.warn(
                    "[OrderForm] Pero hay responsables en el sistema con estos branch_id:",
                    allResponsables.map((u: any) => ({
                      name: u.name,
                      branch_id: u.branch_id,
                      branch_id_type: typeof u.branch_id,
                      branch_id_coincide: u.branch_id === sucursalId,
                      branch_id_equals: u.branch_id == sucursalId,
                    })),
                  );
                } else {
                  console.error(
                    "[OrderForm] PROBLEMA: No se pueden leer responsables. Esto indica que las políticas RLS están bloqueando la consulta.",
                  );
                  console.error(
                    "[OrderForm] SOLUCIÓN: Ejecuta el script fix_users_rls_simple.sql en Supabase SQL Editor",
                  );
                }
              }
              setResponsibleUsers(data || []);
            }
            setLoadingResponsibleUsers(false);
          }
        } catch (error) {
          console.error("[OrderForm] Error parseando sesión de sucursal:", error);
          setLoadingResponsibleUsers(false);
        }
      }
    }

    loadResponsibleUsers();
  }, [technicianId]);

  const { handleSubmit } = useOrderSubmit(onSaved);
  return (
    <Fragment>
      <form
        onSubmit={handleSubmit}
        className="min-h-screen space-y-4 bg-slate-50/50 pb-20"
      >
        {orderStep >= 1 && orderStep <= 4 && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-violet-700">
              <span>Paso {orderStep} de 4</span>
              <span>
                {orderStep === 1 && "Cliente"}
                {orderStep === 2 && "Dispositivo"}
                {orderStep === 3 && "Desbloqueo + Serie"}
                {orderStep === 4 && "Checklist / Servicios"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                style={{ width: `${(orderStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Selección de Cliente */}
        {orderStep === 1 && (
          <section className="mx-auto flex min-h-[58vh] w-full max-w-5xl items-center justify-center">
            <div className="w-full space-y-6 rounded-3xl border border-violet-100 bg-gradient-to-b from-white via-violet-50/30 to-white p-6 shadow-[0_28px_60px_-40px_rgba(79,70,229,0.55)] md:p-10">
              <div className="text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-violet-600 uppercase">
                  Paso 1 · Cliente
                </p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                  ¿Quién trae el dispositivo?
                </h3>
                <p className="mt-2 text-sm text-slate-600 md:text-base">
                  Busca por nombre, correo o teléfono. También puedes crear un cliente nuevo en
                  segundos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <label className="mb-2 block text-base font-semibold text-slate-700">Cliente *</label>
                <CustomerSearch
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={setSelectedCustomer}
                />
              </div>

              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  ⚡ Selección rápida del cliente en el mismo paso.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  👥 Ideal para clientes recurrentes y atenciones rápidas.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  ✅ Menos ruido visual, foco total en una sola acción.
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <button
                  type="button"
                  onClick={() => setOrderStep(2)}
                  disabled={!selectedCustomer}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
                >
                  Continuar · Seleccionar dispositivo
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Equipos - Mostrar cada equipo en una sección separada */}
        {orderStep >= 2 && orderStep < 5 && devices.map((device, deviceIndex) => (
          <div
            key={device.id}
            className={`grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] items-start gap-6 rounded-3xl border border-slate-100 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/60 p-6 shadow-[0_28px_50px_-36px_rgba(15,23,42,0.18)] ${orderStep === 2 ? "min-h-[72vh]" : ""}`}
          >
            {/* SIDEBAR (Columna Izquierda) */}
            <aside className="sticky top-6 hidden xl:flex flex-col gap-4">
              {/* Tu Progreso */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-base font-semibold text-slate-900">Tu progreso</p>
                <div className="mt-4 space-y-2">
                  {[
                    { label: "Dispositivo", state: orderStep > 2 ? "done" : "active" },
                    { label: "Desbloqueo", state: orderStep > 3 ? "done" : orderStep === 3 ? "active" : "pending" },
                    { label: "Checklist", state: getFlowStep(device.id) > 1 ? "done" : getFlowStep(device.id) === 1 && orderStep === 4 ? "active" : "pending" },
                    { label: "Servicios", state: getFlowStep(device.id) === 3 ? "active" : getFlowStep(device.id) > 3 ? "done" : "pending" },
                    { label: "Resumen", state: orderStep > 4 ? "done" : orderStep === 5 ? "active" : "pending" },
                  ].map((step, stepIndex) => (
                    <div
                      key={`${device.id}-sidebar-step-${step.label}`}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                        step.state === "active"
                          ? "border border-violet-200 bg-violet-50 text-violet-900 font-medium"
                          : step.state === "done"
                            ? "text-slate-800"
                            : "text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            step.state === "done"
                              ? "bg-violet-600 text-white"
                              : step.state === "active"
                                ? "border border-violet-400 bg-white text-violet-700"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.state === "done" ? "✓" : stepIndex + 1}
                        </span>
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de Cliente */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">Cliente seleccionado</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {selectedCustomer?.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{selectedCustomer?.name || "Sin cliente"}</p>
                    {selectedCustomer?.email && <p className="truncate text-xs text-slate-500">{selectedCustomer.email}</p>}
                  </div>
                </div>
              </div>

              {/* Resumen rápido del dispositivo */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">Resumen rápido</p>
                {device.deviceModel ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs font-medium text-indigo-700">📱</span>
                      <p className="truncate text-sm font-medium text-slate-800">{device.deviceModel}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="flex justify-between text-xs text-slate-500">
                        <span>Desbloqueo:</span>
                        <span className="font-medium text-slate-700">{device.unlockType === "pattern" ? "Patrón" : device.unlockType === "code" ? "PIN" : "Sin bloqueo"}</span>
                      </p>
                      <p className="flex justify-between text-xs text-slate-500">
                        <span>Servicios:</span>
                        <span className="font-medium text-slate-700">{device.selectedServices?.length || 0}</span>
                      </p>
                      {device.checklistData && Object.keys(device.checklistData).some(k => device.checklistData[k]) && (
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <Check className="h-3 w-3" /> Checklists:
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {Object.keys(device.checklistData).filter(k => device.checklistData[k]).length} completados
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Dispositivo no seleccionado</p>
                )}
              </div>

              {/* Detalles de la Orden */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-indigo-500" />
                  Detalles de la Orden
                </p>
                
                <div className="space-y-4">
                  {/* Prioridad */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Prioridad</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media (Normal)</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  {/* Fecha de Compromiso */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Fecha de entrega</label>
                    <input
                      type="datetime-local"
                      value={commitmentDate}
                      onChange={(e) => setCommitmentDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Garantía */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Garantía (días)</label>
                    <select
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={0}>Sin garantía</option>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                      <option value={180}>6 meses</option>
                    </select>
                  </div>

                  {/* Total Estimado */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">Total estimado (Todos los equipos)</p>
                    <p className="text-lg font-bold text-indigo-700 mt-1">
                      {formatCLP(
                        devices.reduce((sum, d) => sum + d.replacementCost, 0) +
                        devices.reduce((sum, d) => sum + getDeviceServiceTotal(d), 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENIDO PRINCIPAL (Columna Derecha) */}
            <div className="flex w-full min-w-0 flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 xl:hidden">Equipo {deviceIndex + 1}</h3>
                <div className="hidden xl:block" />
                {devices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDevice(device.id)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Eliminar equipo
                  </button>
                )}
              </div>

            {/* Información del Dispositivo */}
            {!isDeviceFinalized(device.id) && orderStep === 2 && (
              <>
                {!device.deviceModel || manualEditOpenByDevice[device.id] ? (
                  <div
                    ref={wizardPanelRef}
                    tabIndex={-1}
                    className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.22)]"
                  >
                    <h4 className="mb-3 text-sm font-semibold tracking-wide text-slate-700 uppercase">
                      Asistente rápido
                    </h4>
                    {!manualEntryByDevice[device.id] && (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            setManualEntryByDevice((prev) => ({ ...prev, [device.id]: true }));
                            setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }));
                            setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 6 }));
                            updateDevice(device.id, { deviceType: null, deviceModel: "" });
                          }}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          ¿No encuentras el dispositivo? Escríbelo manual
                        </button>
                      </div>
                    )}
                    {getWizardStep(device.id) === 1 && (
                      <>
                        <p className="mb-3 text-xl font-semibold text-slate-700">
                          1) ¿Qué dispositivo vas a recibir?
                        </p>
                        {!catalogLoaded ? (
                          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            Cargando catÃƒÆ’Ã‚Â¡logo de dispositivos...
                          </div>
                        ) : (
                          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                            {wizardTypeOptions.map((option) => (
                              <button
                                key={`${device.id}-${option.id}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyDeviceType(device.id, option.id)}
                                className={wizardCardButtonClass}
                              >
                                <AdaptiveWizardCardImage src={option.imageUrl} alt={option.label} />
                                <p className={wizardCardInnerTextClass}>
                                  {option.icon} {option.label}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">{option.description}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {getWizardStep(device.id) === 2 && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xl font-semibold text-slate-700">
                            2) ¿Qué marca de{" "}
                            {wizardTypeOptions
                              .find((option) => option.id === device.deviceType)
                              ?.label.toLowerCase()}
                            ?
                          </p>
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-700 underline"
                            onClick={() =>
                              setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))
                            }
                          >
                            Volver
                          </button>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                          {getBrandsForDevice(device).map((brand) => (
                            <button
                              key={`${device.id}-brand-${brand.id}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyBrand(device.id, String(brand.id))}
                              className={wizardCardButtonClass}
                            >
                              <AdaptiveWizardCardImage
                                src={
                                  brand.logo_url ||
                                  "https://dummyimage.com/320x160/e2e8f0/475569&text=Marca"
                                }
                                alt={brand.name}
                              />
                              <p className="text-xs font-semibold">{brand.name}</p>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {getWizardStep(device.id) === 3 && selectedBrandByDevice[device.id] && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xl font-semibold text-slate-700">
                            3) Selecciona serie / línea
                          </p>
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-700 underline"
                            onClick={() => {
                              keepScrollPosition(() => {
                                setSelectedBrandByDevice((prev) => ({
                                  ...prev,
                                  [device.id]: null,
                                }));
                                setSelectedSeriesByDevice((prev) => ({
                                  ...prev,
                                  [device.id]: null,
                                }));
                                setSelectedModelByDevice((prev) => ({
                                  ...prev,
                                  [device.id]: null,
                                }));
                                setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 2 }));
                              });
                            }}
                          >
                            Volver
                          </button>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                          {getLinesForDevice(device).map((series) => (
                            <button
                              key={`${device.id}-series-${series.id}`}
                              type="button"
                              onClick={() => {
                                keepScrollPosition(() => {
                                  setSelectedSeriesByDevice((prev) => ({
                                    ...prev,
                                    [device.id]: String(series.id),
                                  }));
                                  setSelectedModelByDevice((prev) => ({
                                    ...prev,
                                    [device.id]: null,
                                  }));
                                  setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }));
                                });
                              }}
                              className={wizardCardButtonClass}
                            >
                              <AdaptiveWizardCardImage
                                src={
                                  series.image_url ||
                                  "https://dummyimage.com/320x520/e2e8f0/475569&text=L%C3%ADnea"
                                }
                                alt={series.name}
                              />
                              <p className="text-xs font-semibold">{series.name}</p>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {getWizardStep(device.id) === 4 &&
                      selectedBrandByDevice[device.id] &&
                      selectedSeriesByDevice[device.id] && (
                        <>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xl font-semibold text-slate-700">4) Modelo exacto</p>
                            <button
                              type="button"
                              className="text-xs font-medium text-slate-700 underline"
                              onClick={() => {
                                keepScrollPosition(() => {
                                  setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 3 }));
                                });
                              }}
                            >
                              Volver
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {getModelsForDevice(device).map((model) => {
                              const typeId = getTypeIdForDevice(device);
                              const brandId = Number(selectedBrandByDevice[device.id]) || null;
                              const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                              const displayName = buildDeviceDisplayName({
                                brandName:
                                  catalog.brands.find(
                                    (b) => b.id === Number(selectedBrandByDevice[device.id]),
                                  )?.name ?? "",
                                lineName:
                                  catalog.productLines.find(
                                    (l) => l.id === Number(selectedSeriesByDevice[device.id]),
                                  )?.name ?? "",
                                modelName: model.name,
                              });
                              const cardImage = getCardImage({
                                typeId,
                                brandId,
                                lineId,
                                modelId: model.id,
                                variantId: null,
                              });
                              return (
                                <button
                                  key={`${device.id}-model-${model.id}`}
                                  type="button"
                                  onClick={() => {
                                    const modelVariants = getVariantsForModel(model.id);
                                    setSelectedModelByDevice((prev) => ({
                                      ...prev,
                                      [device.id]: String(model.id),
                                    }));
                                    setSelectedVariantByDevice((prev) => ({
                                      ...prev,
                                      [device.id]: null,
                                    }));
                                    if (modelVariants.length > 0) {
                                      setWizardStepByDevice((prev) => ({
                                        ...prev,
                                        [device.id]: 5,
                                      }));
                                      return;
                                    }
                                    applySuggestedModel(device.id, displayName);
                                  }}
                                  className={wizardCardButtonClass}
                                >
                                  <AdaptiveWizardCardImage
                                    src={
                                      cardImage ||
                                      "https://dummyimage.com/320x160/e2e8f0/475569&text=Modelo"
                                    }
                                    alt={displayName}
                                  />
                                  <span>{displayName}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-3">
                            <p className="mb-2 text-xs font-semibold text-slate-700">
                              Ãƒâ€šÃ‚Â¿No aparece? AgrÃƒÆ’Ã‚Â©galo al catÃƒÆ’Ã‚Â¡logo
                            </p>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                              <input
                                value={customCatalogFormByDevice[device.id]?.model ?? ""}
                                onChange={(e) =>
                                  setCustomCatalogFormByDevice((prev) => ({
                                    ...prev,
                                    [device.id]: {
                                      ...(prev[device.id] ?? { model: "", variant: "" }),
                                      model: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                placeholder="Modelo (ej: S24)"
                              />
                              <input
                                value={customCatalogFormByDevice[device.id]?.variant ?? ""}
                                onChange={(e) =>
                                  setCustomCatalogFormByDevice((prev) => ({
                                    ...prev,
                                    [device.id]: {
                                      ...(prev[device.id] ?? { model: "", variant: "" }),
                                      variant: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                placeholder="Variante (opcional)"
                              />
                              <button
                                type="button"
                                onClick={() => addCustomModelToCatalog(device)}
                                className="rounded-lg bg-gradient-to-r from-slate-600 to-zinc-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                              >
                                Guardar y usar
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                    {getWizardStep(device.id) === 5 && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xl font-semibold text-slate-700">5) Variante</p>
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-700 underline"
                            onClick={() =>
                              setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }))
                            }
                          >
                            Volver
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {(() => {
                            const selectedModelId = Number(selectedModelByDevice[device.id]);
                            if (!selectedModelId) return null;
                            const model = catalog.models.find((row) => row.id === selectedModelId);
                            if (!model) return null;
                            const variants = getVariantsForModel(selectedModelId);
                            const typeId = getTypeIdForDevice(device);
                            const brandId = Number(selectedBrandByDevice[device.id]) || null;
                            const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                            const brandName =
                              catalog.brands.find(
                                (b) => b.id === Number(selectedBrandByDevice[device.id]),
                              )?.name ?? "";
                            const lineName =
                              catalog.productLines.find(
                                (l) => l.id === Number(selectedSeriesByDevice[device.id]),
                              )?.name ?? "";

                            return variants.map((variant) => {
                              const displayName = buildDeviceDisplayName({
                                brandName,
                                lineName,
                                modelName: model.name,
                                variantName: variant.name,
                              });
                              const cardImage = getCardImage({
                                typeId,
                                brandId,
                                lineId,
                                modelId: model.id,
                                variantId: variant.id,
                              });
                              return (
                                <button
                                  key={`${device.id}-variant-${variant.id}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVariantByDevice((prev) => ({
                                      ...prev,
                                      [device.id]: String(variant.id),
                                    }));
                                    applySuggestedModel(device.id, displayName);
                                  }}
                                  className={wizardCardButtonClass}
                                >
                                  <AdaptiveWizardCardImage
                                    src={
                                      cardImage ||
                                      "https://dummyimage.com/320x160/e2e8f0/475569&text=Variante"
                                    }
                                    alt={displayName}
                                  />
                                  <span>{variant.name}</span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-zinc-700 uppercase">
                        Dispositivo seleccionado
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">{device.deviceModel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }))
                      }
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Editar dispositivo
                    </button>
                  </div>
                )}
              </>
            )}

            {!isDeviceFinalized(device.id) && orderStep === 2 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStageByDevice((prev) => ({ ...prev, [device.id]: "unlock" }));
                    setOrderStep(3);
                  }}
                  disabled={!device.deviceModel}
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar · Desbloqueo
                </button>
              </div>
            )}

            {!isDeviceFinalized(device.id) && orderStep >= 3 && (
              <div className="space-y-4">
                {(activeStageByDevice[device.id] ?? "unlock") === "unlock" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_24px_45px_-35px_rgba(79,70,229,0.5)]">
                  <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-indigo-50 to-white px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                          <Lock className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            Paso 2 · Configura el desbloqueo
                          </p>
                          <p className="text-xs text-slate-600">
                            Esta información se usa para validar la recepción del dispositivo.
                          </p>
                        </div>
                      </div>
                      <div className="hidden items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-3 py-1 text-xs font-medium text-violet-700 md:flex">
                        <ShieldCheck className="h-4 w-4" />
                        Proceso seguro
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
                      <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700">
                          Número de Serie (opcional)
                        </label>
                        {!serialFieldOpenByDevice[device.id] && !device.deviceSerial && (
                          <button
                            type="button"
                            onClick={() =>
                              setSerialFieldOpenByDevice((prev) => ({ ...prev, [device.id]: true }))
                            }
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            + Agregar número de serie
                          </button>
                        )}
                      </div>
                      {serialFieldOpenByDevice[device.id] || !!device.deviceSerial ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                            value={device.deviceSerial}
                            onChange={(e) => updateDevice(device.id, { deviceSerial: e.target.value })}
                            placeholder="Ej: R58N12345AB"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateDevice(device.id, { deviceSerial: "" });
                              setSerialFieldOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
                            }}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No agregado.</p>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        {
                          value: "pattern",
                          label: "Patrón de desbloqueo",
                          helper: "Dibuja una secuencia única",
                          icon: Grip,
                        },
                        {
                          value: "code",
                          label: "Código PIN",
                          helper: "Ingresa un código numérico",
                          icon: KeyRound,
                        },
                        {
                          value: "none",
                          label: "Sin bloqueo",
                          helper: "El dispositivo llega desbloqueado",
                          icon: Check,
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isActive = device.unlockType === option.value;
                        return (
                          <button
                            key={`${device.id}-unlock-${option.value}`}
                            type="button"
                            onClick={() => {
                              const type = option.value as "code" | "pattern" | "none";
                              setUnlockFieldOpenByDevice((prev) => ({ ...prev, [device.id]: true }));
                              if (type === "pattern") {
                                updateDevice(device.id, {
                                  unlockType: "pattern",
                                  deviceUnlockCode: "",
                                });
                                if (device.deviceUnlockPattern.length === 0) {
                                  setShowPatternDrawer({ deviceId: device.id });
                                }
                                return;
                              }
                              updateDevice(device.id, {
                                unlockType: type,
                                deviceUnlockPattern: [],
                                deviceUnlockCode: type === "none" ? "" : device.deviceUnlockCode,
                              });
                            }}
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              isActive
                                ? "border-violet-500 bg-violet-50 shadow-[0_14px_30px_-25px_rgba(124,58,237,0.85)]"
                                : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span
                                className={`rounded-xl p-2 ${isActive ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              {isActive && (
                                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                                  Seleccionado
                                </span>
                              )}
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{option.label}</p>
                            <p className="mt-1 text-xs text-slate-600">{option.helper}</p>
                          </button>
                        );
                      })}
                    </div>

                    {orderStep === 2 && (
                    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                        {device.unlockType === "code" && (
                          <div>
                            <p className="mb-2 text-sm font-semibold text-slate-800">
                              Ingresa el PIN de desbloqueo
                            </p>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2"
                              placeholder="Ej: 1234"
                              value={device.deviceUnlockCode}
                              onChange={(e) =>
                                updateDevice(device.id, { deviceUnlockCode: e.target.value })
                              }
                            />
                            <p className="mt-2 text-xs text-slate-500">
                              Solo se utiliza para validaciones internas del ingreso.
                            </p>
                          </div>
                        )}

                        {device.unlockType === "pattern" && (
                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                Patrón registrado
                                {device.deviceUnlockPattern.length > 0 &&
                                  ` (${device.deviceUnlockPattern.length} puntos)`}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowPatternDrawer({ deviceId: device.id })}
                                className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                              >
                                {device.deviceUnlockPattern.length > 0 ? "Cambiar patrón" : "Dibujar patrón"}
                              </button>
                            </div>
                            {device.deviceUnlockPattern.length > 0 ? (
                              <PatternViewer pattern={device.deviceUnlockPattern} size={180} />
                            ) : (
                              <p className="rounded-xl border border-dashed border-violet-300 bg-white px-3 py-5 text-center text-sm text-slate-600">
                                Aún no hay patrón guardado.
                              </p>
                            )}
                          </div>
                        )}

                        {device.unlockType === "none" && (
                          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-800">
                            El equipo será registrado como <strong>sin bloqueo</strong>.
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-900">
                          <ShieldCheck className="h-4 w-4" />
                          Seguro e inmutable
                        </p>
                        <ul className="space-y-2 text-xs text-slate-600">
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
                            Tu patrón o código queda asociado a esta orden.
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
                            Se usa para validaciones de recepción y entrega.
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
                            Diseño orientado a flujo guiado, rápido y claro.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStageByDevice((prev) => ({ ...prev, [device.id]: "checklist" }));
                        setOrderStep(4);
                      }}
                      className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500"
                    >
                      Continuar a Checklist
                    </button>
                  </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {showPatternDrawer?.deviceId === device.id && (
              <PatternDrawer
                onPatternComplete={(pattern) => {
                  updateDevice(device.id, {
                    unlockType: "pattern",
                    deviceUnlockPattern: pattern,
                    deviceUnlockCode: "",
                  });
                  setShowPatternDrawer(null);
                }}
                onClose={() => setShowPatternDrawer(null)}
              />
            )}

            {/* Modal para seleccionar categoría de dispositivo */}
            {showDeviceCategoryModal?.deviceId === device.id && (
              <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">
                    Agregar Nuevo Dispositivo
                  </h3>
                  <p className="mb-4 text-slate-600">
                    El dispositivo{" "}
                    <strong>
                      &quot;{showDeviceCategoryModal.deviceModel || device.deviceModel}&quot;
                    </strong>{" "}
                    no está en el listado. Por favor, selecciona la categoría del dispositivo:
                  </p>
                  <div className="mb-6 space-y-2">
                    <button
                      onClick={() => {
                        updateDevice(device.id, { deviceType: "iphone" });
                        setShowDeviceCategoryModal(null);
                      }}
                      className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                    >
                      <span className="font-medium">📱 Celular</span>
                      <p className="text-sm text-slate-600">iPhone, Android, etc.</p>
                    </button>
                    <button
                      onClick={() => {
                        updateDevice(device.id, { deviceType: "ipad" });
                        setShowDeviceCategoryModal(null);
                      }}
                      className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                    >
                      <span className="font-medium">📱 Tablet</span>
                      <p className="text-sm text-slate-600">iPad, Android Tablet, etc.</p>
                    </button>
                    <button
                      onClick={() => {
                        updateDevice(device.id, { deviceType: "macbook" });
                        setShowDeviceCategoryModal(null);
                      }}
                      className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                    >
                      <span className="font-medium">💻 Notebook / Laptop</span>
                      <p className="text-sm text-slate-600">MacBook, Windows Laptop, etc.</p>
                    </button>
                    <button
                      onClick={() => {
                        updateDevice(device.id, { deviceType: "apple_watch" });
                        setShowDeviceCategoryModal(null);
                      }}
                      className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                    >
                      <span className="font-medium">⌚ Smartwatch</span>
                      <p className="text-sm text-slate-600">Apple Watch, Android Watch, etc.</p>
                    </button>
                    <button
                      onClick={() => {
                        updateDevice(device.id, { deviceType: "iphone" });
                        setShowDeviceCategoryModal(null);
                      }}
                      className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                    >
                      <span className="font-medium">🔧 Otro</span>
                      <p className="text-sm text-slate-600">Otro tipo de dispositivo</p>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full rounded-md bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Botón para agregar categoría si no se detectó tipo */}
            {device.deviceModel &&
              !device.deviceType &&
              showDeviceCategoryModal?.deviceId !== device.id && (
                <div className="mb-4 rounded-md border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-2 text-sm text-stone-800">
                    No se detectÃƒÆ’Ã‚Â³ la categorÃƒÆ’Ã‚Â­a del dispositivo. Para mostrar el
                    checklist, selecciona la categorÃƒÆ’Ã‚Â­a:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeviceCategoryModal({
                        deviceId: device.id,
                        deviceModel: device.deviceModel,
                      });
                    }}
                    className="rounded-md bg-stone-600 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                  >
                    ➕ Agregar Nuevo Dispositivo
                  </button>
                </div>
              )}

            {/* Flujo de checklist -> descripción -> servicios (sin scroll) */}
            {device.deviceModel &&
              !isDeviceFinalized(device.id) &&
              (activeStageByDevice[device.id] ?? "unlock") !== "unlock" && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 p-4 shadow-[0_20px_40px_-30px_rgba(79,70,229,0.5)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStageByDevice((prev) => ({ ...prev, [device.id]: "unlock" }));
                        setOrderStep(3);
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors mr-2"
                    >
                      ← Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${getFlowStep(device.id) === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
                    >
                      1. Checklist
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${getFlowStep(device.id) === 2 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
                    >
                      2. Problema
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${getFlowStep(device.id) === 3 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
                    >
                      3. Servicios
                    </button>
                  </div>
                  
                  {getFlowStep(device.id) === 1 && device.deviceType && (
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
                    >
                      Siguiente: Descripción →
                    </button>
                  )}
                  {getFlowStep(device.id) === 2 && (
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
                    >
                      Siguiente: Servicios →
                    </button>
                  )}
                  {getFlowStep(device.id) === 3 && (
                    <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors hidden sm:block"
                        >
                          Guardar borrador
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSavingDeviceId(device.id);
                            setTimeout(() => {
                              setSavingDeviceId(null);
                              setFinalizedDeviceById((prev) => ({ ...prev, [device.id]: true }));
                              setDetailsOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
                              setShowAddDevicePrompt(true);
                            }, 1200);
                          }}
                          disabled={device.selectedServices.length === 0}
                          className="rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continuar al resumen →
                        </button>
                    </div>
                  )}
                </div>

                {getFlowStep(device.id) === 1 && device.deviceType && (
                  <DeviceChecklist
                    deviceType={device.deviceType}
                    checklistData={device.checklistData}
                    onChecklistChange={(newChecklist) =>
                      updateDevice(device.id, { checklistData: newChecklist })
                    }
                    onAutoAdvance={() => {
                      setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }));
                    }}
                  />
                )}

                {getFlowStep(device.id) === 2 && (
                  <>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Descripción del problema * (Máximo {MAX_DESCRIPTION_LENGTH} caracteres)
                    </label>
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Selección rápida
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_PROBLEM_SYMPTOMS.map((symptom) => (
                          <button
                            key={`${device.id}-${symptom}`}
                            type="button"
                            onClick={() => {
                              const current = device.problemDescription.trim();
                              if (current.toLowerCase().includes(symptom.toLowerCase())) return;
                              const nextValue = current ? `${current}. ${symptom}` : symptom;
                              if (nextValue.length <= MAX_DESCRIPTION_LENGTH) {
                                updateDevice(device.id, { problemDescription: nextValue });
                              }
                            }}
                            className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50"
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      className={`min-h-[100px] w-full rounded-xl border px-3 py-2 ${
                        device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                          ? "border-gray-500 bg-gray-50"
                          : "border-indigo-200 bg-white"
                      }`}
                      value={device.problemDescription}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue.length <= MAX_DESCRIPTION_LENGTH) {
                          updateDevice(device.id, { problemDescription: newValue });
                        }
                      }}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      required
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span
                        className={`text-xs ${
                          device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                            ? "font-semibold text-gray-600"
                            : device.problemDescription.length > MAX_DESCRIPTION_LENGTH * 0.9
                              ? "text-stone-600"
                              : "text-slate-500"
                        }`}
                      >
                        {device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                          ? `⚠️ Excede el límite por ${device.problemDescription.length - MAX_DESCRIPTION_LENGTH} caracteres`
                          : `${device.problemDescription.length} / ${MAX_DESCRIPTION_LENGTH} caracteres`}
                      </span>
                    </div>
                  </>
                )}

                {getFlowStep(device.id) === 3 && (
                  <>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Servicios *
                    </label>
                    
                    {(device.selectedServices.length === 0 || isAddingServiceByDevice[device.id]) && (
                      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative">
                        {device.selectedServices.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddingServiceByDevice(prev => ({ ...prev, [device.id]: false }))}
                            className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-slate-600 z-10 bg-slate-50 p-2 rounded-lg"
                          >
                            ✕ Cancelar
                          </button>
                        )}
                        <ServiceSelector
                          selectedServices={device.selectedServices}
                          deviceType={device.deviceType}
                          deviceModel={device.deviceModel}
                          showSelectedServicesList={false}
                          onServicesChange={(services) => {
                            const uniqueServices: Service[] = [];
                            const seenIds = new Set<string>();

                            for (const service of services) {
                              if (!seenIds.has(service.id)) {
                                seenIds.add(service.id);
                                uniqueServices.push(service);
                              }
                            }

                            const currentPrices = device.servicePrices;
                            const newPrices: Record<string, number> = {};
                            uniqueServices.forEach((service) => {
                              newPrices[service.id] = currentPrices[service.id] || 0;
                            });
                            updateDevice(device.id, {
                              selectedServices: uniqueServices,
                              servicePrices: newPrices,
                            });
                            
                            setIsAddingServiceByDevice((prev) => ({ ...prev, [device.id]: false }));
                          }}
                        />
                      </div>
                    )}

                    {device.selectedServices.length > 0 && !isAddingServiceByDevice[device.id] && (
                      <button
                        type="button"
                        onClick={() => setIsAddingServiceByDevice(prev => ({ ...prev, [device.id]: true }))}
                        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 py-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          +
                        </span>
                        Agregar otro servicio
                      </button>
                    )}

                    <div className="mt-8">
                      <p className="text-base font-bold text-slate-800 mb-4">
                        Servicios seleccionados ({device.selectedServices.length})
                      </p>
                      
                      {device.selectedServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-12 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-500">
                            <Inbox className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Aún no has seleccionado servicios</p>
                          <p className="mt-1 text-xs text-slate-500">Selecciona uno o más servicios de las categorías anteriores</p>
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4">
                          {device.selectedServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center gap-4 rounded-xl border border-white bg-white p-4 shadow-sm"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Wrench className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{service.name}</p>
                                {service.category && (
                                  <span className="text-xs text-slate-500">Categoría: {service.category}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
                                    Precio (CLP)
                                  </label>
                                  <input
                                    type="text"
                                    className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-right text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={formatCLPInput(device.servicePrices[service.id] || 0)}
                                    onChange={(e) => {
                                      const newPrices = { ...device.servicePrices };
                                      newPrices[service.id] = parseCLPInput(e.target.value);
                                      updateDevice(device.id, { servicePrices: newPrices });
                                    }}
                                    required
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newServices = device.selectedServices.filter(s => s.id !== service.id);
                                    const newPrices = { ...device.servicePrices };
                                    delete newPrices[service.id];
                                    updateDevice(device.id, { selectedServices: newServices, servicePrices: newPrices });
                                  }}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
                                  title="Eliminar servicio"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </>
                )}
              </div>
            )}
              </div>
            )}

            {isDeviceFinalized(device.id) && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                    <img
                      src={(() => {
                        const typeId = getTypeIdForDevice(device);
                        const brandId = Number(selectedBrandByDevice[device.id]) || null;
                        const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                        const modelId = Number(selectedModelByDevice[device.id]) || 0;
                        const variantId = selectedVariantByDevice[device.id]
                          ? Number(selectedVariantByDevice[device.id])
                          : null;
                        return (
                          (modelId
                            ? getCardImage({ typeId, brandId, lineId, modelId, variantId })
                            : null) || "https://dummyimage.com/100x100/e2e8f0/475569&text=?"
                        );
                      })()}
                      alt={device.deviceModel || "Dispositivo"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      {device.deviceModel || `Equipo ${deviceIndex + 1}`}
                    </p>
                    <p className="text-xs text-zinc-700">
                      {device.selectedServices.length} servicio(s) registrados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailsOpenByDevice((prev) => ({
                          ...prev,
                          [device.id]: !prev[device.id],
                        }))
                      }
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      {detailsOpenByDevice[device.id] ? "Ocultar detalles" : "Ver detalles"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (devices.length === 1) {
                          resetDevice(device.id);
                          return;
                        }
                        removeDevice(device.id);
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Eliminar dispositivo
                    </button>
                  </div>
                </div>

                {detailsOpenByDevice[device.id] && (
                  <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">Checklist</p>
                      <p className="text-slate-600">
                        {Object.keys(device.checklistData).length} items registrados
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Descripción del problema</p>
                      <p className="whitespace-pre-wrap text-slate-600">
                        {device.problemDescription || "Sin descripción"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Servicios</p>
                      {device.selectedServices.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-600">
                          {device.selectedServices.map((service) => (
                            <li key={`${device.id}-detail-${service.id}`}>
                              {service.name} — {formatCLP(device.servicePrices[service.id] || 0)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-600">Sin servicios.</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFinalizedDeviceById((prev) => ({ ...prev, [device.id]: false }));
                          setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 1 }));
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Editar checklist
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFinalizedDeviceById((prev) => ({ ...prev, [device.id]: false }));
                          setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }));
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Editar descripción
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFinalizedDeviceById((prev) => ({ ...prev, [device.id]: false }));
                          setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }));
                        }}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Editar servicios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        ))}

        {showPatternDrawer &&
          (() => {
            const targetDevice = devices.find((d) => d.id === showPatternDrawer.deviceId);
            if (!targetDevice) return null;
            return (
              <PatternDrawer
                onPatternComplete={(pattern) => {
                  updateDevice(targetDevice.id, {
                    unlockType: "pattern",
                    deviceUnlockPattern: pattern,
                    deviceUnlockCode: "",
                  });
                  setShowPatternDrawer(null);
                }}
                onClose={() => setShowPatternDrawer(null)}
              />
            );
          })()}

        {/* Botón para agregar otro equipo */}
        {orderStep === 2 && (
          <div className="flex justify-center">
          <button
            type="button"
            onClick={addNewDevice}
            className="flex items-center gap-2 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700"
          >
            ➕ Agregar Otro Equipo
          </button>
          </div>
        )}

        {/* Campo de Responsable con Autocompletado (solo para sucursales) */}
        {(() => {
          // Verificar si es una sucursal
          if (typeof window === "undefined") return null;
          const branchSessionStr = localStorage.getItem("branchSession");
          if (branchSessionStr) {
            try {
              const branchSession = JSON.parse(branchSessionStr);
              if (branchSession.type === "branch" && branchSession.branchId) {
                return (
                  <div className="mb-6 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Responsable de Recibir el Equipo *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="responsible-users-list"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-slate-700 focus:outline-none"
                        placeholder="Escribe o selecciona el nombre del responsable..."
                        value={responsibleUserName}
                        onChange={(e) => setResponsibleUserName(e.target.value)}
                        required
                      />
                      {responsibleUsers.length > 0 && (
                        <datalist id="responsible-users-list">
                          {responsibleUsers.map((user) => (
                            <option key={user.id} value={user.name} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    {loadingResponsibleUsers ? (
                      <p className="mt-1 text-xs text-slate-500">Cargando responsables...</p>
                    ) : responsibleUsers.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-600">
                        💡 Puedes escribir el nombre o seleccionar de la lista. Si escribes un
                        nombre que no está en la lista, se guardará igual.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">
                        💡 Escribe el nombre del responsable. Este campo es obligatorio.
                      </p>
                    )}
                    {!responsibleUserName && (
                      <p className="mt-1 text-sm text-gray-600">
                        Este campo es obligatorio para crear la orden
                      </p>
                    )}
                  </div>
                );
              }
            } catch (error) {
              // No es sucursal o error parseando
            }
          }
          return null;
        })()}

        {/* RESUMEN Y CONFIRMACIÓN (Paso 5) */}
        {orderStep === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Resumen y confirmación</h2>
              <p className="mt-2 text-slate-500">Revisa la información de tu registro antes de confirmar. Estás a un paso de completar el proceso.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Columna Izquierda (Detalles de los equipos) */}
              <div className="lg:col-span-2 space-y-6">
                {devices.map((device, index) => (
                  <div key={device.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Dispositivo */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Dispositivo {devices.length > 1 ? index + 1 : ""}</h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-2 overflow-hidden">
                          <img
                            src={(() => {
                              const typeId = getTypeIdForDevice(device);
                              const brandId = Number(selectedBrandByDevice[device.id]) || null;
                              const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                              const modelId = Number(selectedModelByDevice[device.id]) || 0;
                              const variantId = selectedVariantByDevice[device.id] ? Number(selectedVariantByDevice[device.id]) : null;
                              return (modelId ? getCardImage({ typeId, brandId, lineId, modelId, variantId }) : null) || "https://dummyimage.com/100x100/e2e8f0/475569&text=?";
                            })()}
                            alt={device.deviceModel || "Dispositivo"}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-xl font-bold text-slate-900">{device.deviceModel || "Equipo sin modelo"}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-indigo-500" /> {device.unlockType === "pattern" ? "Patrón guardado" : device.unlockType === "code" ? "Código guardado" : "Sin bloqueo"}</span>
                            {device.deviceSerial && (
                              <span className="flex items-center gap-1.5"><span className="text-slate-400">SN:</span> {device.deviceSerial}</span>
                            )}
                          </div>
                        </div>
                        <button type="button" onClick={() => {
                          setFinalizedDeviceById(prev => ({ ...prev, [device.id]: false }));
                          setOrderStep(4);
                        }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          Editar
                        </button>
                      </div>
                    </div>

                    <hr className="border-slate-100 my-6" />

                    {/* Servicios Seleccionados */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Servicios seleccionados ({device.selectedServices.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {device.selectedServices.map(service => (
                          <div key={service.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Wrench className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{service.name}</p>
                                <p className="text-sm text-slate-500">Servicio profesional</p>
                              </div>
                            </div>
                            <p className="font-bold text-slate-900">{formatCLP(device.servicePrices[service.id] || 0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-slate-100 my-6" />

                    {/* Detalles adicionales */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Detalles adicionales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha compromiso</label>
                          <input type="date" className="w-full bg-transparent font-bold text-slate-900 focus:outline-none" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} />
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Garantía</label>
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            <input type="number" className="w-12 bg-transparent text-center focus:outline-none" value={warrantyDays} onChange={(e) => setWarrantyDays(parseInt(e.target.value) || 0)} />
                            <span>días</span>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prioridad</label>
                          <select className="w-full bg-transparent font-bold text-slate-900 focus:outline-none appearance-none" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="urgente">Urgente</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna Derecha (Resumen y Total) */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sticky top-6">
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                      <Check className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">¡Todo listo!</h3>
                    <p className="mt-1 text-sm text-slate-500">Confirma para completar el registro.</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5 mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">ID de registro</p>
                    <p className="text-lg font-bold text-indigo-600">#REG-PENDIENTE</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Equipos</span>
                      <span className="font-bold text-slate-900">{devices.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Servicios totales</span>
                      <span className="font-bold text-slate-900">{devices.reduce((acc, d) => acc + d.selectedServices.length, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Tiempo estimado</span>
                      <span className="font-bold text-indigo-600">24 - 48 horas</span>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-end">
                      <span className="text-slate-500">Total estimado</span>
                      <span className="text-2xl font-black text-slate-900">
                        {formatCLP(
                          devices.reduce((sum, device) => sum + device.replacementCost, 0) +
                          devices.reduce((sum, device) => sum + getDeviceServiceTotal(device), 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 text-center mb-6 px-4">
                    Al confirmar, aceptas nuestros Términos y Condiciones y autorizas el procesamiento.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={loading || isSubmitting || devices.some((device) => device.problemDescription.length > MAX_DESCRIPTION_LENGTH)}
                      onClick={(e) => {
                        const deviceMissingDesc = devices.find(d => !d.problemDescription || d.problemDescription.trim() === "");
                        if (deviceMissingDesc) {
                          e.preventDefault();
                          alert(`⚠️ Faltan datos obligatorios.\n\nPor favor, ingresa la descripción del problema para el equipo: ${deviceMissingDesc.deviceModel || "Desconocido"}`);
                          setFinalizedDeviceById(prev => ({ ...prev, [deviceMissingDesc.id]: false }));
                          setFlowStepByDevice(prev => ({ ...prev, [deviceMissingDesc.id]: 2 }));
                          setOrderStep(4);
                        }
                      }}
                      className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading || isSubmitting ? "Procesando..." : "Confirmar y finalizar →"}
                    </button>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setOrderStep(4)} className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        ← Volver
                      </button>
                      <button type="button" onClick={onSaved} className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        Guardar borrador
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* PDFPreview fuera del formulario para evitar que los botones disparen el submit */}
      {/* Mostrar preview de todos los equipos en una sola orden */}
      {showPDFPreview && createdOrder && devices.length > 0 && (
        <PDFPreview
          order={createdOrder}
          services={devices.flatMap((d) => d.selectedServices)}
          orderServices={createdOrderServices}
          serviceValue={devices.reduce((sum, d) => sum + getDeviceServiceTotal(d), 0)}
          replacementCost={devices.reduce((sum, d) => sum + d.replacementCost, 0)}
          warrantyDays={warrantyDays}
          checklistData={devices[0].checklistData}
          notes={[]}
          onClose={() => {
            setShowPDFPreview(false);
            onSaved();
          }}
          onDownload={() => {
            setShowPDFPreview(false);
            onSaved();
          }}
        />
      )}

      {/* Pantalla de carga simulada al guardar dispositivo */}
      {savingDeviceId && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="mt-4 text-lg font-semibold text-slate-800 animate-pulse">Guardando servicios...</p>
        </div>
      )}

      {/* Prompt modal para agregar otro dispositivo o finalizar */}
      {showAddDevicePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">¡Dispositivo guardado!</h3>
            <p className="mb-8 text-slate-500">¿Qué deseas hacer a continuación?</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddDevicePrompt(false);
                  setOrderStep(5); // Pasar al resumen
                }}
                className="w-full rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
              >
                Continuar al resumen general
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddDevicePrompt(false);
                  addNewDevice();
                }}
                className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                + Agregar otro dispositivo
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
}
