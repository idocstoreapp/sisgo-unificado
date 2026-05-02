"use client";
import { useState, useEffect, useRef, Fragment, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import type { DeviceType, User } from "@/types";
import {
  Check,
  CircleHelp,
  Inbox,
  Plus,
  Wrench,
} from "lucide-react";

import PatternDrawer from "../PatternDrawer";
import PDFPreview from "../PDFPreview";

import { useOrderWizard, type DeviceItem } from "./OrderWizardContext";
import { useOrderSubmit } from "./useOrderSubmit";
import OrderWizardSidebar from "./OrderWizardSidebar";
import CustomerStep from "./CustomerStep";
import DeviceCatalogStep from "./DeviceCatalogStep";
import UnlockStep from "./UnlockStep";
import DeviceDetailsFlow from "./DeviceDetailsFlow";
import OrderSummaryStep from "./OrderSummaryStep";

export default function OrderWizardContent({ onSaved }: { onSaved: () => void }) {
  const context = useOrderWizard();
  const {
    technicianId,
    selectedCustomer,
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
    detailsOpenByDevice,
    setDetailsOpenByDevice,
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
    wizardPanelRef,
  } = context;

  const [activeStageByDevice, setActiveStageByDevice] = useState<
    Record<string, "unlock" | "checklist" | "services">
  >({});
  const [showAddDevicePrompt, setShowAddDevicePrompt] = useState(false);
  const deviceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const deviceSuggestionsRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getWizardStep = (deviceId: string): number => wizardStepByDevice[deviceId] ?? 1;
  const getFlowStep = (deviceId: string): 1 | 2 | 3 => flowStepByDevice[deviceId] ?? 1;
  const isDeviceFinalized = (deviceId: string): boolean => Boolean(finalizedDeviceById[deviceId]);

  const getDeviceServiceTotal = (device: DeviceItem): number => {
    if (!device) return 0;
    return (device.selectedServices || []).reduce((sum: number, service) => {
      return sum + (device.servicePrices?.[service.id] || 0);
    }, 0);
  };

  const { handleSubmit } = useOrderSubmit(onSaved);

  // Cerrar sugerencias al hacer click fuera
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

  // Cargar responsables de la sucursal
  useEffect(() => {
    async function loadResponsibleUsers() {
      if (typeof window === "undefined") return;
      const branchSessionStr = localStorage.getItem("branchSession");
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          if (branchSession.type === "branch" && branchSession.branchId) {
            setLoadingResponsibleUsers(true);
            const { data, error } = await supabase
              .from("users")
              .select("*")
              .eq("role", "responsable")
              .eq("branch_id", branchSession.branchId)
              .order("name");
            if (error) {
              console.error("[OrderForm] Error cargando responsables:", error);
              setResponsibleUsers([]);
            } else {
              setResponsibleUsers(data || []);
            }
            setLoadingResponsibleUsers(false);
          }
        } catch (error) {
          console.error("[OrderForm] Error parseando sesion de sucursal:", error);
          setLoadingResponsibleUsers(false);
        }
      }
    }
    loadResponsibleUsers();
  }, [technicianId]);

  const isBranchSession = (() => {
    if (typeof window === "undefined") return false;
    try {
      const branchSessionStr = localStorage.getItem("branchSession");
      if (branchSessionStr) {
        const branchSession = JSON.parse(branchSessionStr);
        return branchSession.type === "branch" && branchSession.branchId;
      }
    } catch { /* ignore */ }
    return false;
  })();

  return (
    <Fragment>
      <form onSubmit={handleSubmit} className="min-h-screen space-y-4 bg-slate-50/50 pb-20">
        {/* Progress Bar */}
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

        {/* Step 1: Customer */}
        {orderStep === 1 && <CustomerStep />}

        {/* Steps 2-4: Devices */}
        {orderStep >= 2 && orderStep < 5 && devices.map((device, deviceIndex) => (
          <div
            key={device.id}
            className={`grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] items-start gap-6 rounded-3xl border border-slate-100 bg-gradient-to-b from-white via-slate-50/30 to-slate-100/60 p-6 shadow-[0_28px_50px_-36px_rgba(15,23,42,0.18)] ${orderStep === 2 ? "min-h-[72vh]" : ""}`}
          >
            {/* Sidebar (visible on xl) */}
            <OrderWizardSidebar
              orderStep={orderStep}
              device={device}
              deviceIndex={deviceIndex}
              getFlowStep={getFlowStep}
              getDeviceServiceTotal={getDeviceServiceTotal}
            />

            {/* Main Content */}
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

              {/* Step 2: Device Catalog Selection */}
              <DeviceCatalogStep
                device={device}
                deviceIndex={deviceIndex}
                isFinalized={isDeviceFinalized(device.id)}
                orderStep={orderStep}
                getWizardStep={getWizardStep}
              />

              {/* Continue to Unlock button (step 2) */}
              {!isDeviceFinalized(device.id) && orderStep === 2 && device.deviceModel && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStageByDevice((prev) => ({ ...prev, [device.id]: "unlock" }));
                      setOrderStep(3);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Continuar · Desbloqueo
                  </button>
                </div>
              )}

              {/* Step 3: Unlock */}
              <UnlockStep
                device={device}
                isFinalized={isDeviceFinalized(device.id)}
                orderStep={orderStep}
                activeStageByDevice={activeStageByDevice}
                setActiveStageByDevice={setActiveStageByDevice}
              />

              {/* Device Category Modal */}
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
                      no esta en el listado. Selecciona la categoria:
                    </p>
                    <div className="mb-6 space-y-2">
                      {(["iphone", "ipad", "macbook", "apple_watch"] as DeviceType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            updateDevice(device.id, { deviceType: type });
                            setShowDeviceCategoryModal(null);
                          }}
                          className="w-full rounded-md bg-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-200"
                        >
                          <span className="font-medium">
                            {type === "iphone" ? "📱 Celular" : type === "ipad" ? "📱 Tablet" : type === "macbook" ? "💻 Notebook" : "⌚ Smartwatch"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDeviceCategoryModal(null)}
                      className="w-full rounded-md bg-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Add category button if no type detected */}
              {device.deviceModel &&
                !device.deviceType &&
                showDeviceCategoryModal?.deviceId !== device.id && (
                  <div className="mb-4 rounded-md border border-stone-200 bg-stone-50 p-4">
                    <p className="mb-2 text-sm text-stone-800">
                      No se detecto la categoria del dispositivo. Para mostrar el checklist, selecciona la categoria:
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
                      Agregar Nuevo Dispositivo
                    </button>
                  </div>
                )}

              {/* Step 4: Checklist / Problem / Services */}
              <DeviceDetailsFlow
                device={device}
                isFinalized={isDeviceFinalized(device.id)}
                orderStep={orderStep}
                activeStageByDevice={activeStageByDevice}
                setActiveStageByDevice={setActiveStageByDevice}
                getFlowStep={getFlowStep}
              />

              {/* Finalized Device Summary */}
              {isDeviceFinalized(device.id) && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      <img
                        src={(() => {
                          const typeId = getTypeIdForDevice(device);
                          const brandId = Number(context.selectedBrandByDevice[device.id]) || null;
                          const lineId = Number(context.selectedSeriesByDevice[device.id]) || null;
                          const modelId = Number(context.selectedModelByDevice[device.id]) || 0;
                          const variantId = context.selectedVariantByDevice[device.id]
                            ? Number(context.selectedVariantByDevice[device.id])
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
                        <p className="font-semibold text-slate-800">Descripcion del problema</p>
                        <p className="whitespace-pre-wrap text-slate-600">
                          {device.problemDescription || "Sin descripcion"}
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
                          Editar descripcion
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

        {/* Add Device Button */}
        {orderStep === 2 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addNewDevice}
              className="flex items-center gap-2 rounded-md bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" /> Agregar Otro Equipo
            </button>
          </div>
        )}

        {/* Responsible User (branch sessions) */}
        {isBranchSession && (
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
                  {responsibleUsers.map((user: User) => (
                    <option key={user.id} value={user.name} />
                  ))}
                </datalist>
              )}
            </div>
            {loadingResponsibleUsers ? (
              <p className="mt-1 text-xs text-slate-500">Cargando responsables...</p>
            ) : responsibleUsers.length > 0 ? (
              <p className="mt-1 text-xs text-slate-600">
                Puedes escribir el nombre o seleccionar de la lista.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-600">
                Escribe el nombre del responsable. Este campo es obligatorio.
              </p>
            )}
          </div>
        )}

        {/* Step 5: Summary */}
        <OrderSummaryStep
          devices={devices}
          getDeviceServiceTotal={getDeviceServiceTotal}
        />
      </form>

      {/* PDFPreview */}
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

      {/* Pattern Drawer (global) */}
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

      {/* Add Device Prompt Modal */}
      {showAddDevicePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-slate-900">Dispositivo guardado!</h3>
            <p className="mb-8 text-slate-500">Que deseas hacer a continuacion?</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddDevicePrompt(false);
                  setOrderStep(5);
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
