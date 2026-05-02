"use client";

import { Check, Lock, Wrench } from "lucide-react";
import { formatCLP, formatCLPInput, parseCLPInput } from "@/lib/currency";
import { useOrderWizard, type DeviceItem } from "./OrderWizardContext";

interface OrderSummaryStepProps {
  devices: DeviceItem[];
  getDeviceServiceTotal: (device: DeviceItem) => number;
}

export default function OrderSummaryStep({
  devices,
  getDeviceServiceTotal,
}: OrderSummaryStepProps) {
  const context = useOrderWizard();
  const {
    selectedCustomer,
    orderStep,
    setOrderStep,
    setFinalizedDeviceById,
    setOrderStep: setOrderStepContext,
    priority,
    setPriority,
    commitmentDate,
    setCommitmentDate,
    warrantyDays,
    setWarrantyDays,
    loading,
    isSubmitting,
    selectedBrandByDevice,
    selectedSeriesByDevice,
    selectedModelByDevice,
    selectedVariantByDevice,
    getTypeIdForDevice,
    getCardImage,
    onSaved,
    showPDFPreview,
    setShowPDFPreview,
    createdOrder,
    createdOrderServices,
  } = context;

  if (orderStep !== 5) return null;

  const MAX_DESCRIPTION_LENGTH = 500;

  const handleSubmitClick = (e: React.MouseEvent) => {
    const deviceMissingDesc = devices.find(d => !d.problemDescription || d.problemDescription.trim() === "");
    if (deviceMissingDesc) {
      e.preventDefault();
      alert(`Faltan datos obligatorios.\n\nPor favor, ingresa la descripcion del problema para el equipo: ${deviceMissingDesc.deviceModel || "Desconocido"}`);
      setFinalizedDeviceById(prev => ({ ...prev, [deviceMissingDesc.id]: false }));
      setOrderStepContext(4);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Resumen y confirmacion</h2>
        <p className="mt-2 text-slate-500">Revisa la informacion de tu registro antes de confirmar.</p>
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
                      <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-indigo-500" /> {device.unlockType === "pattern" ? "Patron guardado" : device.unlockType === "code" ? "Codigo guardado" : "Sin bloqueo"}</span>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Garantia</label>
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <input type="number" className="w-12 bg-transparent text-center focus:outline-none" value={warrantyDays} onChange={(e) => setWarrantyDays(parseInt(e.target.value) || 0)} />
                      <span>dias</span>
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
              <h3 className="text-2xl font-bold text-slate-900">Todo listo!</h3>
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
              Al confirmar, aceptas nuestros Terminos y Condiciones y autorizas el procesamiento.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || isSubmitting || devices.some((device) => device.problemDescription.length > MAX_DESCRIPTION_LENGTH)}
                onClick={handleSubmitClick}
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
  );
}
