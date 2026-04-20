"use client";
/**
 * OrderWizard - Professional Order Creation Wizard
 * Replicates the exact flow from sistema-gestion-ordenes
 * Multi-device support with image-based selection
 */

"use client";

import { useState, useEffect } from "react";
import { useOrders } from "@/presentation/hooks/useOrders";
import { useAuth } from "@/presentation/hooks/useAuth";
import type { DeviceType, DeviceItem, Customer, Service } from "@/domain/types/OrderTypes";
import { generatePDFBlob } from "@/infrastructure/services/Pdf/generate-pdf-blob";
import DeviceSelector from "./DeviceSelector";
import DeviceChecklist from "./DeviceChecklist";
import ServiceSelector from "./ServiceSelector";
import PatternDrawer from "./PatternDrawer";
import CustomerSearch from "./CustomerSearch";

interface OrderWizardProps {
  companyId: string;
  branchId?: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

export default function OrderWizard({ companyId, branchId, onSuccess, onCancel }: OrderWizardProps) {
  const { createOrder } = useOrders();
  const { user } = useAuth();
  
  // Step 1: Customer Selection
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Step 2: Devices
  const [devices, setDevices] = useState<DeviceItem[]>([createNewDevice()]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showPatternDrawer, setShowPatternDrawer] = useState(false);

  // Step 3: Order Settings
  const [priority, setPriority] = useState<"baja" | "media" | "urgente">("media");
  const [commitmentDate, setCommitmentDate] = useState("");
  const [warrantyDays, setWarrantyDays] = useState(30);

  // UI State
  const [currentStep, setCurrentStep] = useState(1); // 1: Customer, 2: Devices, 3: Settings
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function createNewDevice(): DeviceItem {
    return {
      id: `device-${Date.now()}-${Math.random()}`,
      deviceType: null,
      deviceBrand: "",
      deviceModel: "",
      deviceSerial: "",
      unlockType: "none",
      deviceUnlockCode: "",
      deviceUnlockPattern: [],
      problemDescription: "",
      checklistData: {},
      selectedServices: [],
      replacementCost: 0,
    };
  }

  function updateDevice(deviceId: string, updates: Partial<DeviceItem>) {
    setDevices(prev =>
      prev.map(d => d.id === deviceId ? { ...d, ...updates } : d)
    );
  }

  function addDevice() {
    setDevices(prev => [...prev, createNewDevice()]);
    setCurrentDeviceIndex(devices.length);
  }

  function removeDevice(deviceId: string) {
    if (devices.length === 1) return;
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (currentDeviceIndex >= devices.length - 1) {
      setCurrentDeviceIndex(Math.max(0, devices.length - 2));
    }
  }

  function getDeviceTotal(device: DeviceItem): number {
    const servicesTotal = device.selectedServices.reduce((sum, s) => sum + s.price, 0);
    return servicesTotal + device.replacementCost;
  }

  function getOrderTotal(): number {
    return devices.reduce((sum, d) => sum + getDeviceTotal(d), 0);
  }

  async function handleSubmit() {
    setErrors([]);
    
    // Validations
    const validationErrors: string[] = [];
    if (!selectedCustomer) validationErrors.push("Debe seleccionar un cliente");
    if (devices.some(d => !d.deviceType || !d.deviceModel)) {
      validationErrors.push("Todos los dispositivos deben tener tipo y modelo");
    }
    if (devices.some(d => !d.problemDescription)) {
      validationErrors.push("Todos los dispositivos deben tener descripciÃ³n del problema");
    }
    if (devices.some(d => d.selectedServices.length === 0)) {
      validationErrors.push("Todos los dispositivos deben tener al menos un servicio");
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Create order with first device data
      const firstDevice = devices[0];
      const result = await createOrder({
        companyId,
        branchId: branchId || "",
        customerId: selectedCustomer!.id,
        businessType: "servicio_tecnico",
        metadata: {
          devices: devices.map(d => ({
            type: d.deviceType,
            brand: d.deviceBrand,
            model: d.deviceModel,
            serial: d.deviceSerial,
            unlockType: d.unlockType,
            unlockCode: d.deviceUnlockCode,
            unlockPattern: d.deviceUnlockPattern,
            problem: d.problemDescription,
            checklist: d.checklistData,
            services: d.selectedServices,
            replacementCost: d.replacementCost,
          })),
          priority,
          warrantyDays,
        },
        totalCost: devices.reduce((sum, d) => sum + d.replacementCost, 0),
        totalPrice: getOrderTotal(),
        commitmentDate: commitmentDate ? new Date(commitmentDate) : undefined,
        warrantyDays,
      });

      if (result.success && onSuccess && result.orderId) {
        // Generar PDF usando el motor importado
        try {
          const serviceValue = devices.reduce((sum, d) => sum + d.selectedServices.reduce((sSum, s) => sSum + (s.price || 0), 0), 0);
          
          const legacyOrder: any = {
            id: result.orderId,
            order_number: result.orderId.substring(0, 8).toUpperCase(), // as fallback
            customer_id: selectedCustomer!.id,
            device_type: firstDevice.deviceType,
            device_model: `${firstDevice.deviceBrand} ${firstDevice.deviceModel}`,
            device_serial_number: firstDevice.deviceSerial,
            device_unlock_code: firstDevice.deviceUnlockCode,
            device_unlock_pattern: firstDevice.deviceUnlockPattern,
            problem_description: firstDevice.problemDescription,
            replacement_cost: firstDevice.replacementCost,
            labor_cost: firstDevice.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0),
            total_repair_cost: getOrderTotal(),
            created_at: new Date().toISOString(),
            status: "en_proceso",
            customer: selectedCustomer,
            devices_data: devices.slice(1).map((d, idx) => ({
              index: idx + 2,
              device_type: d.deviceType,
              device_model: `${d.deviceBrand} ${d.deviceModel}`,
              device_serial_number: d.deviceSerial,
              problem_description: d.problemDescription,
              replacement_cost: d.replacementCost,
              labor_cost: d.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0),
              selected_services: d.selectedServices.map(s => ({
                name: s.name, quantity: 1, unit_price: s.price || 0, total_price: s.price || 0
              })),
              checklist_data: d.checklistData
            }))
          };

          const allServices = devices.flatMap(d => d.selectedServices);
          
          const blob = await generatePDFBlob(
            legacyOrder,
            allServices as any[],
            serviceValue,
            legacyOrder.replacement_cost,
            warrantyDays,
            firstDevice.checklistData,
            [],
            allServices.map(s => ({
              service_name: s.name,
              quantity: 1,
              unit_price: s.price || 0,
              total_price: s.price || 0
            }))
          );
          
          const objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl, "_blank");
        } catch (pdfError) {
          console.error("Error al generar PDF:", pdfError);
          alert("La orden fue creada pero hubo un error intentando generar el PDF.");
        }
        
        onSuccess(result.orderId);
      }
    } catch (error) {
      setErrors(["Error al crear la orden: " + (error as Error).message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Orden de Servicio</h1>
          <p className="text-gray-600 mt-2">Complete los pasos para crear una nueva orden</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "Cliente" },
              { step: 2, label: "Dispositivos" },
              { step: 3, label: "ConfiguraciÃ³n" },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {currentStep > step ? "âœ“" : step}
                </div>
                <div className="ml-2 font-semibold text-gray-700">{label}</div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ul className="list-disc list-inside">
              {errors.map((error, i) => (
                <li key={i} className="text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 1: Customer Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Paso 1: Seleccionar Cliente</h2>
            
            {/* Customer Search */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium mb-2">Buscar Cliente</label>
              <CustomerSearch
                selectedCustomer={selectedCustomer}
                onCustomerSelect={(customer) => setSelectedCustomer(customer)}
              />
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button onClick={onCancel} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedCustomer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente â†’
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Devices */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Paso 2: Configurar Dispositivos ({devices.length})</h2>
            
            {/* Device Tabs */}
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {devices.map((device, index) => (
                  <div
                    key={device.id}
                    onClick={() => setCurrentDeviceIndex(index)}
                    className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
                      currentDeviceIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {device.deviceModel || `Dispositivo ${index + 1}`}
                  </div>
                ))}
                <button
                  onClick={addDevice}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Agregar Dispositivo
                </button>
              </div>
            </div>

            {/* Current Device Configuration */}
            {devices[currentDeviceIndex] && (
              <DeviceConfiguration
                device={devices[currentDeviceIndex]}
                onUpdate={(updates) => updateDevice(devices[currentDeviceIndex].id, updates)}
                onRemove={() => removeDevice(devices[currentDeviceIndex].id)}
                canRemove={devices.length > 1}
              />
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                â† Anterior
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Siguiente â†’
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Order Settings */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Paso 3: ConfiguraciÃ³n de Orden</h2>
            
            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Prioridad</label>
              <div className="flex space-x-4">
                {(["baja", "media", "urgente"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      priority === p
                        ? p === "urgente"
                          ? "bg-red-600 text-white"
                          : p === "media"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Commitment Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Fecha de Compromiso</label>
              <input
                type="date"
                value={commitmentDate}
                onChange={(e) => setCommitmentDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Warranty Days */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">DÃ­as de GarantÃ­a</label>
              <input
                type="number"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg w-32"
                min="0"
                max="365"
              />
            </div>

            {/* Order Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold mb-2">Resumen de Orden</h3>
              <p>Cliente: {selectedCustomer?.name}</p>
              <p>Dispositivos: {devices.length}</p>
              <p>Total: ${getOrderTotal().toLocaleString("es-CL")}</p>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                â† Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear Orden âœ“"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Device Configuration Sub-Component
function DeviceConfiguration({
  device,
  onUpdate,
  onRemove,
  canRemove,
}: {
  device: DeviceItem;
  onUpdate: (updates: Partial<DeviceItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showPatternDrawer, setShowPatternDrawer] = useState(false);

  return (
    <div className="space-y-4">
      {/* Device Type/Model Selection */}
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
        {device.deviceType && device.deviceModel ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">
                {device.deviceBrand} {device.deviceModel}
              </h3>
              <button
                onClick={() => setShowDeviceSelector(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Cambiar Dispositivo
              </button>
            </div>
            <p className="text-sm text-gray-600">Tipo: {device.deviceType}</p>
          </div>
        ) : (
          <button
            onClick={() => setShowDeviceSelector(true)}
            className="w-full py-8 text-center text-gray-500 hover:text-blue-600"
          >
            + Seleccionar Dispositivo
          </button>
        )}
      </div>

      {/* Serial Number */}
      <div>
        <label className="block text-sm font-medium mb-2">NÃºmero de Serie (opcional)</label>
        <input
          type="text"
          value={device.deviceSerial}
          onChange={(e) => onUpdate({ deviceSerial: e.target.value })}
          placeholder="Serial del dispositivo..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Unlock Code/Pattern */}
      <div>
        <label className="block text-sm font-medium mb-2">Desbloqueo</label>
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => onUpdate({ unlockType: "none" })}
            className={`px-3 py-1 rounded ${device.unlockType === "none" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Ninguno
          </button>
          <button
            onClick={() => onUpdate({ unlockType: "code" })}
            className={`px-3 py-1 rounded ${device.unlockType === "code" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            CÃ³digo
          </button>
          <button
            onClick={() => {
              onUpdate({ unlockType: "pattern" });
              setShowPatternDrawer(true);
            }}
            className={`px-3 py-1 rounded ${device.unlockType === "pattern" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            PatrÃ³n
          </button>
        </div>
        {device.unlockType === "code" && (
          <input
            type="text"
            value={device.deviceUnlockCode}
            onChange={(e) => onUpdate({ deviceUnlockCode: e.target.value })}
            placeholder="CÃ³digo de desbloqueo..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        )}
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium mb-2">DescripciÃ³n del Problema *</label>
        <textarea
          value={device.problemDescription}
          onChange={(e) => onUpdate({ problemDescription: e.target.value })}
          placeholder="Describa el problema del dispositivo..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 text-right">
          {device.problemDescription.length}/500
        </p>
      </div>

      {/* Checklist */}
      <div>
        <button
          onClick={() => setShowChecklist(true)}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          âœ“ Checklist de Dispositivo
        </button>
        {Object.keys(device.checklistData).length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {Object.keys(device.checklistData).length} items completados
          </p>
        )}
      </div>

      {/* Services */}
      <div>
        <button
          onClick={() => setShowServiceSelector(true)}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          ðŸ”§ Seleccionar Servicios
        </button>
        {device.selectedServices.length > 0 && (
          <div className="mt-2 p-3 bg-indigo-50 rounded">
            {device.selectedServices.map((s, i) => (
              <div key={i} className="text-sm">
                {s.name} - ${s.price.toLocaleString("es-CL")}
              </div>
            ))}
            <div className="mt-2 font-bold">
              Total: ${device.selectedServices.reduce((sum, s) => sum + s.price, 0).toLocaleString("es-CL")}
            </div>
          </div>
        )}
      </div>

      {/* Replacement Cost */}
      <div>
        <label className="block text-sm font-medium mb-2">Costo de Repuestos</label>
        <input
          type="number"
          value={device.replacementCost}
          onChange={(e) => onUpdate({ replacementCost: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          min="0"
        />
      </div>

      {/* Remove Device Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Eliminar Dispositivo
        </button>
      )}

      {/* Modals */}
      {showDeviceSelector && (
        <DeviceSelector
          onSelect={(deviceData) => {
            onUpdate({
              deviceType: deviceData.type,
              deviceBrand: deviceData.brand,
              deviceModel: deviceData.model,
            });
            setShowDeviceSelector(false);
          }}
          onClose={() => setShowDeviceSelector(false)}
        />
      )}

      {showChecklist && device.deviceType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Checklist - {device.deviceType}</h2>
              <button onClick={() => setShowChecklist(false)} className="text-gray-500 hover:text-gray-700 text-xl">âœ•</button>
            </div>
            <DeviceChecklist
              deviceType={device.deviceType}
              checklistData={device.checklistData}
              onChecklistChange={(data) => onUpdate({ checklistData: data })}
            />
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowChecklist(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Seleccionar Servicios</h2>
              <button onClick={() => setShowServiceSelector(false)} className="text-gray-500 hover:text-gray-700 text-xl">âœ•</button>
            </div>
            <ServiceSelector
              selectedServices={device.selectedServices}
              onServicesChange={(services) => onUpdate({ selectedServices: services })}
              deviceType={device.deviceType}
              deviceModel={device.deviceModel}
            />
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowServiceSelector(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPatternDrawer && (
        <PatternDrawer
          onPatternComplete={(pattern) => {
            onUpdate({ deviceUnlockPattern: pattern });
            setShowPatternDrawer(false);
          }}
          onClose={() => setShowPatternDrawer(false)}
        />
      )}
    </div>
  );
}

