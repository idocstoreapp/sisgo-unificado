import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import type { Customer, DeviceType, Service } from "@/types";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Save,
  Shield,
  Smartphone,
  UserCheck,
  Wrench,
} from "lucide-react";

import CustomerSearch from "./CustomerSearch";
import DeviceGridSelector from "./DeviceGridSelector";
import QuickChecklist from "./QuickChecklist";

interface QuickOrderWizardProps {
  technicianId: string;
  onSaved: () => void;
  onCancel?: () => void;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  services: Service[];
}

const PROBLEM_QUICK_OPTIONS = [
  { id: "pantalla", label: "Pantalla rota" },
  { id: "bateria", label: "Batería" },
  { id: "no_enciende", label: "No enciende" },
  { id: "camara", label: "Cámara" },
  { id: "audio", label: "Sin audio" },
  { id: "bloqueado", label: "Bloqueado" },
  { id: "carga", label: "No carga" },
  { id: "lentitud", label: "Lento" },
  { id: "otro", label: "Otro" },
];

const PRIORITY_OPTIONS = [
  { id: "baja", label: "Normal", note: "Tiempo estándar", color: "bg-slate-100 text-slate-700" },
  {
    id: "media",
    label: "Urgente",
    note: "Atención preferente",
    color: "bg-amber-100 text-amber-700",
  },
  { id: "urgente", label: "Crítico", note: "Prioridad máxima", color: "bg-rose-100 text-rose-700" },
];

const STEPS = [
  { num: 1, label: "Checklist", icon: CheckCircle2 },
  { num: 2, label: "Desbloqueo", icon: Lock },
  { num: 3, label: "Servicios", icon: Wrench },
  { num: 4, label: "Resumen", icon: FileText },
  { num: 5, label: "Confirmación", icon: Shield },
] as const;

export default function QuickOrderWizard({ technicianId, onSaved }: QuickOrderWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [deviceModel, setDeviceModel] = useState("");
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [problemType, setProblemType] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState("");
  const [priority, setPriority] = useState<"baja" | "media" | "urgente">("media");

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

  const [commitmentDate, setCommitmentDate] = useState("");
  const [warrantyDays] = useState(30);

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      const { data } = await supabase.from("services").select("*").order("name");

      if (data) {
        const categories: Record<string, ServiceCategory> = {
          bateria: { id: "bateria", name: "Batería", icon: "🔋", services: [] },
          camara: { id: "camara", name: "Cámara", icon: "📸", services: [] },
          pantalla: { id: "pantalla", name: "Pantalla", icon: "📱", services: [] },
          software: { id: "software", name: "Software", icon: "⚙️", services: [] },
          mantenimiento: { id: "mantenimiento", name: "Mantenimiento", icon: "🛠️", services: [] },
          carga: { id: "carga", name: "Carga", icon: "⚡", services: [] },
          otro: { id: "otro", name: "Otros", icon: "📦", services: [] },
        };

        const prices: Record<string, number> = {};

        data.forEach((service) => {
          const name = service.name.toLowerCase();
          let category = "otro";
          if (name.includes("bater")) category = "bateria";
          else if (name.includes("cámara") || name.includes("camara")) category = "camara";
          else if (name.includes("pantalla") || name.includes("display")) category = "pantalla";
          else if (
            name.includes("software") ||
            name.includes("actualiz") ||
            name.includes("ios") ||
            name.includes("android")
          )
            category = "software";
          else if (
            name.includes("limpieza") ||
            name.includes("mantenimiento") ||
            name.includes("diagnóstico") ||
            name.includes("diagnostico")
          )
            category = "mantenimiento";
          else if (name.includes("carga") || name.includes("conector") || name.includes("pin"))
            category = "carga";

          categories[category].services.push(service);
          prices[service.id] = service.default_price || 0;
        });

        setServicePrices(prices);
        setServiceCategories(Object.values(categories).filter((c) => c.services.length > 0));
      }
      setLoadingServices(false);
    }

    loadServices();
  }, []);

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service],
    );
  };

  const totalServices = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + (servicePrices[service.id] || service.default_price || 0),
        0,
      ),
    [selectedServices, servicePrices],
  );

  const canProceed = () => {
    switch (step) {
      case 1:
        return Boolean(customer && deviceType && deviceModel.trim());
      case 2:
        return true;
      case 3:
        return selectedServices.length > 0;
      case 4:
        return Boolean(problemType || problemDescription || selectedServices.length > 0);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!customer || !deviceType || !deviceModel || selectedServices.length === 0) {
      alert("Faltan datos requeridos");
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      const orderNum = `ORD-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today
        .getDate()
        .toString()
        .padStart(2, "0")}-${Date.now().toString().slice(-4)}`;

      const { data: order, error: orderError } = await supabase
        .from("work_orders")
        .insert({
          order_number: orderNum,
          customer_id: customer.id,
          technician_id: technicianId,
          device_type: deviceType,
          device_model: deviceModel,
          problem_description: problemDescription || problemType,
          checklist_data: checklistData,
          priority,
          commitment_date: commitmentDate || null,
          warranty_days: warrantyDays,
          total_repair_cost: totalServices,
          status: "en_proceso",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderServices = selectedServices.map((service) => ({
        order_id: order.id,
        service_id: service.id,
        service_name: service.name,
        quantity: 1,
        unit_price: servicePrices[service.id] || service.default_price || 0,
        total_price: servicePrices[service.id] || service.default_price || 0,
      }));

      const { error: servicesError } = await supabase.from("order_services").insert(orderServices);
      if (servicesError) throw servicesError;

      onSaved();
    } catch (error: any) {
      console.error("Error creando orden:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    1: "Checklist inicial y equipo",
    2: "Sección de desbloqueo",
    3: "Selección de servicios",
    4: "Resumen y confirmación",
    5: "Listo para crear orden",
  }[step];

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-h-[980px] w-full max-w-[1450px] overflow-hidden rounded-3xl border border-indigo-100 bg-slate-50 shadow-[0_30px_70px_-42px_rgba(79,70,229,0.55)]">
      <aside className="hidden w-[290px] flex-col border-r border-indigo-100/80 bg-white p-5 lg:flex">
        <h3 className="text-2xl font-semibold text-slate-900">Tu progreso</h3>
        <p className="mt-1 text-sm text-slate-500">Flujo guiado sin scroll</p>

        <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 p-3">
          {STEPS.map((item) => {
            const isCurrent = step === item.num;
            const isDone = step > item.num;
            return (
              <div
                key={item.num}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                  isCurrent ? "border-brand-light bg-brand-light/10" : "border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isDone || isCurrent
                        ? "bg-brand-light text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`text-sm ${isCurrent ? "font-semibold text-slate-900" : "text-slate-600"}`}
                  >
                    {item.label}
                  </span>
                </div>
                {isDone && <Check className="text-brand-light h-4 w-4" />}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Resumen rápido
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {deviceModel || "Equipo sin modelo"}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {deviceType?.replace("_", " ") || "Tipo pendiente"}
          </p>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p>Cliente: {customer?.name || "No seleccionado"}</p>
            <p>Servicios: {selectedServices.length}</p>
            <p>Total: {selectedServices.length ? formatCLP(totalServices) : "-"}</p>
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-700">
          <p className="font-semibold">Tu información está segura</p>
          <p className="mt-1">Usamos encriptación de nivel bancario para proteger los datos.</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="border-b border-indigo-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => step > 1 && setStep(step - 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <div className="hidden gap-3 md:flex">
              {STEPS.map((item, idx) => {
                const isCurrent = step === item.num;
                const isDone = step > item.num;
                return (
                  <div key={item.num} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isDone || isCurrent
                          ? "bg-brand-light text-white"
                          : "border border-slate-200 text-slate-400"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : item.num}
                    </span>
                    <span
                      className={`text-sm ${isCurrent ? "text-brand-dark font-semibold" : "text-slate-500"}`}
                    >
                      {item.label}
                    </span>
                    {idx < STEPS.length - 1 && <span className="h-px w-7 bg-slate-200" />}
                  </div>
                );
              })}
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{stepTitle}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="text-brand-light rounded-xl bg-indigo-100 p-2">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Cliente y recepción</h3>
                    <p className="text-sm text-slate-500">
                      Selecciona cliente, tipo y modelo del equipo.
                    </p>
                  </div>
                </div>
                <CustomerSearch selectedCustomer={customer} onCustomerSelect={setCustomer} />
                <DeviceGridSelector onSelect={setDeviceType} selected={deviceType} />
                <input
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="Modelo específico (ej: iPhone 11)"
                  className="focus:border-brand-light focus:ring-brand-light/20 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <h4 className="font-semibold text-slate-900">Checklist visual</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Desde este paso se mantiene visible el equipo para evitar confusión.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-xl border border-white bg-white p-3">
                    Cliente: {customer?.name || "Pendiente"}
                  </div>
                  <div className="rounded-xl border border-white bg-white p-3">
                    Tipo: {deviceType?.replace("_", " ") || "Pendiente"}
                  </div>
                  <div className="rounded-xl border border-white bg-white p-3">
                    Modelo: {deviceModel || "Pendiente"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <QuickChecklist
                deviceType={deviceType || "iphone"}
                checklistData={checklistData}
                onChecklistChange={setChecklistData}
              />
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <h4 className="text-base font-semibold text-indigo-900">Seguro e inmutable</h4>
                <ul className="mt-3 space-y-2 text-sm text-indigo-800">
                  <li>✓ Validación en recepción sin fricción.</li>
                  <li>✓ El estado inicial queda guardado para respaldo.</li>
                  <li>✓ Puedes ampliar en diagnóstico después.</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {loadingServices ? (
                <div className="flex items-center justify-center py-14 text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando servicios...
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {serviceCategories.map((category) => (
                      <div key={category.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {category.icon} {category.name}
                        </p>
                        <div className="mt-3 space-y-2">
                          {category.services.slice(0, 4).map((service) => {
                            const selected = selectedServices.some((s) => s.id === service.id);
                            return (
                              <button
                                type="button"
                                key={service.id}
                                onClick={() => toggleService(service)}
                                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                                  selected
                                    ? "border-brand-light bg-brand-light/10"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <span className="truncate pr-2">{service.name}</span>
                                <span className="font-medium text-slate-700">
                                  {formatCLP(
                                    servicePrices[service.id] || service.default_price || 0,
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-brand-light/40 bg-brand-light/5 rounded-2xl border border-dashed p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Servicios seleccionados ({selectedServices.length})
                    </p>
                    {selectedServices.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Aún no has seleccionado servicios.
                      </p>
                    ) : (
                      <ul className="mt-2 grid gap-2 md:grid-cols-2">
                        {selectedServices.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900">Problema y prioridad</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {PROBLEM_QUICK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProblemType(opt.label)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                        problemType === opt.label
                          ? "border-brand-light bg-brand-light/10 text-brand-dark"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Detalle adicional (opcional)"
                  className="focus:border-brand-light min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                />

                <div className="grid gap-2 sm:grid-cols-3">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setPriority(opt.id as "baja" | "media" | "urgente")}
                      className={`rounded-xl border px-3 py-2 text-left ${priority === opt.id ? "border-slate-900" : "border-slate-200"}`}
                    >
                      <p
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${opt.color}`}
                      >
                        {opt.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{opt.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">¡Todo listo!</p>
                <p className="mt-1 text-sm text-emerald-800">
                  Estás a un paso de completar el registro del dispositivo.
                </p>
                <div className="mt-4 rounded-xl border border-white bg-white p-3">
                  <p className="text-xs text-slate-500">Total estimado</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {formatCLP(totalServices || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <h3 className="text-xl font-semibold text-slate-900">Resumen y confirmación</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Cliente</p>
                    <p className="font-medium text-slate-900">{customer?.name}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Dispositivo</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {deviceType?.replace("_", " ")} - {deviceModel}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">
                    Servicios seleccionados ({selectedServices.length})
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {selectedServices.map((service) => (
                      <li key={service.id} className="flex items-center justify-between">
                        <span>{service.name}</span>
                        <span>
                          {formatCLP(servicePrices[service.id] || service.default_price || 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-brand-light/30 bg-brand-light/5 rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Monto total</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatCLP(totalServices)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Detalles adicionales</p>
                <label className="mt-3 block text-xs text-slate-600">Fecha compromiso</label>
                <input
                  type="date"
                  value={commitmentDate}
                  onChange={(e) => setCommitmentDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
                  Garantía: {warrantyDays} días
                </div>
                <div className="mt-3 inline-flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4" /> Al confirmar, se crea la orden y sus
                  servicios.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => step > 1 && setStep(step - 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed() || loading}
              className="from-brand-light to-brand-dark inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? "Creando orden..." : "Confirmar y finalizar"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
