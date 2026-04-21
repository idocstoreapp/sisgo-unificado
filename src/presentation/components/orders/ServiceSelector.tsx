"use client";
import { useState, useEffect, useRef, type MouseEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { Service } from "@/types";
import { getRecommendedServices } from "@/lib/deviceWizardData";

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
    function handleClickOutside(event: MouseEvent) {
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
    { key: "pantalla", label: "Pantalla", icon: "ðŸ–¥ï¸", pattern: /pantalla|glass|tactil/i },
    { key: "bateria", label: "BaterÃ­a", icon: "ðŸ”‹", pattern: /bateria|baterÃ­a/i },
    { key: "camara", label: "CÃ¡mara", icon: "ðŸ“·", pattern: /camara|cÃ¡mara|face id/i },
    { key: "carga", label: "Carga", icon: "ðŸ”Œ", pattern: /carga|conector|pin|base/i },
    { key: "software", label: "Software", icon: "ðŸ§ ", pattern: /software|reseteo|google|frp|actualizaciÃ³n|actualizacion|virus/i },
    { key: "mantenimiento", label: "MantenciÃ³n", icon: "ðŸ§°", pattern: /limpieza|mantencion|manten|diagnostico|diagnÃ³stico|baÃ±o quimico/i },
    { key: "placa", label: "Placa", icon: "ðŸ§©", pattern: /placa|fpc|sensores|sim|flex/i },
    { key: "otros", label: "Otros", icon: "âš™ï¸", pattern: /.*/i },
  ];

  const categorizedByDb = availableServices.reduce<Record<string, { key: string; label: string; icon: string; imageUrl: string | null; services: Service[] }>>((acc, service) => {
    const key = (service.category || "").trim().toLowerCase();
    if (!key) return acc;
    if (!acc[key]) {
      acc[key] = {
        key,
        label: service.category as string,
        icon: "ðŸ› ï¸",
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
    // Validar que el servicio no estÃ© ya en la lista (protecciÃ³n contra duplicados)
    if (selectedServices.find((s) => s.id === service.id)) {
      console.warn(`[ServiceSelector] Servicio ${service.name} (${service.id}) ya estÃ¡ en la lista. Ignorando duplicado.`);
      setSearchTerm("");
      setShowResults(false);
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    // Agregar el servicio solo si no estÃ¡ duplicado
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
      console.warn("[ServiceSelector] handleCreateService ya estÃ¡ en ejecuciÃ³n. Ignorando llamada duplicada.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .insert({
          name: newServiceName.trim(),
          description: null,
          default_price: 0,
        })
        .select()
        .single();

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
      <div className="flex gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2"
          placeholder="Buscar o escribir nombre de servicio..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => {
            if (searchTerm) setShowResults(true);
          }}
        />
        <button
          type="button"
          onClick={() => setShowNewServiceForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
        >
          + Nuevo
        </button>
      </div>

      {!hasSelectedDevice && (
        <div className="mb-3 p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          Â¿Servicios para quÃ© dispositivo? Primero selecciona tipo y modelo en el asistente de dispositivo.
        </div>
      )}

      {hasSelectedDevice && (
        <div className="mb-3 p-3 rounded-md border border-slate-200 bg-slate-50">
          {!selectedCategory && (
            <>
              <p className="text-xs font-semibold text-slate-700 mb-2">Â¿QuÃ© tipo de servicio necesitas?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {servicesByCategory
                  .filter((category) => category.services.length > 0)
                  .map((category) => (
                    <button
                      key={`category-${category.key}`}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs hover:bg-slate-100 text-left"
                    >
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.label} className="h-10 w-full object-cover rounded-md mb-1" loading="lazy" />
                      ) : null}
                      <p className="font-semibold">{category.icon} {category.label}</p>
                      <p className="text-[11px] opacity-80">{category.services.length} opciones</p>
                    </button>
                  ))}
              </div>
            </>
          )}

          {selectedCategory && selectedCategoryData && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">
                  Servicios disponibles: {selectedCategoryData.icon} {selectedCategoryData.label}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs underline text-slate-600"
                >
                  Cambiar tipo
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategoryData.services.slice(0, 25).map((service) => (
                  <button
                    key={`category-service-${service.id}`}
                    type="button"
                    onClick={() => handleServiceSelect(service)}
                    className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs hover:bg-emerald-100"
                  >
                    {service.image_url ? <img src={service.image_url} alt={service.name} className="inline-block h-4 w-4 rounded-full object-cover mr-1" loading="lazy" /> : null}
                    + {service.name}
                  </button>
                ))}
              </div>
            </>
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
                className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
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
            // Verificar si el servicio ya estÃ¡ seleccionado (protecciÃ³n adicional)
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
          <p className="text-slate-600 text-center mb-2">No se encontrÃ³ el servicio</p>
          <button
            type="button"
            onClick={() => {
              setNewServiceName(searchTerm);
              setShowNewServiceForm(true);
              setShowResults(false);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                className="text-red-600 hover:text-red-800 text-sm font-medium"
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

