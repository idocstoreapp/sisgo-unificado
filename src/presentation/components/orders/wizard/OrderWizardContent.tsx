"use client";
import { useState, useEffect, useRef, Fragment, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import type { Customer, Service, DeviceChecklistItem, DeviceType, User } from "@/types";
import { detectDeviceTypeWithCustom, getSmartSuggestions } from "@/lib/deviceDatabase";
import { buildDeviceDisplayName, ensureCatalogChain, fetchCatalogSnapshot, type CatalogSnapshot } from "@/lib/device-catalog";

import DeviceChecklist from "../DeviceChecklist";
import CustomerSearch from "../CustomerSearch";
import PatternDrawer from "../PatternDrawer";
import ServiceSelector from "../ServiceSelector";
import PDFPreview from "../PDFPreview";
import { generatePDFBlob } from "@/lib/generate-pdf-blob";
import { uploadPDFToStorage } from "@/lib/upload-pdf";
import { useOrderWizard } from "./OrderWizardContext";
import { useOrderSubmit } from "./useOrderSubmit";

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
    <div className="w-full h-56 md:h-64 lg:h-72 rounded-xl bg-white overflow-hidden mb-2 shadow-sm flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

// Interfaz para un equipo individual
interface DeviceItem {
  id: string; // ID ÃƒÆ’Ã‚Âºnico para cada equipo
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
    technicianId, selectedCustomer, setSelectedCustomer, devices, priority, setPriority, commitmentDate, setCommitmentDate, warrantyDays, setWarrantyDays,
    responsibleUserName, setResponsibleUserName, updateDevice, resetDevice, addNewDevice, removeDevice,
    wizardStepByDevice, setWizardStepByDevice, flowStepByDevice, setFlowStepByDevice,
    finalizedDeviceById, setFinalizedDeviceById, manualEntryByDevice, setManualEntryByDevice,
    selectedBrandByDevice, setSelectedBrandByDevice, selectedSeriesByDevice, setSelectedSeriesByDevice,
    selectedModelByDevice, setSelectedModelByDevice, selectedVariantByDevice, setSelectedVariantByDevice,
    customCatalogFormByDevice, setCustomCatalogFormByDevice, detailsOpenByDevice, setDetailsOpenByDevice,
    serialFieldOpenByDevice, setSerialFieldOpenByDevice, unlockFieldOpenByDevice, setUnlockFieldOpenByDevice,
    manualEditOpenByDevice, setManualEditOpenByDevice, showPatternDrawer, setShowPatternDrawer,
    showDeviceCategoryModal, setShowDeviceCategoryModal, catalog, catalogCards, catalogLoaded,
    customDeviceTypes, recentDeviceModels, deviceSuggestions, setDeviceSuggestions, showDeviceSuggestions, setShowDeviceSuggestions,
    loading, setLoading, isSubmitting, setIsSubmitting, responsibleUsers, loadingResponsibleUsers,
    showPDFPreview, setShowPDFPreview, createdOrder, setCreatedOrder, createdOrderServices, setCreatedOrderServices,
    applyDeviceType, applyBrand, getCombinedSuggestions, applySuggestedModel, addCustomModelToCatalog,
    getTypeIdForDevice, getBrandsForDevice, getLinesForDevice, getModelsForDevice, getVariantsForModel,
    getCardImage, mapCatalogCodeToDeviceType, wizardTypeOptions
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
  const keepScrollPosition = (fn: () => void) => { if (typeof window === "undefined") { fn(); return; } if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); const currentScrollY = window.scrollY; fn(); const restore = () => { if (wizardPanelRef.current) wizardPanelRef.current.focus({ preventScroll: true }); window.scrollTo({ top: currentScrollY, behavior: "auto" }); }; requestAnimationFrame(() => { restore(); setTimeout(restore, 15); setTimeout(restore, 100); }); };
  const getWizardStep = (deviceId: string): number => wizardStepByDevice[deviceId] ?? 1; const getFlowStep = (deviceId: string): 1 | 2 | 3 => flowStepByDevice[deviceId] ?? 1; const isDeviceFinalized = (deviceId: string): boolean => Boolean(finalizedDeviceById[deviceId]);
  const wizardCardButtonClass = "bg-white border border-white rounded-xl p-2 shadow-sm transition hover:shadow-md text-left overflow-hidden min-h-[320px]";
  const wizardCardInnerTextClass = "font-medium text-slate-900 text-sm";

  // Cerrar sugerencias al hacer click fuera (para todos los equipos)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      devices.forEach(device => {
        const inputRef = deviceInputRefs.current[device.id];
        const suggestionsRef = deviceSuggestionsRefs.current[device.id];
        if (inputRef && suggestionsRef && 
            !inputRef.contains(event.target as Node) &&
            !suggestionsRef.contains(event.target as Node)) {
          setShowDeviceSuggestions(prev => ({ ...prev, [device.id]: false }));
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [devices.map(d => d.id).join(',')]);

  // Cargar encargados de la sucursal cuando es una sucursal
  // Cargar responsables de la sucursal cuando es una sucursal
  useEffect(() => {
    async function loadResponsibleUsers() {
      // Verificar si es una sucursal
      if (typeof window === 'undefined') return;
      
      const branchSessionStr = localStorage.getItem('branchSession');
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          // Si hay sesiÃƒÆ’Ã‚Â³n de sucursal, cargar responsables de esa sucursal
          if (branchSession.type === 'branch' && branchSession.branchId) {
            const sucursalId = branchSession.branchId;
            console.log("[OrderForm] Cargando responsables para sucursal:", sucursalId);
            
            setLoadingResponsibleUsers(true);
            
            // Primero, verificar todos los responsables para debug
            console.log("[OrderForm] DEBUG - Verificando auth.uid():", (await supabase.auth.getUser()).data.user?.id || "NULL");
            
            const { data: allResponsables, error: allError } = await supabase
              .from("users")
              .select("id, name, role, branch_id")
              .eq("role", "responsable");
            
            console.log("[OrderForm] DEBUG - Consulta todos los responsables - Error:", allError);
            console.log("[OrderForm] DEBUG - Todos los responsables en el sistema:", allResponsables);
            console.log("[OrderForm] DEBUG - Buscando responsables con branch_id:", sucursalId);
            console.log("[OrderForm] DEBUG - Tipo de sucursalId:", typeof sucursalId);
            
            if (allError) {
              console.error("[OrderForm] ERROR CRÃƒÆ’Ã‚ÂTICO - No se pueden leer responsables debido a RLS:", allError);
              console.error("[OrderForm] CÃƒÆ’Ã‚Â³digo de error:", allError.code);
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
              console.error("[OrderForm] CÃƒÆ’Ã‚Â³digo de error:", error.code);
              console.error("[OrderForm] Mensaje:", error.message);
              console.error("[OrderForm] Detalles:", error.details);
              console.error("[OrderForm] Hint:", error.hint);
              setResponsibleUsers([]);
            } else {
              console.log("[OrderForm] Responsables encontrados para sucursal", sucursalId, ":", data?.length || 0);
              if (data && data.length > 0) {
                console.log("[OrderForm] Responsables encontrados:", data.map(u => ({ 
                  id: u.id, 
                  name: u.name, 
                  branch_id: u.branch_id,
                  branch_id_type: typeof u.branch_id
                })));
              } else {
                // Si no hay responsables, mostrar informaciÃƒÆ’Ã‚Â³n de debug
                console.warn("[OrderForm] No se encontraron responsables para sucursal:", sucursalId);
                if (allResponsables && allResponsables.length > 0) {
                  console.warn("[OrderForm] Pero hay responsables en el sistema con estos branch_id:", 
                    allResponsables.map(u => ({ 
                      name: u.name, 
                      branch_id: u.branch_id, 
                      branch_id_type: typeof u.branch_id,
                      branch_id_coincide: u.branch_id === sucursalId,
                      branch_id_equals: u.branch_id == sucursalId
                    }))
                  );
                } else {
                  console.error("[OrderForm] PROBLEMA: No se pueden leer responsables. Esto indica que las polÃƒÆ’Ã‚Â­ticas RLS estÃƒÆ’Ã‚Â¡n bloqueando la consulta.");
                  console.error("[OrderForm] SOLUCIÃƒÆ’Ã¢â‚¬Å“N: Ejecuta el script fix_users_rls_simple.sql en Supabase SQL Editor");
                }
              }
              setResponsibleUsers(data || []);
            }
            setLoadingResponsibleUsers(false);
          }
        } catch (error) {
          console.error("[OrderForm] Error parseando sesiÃƒÆ’Ã‚Â³n de sucursal:", error);
          setLoadingResponsibleUsers(false);
        }
      }
    }

    loadResponsibleUsers();
  }, [technicianId]);

    const { handleSubmit } = useOrderSubmit(onSaved);
return (
    <Fragment>
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Nueva Orden de Trabajo</h2>

      {/* SelecciÃƒÆ’Ã‚Â³n de Cliente */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Cliente *
        </label>
        <CustomerSearch
          selectedCustomer={selectedCustomer}
          onCustomerSelect={setSelectedCustomer}
        />
      </div>

      {/* Equipos - Mostrar cada equipo en una secciÃƒÆ’Ã‚Â³n separada */}
      {devices.map((device, deviceIndex) => (
        <div key={device.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Equipo {deviceIndex + 1}
            </h3>
            {devices.length > 1 && (
              <button
                type="button"
                onClick={() => removeDevice(device.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã¢â‚¬ËœÃƒÂ¯Ã‚Â¸Ã‚Â Eliminar Equipo
              </button>
            )}
          </div>

          {/* InformaciÃƒÆ’Ã‚Â³n del Dispositivo */}
          {!isDeviceFinalized(device.id) && (
          <>
          {(!device.deviceModel || manualEditOpenByDevice[device.id]) ? (
          <div ref={wizardPanelRef} tabIndex={-1} className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Asistente rÃƒÆ’Ã‚Â¡pido</h4>
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
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Ãƒâ€šÃ‚Â¿No encuentras el dispositivo? EscrÃƒÆ’Ã‚Â­belo manual
                </button>
              </div>
            )}
            {getWizardStep(device.id) === 1 && (
              <>
                <p className="text-xl text-slate-600 mb-3">1) Ãƒâ€šÃ‚Â¿QuÃƒÆ’Ã‚Â© dispositivo vas a recibir?</p>
                {!catalogLoaded ? (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    Cargando catÃƒÆ’Ã‚Â¡logo de dispositivos...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {wizardTypeOptions.map((option) => (
                      <button
                        key={`${device.id}-${option.id}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyDeviceType(device.id, option.id)}
                        className={wizardCardButtonClass}
                      >
                        <AdaptiveWizardCardImage src={option.imageUrl} alt={option.label} />
                        <p className="font-medium text-slate-900 text-sm">{option.icon} {option.label}</p>
                        <p className="text-xs text-slate-600 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {getWizardStep(device.id) === 2 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xl text-slate-600">2) Ãƒâ€šÃ‚Â¿QuÃƒÆ’Ã‚Â© marca de {wizardTypeOptions.find((option) => option.id === device.deviceType)?.label.toLowerCase()}?</p>
                  <button type="button" className="text-xs underline text-slate-600" onClick={() => setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))}>
                    Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {getBrandsForDevice(device).map((brand) => (
                    <button
                      key={`${device.id}-brand-${brand.id}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBrand(device.id, String(brand.id))}
                      className={wizardCardButtonClass}
                    >
                      <AdaptiveWizardCardImage src={brand.logo_url || "https://dummyimage.com/320x160/e2e8f0/475569&text=Marca"} alt={brand.name} />
                      <p className="font-semibold text-xs">{brand.name}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {getWizardStep(device.id) === 3 && selectedBrandByDevice[device.id] && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xl text-slate-600">3) Selecciona serie / lÃƒÆ’Ã‚Â­nea</p>
                  <button
                    type="button"
                    className="text-xs underline text-slate-600"
                    onClick={() => {
                      keepScrollPosition(() => {
                        setSelectedBrandByDevice((prev) => ({ ...prev, [device.id]: null }));
                        setSelectedSeriesByDevice((prev) => ({ ...prev, [device.id]: null }));
                        setSelectedModelByDevice((prev) => ({ ...prev, [device.id]: null }));
                        setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 2 }));
                      });
                    }}
                  >
                    Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {getLinesForDevice(device).map((series) => (
                    <button
                      key={`${device.id}-series-${series.id}`}
                      type="button"
                      onClick={() => {
                        keepScrollPosition(() => {
                          setSelectedSeriesByDevice((prev) => ({ ...prev, [device.id]: String(series.id) }));
                          setSelectedModelByDevice((prev) => ({ ...prev, [device.id]: null }));
                          setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }));
                        });
                      }}
                      className={wizardCardButtonClass}
                    >
                      <AdaptiveWizardCardImage
                        src={series.image_url || "https://dummyimage.com/320x520/e2e8f0/475569&text=L%C3%ADnea"}
                        alt={series.name}
                      />
                      <p className="font-semibold text-xs">{series.name}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {getWizardStep(device.id) === 4 && selectedBrandByDevice[device.id] && selectedSeriesByDevice[device.id] && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xl text-slate-600">4) Modelo exacto</p>
                  <button
                    type="button"
                    className="text-xs underline text-slate-600"
                    onClick={() => {
                      keepScrollPosition(() => {
                        setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 3 }));
                      });
                    }}
                  >
                    Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getModelsForDevice(device).map((model) => {
                    const typeId = getTypeIdForDevice(device);
                    const brandId = Number(selectedBrandByDevice[device.id]) || null;
                    const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                    const displayName = buildDeviceDisplayName({
                      brandName: catalog.brands.find((b) => b.id === Number(selectedBrandByDevice[device.id]))?.name ?? "",
                      lineName: catalog.productLines.find((l) => l.id === Number(selectedSeriesByDevice[device.id]))?.name ?? "",
                      modelName: model.name,
                    });
                    const cardImage = getCardImage({ typeId, brandId, lineId, modelId: model.id, variantId: null });
                    return (
                      <button
                        key={`${device.id}-model-${model.id}`}
                        type="button"
                        onClick={() => {
                          const modelVariants = getVariantsForModel(model.id);
                          setSelectedModelByDevice((prev) => ({ ...prev, [device.id]: String(model.id) }));
                          setSelectedVariantByDevice((prev) => ({ ...prev, [device.id]: null }));
                          if (modelVariants.length > 0) {
                            setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 5 }));
                            return;
                          }
                          applySuggestedModel(device.id, displayName);
                        }}
                        className={wizardCardButtonClass}
                      >
                        <AdaptiveWizardCardImage
                          src={cardImage || "https://dummyimage.com/320x160/e2e8f0/475569&text=Modelo"}
                          alt={displayName}
                        />
                        <span>{displayName}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-md border border-dashed border-slate-300 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Ãƒâ€šÃ‚Â¿No aparece? AgrÃƒÆ’Ã‚Â©galo al catÃƒÆ’Ã‚Â¡logo</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      value={customCatalogFormByDevice[device.id]?.model ?? ""}
                      onChange={(e) => setCustomCatalogFormByDevice((prev) => ({ ...prev, [device.id]: { ...(prev[device.id] ?? { model: "", variant: "" }), model: e.target.value } }))}
                      className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                      placeholder="Modelo (ej: S24)"
                    />
                    <input
                      value={customCatalogFormByDevice[device.id]?.variant ?? ""}
                      onChange={(e) => setCustomCatalogFormByDevice((prev) => ({ ...prev, [device.id]: { ...(prev[device.id] ?? { model: "", variant: "" }), variant: e.target.value } }))}
                      className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                      placeholder="Variante (opcional)"
                    />
                    <button
                      type="button"
                      onClick={() => addCustomModelToCatalog(device)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      Guardar y usar
                    </button>
                  </div>
                </div>
              </>
            )}

            {getWizardStep(device.id) === 5 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xl text-slate-600">5) Variante</p>
                  <button
                    type="button"
                    className="text-xs underline text-slate-600"
                    onClick={() => setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 4 }))}
                  >
                    Volver
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(() => {
                    const selectedModelId = Number(selectedModelByDevice[device.id]);
                    if (!selectedModelId) return null;
                    const model = catalog.models.find((row) => row.id === selectedModelId);
                    if (!model) return null;
                    const variants = getVariantsForModel(selectedModelId);
                    const typeId = getTypeIdForDevice(device);
                    const brandId = Number(selectedBrandByDevice[device.id]) || null;
                    const lineId = Number(selectedSeriesByDevice[device.id]) || null;
                    const brandName = catalog.brands.find((b) => b.id === Number(selectedBrandByDevice[device.id]))?.name ?? "";
                    const lineName = catalog.productLines.find((l) => l.id === Number(selectedSeriesByDevice[device.id]))?.name ?? "";

                    return variants.map((variant) => {
                      const displayName = buildDeviceDisplayName({
                        brandName,
                        lineName,
                        modelName: model.name,
                        variantName: variant.name,
                      });
                      const cardImage = getCardImage({ typeId, brandId, lineId, modelId: model.id, variantId: variant.id });
                      return (
                        <button
                          key={`${device.id}-variant-${variant.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedVariantByDevice((prev) => ({ ...prev, [device.id]: String(variant.id) }));
                            applySuggestedModel(device.id, displayName);
                          }}
                          className={wizardCardButtonClass}
                        >
                          <AdaptiveWizardCardImage
                            src={cardImage || "https://dummyimage.com/320x160/e2e8f0/475569&text=Variante"}
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
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Dispositivo seleccionado</p>
                <p className="text-sm font-semibold text-emerald-900">{device.deviceModel}</p>
              </div>
              <button
                type="button"
                onClick={() => setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }))}
                className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Editar dispositivo
              </button>
            </div>
          )}
          </>
          )}

          {!isDeviceFinalized(device.id) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dispositivo seleccionado *
            </label>
            {(() => {
              const isManual = !!manualEntryByDevice[device.id];
              const typeId = getTypeIdForDevice(device);
              const brandId = Number(selectedBrandByDevice[device.id]) || null;
              const lineId = Number(selectedSeriesByDevice[device.id]) || null;
              const modelId = Number(selectedModelByDevice[device.id]) || 0;
              const variantId = selectedVariantByDevice[device.id] ? Number(selectedVariantByDevice[device.id]) : null;
              const cardImage = modelId ? getCardImage({ typeId, brandId, lineId, modelId, variantId }) : null;
              const fullName = `${catalog.brands.find((b) => b.id === brandId)?.name ?? ""} ${catalog.productLines.find((l) => l.id === lineId)?.name ?? ""} ${catalog.models.find((m) => m.id === modelId)?.name ?? ""}${variantId ? ` ${catalog.variants.find((v) => v.id === variantId)?.name ?? ""}` : ""}`.trim();

              if (isManual && (!device.deviceModel || manualEditOpenByDevice[device.id])) {
                const suggestions = deviceSuggestions[device.id] || [];
                return (
                  <div className="space-y-2 p-2 border border-slate-200 rounded-md bg-white">
                    <input
                      type="text"
                      value={device.deviceModel}
                      placeholder="Escribe el modelo manualmente..."
                      onChange={(e) => {
                        updateDevice(device.id, { deviceModel: e.target.value });
                        setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 6 }));
                      }}
                      className="w-full border border-slate-300 rounded-md px-2 py-2"
                    />
                    {suggestions.length > 0 && (
                      <div className="max-h-40 overflow-auto border border-slate-200 rounded-md bg-white">
                        {suggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => applySuggestedModel(device.id, item)}
                            className="w-full text-left px-2 py-1 hover:bg-slate-100"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualEntryByDevice((prev) => ({ ...prev, [device.id]: false }));
                          setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
                          setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 1 }));
                          updateDevice(device.id, { deviceModel: "" });
                        }}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Volver al asistente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (device.deviceModel.trim()) {
                            setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
                            setWizardStepByDevice((prev) => ({ ...prev, [device.id]: 6 }));
                          }
                        }}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Usar valor manual
                      </button>
                    </div>
                  </div>
                );
              }

              if (device.deviceModel) {
                return (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
                    <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white overflow-hidden border border-emerald-200">
                      <img src={cardImage || "https://dummyimage.com/100x100/e2e8f0/475569&text=?"} alt={fullName || device.deviceModel || "Dispositivo"} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{fullName || device.deviceModel}</p>
                      <p className="text-xs text-slate-600">{device.deviceModel}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                      onClick={() => {
                        setManualEditOpenByDevice((prev) => ({ ...prev, [device.id]: true }));
                        setWizardStepByDevice((prev) => ({ ...prev, [device.id]: isManual ? 6 : 2 }));
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                );
              }

              return (
                <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                  Completa el asistente rÃƒÆ’Ã‚Â¡pido para seleccionar el dispositivo.
                </div>
              );
            })()}
          </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              NÃƒÆ’Ã‚Âºmero de Serie (opcional)
            </label>
            {!serialFieldOpenByDevice[device.id] && !device.deviceSerial && (
              <button
                type="button"
                onClick={() => setSerialFieldOpenByDevice((prev) => ({ ...prev, [device.id]: true }))}
                className="text-xs rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 text-slate-700"
              >
                + Agregar nÃƒÆ’Ã‚Âºmero de serie
              </button>
            )}
          </div>
          {(serialFieldOpenByDevice[device.id] || !!device.deviceSerial) ? (
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2"
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
                className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
              >
                Quitar
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No agregado.</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              CÃƒÆ’Ã‚Â³digo/PatrÃƒÆ’Ã‚Â³n de Desbloqueo (opcional)
            </label>
            {!unlockFieldOpenByDevice[device.id] && device.unlockType === "none" && (
              <button
                type="button"
                onClick={() => setUnlockFieldOpenByDevice((prev) => ({ ...prev, [device.id]: true }))}
                className="text-xs rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 text-slate-700"
              >
                + Agregar cÃƒÆ’Ã‚Â³digo/patrÃƒÆ’Ã‚Â³n
              </button>
            )}
          </div>
          {(unlockFieldOpenByDevice[device.id] || device.unlockType !== "none") ? (
          <div className="space-y-2">
            <div className="flex gap-2">
            <select
              className="w-full border border-slate-300 rounded-md px-3 py-2"
              value={device.unlockType}
              onChange={(e) => {
                const type = e.target.value as "code" | "pattern" | "none";
                if (type === "pattern") {
                  updateDevice(device.id, {
                    unlockType: "pattern",
                    deviceUnlockCode: "",
                  });
                  setShowPatternDrawer({ deviceId: device.id });
                } else {
                  updateDevice(device.id, { 
                    unlockType: type,
                    deviceUnlockPattern: [],
                    deviceUnlockCode: type === "none" ? "" : device.deviceUnlockCode
                  });
                }
              }}
            >
              <option value="none">Sin cÃƒÆ’Ã‚Â³digo/patrÃƒÆ’Ã‚Â³n</option>
              <option value="code">CÃƒÆ’Ã‚Â³digo numÃƒÆ’Ã‚Â©rico</option>
              <option value="pattern">PatrÃƒÆ’Ã‚Â³n de desbloqueo</option>
            </select>
            <button
              type="button"
              onClick={() => {
                updateDevice(device.id, { unlockType: "none", deviceUnlockCode: "", deviceUnlockPattern: [] });
                setUnlockFieldOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
            >
              Quitar
            </button>
            </div>
            
            {device.unlockType === "code" && (
              <input
                type="text"
                className="w-full border border-slate-300 rounded-md px-3 py-2"
                placeholder="Ej: 1234"
                value={device.deviceUnlockCode}
                onChange={(e) => updateDevice(device.id, { deviceUnlockCode: e.target.value })}
              />
            )}
            
            {device.unlockType === "pattern" && device.deviceUnlockPattern.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <p className="text-sm text-slate-600 mb-2">
                  PatrÃƒÆ’Ã‚Â³n guardado ({device.deviceUnlockPattern.length} puntos)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPatternDrawer({ deviceId: device.id })}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
                  >
                    Cambiar PatrÃƒÆ’Ã‚Â³n
                  </button>
                </div>
              </div>
            )}
            
            {device.unlockType === "pattern" && device.deviceUnlockPattern.length === 0 && (
              <button
                type="button"
                onClick={() => setShowPatternDrawer({ deviceId: device.id })}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-md text-slate-600 hover:border-brand-light hover:text-brand-light transition-colors"
              >
                Dibujar PatrÃƒÆ’Ã‚Â³n
              </button>
            )}
          </div>
          ) : (
            <p className="text-xs text-slate-500">No agregado.</p>
          )}
        </div>
        
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
      </div>
      )}

          {/* Modal para seleccionar categorÃƒÆ’Ã‚Â­a de dispositivo */}
          {showDeviceCategoryModal?.deviceId === device.id && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Agregar Nuevo Dispositivo
                </h3>
                <p className="text-slate-600 mb-4">
                  El dispositivo <strong>&quot;{showDeviceCategoryModal.deviceModel || device.deviceModel}&quot;</strong> no estÃƒÆ’Ã‚Â¡ en el listado.
                  Por favor, selecciona la categorÃƒÆ’Ã‚Â­a del dispositivo:
                </p>
                <div className="space-y-2 mb-6">
                  <button
                    onClick={() => {
                      updateDevice(device.id, { deviceType: "iphone" });
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
                  >
                    <span className="font-medium">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â± Celular</span>
                    <p className="text-sm text-slate-600">iPhone, Android, etc.</p>
                  </button>
                  <button
                    onClick={() => {
                      updateDevice(device.id, { deviceType: "ipad" });
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
                  >
                    <span className="font-medium">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â± Tablet</span>
                    <p className="text-sm text-slate-600">iPad, Android Tablet, etc.</p>
                  </button>
                  <button
                    onClick={() => {
                      updateDevice(device.id, { deviceType: "macbook" });
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
                  >
                    <span className="font-medium">ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â» Notebook / Laptop</span>
                    <p className="text-sm text-slate-600">MacBook, Windows Laptop, etc.</p>
                  </button>
                  <button
                    onClick={() => {
                      updateDevice(device.id, { deviceType: "apple_watch" });
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
                  >
                    <span className="font-medium">ÃƒÂ¢Ã…â€™Ã…Â¡ Smartwatch</span>
                    <p className="text-sm text-slate-600">Apple Watch, Android Watch, etc.</p>
                  </button>
                  <button
                    onClick={() => {
                      updateDevice(device.id, { deviceType: "iphone" });
                      setShowDeviceCategoryModal(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
                  >
                    <span className="font-medium">ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â§ Otro</span>
                    <p className="text-sm text-slate-600">Otro tipo de dispositivo</p>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowDeviceCategoryModal(null);
                  }}
                  className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* BotÃƒÆ’Ã‚Â³n para agregar categorÃƒÆ’Ã‚Â­a si no se detectÃƒÆ’Ã‚Â³ tipo */}
          {device.deviceModel && !device.deviceType && showDeviceCategoryModal?.deviceId !== device.id && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 mb-2">
                No se detectÃƒÆ’Ã‚Â³ la categorÃƒÆ’Ã‚Â­a del dispositivo. Para mostrar el checklist, selecciona la categorÃƒÆ’Ã‚Â­a:
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDeviceCategoryModal({ deviceId: device.id, deviceModel: device.deviceModel });
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
              >
                ÃƒÂ¢Ã…Â¾Ã¢â‚¬Â¢ Agregar Nuevo Dispositivo
              </button>
            </div>
          )}

          {/* Flujo de checklist -> descripciÃƒÆ’Ã‚Â³n -> servicios (sin scroll) */}
          {device.deviceModel && !isDeviceFinalized(device.id) && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getFlowStep(device.id) === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  1. Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getFlowStep(device.id) === 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  2. Problema
                </button>
                <button
                  type="button"
                  onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getFlowStep(device.id) === 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  3. Servicios
                </button>
              </div>

              {getFlowStep(device.id) === 1 && device.deviceType && (
                <>
                  <DeviceChecklist
                    deviceType={device.deviceType}
                    checklistData={device.checklistData}
                    onChecklistChange={(newChecklist) => updateDevice(device.id, { checklistData: newChecklist })}
                  />
                  <div className="mt-4 flex justify-end">
<button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Siguiente: Descripcion
                    </button>
                  </div>
                </>
              )}

              {getFlowStep(device.id) === 2 && (
                <>
<label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripcion del Problema * (Maximo {MAX_DESCRIPTION_LENGTH} caracteres)
                  </label>
                  <div className="mb-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Selección rápida</p>
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
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {symptom}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    className={`w-full border rounded-md px-3 py-2 min-h-[100px] ${
                      device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                        ? "border-red-500 bg-red-50"
                        : "border-slate-300"
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
                  <div className="mt-1 flex justify-between items-center">
                    <span className={`text-xs ${
                      device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                        ? "text-red-600 font-semibold"
                        : device.problemDescription.length > MAX_DESCRIPTION_LENGTH * 0.9
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}>
                      {device.problemDescription.length > MAX_DESCRIPTION_LENGTH
                        ? `ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Excede el lÃƒÆ’Ã‚Â­mite por ${device.problemDescription.length - MAX_DESCRIPTION_LENGTH} caracteres`
                        : `${device.problemDescription.length} / ${MAX_DESCRIPTION_LENGTH} caracteres`}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 1 }))}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Volver a checklist
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Continuar: Servicios
                    </button>
                  </div>
                </>
              )}

              {getFlowStep(device.id) === 3 && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Servicios *
                  </label>
                  <ServiceSelector
                    selectedServices={device.selectedServices}
                    deviceType={device.deviceType}
                    deviceModel={device.deviceModel}
                    showSelectedServicesList={false}
                    onServicesChange={(services) => {
                console.log(`[OrderForm] onServicesChange llamado para equipo ${device.id}:`, {
                  servicios_anteriores: device.selectedServices.length,
                  servicios_nuevos: services.length,
                  servicios: services,
                });
                
                // Validar y eliminar duplicados por ID (protecciÃƒÆ’Ã‚Â³n adicional)
                const uniqueServices: Service[] = [];
                const seenIds = new Set<string>();
                
                for (const service of services) {
                  if (!seenIds.has(service.id)) {
                    seenIds.add(service.id);
                    uniqueServices.push(service);
                  } else {
                    console.warn(`[OrderForm] Servicio duplicado detectado y eliminado: ${service.name} (${service.id})`);
                  }
                }
                
                if (uniqueServices.length !== services.length) {
                  console.warn(`[OrderForm] Se eliminaron ${services.length - uniqueServices.length} servicios duplicados`);
                }
                
                // Al cambiar servicios, limpiar precios de servicios eliminados
                const currentPrices = device.servicePrices;
                const newPrices: Record<string, number> = {};
                uniqueServices.forEach(service => {
                  // Mantener precio existente si el servicio ya estaba, sino usar 0
                  newPrices[service.id] = currentPrices[service.id] || 0;
                });
                updateDevice(device.id, { 
                  selectedServices: uniqueServices,
                  servicePrices: newPrices
                });
                console.log(`[OrderForm] Estado actualizado para equipo ${device.id}. Servicios ÃƒÆ’Ã‚Âºnicos:`, uniqueServices.length);
                    }}
                  />
                  
                  {/* Lista de servicios con precios individuales */}
                  {device.selectedServices.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {device.selectedServices.map((service) => (
                        <div key={service.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                          <span className="font-medium text-slate-900 flex-1">{service.name}</span>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600 whitespace-nowrap">Precio (CLP):</label>
                            <input
                              type="text"
                              className="w-32 border border-slate-300 rounded-md px-3 py-2"
                              value={formatCLPInput(device.servicePrices[service.id] || 0)}
                              onChange={(e) => {
                                const newPrices = { ...device.servicePrices };
                                newPrices[service.id] = parseCLPInput(e.target.value);
                                updateDevice(device.id, { servicePrices: newPrices });
                              }}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Volver a descripciÃƒÆ’Ã‚Â³n
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinalizedDeviceById((prev) => ({ ...prev, [device.id]: true }));
                        setDetailsOpenByDevice((prev) => ({ ...prev, [device.id]: false }));
                      }}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Guardar dispositivo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {isDeviceFinalized(device.id) && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-lg border border-emerald-200 bg-white">
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
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">{device.deviceModel || `Equipo ${deviceIndex + 1}`}</p>
                  <p className="text-xs text-emerald-700">{device.selectedServices.length} servicio(s) registrados</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailsOpenByDevice((prev) => ({ ...prev, [device.id]: !prev[device.id] }))}
                    className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
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
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Eliminar dispositivo
                  </button>
                </div>
              </div>

              {detailsOpenByDevice[device.id] && (
                <div className="mt-3 space-y-3 rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">Checklist</p>
                    <p className="text-slate-600">{Object.keys(device.checklistData).length} items registrados</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">DescripciÃƒÆ’Ã‚Â³n del problema</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{device.problemDescription || "Sin descripciÃƒÆ’Ã‚Â³n"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Servicios</p>
                    {device.selectedServices.length > 0 ? (
                      <ul className="list-disc pl-5 text-slate-600">
                        {device.selectedServices.map((service) => (
                          <li key={`${device.id}-detail-${service.id}`}>
                            {service.name} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â {formatCLP(device.servicePrices[service.id] || 0)}
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
                      Editar descripciÃƒÆ’Ã‚Â³n
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
      ))}

      {/* BotÃƒÆ’Ã‚Â³n para agregar otro equipo */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={addNewDevice}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          ÃƒÂ¢Ã…Â¾Ã¢â‚¬Â¢ Agregar Otro Equipo
        </button>
      </div>

      {/* Campo de Responsable con Autocompletado (solo para sucursales) */}
      {(() => {
        // Verificar si es una sucursal
        if (typeof window === 'undefined') return null;
        const branchSessionStr = localStorage.getItem('branchSession');
        if (branchSessionStr) {
          try {
            const branchSession = JSON.parse(branchSessionStr);
            if (branchSession.type === 'branch' && branchSession.branchId) {
              return (
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Responsable de Recibir el Equipo *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="responsible-users-list"
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
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
                    <p className="text-xs text-slate-500 mt-1">Cargando responsables...</p>
                  ) : responsibleUsers.length > 0 ? (
                    <p className="text-xs text-slate-600 mt-1">
                      ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡ Puedes escribir el nombre o seleccionar de la lista. Si escribes un nombre que no estÃƒÆ’Ã‚Â¡ en la lista, se guardarÃƒÆ’Ã‚Â¡ igual.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 mt-1">
                      ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡ Escribe el nombre del responsable. Este campo es obligatorio.
                    </p>
                  )}
                  {!responsibleUserName && (
                    <p className="text-sm text-red-600 mt-1">
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

      {/* Prioridad y Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Prioridad *
          </label>
          <select
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            required
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label 
            htmlFor="commitment-date"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Fecha Compromiso
          </label>
          <div className="relative">
            <input
              id="commitment-date"
              type="date"
              className="w-full border border-slate-300 rounded-md px-3 py-2 cursor-pointer"
              value={commitmentDate}
              onChange={(e) => setCommitmentDate(e.target.value)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.showPicker) {
                  target.showPicker();
                }
              }}
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.showPicker) {
                  target.showPicker();
                }
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            GarantÃƒÆ’Ã‚Â­a (dÃƒÆ’Ã‚Â­as)
          </label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-md px-3 py-2"
            value={warrantyDays}
            onChange={(e) => setWarrantyDays(parseInt(e.target.value) || 30)}
            min="0"
          />
        </div>
      </div>

      {/* Total General - Suma de todos los equipos */}
      {(() => {
        const totalReplacementCost = devices.reduce((sum, device) => sum + device.replacementCost, 0);
        const totalServiceValue = devices.reduce((sum, device) => sum + getDeviceServiceTotal(device), 0);
        const totalGeneral = totalReplacementCost + totalServiceValue;
        
        return (
          <div className="bg-slate-50 p-4 rounded space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Subtotal General:</span>
              <span className="text-sm font-medium text-slate-700">
                {formatCLP(totalGeneral / 1.19)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">IVA (19%):</span>
              <span className="text-sm font-medium text-slate-700">
                {formatCLP(totalGeneral - (totalGeneral / 1.19))}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-slate-700">Total General ({devices.length} {devices.length === 1 ? 'equipo' : 'equipos'}):</span>
                <span className="text-2xl font-bold text-brand">
                  {formatCLP(totalGeneral)}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onSaved}
          className="px-6 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || isSubmitting || devices.some(device => device.problemDescription.length > MAX_DESCRIPTION_LENGTH)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || isSubmitting ? "Guardando..." : `Crear Orden${devices.length > 1 ? ` (${devices.length} equipos)` : ''}`}
        </button>
      </div>
    </form>

    {/* PDFPreview fuera del formulario para evitar que los botones disparen el submit */}
    {/* Mostrar preview de todos los equipos en una sola orden */}
    {showPDFPreview && createdOrder && devices.length > 0 && (
      <PDFPreview
        order={createdOrder}
        services={devices.flatMap(d => d.selectedServices)}
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
    </Fragment>
  );
}







