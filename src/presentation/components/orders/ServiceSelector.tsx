"use client";
import { useState, useEffect, useRef, type MouseEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/types";
import { getRecommendedServices } from "@/lib/deviceWizardData";
import { Search, Lightbulb, BatteryFull, Camera, Smartphone, Settings, Wrench, Zap, Cpu, MoreHorizontal, Inbox, Check } from "lucide-react";

interface ServiceSelectorProps {
  selectedServices: Service[];
  onServicesChange: (services: Service[]) => void;
  deviceType?: string | null;
  deviceModel?: string;
  showSelectedServicesList?: boolean;
}

export default function ServiceSelector({
  selectedServices,
  onServicesChange,
  deviceType = null,
  deviceModel = "",
  showSelectedServicesList = true,
}: ServiceSelectorProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      loadServices();
    }
    init();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
  }, [deviceType, deviceModel]);

  const fallbackServices: Service[] = [
    { id: "1", name: "Cambio de Pantalla", description: null, default_price: 25000, category: "pantalla", created_at: new Date().toISOString() },
    { id: "2", name: "Cambio de Batería", description: null, default_price: 15000, category: "bateria", created_at: new Date().toISOString() },
    { id: "3", name: "Cambio de Cámara Frontal", description: null, default_price: 20000, category: "camara", created_at: new Date().toISOString() },
    { id: "4", name: "Cambio de Cámara Trasera", description: null, default_price: 22000, category: "camara", created_at: new Date().toISOString() },
    { id: "5", name: "Reparación de Carga", description: null, default_price: 12000, category: "carga", created_at: new Date().toISOString() },
    { id: "6", name: "Software / Reset", description: null, default_price: 10000, category: "software", created_at: new Date().toISOString() },
    { id: "7", name: "Cambio de Vidrio Templado", description: null, default_price: 18000, category: "pantalla", created_at: new Date().toISOString() },
    { id: "8", name: "Diagnóstico", description: null, default_price: 5000, category: "mantenimiento", created_at: new Date().toISOString() },
    { id: "9", name: "Limpieza Química", description: null, default_price: 8000, category: "mantenimiento", created_at: new Date().toISOString() },
    { id: "10", name: "Reparación de Placa", description: null, default_price: 35000, category: "placa", created_at: new Date().toISOString() },
    { id: "11", name: "Recuperación de Datos", description: null, default_price: 20000, category: "software", created_at: new Date().toISOString() },
    { id: "12", name: "Cambio de Micrófono", description: null, default_price: 10000, category: "carga", created_at: new Date().toISOString() },
  ];

  async function loadServices(cid?: string | null) {
    console.log("[ServiceSelector] Cargando servicios...");
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");
    if (error) {
      console.error("[ServiceSelector] Error cargando servicios:", error);
      console.log("[ServiceSelector] Usando servicios de fallback");
      setAvailableServices(fallbackServices);
    } else if (!data || data.length === 0) {
      console.log("[ServiceSelector] No hay servicios en DB, usando fallback");
      setAvailableServices(fallbackServices);
    } else {
      console.log("[ServiceSelector] Servicios cargados:", data.length);
      setAvailableServices(data);
    }
  }

  const filteredServices = availableServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedServices.find((s) => s.id === service.id)
  );
  const recommendedServices = getRecommendedServices(availableServices, {
    deviceType,
    deviceModel,
    selectedServiceIds: selectedServices.map((service) => service.id),
  });

  const hasSelectedDevice = Boolean(deviceType && deviceModel.trim());
  const fallbackServiceCategories = [
    { key: "bateria", label: "Batería", icon: <BatteryFull className="h-6 w-6 text-indigo-500" />, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", pattern: /bateria|batería/i, desc: "Diagnóstico, reemplazo y optimización de batería" },
    { key: "camara", label: "Cámara", icon: <Camera className="h-6 w-6 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", pattern: /camara|cámara|face id/i, desc: "Reparación y mantenimiento de cámaras" },
    { key: "pantalla", label: "Pantalla", icon: <Smartphone className="h-6 w-6 text-blue-500" />, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", pattern: /pantalla|glass|tactil/i, desc: "Reparación y cambio de pantallas" },
    { key: "software", label: "Software", icon: <Settings className="h-6 w-6 text-amber-500" />, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", pattern: /software|reseteo|google|frp|actualización|actualizacion|virus/i, desc: "Actualización, configuración y solución de software" },
    { key: "mantenimiento", label: "Mantenimiento", icon: <Wrench className="h-6 w-6 text-teal-500" />, bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", pattern: /limpieza|mantencion|manten|diagnostico|diagnóstico|baño quimico/i, desc: "Limpieza, diagnóstico y mantenimiento general" },
    { key: "carga", label: "Carga", icon: <Zap className="h-6 w-6 text-rose-500" />, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", pattern: /carga|conector|pin|base/i, desc: "Solución de problemas de carga y conectividad" },
    { key: "placa", label: "Placa Base", icon: <Cpu className="h-6 w-6 text-slate-500" />, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", pattern: /placa|fpc|sensores|sim|flex/i, desc: "Reparaciones a nivel de microelectrónica" },
    { key: "otros", label: "Otros", icon: <MoreHorizontal className="h-6 w-6 text-gray-500" />, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100", pattern: /.*/i, desc: "Otros servicios generales" },
  ];

  const getCategoryDefaults = (key: string) => {
    return fallbackServiceCategories.find(c => c.key === key) || fallbackServiceCategories[fallbackServiceCategories.length - 1];
  };

  const categorizedByDb = availableServices.reduce<Record<string, any>>((acc, service) => {
    const key = (service.category || "otros").trim().toLowerCase();
    if (!acc[key]) {
      const defaults = getCategoryDefaults(key);
      acc[key] = {
        key,
        label: service.category || defaults.label,
        icon: defaults.icon,
        bg: defaults.bg,
        text: defaults.text,
        border: defaults.border,
        desc: defaults.desc,
        imageUrl: service.category_image_url || null,
        services: [],
      };
    }
    if (!selectedServices.some((s) => s.id === service.id)) {
      acc[key].services.push(service);
    }
    if (!acc[key].imageUrl && service.category_image_url) {
      acc[key].imageUrl = service.category_image_url;
    }
    return acc;
  }, {});

  const servicesByCategory = Object.values(categorizedByDb).length > 0
    ? Object.values(categorizedByDb)
    : fallbackServiceCategories.map((category) => ({
      ...category,
      imageUrl: null,
      services: availableServices.filter((service) => category.pattern.test(service.name) && !selectedServices.some((s) => s.id === service.id)),
    }));

  const selectedCategoryData = servicesByCategory.find((category) => category.key === selectedCategory);

  function handleServiceSelect(service: Service) {
    // Validar que el servicio no esté ya en la lista (protección contra duplicados)
    if (selectedServices.find((s) => s.id === service.id)) {
      console.warn(`[ServiceSelector] Servicio ${service.name} (${service.id}) ya está en la lista. Ignorando duplicado.`);
      setSearchTerm("");
      setShowResults(false);
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    // Agregar el servicio solo si no está duplicado
    onServicesChange([...selectedServices, service]);
    setSearchTerm("");
    setShowResults(false);
    if (inputRef.current) inputRef.current.focus();
  }

  async function handleCreateService(e?: MouseEvent<HTMLButtonElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newServiceName.trim()) {
      alert("Por favor ingresa un nombre para el servicio");
      return;
    }

    if (loading) {
      console.warn("[ServiceSelector] handleCreateService ya está en ejecución. Ignorando llamada duplicada.");
      return;
    }

    setLoading(true);
    try {
      const { data: rawData, error } = await supabase
        .from("catalog_services")
        .insert({
          name: newServiceName.trim(),
          description: null,
          base_price: 0,
        })
        .select()
        .single();
        
      const data = rawData as any;

      if (error) {
        if (error.code === "23505") {
          alert("Ya existe un servicio con ese nombre");
        } else {
          alert(`Error: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (data) {
        await loadServices();
        
        if (!selectedServices.find((s) => s.id === data.id)) {
          handleServiceSelect(data);
        }
        
        setNewServiceName("");
        setShowNewServiceForm(false);
        setSearchTerm("");
        setShowResults(false);
      }
    } catch (error: any) {
      console.error("Error creando servicio:", error);
      alert(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-col mb-6">
        <h3 className="text-2xl font-bold text-slate-900">
          Selecciona los servicios que necesita tu dispositivo
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Elige los servicios que aplican a este equipo. Puedes modificar tu selección más adelante.
        </p>
      </div>

      <div className="mb-6 flex gap-3 items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (searchTerm) setShowResults(true);
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            // Lógica de ver sugerencias
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
          className="hidden sm:flex items-center gap-2 whitespace-nowrap rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          <Lightbulb className="h-4 w-4" />
          Ver sugerencias
        </button>
      </div>

      {!hasSelectedDevice && (
        <div className="mb-3 p-3 rounded-md border border-stone-200 bg-stone-50 text-stone-800 text-sm">
          Â¿Servicios para quÃ© dispositivo? Primero selecciona tipo y modelo en el asistente de dispositivo.
        </div>
      )}

      {hasSelectedDevice && (
        <div className="mb-8">
          {!selectedCategory && (
            <>
              <p className="text-base font-bold text-slate-800 mb-4">Categorías de servicios</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servicesByCategory
                  .filter((category) => category.services.length > 0)
                  .map((category) => (
                    <button
                      key={`category-${category.key}`}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      className={`group relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${category.border} bg-white hover:shadow-md hover:-translate-y-1`}
                    >
                      <div className="absolute right-4 top-4 h-5 w-5 rounded border-2 border-slate-200 transition-colors group-hover:border-slate-300" />
                      
                      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${category.bg}`}>
                        {category.icon}
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-900">{category.label}</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 min-h-[34px]">
                        {category.desc}
                      </p>
                      
                      <div className={`mt-4 rounded-full px-2.5 py-1 text-[10px] font-bold ${category.bg} ${category.text}`}>
                        {category.services.length} servicio{category.services.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}

          {selectedCategory && selectedCategoryData && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${selectedCategoryData.bg}`}>
                    {selectedCategoryData.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedCategoryData.label}</h3>
                    <p className="text-sm text-slate-500">Selecciona el servicio específico</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ← Volver a categorías
                </button>
              </div>

              {selectedCategoryData.services.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-500">
                  <p>Todos los servicios de esta categoría ya fueron seleccionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCategoryData.services.map((service) => (
                    <button
                      key={`category-service-${service.id}`}
                      type="button"
                      onClick={() => handleServiceSelect(service)}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-indigo-300 hover:shadow-md"
                    >
                      <div>
                        {service.image_url && (
                          <img src={service.image_url} alt={service.name} className="mb-3 h-10 w-10 rounded-lg object-cover" loading="lazy" />
                        )}
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                        {service.description && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{service.description}</p>
                        )}
                      </div>
                      <div className="mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs font-semibold text-slate-500">Servicio profesional</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          +
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {hasSelectedDevice && recommendedServices.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Sugeridos para este equipo</p>
          <div className="flex flex-wrap gap-2">
            {recommendedServices.map((service) => (
              <button
                key={`recommended-${service.id}`}
                type="button"
                onClick={() => handleServiceSelect(service)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
              >
                + {service.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && searchTerm && filteredServices.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredServices.map((service) => {
            // Verificar si el servicio ya está seleccionado (protección adicional)
            const isAlreadySelected = selectedServices.some(s => s.id === service.id);
            
            return (
              <button
                key={service.id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!isAlreadySelected) {
                    handleServiceSelect(service);
                  }
                }}
                disabled={isAlreadySelected}
              >
                <p className="font-medium text-slate-900">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-slate-600">{service.description}</p>
                )}
                {isAlreadySelected && (
                  <p className="text-xs text-slate-400 italic">Ya agregado</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showResults && searchTerm && filteredServices.length === 0 && !showNewServiceForm && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-4">
          <p className="text-slate-600 text-center mb-2">No se encontró el servicio</p>
          <button
            type="button"
            onClick={() => {
              setNewServiceName(searchTerm);
              setShowNewServiceForm(true);
              setShowResults(false);
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Crear &quot;{searchTerm}&quot;
          </button>
        </div>
      )}

      {showNewServiceForm && (
        <div className="mb-4 p-4 border border-slate-200 rounded-md bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-2">Nuevo Servicio</h4>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2"
              placeholder="Nombre del servicio"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateService();
                }
              }}
            />
            <button
              type="button"
              onClick={handleCreateService}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewServiceForm(false);
                setNewServiceName("");
              }}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showSelectedServicesList && (
        <div className="space-y-2">
          {selectedServices.map((service) => (
            <div key={service.id} className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-medium text-slate-900">{service.name}</span>
              <button
                type="button"
                onClick={() => onServicesChange(selectedServices.filter((s) => s.id !== service.id))}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
