"use client";

import { useState } from "react";
import { Wrench, Inbox } from "lucide-react";
import { formatCLPInput, parseCLPInput } from "@/lib/currency";
import { useOrderWizard, type DeviceItem } from "./OrderWizardContext";
import DeviceChecklist from "../DeviceChecklist";
import ServiceSelector from "../ServiceSelector";

interface DeviceDetailsFlowProps {
  device: DeviceItem;
  isFinalized: boolean;
  orderStep: number;
  activeStageByDevice: Record<string, "unlock" | "checklist" | "services">;
  setActiveStageByDevice: React.Dispatch<React.SetStateAction<Record<string, "unlock" | "checklist" | "services">>>;
  getFlowStep: (deviceId: string) => 1 | 2 | 3;
}

const MAX_DESCRIPTION_LENGTH = 500;
const QUICK_PROBLEM_SYMPTOMS = [
  "No enciende",
  "Pantalla danada",
  "No carga",
  "Bateria dura poco",
  "Sin senal",
  "Sin audio en llamada",
  "Lento / se reinicia",
  "Mojado",
];

export default function DeviceDetailsFlow({
  device,
  isFinalized,
  orderStep,
  activeStageByDevice,
  setActiveStageByDevice,
  getFlowStep,
}: DeviceDetailsFlowProps) {
  const context = useOrderWizard();
  const {
    setOrderStep,
    setFlowStepByDevice,
    setFinalizedDeviceById,
    setDetailsOpenByDevice,
    updateDevice,
  } = context;

  const [isAddingService, setIsAddingService] = useState(false);
  const [savingDeviceId, setSavingDeviceId] = useState<string | null>(null);
  const flowStep = getFlowStep(device.id);

  if (
    !device.deviceModel ||
    isFinalized ||
    (activeStageByDevice[device.id] ?? "unlock") === "unlock"
  ) return null;

  return (
    <>
      <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 p-4 shadow-[0_20px_40px_-30px_rgba(79,70,229,0.5)]">
        {/* Sub-step Navigation */}
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
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${flowStep === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              1. Checklist
            </button>
            <button
              type="button"
              onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${flowStep === 2 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              2. Problema
            </button>
            <button
              type="button"
              onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${flowStep === 3 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
            >
              3. Servicios
            </button>
          </div>
          
          {flowStep === 1 && device.deviceType && (
            <button
              type="button"
              onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 2 }))}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
            >
              Siguiente: Descripcion →
            </button>
          )}
          {flowStep === 2 && (
            <button
              type="button"
              onClick={() => setFlowStepByDevice((prev) => ({ ...prev, [device.id]: 3 }))}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
            >
              Siguiente: Servicios →
            </button>
          )}
          {flowStep === 3 && (
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

        {/* Flow Step 1: Checklist */}
        {flowStep === 1 && device.deviceType && (
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

        {/* Flow Step 2: Problem Description */}
        {flowStep === 2 && (
          <>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Descripcion del problema * (Maximo {MAX_DESCRIPTION_LENGTH} caracteres)
            </label>
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Seleccion rapida
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
                  ? `Excede el limite por ${device.problemDescription.length - MAX_DESCRIPTION_LENGTH} caracteres`
                  : `${device.problemDescription.length} / ${MAX_DESCRIPTION_LENGTH} caracteres`}
              </span>
            </div>
          </>
        )}

        {/* Flow Step 3: Services */}
        {flowStep === 3 && (
          <>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Servicios *
            </label>
            
            {(device.selectedServices.length === 0 || isAddingService) && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm relative">
                {device.selectedServices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
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
                    const uniqueServices: typeof services = [];
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
                    
                    setIsAddingService(false);
                  }}
                />
              </div>
            )}

            {device.selectedServices.length > 0 && !isAddingService && (
              <button
                type="button"
                onClick={() => setIsAddingService(true)}
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
                  <p className="text-sm font-semibold text-slate-700">Aun no has seleccionado servicios</p>
                  <p className="mt-1 text-xs text-slate-500">Selecciona uno o mas servicios de las categorias anteriores</p>
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
                          <span className="text-xs text-slate-500">Categoria: {service.category}</span>
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

      {/* Loading overlay */}
      {savingDeviceId === device.id && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="mt-4 text-lg font-semibold text-slate-800 animate-pulse">Guardando servicios...</p>
        </div>
      )}
    </>
  );
}
