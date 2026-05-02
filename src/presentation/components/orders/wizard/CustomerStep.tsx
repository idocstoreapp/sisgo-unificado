"use client";

import { useOrderWizard } from "./OrderWizardContext";
import CustomerSearch from "../CustomerSearch";

export default function CustomerStep() {
  const {
    selectedCustomer,
    setSelectedCustomer,
    orderStep,
    setOrderStep,
  } = useOrderWizard();

  return (
    <section className="mx-auto flex min-h-[58vh] w-full max-w-5xl items-center justify-center">
      <div className="w-full space-y-6 rounded-3xl border border-violet-100 bg-gradient-to-b from-white via-violet-50/30 to-white p-6 shadow-[0_28px_60px_-40px_rgba(79,70,229,0.55)] md:p-10">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-600 uppercase">
            Paso 1 · Cliente
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Quien trae el dispositivo?
          </h3>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Busca por nombre, correo o telefono. Tambien puedes crear un cliente nuevo en
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
            ⚡ Seleccion rapida del cliente en el mismo paso.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            👥 Ideal para clientes recurrentes y atenciones rapidas.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            ✅ Menos ruido visual, foco total en una sola accion.
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
  );
}
