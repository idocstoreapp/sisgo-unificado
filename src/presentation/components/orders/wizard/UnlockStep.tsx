"use client";

import { Lock, ShieldCheck, Grip, KeyRound, Check } from "lucide-react";
import { useOrderWizard, type DeviceItem } from "./OrderWizardContext";
import PatternDrawer from "../PatternDrawer";
import PatternViewer from "../PatternViewer";

interface UnlockStepProps {
  device: DeviceItem;
  isFinalized: boolean;
  orderStep: number;
  activeStageByDevice: Record<string, "unlock" | "checklist" | "services">;
  setActiveStageByDevice: React.Dispatch<React.SetStateAction<Record<string, "unlock" | "checklist" | "services">>>;
}

export default function UnlockStep({
  device,
  isFinalized,
  orderStep,
  activeStageByDevice,
  setActiveStageByDevice,
}: UnlockStepProps) {
  const {
    setOrderStep,
    updateDevice,
    serialFieldOpenByDevice,
    setSerialFieldOpenByDevice,
    setUnlockFieldOpenByDevice,
    showPatternDrawer,
    setShowPatternDrawer,
  } = useOrderWizard();

  if (isFinalized || orderStep < 3 || (activeStageByDevice[device.id] ?? "unlock") !== "unlock") return null;

  return (
    <>
      <div className="space-y-4">
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
                    Esta informacion se usa para validar la recepcion del dispositivo.
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
            {/* Serial Number */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Numero de Serie (opcional)
                </label>
                {!serialFieldOpenByDevice[device.id] && !device.deviceSerial && (
                  <button
                    type="button"
                    onClick={() =>
                      setSerialFieldOpenByDevice((prev) => ({ ...prev, [device.id]: true }))
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    + Agregar numero de serie
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

            {/* Unlock Type Selection */}
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: "pattern" as const, label: "Patron de desbloqueo", helper: "Dibuja una secuencia unica", icon: Grip },
                { value: "code" as const, label: "Codigo PIN", helper: "Ingresa un codigo numerico", icon: KeyRound },
                { value: "none" as const, label: "Sin bloqueo", helper: "El dispositivo llega desbloqueado", icon: Check },
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

            {/* Unlock Type Content */}
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
                        Patron registrado
                        {device.deviceUnlockPattern.length > 0 &&
                          ` (${device.deviceUnlockPattern.length} puntos)`}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowPatternDrawer({ deviceId: device.id })}
                        className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        {device.deviceUnlockPattern.length > 0 ? "Cambiar patron" : "Dibujar patron"}
                      </button>
                    </div>
                    {device.deviceUnlockPattern.length > 0 ? (
                      <PatternViewer pattern={device.deviceUnlockPattern} size={180} />
                    ) : (
                      <p className="rounded-xl border border-dashed border-violet-300 bg-white px-3 py-5 text-center text-sm text-slate-600">
                        Aun no hay patron guardado.
                      </p>
                    )}
                  </div>
                )}

                {device.unlockType === "none" && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-sm text-emerald-800">
                    El equipo sera registrado como <strong>sin bloqueo</strong>.
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
                    Tu patron o codigo queda asociado a esta orden.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
                    Se usa para validaciones de recepcion y entrega.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-violet-600" />
                    Diseno orientado a flujo guiado, rapido y claro.
                  </li>
                </ul>
              </div>
            </div>

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
    </>
  );
}
