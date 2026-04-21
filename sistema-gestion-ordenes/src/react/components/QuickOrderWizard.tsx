import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import type { Customer, Service, DeviceType } from "@/types";

import DeviceGridSelector from "./DeviceGridSelector";
import QuickChecklist from "./QuickChecklist";
import CustomerSearch from "./CustomerSearch";
import { 
  UserCheck, Smartphone, Wrench, FileText, Calendar, Save, 
  ChevronRight, CheckCircle2, Plus, Minus, X, Loader2
} from "lucide-react";

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
  { id: "baja", label: "Normal", color: "bg-slate-100 text-slate-700", icon: "✓" },
  { id: "media", label: "Urgente", color: "bg-amber-100 text-amber-700", icon: "⚠" },
  { id: "urgente", label: "Crítico", color: "bg-rose-100 text-rose-700", icon: "🔴" },
];

export default function QuickOrderWizard({ technicianId, onSaved }: QuickOrderWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Paso 1: Cliente
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Paso 2: Dispositivo
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [deviceModel, setDeviceModel] = useState("");
  
  // Paso 3: Checklist (simplificado)
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  
  // Paso 4: Problema
  const [problemType, setProblemType] = useState<string>("");
  const [problemDescription, setProblemDescription] = useState("");
  const [priority, setPriority] = useState<"baja" | "media" | "urgente">("media");
  
  // Paso 5: Servicios
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  
  // Paso 6: Resumen
  const [commitmentDate, setCommitmentDate] = useState("");
  const [warrantyDays] = useState(30);
  
  // Cargar servicios
  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      const { data } = await supabase.from("services").select("*").order("name");
      
      if (data) {
        // Agrupar por categorías simples
        const categories: Record<string, ServiceCategory> = {
          pantalla: { id: "pantalla", name: "🖥️ Pantalla", icon: "🖥️", services: [] },
          bateria: { id: "bateria", name: "🔋 Batería", icon: "🔋", services: [] },
          componentes: { id: "componentes", name: "🔌 Componentes", icon: "🔌", services: [] },
          software: { id: "software", name: "💻 Software", icon: "💻", services: [] },
          limpieza: { id: "limpieza", name: "🧹 Limpieza", icon: "🧹", services: [] },
          otro: { id: "otro", name: "❓ Otros", icon: "❓", services: [] },
        };
        
        data.forEach(service => {
          const name = service.name.toLowerCase();
          let category = "otro";
          if (name.includes("pantalla")) category = "pantalla";
          else if (name.includes("batería") || name.includes("bateria")) category = "bateria";
          else if (name.includes("cámara") || name.includes("camara") || name.includes("altavo") || name.includes("botón") || name.includes("boton") || name.includes("carga") || name.includes("sensor")) category = "componentes";
          else if (name.includes("software") || name.includes("actualiz") || name.includes("ios") || name.includes("android")) category = "software";
          else if (name.includes("limp")) category = "limpieza";
          
          categories[category].services.push(service);
          // Inicializar precio
          servicePrices[service.id] = service.default_price || 0;
        });
        
        setServiceCategories(Object.values(categories).filter(c => c.services.length > 0));
        setServices(data);
      }
      setLoadingServices(false);
    }
    loadServices();
  }, []);

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const totalServices = selectedServices.reduce((sum, s) => {
    return sum + (servicePrices[s.id] || s.default_price || 0);
  }, 0);

  const canProceed = () => {
    switch (step) {
      case 1: return !!customer;
      case 2: return !!deviceType && !!deviceModel;
      case 3: return true; // Checklist siempre opcional en modo rápido
      case 4: return !!problemType || !!problemDescription;
      case 5: return selectedServices.length > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!customer || !deviceType || !deviceModel || selectedServices.length === 0) {
      alert("Faltan datos requeridos");
      return;
    }

    setLoading(true);
    try {
      // Generar número de orden
      const today = new Date();
      const orderNum = `ORD-${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,"0")}${today.getDate().toString().padStart(2,"0")}-${Date.now().toString().slice(-4)}`;
      
      // Crear orden
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
          priority: priority,
          commitment_date: commitmentDate || null,
          warranty_days: warrantyDays,
          total_repair_cost: totalServices,
          status: "en_proceso",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear servicios asociados
      const orderServices = selectedServices.map(s => ({
        order_id: order.id,
        service_id: s.id,
        service_name: s.name,
        quantity: 1,
        unit_price: servicePrices[s.id] || s.default_price || 0,
        total_price: servicePrices[s.id] || s.default_price || 0,
      }));

      const { error: servicesError } = await supabase
        .from("order_services")
        .insert(orderServices);

      if (servicesError) throw servicesError;

      onSaved();
    } catch (error: any) {
      console.error("Error creando orden:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, icon: UserCheck, label: "Cliente" },
    { num: 2, icon: Smartphone, label: "Equipo" },
    { num: 3, icon: CheckCircle2, label: "Estado" },
    { num: 4, icon: FileText, label: "Problema" },
    { num: 5, icon: Wrench, label: "Servicios" },
    { num: 6, icon: Save, label: "Listo" },
  ];

  const StepIcon = ({ step: s, current }: { step: typeof steps[0], current: boolean }) => {
    const Icon = s.icon;
    const isCompleted = step > s.num;
    
    return (
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full transition-all
        ${isCompleted ? "bg-emerald-500 text-white" : current ? "bg-brand-light text-white" : "bg-slate-200 text-slate-500"}
      `}>
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.65)]">
      {/* Header con pasos */}
      <div className="border-b border-slate-700/30 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Servicio Técnico</p>
            <h1 className="text-lg font-semibold text-white">Asistente de Recepción</h1>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
            Paso {step} de {steps.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <StepIcon step={s} current={step === s.num} />
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${step > s.num ? "bg-emerald-500" : "bg-slate-600"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-white/70">
          {steps.find(s => s.num === step)?.label}
        </p>
      </div>

      <div className="min-h-[460px] bg-gradient-to-b from-white to-slate-50/70 p-6">
        {/* Paso 1: Cliente */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">¿Quién es el cliente?</h2>
                <p className="text-sm text-slate-500">Busca por nombre, RUT, email o teléfono</p>
              </div>
            </div>
            
            <CustomerSearch
              selectedCustomer={customer}
              onCustomerSelect={setCustomer}
            />
            
            {customer && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">{customer.name}</p>
                  <p className="text-sm text-emerald-700">{customer.email} • {customer.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Dispositivo */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">¿Qué dispositivo?</h2>
                <p className="text-sm text-slate-500">Selecciona el tipo de equipo</p>
              </div>
            </div>
            
            {!deviceType ? (
              <DeviceGridSelector onSelect={setDeviceType} selected={deviceType} />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-purple-600" />
                    <span className="font-semibold text-purple-900 capitalize">{deviceType.replace("_", " ")}</span>
                  </div>
                  <button onClick={() => setDeviceType(null)} className="text-purple-600 hover:text-purple-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Modelo específico</label>
                  <input
                    type="text"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="Ej: iPhone 14 Pro, Samsung S23 Ultra..."
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Checklist rápido */}
        {step === 3 && deviceType && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Estado del equipo</h2>
                <p className="text-sm text-slate-500">Revisión rápida (opcional)</p>
              </div>
            </div>
            
            <QuickChecklist
              deviceType={deviceType}
              checklistData={checklistData}
              onChecklistChange={setChecklistData}
            />
          </div>
        )}

        {/* Paso 4: Problema */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">¿Qué le pasa?</h2>
                <p className="text-sm text-slate-500">Selecciona o describe el problema</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROBLEM_QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProblemType(opt.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    problemType === opt.id
                      ? "border-amber-500 bg-amber-100 shadow-sm"
                      : "border-slate-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                </button>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Descripción adicional</label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Detalles adicionales del problema..."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[80px] focus:ring-2 focus:ring-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prioridad</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPriority(opt.id as any)}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                      priority === opt.id
                        ? opt.color
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Paso 5: Servicios */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Servicios</h2>
                <p className="text-sm text-slate-500">Selecciona los servicios a realizar</p>
              </div>
            </div>
            
            {loadingServices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="max-h-[350px] space-y-3 overflow-y-auto pr-2">
                {serviceCategories.map((category) => (
                  <div key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="bg-gradient-to-r from-slate-50 to-white px-3 py-2 text-sm font-medium text-slate-700">
                      {category.name}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {category.services.map((service) => {
                        const isSelected = selectedServices.find(s => s.id === service.id);
                        const price = servicePrices[service.id] || service.default_price || 0;
                        
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`w-full flex items-center justify-between p-3 text-left transition-all ${
                              isSelected ? "bg-rose-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? "border-rose-500 bg-rose-500" : "border-slate-300"
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${isSelected ? "font-medium text-rose-900" : "text-slate-700"}`}>
                                {service.name}
                              </span>
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-rose-600" : "text-slate-500"}`}>
                              {formatCLP(price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedServices.length > 0 && (
              <div className="rounded-2xl bg-slate-900 p-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total servicios:</span>
                  <span className="text-white font-bold text-lg">{formatCLP(totalServices)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 6: Resumen */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Save className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
                <p className="text-sm text-slate-500">Confirma los datos de la orden</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-medium">{customer?.name}</p>
              </div>
              
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">Dispositivo</p>
                <p className="font-medium capitalize">{deviceType?.replace("_", " ")} - {deviceModel}</p>
              </div>
              
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">Problema</p>
                <p className="font-medium">{problemType || problemDescription || "No especificado"}</p>
              </div>
              
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-slate-500">Servicios ({selectedServices.length})</p>
                <div className="space-y-1 mt-1">
                  {selectedServices.map(s => (
                    <p key={s.id} className="text-sm">• {s.name}</p>
                  ))}
                </div>
              </div>
              
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">Total</p>
                <p className="font-bold text-emerald-700 text-xl">{formatCLP(totalServices)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con navegación */}
      <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Atrás
          </button>
        )}
        
        <div className="flex-1" />
        
        {step < 6 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-light to-brand-dark px-6 py-2.5 font-medium text-white shadow-md shadow-brand-light/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 font-medium text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Crear Orden
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
