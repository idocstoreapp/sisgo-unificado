"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import type { Customer, Service, DeviceType, User } from "@/types";
import type { CatalogSnapshot } from "@/lib/device-catalog";
import { supabase } from "@/lib/supabase";
import { detectDeviceTypeWithCustom, getSmartSuggestions } from "@/lib/deviceDatabase";
import { buildDeviceDisplayName, ensureCatalogChain, fetchCatalogSnapshot } from "@/lib/device-catalog";

export interface DeviceItem {
  id: string;
  deviceType: DeviceType | null;
  deviceModel: string;
  deviceSerial: string;
  unlockType: "code" | "pattern" | "none";
  deviceUnlockCode: string;
  deviceUnlockPattern: number[];
  problemDescription: string;
  checklistData: Record<string, string>;
  selectedServices: Service[];
  replacementCost: number;
  serviceValue: number;
  servicePrices: Record<string, number>;
}

export interface DeviceCatalogCard {
  id: number;
  device_type_id: number;
  brand_id: number;
  product_line_id: number;
  model_id: number;
  variant_id: number | null;
  display_name: string;
  image_url: string | null;
  is_active: boolean;
}

export interface OrderWizardContextType {
  technicianId: string;
  onSaved: () => void;
  // Global form state
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  devices: DeviceItem[];
  priority: "baja" | "media" | "urgente";
  setPriority: (p: "baja" | "media" | "urgente") => void;
  commitmentDate: string;
  setCommitmentDate: (d: string) => void;
  warrantyDays: number;
  setWarrantyDays: (d: number) => void;
  responsibleUserName: string;
  setResponsibleUserName: (n: string) => void;
  
  // Device handling
  updateDevice: (deviceId: string, updates: Partial<DeviceItem>) => void;
  resetDevice: (deviceId: string) => void;
  addNewDevice: () => void;
  removeDevice: (deviceId: string) => void;
  
  // UI State per device (wizard flow)
  wizardStepByDevice: Record<string, number>;
  setWizardStepByDevice: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  flowStepByDevice: Record<string, 1 | 2 | 3>;
  setFlowStepByDevice: React.Dispatch<React.SetStateAction<Record<string, 1 | 2 | 3>>>;
  finalizedDeviceById: Record<string, boolean>;
  setFinalizedDeviceById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  manualEntryByDevice: Record<string, boolean>;
  setManualEntryByDevice: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // Device Selection UI state
  selectedBrandByDevice: Record<string, string | null>;
  setSelectedBrandByDevice: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  selectedSeriesByDevice: Record<string, string | null>;
  setSelectedSeriesByDevice: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  selectedModelByDevice: Record<string, string | null>;
  setSelectedModelByDevice: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  selectedVariantByDevice: Record<string, string | null>;
  setSelectedVariantByDevice: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  customCatalogFormByDevice: Record<string, { model: string; variant: string }>;
  setCustomCatalogFormByDevice: React.Dispatch<React.SetStateAction<Record<string, { model: string; variant: string }>>>;

  // Modals & Panels UI state
  detailsOpenByDevice: Record<string, boolean>;
  setDetailsOpenByDevice: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  serialFieldOpenByDevice: Record<string, boolean>;
  setSerialFieldOpenByDevice: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  unlockFieldOpenByDevice: Record<string, boolean>;
  setUnlockFieldOpenByDevice: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  manualEditOpenByDevice: Record<string, boolean>;
  setManualEditOpenByDevice: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showPatternDrawer: { deviceId: string } | null;
  setShowPatternDrawer: React.Dispatch<React.SetStateAction<{ deviceId: string } | null>>;
  showDeviceCategoryModal: { deviceId: string; deviceModel: string } | null;
  setShowDeviceCategoryModal: React.Dispatch<React.SetStateAction<{ deviceId: string; deviceModel: string } | null>>;
  createdOrder: any;
  setCreatedOrder: React.Dispatch<any>;
  createdOrderServices: any[];
  setCreatedOrderServices: React.Dispatch<any[]>;
  showPDFPreview: boolean;
  setShowPDFPreview: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Suggestions & Catalog state
  catalog: CatalogSnapshot;
  catalogCards: DeviceCatalogCard[];
  catalogLoaded: boolean;
  customDeviceTypes: string[];
  recentDeviceModels: string[];
  deviceSuggestions: Record<string, string[]>;
  setDeviceSuggestions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  showDeviceSuggestions: Record<string, boolean>;
  setShowDeviceSuggestions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // Global loading states
  loading: boolean;
  setLoading: (l: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (l: boolean) => void;
  responsibleUsers: User[];
  loadingResponsibleUsers: boolean;
  
  // Shared actions
  applyDeviceType: (deviceId: string, type: DeviceType) => void;
  applyBrand: (deviceId: string, brandId: string) => void;
  getCombinedSuggestions: (input: string) => string[];
  applySuggestedModel: (deviceId: string, model: string) => void;
  addCustomModelToCatalog: (device: DeviceItem) => Promise<void>;
  getTypeIdForDevice: (device: DeviceItem) => number | null;
  getBrandsForDevice: (device: DeviceItem) => any[];
  getLinesForDevice: (device: DeviceItem) => any[];
  getModelsForDevice: (device: DeviceItem) => any[];
  getVariantsForModel: (modelId: number) => any[];
  getCardImage: (params: any) => string | null;
  mapCatalogCodeToDeviceType: (code: string) => DeviceType;
  wizardTypeOptions: any[];
}

const OrderWizardContext = createContext<OrderWizardContextType | null>(null);

export function OrderWizardProvider({ 
  children,
  technicianId,
  onSaved
}: { 
  children: ReactNode;
  technicianId: string;
  onSaved: () => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: `device-${Date.now()}`,
      deviceType: null,
      deviceModel: "",
      deviceSerial: "",
      unlockType: "none",
      deviceUnlockCode: "",
      deviceUnlockPattern: [],
      problemDescription: "",
      checklistData: {},
      selectedServices: [],
      replacementCost: 0,
      serviceValue: 0,
      servicePrices: {},
    }
  ]);

  const [priority, setPriority] = useState<"baja" | "media" | "urgente">("media");
  const [commitmentDate, setCommitmentDate] = useState("");
  const [warrantyDays, setWarrantyDays] = useState(30);
  const [responsibleUserName, setResponsibleUserName] = useState<string>("");
  const [responsibleUsers, setResponsibleUsers] = useState<User[]>([]);
  const [loadingResponsibleUsers, setLoadingResponsibleUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI State Maps
  const [wizardStepByDevice, setWizardStepByDevice] = useState<Record<string, number>>({});
  const [flowStepByDevice, setFlowStepByDevice] = useState<Record<string, 1 | 2 | 3>>({});
  const [finalizedDeviceById, setFinalizedDeviceById] = useState<Record<string, boolean>>({});
  const [manualEntryByDevice, setManualEntryByDevice] = useState<Record<string, boolean>>({});
  
  // Modals & Panels UI
  const [detailsOpenByDevice, setDetailsOpenByDevice] = useState<Record<string, boolean>>({});
  const [serialFieldOpenByDevice, setSerialFieldOpenByDevice] = useState<Record<string, boolean>>({});
  const [unlockFieldOpenByDevice, setUnlockFieldOpenByDevice] = useState<Record<string, boolean>>({});
  const [manualEditOpenByDevice, setManualEditOpenByDevice] = useState<Record<string, boolean>>({});
  const [showPatternDrawer, setShowPatternDrawer] = useState<{ deviceId: string } | null>(null);
  const [showDeviceCategoryModal, setShowDeviceCategoryModal] = useState<{ deviceId: string; deviceModel: string } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [createdOrderServices, setCreatedOrderServices] = useState<any[]>([]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Device Selection Maps
  const [selectedBrandByDevice, setSelectedBrandByDevice] = useState<Record<string, string | null>>({});
  const [selectedSeriesByDevice, setSelectedSeriesByDevice] = useState<Record<string, string | null>>({});
  const [selectedModelByDevice, setSelectedModelByDevice] = useState<Record<string, string | null>>({});
  const [selectedVariantByDevice, setSelectedVariantByDevice] = useState<Record<string, string | null>>({});
  const [customCatalogFormByDevice, setCustomCatalogFormByDevice] = useState<Record<string, { model: string; variant: string }>>({});

  // Catalog State
  const [catalog, setCatalog] = useState<CatalogSnapshot>({
    deviceTypes: [], brands: [], productLines: [], models: [], variants: [],
  });
  const [catalogCards, setCatalogCards] = useState<DeviceCatalogCard[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [customDeviceTypes, setCustomDeviceTypes] = useState<string[]>([]);
  const [recentDeviceModels, setRecentDeviceModels] = useState<string[]>([]);
  const [deviceSuggestions, setDeviceSuggestions] = useState<Record<string, string[]>>({});
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState<Record<string, boolean>>({});

  // --- Effects ---
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("device_checklist_items").select("device_type");
      if (cancelled || !data) return;
      const builtin = new Set(["iphone", "ipad", "macbook", "apple_watch"]);
      const unique = [...new Set((data as { device_type: string }[]).map((r) => r.device_type))];
      setCustomDeviceTypes(unique.filter((t) => !builtin.has(t)));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const [snapshot, cardsRes] = await Promise.all([
          fetchCatalogSnapshot(),
          supabase.from("device_catalog_items").select("*").eq("is_active", true),
        ]);
        if (!cancelled) {
          setCatalog(snapshot);
          setCatalogCards((cardsRes.data as DeviceCatalogCard[] | null) ?? []);
          setCatalogLoaded(true);
        }
      } catch (error) {
        if (!cancelled) setCatalogLoaded(true);
      }
    }
    loadCatalog();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRecentModels() {
      const { data } = await supabase.from("work_orders").select("device_model").not("device_model", "is", null).order("created_at", { ascending: false }).limit(300);
      if (cancelled || !data) return;
      const unique = [...new Set((data as any[]).map((r) => r.device_model?.trim()).filter(Boolean))];
      setRecentDeviceModels(unique as string[]);
    }
    loadRecentModels();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const loadResponsibleUsers = async () => {
      // Logic for Branch Responsible Users (adapted from OrderForm)
      if (typeof window === 'undefined') return;
      const branchSessionStr = localStorage.getItem('branchSession');
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          if (branchSession.type === 'branch' && branchSession.branchId) {
            setLoadingResponsibleUsers(true);
            const { data } = await supabase.from("users").select("*").eq("role", "responsable").eq("branch_id", branchSession.branchId).order("name");
            setResponsibleUsers(data || []);
            setLoadingResponsibleUsers(false);
          }
        } catch (error) {
          setLoadingResponsibleUsers(false);
        }
      }
    };
    loadResponsibleUsers();
  }, [technicianId]);

  // --- Actions ---
  const updateDevice = (deviceId: string, updates: Partial<DeviceItem>) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d)));
  };

  const resetDevice = (deviceId: string) => {
    updateDevice(deviceId, {
      deviceType: null, deviceModel: "", deviceSerial: "", unlockType: "none",
      deviceUnlockCode: "", deviceUnlockPattern: [], problemDescription: "",
      checklistData: {}, selectedServices: [], replacementCost: 0, servicePrices: {},
    });
    setManualEntryByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setManualEditOpenByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setWizardStepByDevice((prev) => ({ ...prev, [deviceId]: 1 }));
    setFlowStepByDevice((prev) => ({ ...prev, [deviceId]: 1 }));
    setFinalizedDeviceById((prev) => ({ ...prev, [deviceId]: false }));
    setDetailsOpenByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setSerialFieldOpenByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setUnlockFieldOpenByDevice((prev) => ({ ...prev, [deviceId]: false }));
  };

  const addNewDevice = () => {
    const newDevice: DeviceItem = {
      id: `device-${Date.now()}-${Math.random()}`,
      deviceType: null, deviceModel: "", deviceSerial: "", unlockType: "none",
      deviceUnlockCode: "", deviceUnlockPattern: [], problemDescription: "",
      checklistData: {}, selectedServices: [], replacementCost: 0, serviceValue: 0, servicePrices: {},
    };
    setDevices([...devices, newDevice]);
    setWizardStepByDevice((prev) => ({ ...prev, [newDevice.id]: 1 }));
    setFlowStepByDevice((prev) => ({ ...prev, [newDevice.id]: 1 }));
    setFinalizedDeviceById((prev) => ({ ...prev, [newDevice.id]: false }));
  };

  const removeDevice = (deviceId: string) => {
    if (devices.length <= 1) { alert("Debe haber al menos un equipo en la orden"); return; }
    setDevices(devices.filter((d) => d.id !== deviceId));
  };

  const applyDeviceType = (deviceId: string, type: DeviceType) => {
    updateDevice(deviceId, { deviceType: type });
    setSelectedBrandByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setSelectedSeriesByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setSelectedModelByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setSelectedVariantByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setManualEntryByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setWizardStepByDevice((prev) => ({ ...prev, [deviceId]: 2 }));
  };

  const applyBrand = (deviceId: string, brandId: string) => {
    setSelectedBrandByDevice((prev) => ({ ...prev, [deviceId]: brandId }));
    setSelectedSeriesByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setSelectedModelByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setSelectedVariantByDevice((prev) => ({ ...prev, [deviceId]: null }));
    setManualEntryByDevice((prev) => ({ ...prev, [deviceId]: false }));
    setWizardStepByDevice((prev) => ({ ...prev, [deviceId]: 3 }));
  };

  const applySuggestedModel = (deviceId: string, model: string) => {
    const detectedType = detectDeviceTypeWithCustom(model, customDeviceTypes);
    updateDevice(deviceId, { deviceModel: model, deviceType: detectedType });
    setWizardStepByDevice((prev) => ({ ...prev, [deviceId]: 6 }));
    setFlowStepByDevice((prev) => ({ ...prev, [deviceId]: 1 }));
    setFinalizedDeviceById((prev) => ({ ...prev, [deviceId]: false }));
    setManualEditOpenByDevice((prev) => ({ ...prev, [deviceId]: false }));
  };

  const getCombinedSuggestions = (input: string): string[] => {
    const normalizedInput = input.trim().toLowerCase();
    if (!normalizedInput) return [];
    const ordered = new Map<string, string>();
    const addSuggestion = (value: string) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized || ordered.has(normalized)) return;
      ordered.set(normalized, value.trim());
    };
    getSmartSuggestions(input).forEach(addSuggestion);
    customDeviceTypes.filter((type) => type.toLowerCase().includes(normalizedInput))
      .map((t) => t.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).forEach(addSuggestion);
    recentDeviceModels.filter((model) => model.toLowerCase().includes(normalizedInput)).forEach(addSuggestion);
    return Array.from(ordered.values()).slice(0, 8);
  };

  const addCustomModelToCatalog = async (device: DeviceItem) => {
    const brandId = Number(selectedBrandByDevice[device.id]);
    const lineId = Number(selectedSeriesByDevice[device.id]);
    const form = customCatalogFormByDevice[device.id] ?? { model: "", variant: "" };
    if (!brandId || !lineId || !form.model.trim()) { alert("Debes seleccionar marca/lÃ­nea y escribir el modelo."); return; }
    const typeId = getTypeIdForDevice(device);
    const brand = catalog.brands.find((b) => b.id === brandId);
    const line = catalog.productLines.find((l) => l.id === lineId);
    if (!typeId || !brand || !line) { alert("Error catÃ¡logo"); return; }
    try {
      const chain = await ensureCatalogChain({ deviceTypeId: typeId, brandName: brand.name, lineName: line.name, modelName: form.model.trim(), variantName: form.variant.trim() || undefined });
      const displName = buildDeviceDisplayName({ brandName: brand.name, lineName: line.name, modelName: form.model.trim(), variantName: form.variant.trim() });
      const payload = { device_type_id: typeId, brand_id: chain.brandId, product_line_id: chain.lineId, model_id: chain.modelId, variant_id: chain.variantId, display_name: displName, is_active: true };
      await supabase.from("device_catalog_items").insert(payload);
      applySuggestedModel(device.id, displName);
      setCustomCatalogFormByDevice((prev) => ({ ...prev, [device.id]: { model: "", variant: "" } }));
      // Reload
      const [snap, crds] = await Promise.all([fetchCatalogSnapshot(), supabase.from("device_catalog_items").select("*").eq("is_active", true)]);
      setCatalog(snap); setCatalogCards((crds.data as any) ?? []);
    } catch (e) { alert("Error"); }
  };

  // --- Catalog Selectors ---
  const mapCatalogCodeToDeviceType = (code: string): DeviceType => {
    const map: Record<string, DeviceType> = { phone: "iphone", tablet: "ipad", laptop: "macbook", wearable: "apple_watch" };
    return map[code] ?? code;
  };
  const getTypeIdForDevice = (device: DeviceItem) => device.deviceType ? (catalog.deviceTypes.find((t) => mapCatalogCodeToDeviceType(t.code) === device.deviceType && t.is_active)?.id ?? null) : null;
  const getBrandsForDevice = (device: DeviceItem) => {
    const tId = getTypeIdForDevice(device); return tId ? catalog.brands.filter((b) => b.device_type_id === tId && b.is_active) : [];
  };
  const getLinesForDevice = (device: DeviceItem) => {
    const bId = Number(selectedBrandByDevice[device.id]); return bId ? catalog.productLines.filter((l) => l.brand_id === bId && l.is_active) : [];
  };
  const getModelsForDevice = (device: DeviceItem) => {
    const lId = Number(selectedSeriesByDevice[device.id]); return lId ? catalog.models.filter((m) => m.product_line_id === lId && m.is_active) : [];
  };
  const getVariantsForModel = (modelId: number) => catalog.variants.filter((v) => v.model_id === modelId && v.is_active);
  const getCardImage = (params: any) => {
    if (!params.typeId || !params.brandId || !params.lineId) return null;
    const matchId = (a: any, b: any) => (a === null || a === undefined || b === null || b === undefined) ? false : String(a) === String(b);
    const exact = catalogCards.find((card) =>
      matchId(card.device_type_id, params.typeId) &&
      matchId(card.brand_id, params.brandId) &&
      matchId(card.product_line_id, params.lineId) &&
      matchId(card.model_id, params.modelId) &&
      (params.variantId == null ? card.variant_id === null : matchId(card.variant_id, params.variantId))
    );
    if (exact?.image_url) return exact.image_url;
    const modelCard = catalogCards.find((card) => matchId(card.model_id, params.modelId) && card.variant_id === null && !!card.image_url);
    if (modelCard?.image_url) return modelCard.image_url;
    const sameModelCard = catalogCards.find((card) => matchId(card.model_id, params.modelId) && !!card.image_url);
    if (sameModelCard?.image_url) return sameModelCard.image_url;
    const line = catalog.productLines.find((l) => matchId(l.id, params.lineId));
    if (line?.image_url) return line.image_url;
    const brand = catalog.brands.find((b) => matchId(b.id, params.brandId));
    if (brand?.logo_url) return brand.logo_url;
    const type = catalog.deviceTypes.find((t) => matchId(t.id, params.typeId));
    if (type?.image_url) return type.image_url;
    return null;
  };

  const wizardTypeOptions = catalog.deviceTypes.filter(t => t.is_active).map(t => ({
    id: mapCatalogCodeToDeviceType(t.code),
    rawCode: t.code,
    label: t.name,
    description: t.name,
    icon: "ðŸ“±",
    imageUrl: t.image_url || "https://dummyimage.com/480x260/e2e8f0/475569&text=Tipo"
  }));

  const contextValue: OrderWizardContextType = {
    technicianId,
    onSaved,
    selectedCustomer, setSelectedCustomer,
    devices, priority, setPriority, commitmentDate, setCommitmentDate, warrantyDays, setWarrantyDays, responsibleUserName, setResponsibleUserName,
    updateDevice, resetDevice, addNewDevice, removeDevice,
    wizardStepByDevice, setWizardStepByDevice, flowStepByDevice, setFlowStepByDevice, finalizedDeviceById, setFinalizedDeviceById, manualEntryByDevice, setManualEntryByDevice,
    selectedBrandByDevice, setSelectedBrandByDevice, selectedSeriesByDevice, setSelectedSeriesByDevice, selectedModelByDevice, setSelectedModelByDevice, selectedVariantByDevice, setSelectedVariantByDevice, customCatalogFormByDevice, setCustomCatalogFormByDevice,
    createdOrder, setCreatedOrder, createdOrderServices, setCreatedOrderServices, showPDFPreview, setShowPDFPreview,
    detailsOpenByDevice, setDetailsOpenByDevice, serialFieldOpenByDevice, setSerialFieldOpenByDevice, unlockFieldOpenByDevice, setUnlockFieldOpenByDevice, manualEditOpenByDevice, setManualEditOpenByDevice, showPatternDrawer, setShowPatternDrawer, showDeviceCategoryModal, setShowDeviceCategoryModal,
    catalog, catalogCards, catalogLoaded, customDeviceTypes, recentDeviceModels, deviceSuggestions, setDeviceSuggestions, showDeviceSuggestions, setShowDeviceSuggestions,
    loading, setLoading, isSubmitting, setIsSubmitting, responsibleUsers, loadingResponsibleUsers,
    applyDeviceType, applyBrand, getCombinedSuggestions, applySuggestedModel, addCustomModelToCatalog, getTypeIdForDevice, getBrandsForDevice, getLinesForDevice, getModelsForDevice, getVariantsForModel, getCardImage, mapCatalogCodeToDeviceType, wizardTypeOptions
  };

  return (
    <OrderWizardContext.Provider value={contextValue}>
      {children}
    </OrderWizardContext.Provider>
  );
}

export function useOrderWizard() {
  const context = useContext(OrderWizardContext);
  if (!context) throw new Error("useOrderWizard must be used within an OrderWizardProvider");
  return context;
}

