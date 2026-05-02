"use client";

import { NotebookPen, Check } from "lucide-react";
import { formatCLP } from "@/lib/currency";
import { useOrderWizard } from "./OrderWizardContext";
import type { DeviceItem } from "./OrderWizardContext";

interface OrderWizardSidebarProps {
  orderStep: number;
  device: DeviceItem;
  deviceIndex: number;
  getFlowStep: (deviceId: string) => 1 | 2 | 3;
  getDeviceServiceTotal: (device: DeviceItem) => number;
}

export default function OrderWizardSidebar({
  orderStep,
  device,
  deviceIndex,
  getFlowStep,
  getDeviceServiceTotal,
}: OrderWizardSidebarProps) {
  const {
    selectedCustomer,
    priority,
    setPriority,
    commitmentDate,
    setCommitmentDate,
    warrantyDays,
    setWarrantyDays,
    devices,
  } = useOrderWizard();

  const flowStep = getFlowStep(device.id);

  return (
    <aside className="sticky top-6 hidden xl:flex flex-col gap-4">
      {/* Tu Progreso */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
        <p className="text-base font-semibold text-slate-900">Tu progreso</p>
        <div className="mt-4 space-y-2">
          {[
            { label: "Dispositivo", state: orderStep > 2 ? "done" : "active" },
            { label: "Desbloqueo", state: orderStep > 3 ? "done" : orderStep === 3 ? "active" : "pending" },
            { label: "Checklist", state: flowStep > 1 ? "done" : flowStep === 1 && orderStep === 4 ? "active" : "pending" },
            { label: "Servicios", state: flowStep === 3 ? "active" : flowStep > 3 ? "done" : "pending" },
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

      {/* Informacion de Cliente */}
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

      {/* Resumen rapido del dispositivo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Resumen rapido</p>
        {device.deviceModel ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-xs font-medium text-indigo-700">📱</span>
              <p className="truncate text-sm font-medium text-slate-800">{device.deviceModel}</p>
            </div>
            <div className="space-y-1">
              <p className="flex justify-between text-xs text-slate-500">
                <span>Desbloqueo:</span>
                <span className="font-medium text-slate-700">{device.unlockType === "pattern" ? "Patron" : device.unlockType === "code" ? "PIN" : "Sin bloqueo"}</span>
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

          {/* Garantia */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Garantia (dias)</label>
            <select
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={0}>Sin garantia</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
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
  );
}
