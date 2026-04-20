"use client";
/**
 * DeviceSelector - Wizard visual de 5 niveles para seleccionar dispositivos
 * Basado EXACTAMENTE en sistema-gestion-ordenes/src/react/components/OrderForm.tsx (lÃ­neas 100-700)
 * 
 * Flujo: Tipo â†’ Marca â†’ LÃ­nea â†’ Modelo â†’ Variante
 * Cada nivel muestra imÃ¡genes y avanza automÃ¡ticamente al seleccionar
 */

"use client";

import { useState, useEffect } from "react";

interface DeviceSelectorProps {
  onSelect: (deviceData: {
    type: string;
    brand: string;
    model: string;
    variant?: string;
    displayName: string;
  }) => void;
  onClose: () => void;
}

// Interfaces del catÃ¡logo
interface CatalogDeviceType {
  id: number;
  code: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

interface CatalogBrand {
  id: number;
  device_type_id: number;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

interface CatalogProductLine {
  id: number;
  brand_id: number;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

interface CatalogModel {
  id: number;
  product_line_id: number;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

interface CatalogVariant {
  id: number;
  model_id: number;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

export default function DeviceSelector({ onSelect, onClose }: DeviceSelectorProps) {
  // Estado del wizard
  const [step, setStep] = useState(1); // 1: Type, 2: Brand, 3: Line, 4: Model, 5: Variant
  const [selectedType, setSelectedType] = useState<CatalogDeviceType | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<CatalogBrand | null>(null);
  const [selectedLine, setSelectedLine] = useState<CatalogProductLine | null>(null);
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(null);

  // Datos del catÃ¡logo
  const [deviceTypes, setDeviceTypes] = useState<CatalogDeviceType[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [lines, setLines] = useState<CatalogProductLine[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual entry fallback
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDeviceType, setManualDeviceType] = useState("");
  const [manualDeviceModel, setManualDeviceModel] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    setLoading(true);
    try {
      // Cargar tipos de dispositivo
      const response = await fetch("/api/device-catalog");
      const data = await response.json();
      
      if (data.success) {
        setDeviceTypes(data.deviceTypes || []);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
    }
    setLoading(false);
  }

  // Cargar marcas cuando se selecciona tipo
  useEffect(() => {
    if (selectedType) {
      loadBrands(selectedType.id);
    }
  }, [selectedType]);

  async function loadBrands(typeId: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/device-catalog/brands?deviceTypeId=${typeId}`);
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error("Error loading brands:", error);
    }
    setLoading(false);
  }

  // Cargar lÃ­neas cuando se selecciona marca
  useEffect(() => {
    if (selectedBrand) {
      loadLines(selectedBrand.id);
    }
  }, [selectedBrand]);

  async function loadLines(brandId: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/device-catalog/lines?brandId=${brandId}`);
      const data = await response.json();
      
      if (data.success) {
        setLines(data.lines || []);
      }
    } catch (error) {
      console.error("Error loading lines:", error);
    }
    setLoading(false);
  }

  // Cargar modelos cuando se selecciona lÃ­nea
  useEffect(() => {
    if (selectedLine) {
      loadModels(selectedLine.id);
    }
  }, [selectedLine]);

  async function loadModels(lineId: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/device-catalog/models?lineId=${lineId}`);
      const data = await response.json();
      
      if (data.success) {
        setModels(data.models || []);
      }
    } catch (error) {
      console.error("Error loading models:", error);
    }
    setLoading(false);
  }

  // Cargar variantes cuando se selecciona modelo
  useEffect(() => {
    if (selectedModel) {
      loadVariants(selectedModel.id);
    }
  }, [selectedModel]);

  async function loadVariants(modelId: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/device-catalog/variants?modelId=${modelId}`);
      const data = await response.json();
      
      if (data.success) {
        setVariants(data.variants || []);
        if ((data.variants || []).length === 0) {
          // Si no hay variantes, seleccionar directamente
          handleModelSelect(selectedModel, undefined);
        }
      }
    } catch (error) {
      console.error("Error loading variants:", error);
    }
    setLoading(false);
  }

  function handleTypeSelect(type: CatalogDeviceType) {
    setSelectedType(type);
    setStep(2);
  }

  function handleBrandSelect(brand: CatalogBrand) {
    setSelectedBrand(brand);
    setStep(3);
  }

  function handleLineSelect(line: CatalogProductLine) {
    setSelectedLine(line);
    setStep(4);
  }

  function handleModelSelect(model: CatalogModel, variant?: CatalogVariant) {
    setSelectedModel(model);
    if (variant) {
      setSelectedVariant(variant);
    }
    
    // Construir nombre completo
    const parts = [
      selectedBrand?.name || "",
      selectedLine?.name || "",
      model.name,
      variant?.name || ""
    ].filter(Boolean);
    
    const displayName = parts.join(" ");
    
    onSelect({
      type: selectedType?.code || "",
      brand: selectedBrand?.name || "",
      model: model.name,
      variant: variant?.name,
      displayName,
    });
  }

  function buildDisplayName(): string {
    const parts = [
      selectedType?.name || "",
      selectedBrand?.name || "",
      selectedLine?.name || "",
      selectedModel?.name || "",
      selectedVariant?.name || ""
    ].filter(Boolean);
    return parts.join(" ");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seleccionar Dispositivo</h2>
            {selectedType && (
              <p className="text-sm text-gray-600 mt-1">
                Paso {step}/5: {step === 1 ? "Tipo" : step === 2 ? "Marca" : step === 3 ? "LÃ­nea" : step === 4 ? "Modelo" : "Variante"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            âœ•
          </button>
        </div>

        {/* Progress Bar */}
        {selectedType && (
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            {selectedType && (
              <p className="text-sm text-gray-600 mt-2">
                {buildDisplayName() || "Seleccionando dispositivo..."}
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando...</p>
          </div>
        )}

        {/* Step 1: Device Type */}
        {step === 1 && !loading && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Â¿QuÃ© tipo de dispositivo es?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {deviceTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  {type.image_url ? (
                    <img
                      src={type.image_url}
                      alt={type.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                      ðŸ“±
                    </div>
                  )}
                  <p className="font-semibold text-center">{type.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Brand */}
        {step === 2 && !loading && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => { setStep(1); setSelectedType(null); }}
                className="text-blue-600 hover:underline mr-4"
              >
                â† Cambiar tipo
              </button>
              <h3 className="text-lg font-semibold">Selecciona la marca</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center"
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-16 h-16 object-contain mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-2xl">
                      ðŸ·ï¸
                    </div>
                  )}
                  <p className="font-semibold text-center text-sm">{brand.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Product Line */}
        {step === 3 && !loading && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => { setStep(2); setSelectedBrand(null); }}
                className="text-blue-600 hover:underline mr-4"
              >
                â† Cambiar marca
              </button>
              <h3 className="text-lg font-semibold">Selecciona la lÃ­nea de producto</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {lines.map((line) => (
                <button
                  key={line.id}
                  onClick={() => handleLineSelect(line)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  {line.image_url ? (
                    <img
                      src={line.image_url}
                      alt={line.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-2xl">
                      ðŸ“±
                    </div>
                  )}
                  <p className="font-semibold text-center">{line.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Model */}
        {step === 4 && !loading && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => { setStep(3); setSelectedLine(null); }}
                className="text-blue-600 hover:underline mr-4"
              >
                â† Cambiar lÃ­nea
              </button>
              <h3 className="text-lg font-semibold">Selecciona el modelo</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (variants.length === 0) {
                      handleModelSelect(model, undefined);
                    } else {
                      setSelectedModel(model);
                      setStep(5);
                    }
                  }}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <p className="font-semibold text-center">{model.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Variant */}
        {step === 5 && !loading && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => { setStep(4); setSelectedVariant(null); }}
                className="text-blue-600 hover:underline mr-4"
              >
                â† Cambiar modelo
              </button>
              <h3 className="text-lg font-semibold">Selecciona la variante</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleModelSelect(selectedModel!, variant)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <p className="font-semibold text-center">{variant.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Entry */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="text-blue-600 hover:underline text-sm"
          >
            {showManualEntry ? "Ocultar entrada manual" : "Â¿No encuentras tu dispositivo? Ingresar manualmente"}
          </button>
          
          {showManualEntry && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de dispositivo</label>
                  <input
                    type="text"
                    value={manualDeviceType}
                    onChange={(e) => setManualDeviceType(e.target.value)}
                    placeholder="Ej: Celular, Tablet, Laptop..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modelo</label>
                  <input
                    type="text"
                    value={manualDeviceModel}
                    onChange={(e) => setManualDeviceModel(e.target.value)}
                    placeholder="Ej: iPhone 12, Galaxy S21..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (manualDeviceType && manualDeviceModel) {
                    onSelect({
                      type: manualDeviceType.toLowerCase(),
                      brand: "",
                      model: manualDeviceModel,
                      displayName: `${manualDeviceType} ${manualDeviceModel}`,
                    });
                  }
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continuar con dispositivo manual
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
