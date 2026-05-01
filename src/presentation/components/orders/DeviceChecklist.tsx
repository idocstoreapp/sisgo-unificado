"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DeviceChecklistItem as ChecklistItem, DeviceType } from "@/types";
import { 
  Check, 
  Camera, 
  Smartphone, 
  Speaker, 
  Mic, 
  Wifi, 
  Bluetooth, 
  Battery, 
  Fingerprint, 
  Activity, 
  Volume2, 
  Cpu, 
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Radio,
  Image as ImageIcon,
  AlertTriangle
} from "lucide-react";

interface DeviceChecklistProps {
  deviceType: DeviceType;
  checklistData: Record<string, string>;
  onChecklistChange: (data: Record<string, string>) => void;
  onAutoAdvance?: () => void;
}

type QuickCategory = "fisico" | "funcional";
type QuickState = "ok" | "detalles" | "no_probado" | null;

const DEFAULT_STATUS_OPTIONS = [
  { value: "ok", label: "✓ Funcionando" },
  { value: "damaged", label: "⚠ Dañado" },
  { value: "replaced", label: "↻ Reparado" },
  { value: "no_probado", label: "✗ No probado" },
];

const STATUS_STYLES: Record<string, string> = {
  ok: "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100",
  funcionando: "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100",
  damaged: "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
  dañado: "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
  replaced: "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
  reparado: "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
  entregado: "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100",
  no_probado: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  "no probado": "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
};

function getStatusButtonClass(value: string, selected: boolean): string {
  const normalized = value.toLowerCase();
  const base =
    "min-h-[48px] rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-700/40";
  const tone =
    STATUS_STYLES[normalized] || "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const active = selected ? "ring-2 ring-slate-700 shadow-sm scale-[1.01]" : "";
  return `${base} ${tone} ${active}`.trim();
}

function formatStatusLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getQuickCategoryForItem(itemName: string): QuickCategory | null {
  const text = normalizeText(itemName);
  const physicalKeywords = [
    "pantalla",
    "carcasa",
    "camara",
    "boton",
    "pin",
    "carga",
    "vidrio",
    "bisagra",
    "chasis",
    "teclado",
    "touchpad",
    "corona",
  ];
  const functionalKeywords = [
    "microfono",
    "altavoz",
    "auricular",
    "llamada",
    "wifi",
    "bluetooth",
    "sensor",
    "flash",
    "vibr",
    "audio",
    "parlante",
    "senal",
    "señal",
    "software",
  ];

  if (physicalKeywords.some((keyword) => text.includes(keyword))) return "fisico";
  if (functionalKeywords.some((keyword) => text.includes(keyword))) return "funcional";
  return null;
}

function getIconForItem(itemName: string) {
  const text = normalizeText(itemName);
  if (text.includes("pantalla") || text.includes("display") || text.includes("tactil")) return <Smartphone className="h-6 w-6 text-indigo-500" />;
  if (text.includes("camara") || text.includes("lente")) return <Camera className="h-6 w-6 text-pink-500" />;
  if (text.includes("altavoz") || text.includes("parlante") || text.includes("audio") || text.includes("auricular")) return <Volume2 className="h-6 w-6 text-violet-500" />;
  if (text.includes("microfono")) return <Mic className="h-6 w-6 text-orange-500" />;
  if (text.includes("wifi") || text.includes("wi-fi") || text.includes("red")) return <Wifi className="h-6 w-6 text-blue-500" />;
  if (text.includes("bluetooth") || text.includes("bt")) return <Bluetooth className="h-6 w-6 text-blue-600" />;
  if (text.includes("bateria") || text.includes("carga") || text.includes("pin")) return <Battery className="h-6 w-6 text-emerald-500" />;
  if (text.includes("huella") || text.includes("fingerprint") || text.includes("touch") || text.includes("face") || text.includes("biometria")) return <Fingerprint className="h-6 w-6 text-teal-500" />;
  if (text.includes("boton") || text.includes("teclado")) return <Activity className="h-6 w-6 text-rose-500" />;
  if (text.includes("sensores") || text.includes("sensor")) return <Radio className="h-6 w-6 text-purple-500" />;
  if (text.includes("flash")) return <Zap className="h-6 w-6 text-yellow-500" />;
  if (text.includes("carcasa") || text.includes("tapa") || text.includes("chasis") || text.includes("marco")) return <Smartphone className="h-6 w-6 text-slate-500" />;
  if (text.includes("sim") || text.includes("bandeja") || text.includes("sd") || text.includes("chip")) return <Cpu className="h-6 w-6 text-amber-500" />;
  return <CheckCircle2 className="h-6 w-6 text-slate-400" />;
}

export default function DeviceChecklist({
  deviceType,
  checklistData,
  onChecklistChange,
  onAutoAdvance,
}: DeviceChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [itemToEditModal, setItemToEditModal] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState<QuickCategory | null>(null);
  const [customItemStatuses, setCustomItemStatuses] = useState<Record<string, string[]>>({});
  const [expandedByItem, setExpandedByItem] = useState<Record<string, boolean>>({});
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [modalChecklistName, setModalChecklistName] = useState("");
  const [modalStatuses, setModalStatuses] = useState<string[]>([]);
  const [modalNewStatus, setModalNewStatus] = useState("");
  const [editingCompletedItem, setEditingCompletedItem] = useState<string | null>(null);
  const [quickSelectionByCategory, setQuickSelectionByCategory] = useState<
    Record<QuickCategory, QuickState>
  >({
    fisico: null,
    funcional: null,
  });
  // Estado para recordar que el usuario seleccionó "Con detalles"
  const [detallesMode, setDetallesMode] = useState<Record<QuickCategory, boolean>>({
    fisico: false,
    funcional: false,
  });
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function loadChecklist() {
      setLoading(true);
      const { data } = await supabase
        .from("device_checklist_items")
        .select("*")
        .eq("device_type", deviceType)
        .order("item_order");

      if (data) {
        setItems(data);
        // Si no hay items en la BD pero hay items personalizados en checklistData, mantenerlos
        if (data.length === 0 && Object.keys(checklistData).length > 0) {
          setCustomItems(Object.keys(checklistData));
        }
      }
      setLoading(false);
    }

    loadChecklist();
  }, [deviceType]);

  useEffect(() => {
    const key = `device-checklist-custom-item-statuses:${deviceType}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      setCustomItemStatuses({});
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const normalized = Object.entries(parsed).reduce<Record<string, string[]>>(
          (acc, [itemName, statuses]) => {
            if (typeof itemName !== "string" || !Array.isArray(statuses)) return acc;
            const validStatuses = statuses
              .filter((value) => typeof value === "string" && value.trim())
              .map((value) => value.trim());
            if (validStatuses.length > 0) {
              acc[itemName] = Array.from(new Set(validStatuses));
            }
            return acc;
          },
          {},
        );
        setCustomItemStatuses(normalized);
      } else {
        setCustomItemStatuses({});
      }
    } catch {
      setCustomItemStatuses({});
    }
  }, [deviceType]);

  function saveCustomItemStatuses(next: Record<string, string[]>) {
    const key = `device-checklist-custom-item-statuses:${deviceType}`;
    localStorage.setItem(key, JSON.stringify(next));
  }

  function handleItemChange(itemName: string, value: string) {
    if (value === "") return; // No permitir valores vacíos
    onChecklistChange({
      ...checklistData,
      [itemName]: value,
    });
    setExpandedByItem((prev) => ({ ...prev, [itemName]: false }));
    setEditingCompletedItem((prev) => (prev === itemName ? null : prev));
  }

  function handleMarkAllAsNotTested() {
    const allAsNotTested = allItems.reduce<Record<string, string>>((acc, itemName) => {
      acc[itemName] = "no_probado";
      return acc;
    }, {});

    onChecklistChange({
      ...checklistData,
      ...allAsNotTested,
    });

    setExpandedByItem((prev) =>
      allItems.reduce<Record<string, boolean>>((acc, itemName) => ({ ...acc, [itemName]: false }), {
        ...prev,
      }),
    );
    setEditingCompletedItem(null);
    onAutoAdvance?.();
  }

  function handleOpenAddChecklistModal() {
    setModalChecklistName("");
    setModalNewStatus("");
    setModalStatuses(DEFAULT_STATUS_OPTIONS.map((status) => status.value));
    setShowAddChecklistModal(true);
  }

  function handleAddStatusInModal() {
    const value = modalNewStatus.trim();
    if (!value) {
      alert("Ingresa un estado");
      return;
    }
    const duplicated = modalStatuses.some((status) => status.toLowerCase() === value.toLowerCase());
    if (duplicated) {
      alert("Ese estado ya fue agregado");
      return;
    }
    setModalStatuses((prev) => [...prev, value]);
    setModalNewStatus("");
  }

  function handleRemoveStatusInModal(statusValue: string) {
    setModalStatuses((prev) => prev.filter((status) => status !== statusValue));
  }

  function handleSaveCustomChecklist() {
    const itemName = modalChecklistName.trim();
    if (!itemName) {
      alert("Por favor ingresa un nombre para el checklist");
      return;
    }

    if (
      customItems.some((item) => item.toLowerCase() === itemName.toLowerCase()) ||
      items.some((item) => item.item_name.toLowerCase() === itemName.toLowerCase())
    ) {
      alert("Este checklist ya existe");
      return;
    }

    if (modalStatuses.length === 0) {
      alert("Agrega al menos un estado");
      return;
    }

    setCustomItems((prev) => [...prev, itemName]);
    const nextStatuses = {
      ...customItemStatuses,
      [itemName]: modalStatuses,
    };
    setCustomItemStatuses(nextStatuses);
    saveCustomItemStatuses(nextStatuses);
    setShowAddChecklistModal(false);
  }

  function handleRemoveCustomItem(itemName: string) {
    setCustomItems(customItems.filter((item) => item !== itemName));
    const nextStatuses = { ...customItemStatuses };
    delete nextStatuses[itemName];
    setCustomItemStatuses(nextStatuses);
    saveCustomItemStatuses(nextStatuses);
    const newChecklistData = { ...checklistData };
    delete newChecklistData[itemName];
    onChecklistChange(newChecklistData);
  }

  // Combinar items de BD y items personalizados
  const allItems = [
    ...items.map((item) => item.item_name),
    ...customItems.filter((item) => !items.some((dbItem) => dbItem.item_name === item)),
  ];
  const physicalItems = allItems.filter(
    (itemName) => getQuickCategoryForItem(itemName) === "fisico",
  );
  const functionalItems = allItems.filter(
    (itemName) => getQuickCategoryForItem(itemName) === "funcional",
  );
  const quickCategoryHasItems = {
    fisico: physicalItems.length > 0,
    funcional: functionalItems.length > 0,
  };

  function getQuickStateForItems(itemNames: string[]): QuickState {
    if (itemNames.length === 0) return null;
    const values = itemNames
      .map((itemName) => checklistData[itemName])
      .filter((value): value is string => Boolean(value && value.trim()));
    if (values.length === 0) return null;
    if (values.every((value) => value === "ok" || value === "funcionando")) return "ok";
    if (values.every((value) => value === "no_probado" || value === "no probado"))
      return "no_probado";
    return "detalles";
  }

  const quickCategoryState: Record<QuickCategory, QuickState> = {
    fisico: getQuickStateForItems(physicalItems),
    funcional: getQuickStateForItems(functionalItems),
  };

  function applyQuickCategoryState(
    category: QuickCategory,
    value: "ok" | "detalles" | "no_probado",
  ) {
    const categoryItems = category === "fisico" ? physicalItems : functionalItems;
    if (categoryItems.length === 0) return;

    if (value === "detalles") {
      setCategoryModalOpen(category);
      if (quickCategoryState[category] !== "detalles") {
        setDetallesMode((prev) => ({ ...prev, [category]: true }));

        const clearedData = { ...checklistData };
        categoryItems.forEach((itemName) => {
          if (
            clearedData[itemName] === "ok" ||
            clearedData[itemName] === "funcionando" ||
            clearedData[itemName] === "no_probado"
          ) {
            delete clearedData[itemName];
          }
        });
        onChecklistChange(clearedData);
      }
      return;
    }

    // Si selecciona OK o No probado, quitar el modo detalles
    setDetallesMode((prev) => ({ ...prev, [category]: false }));

    const normalizedValue = value === "no_probado" ? "no_probado" : "ok";
    const nextData = { ...checklistData };
    categoryItems.forEach((itemName) => {
      nextData[itemName] = normalizedValue;
    });
    onChecklistChange(nextData);
    setExpandedByItem((prev) => ({
      ...prev,
      ...categoryItems.reduce<Record<string, boolean>>(
        (acc, itemName) => ({ ...acc, [itemName]: false }),
        {},
      ),
    }));

    if (value === "ok") {
      checkAutoAdvance(nextData, true);
    }
  }

  function checkAutoAdvance(data: Record<string, string>, fromQuickOk: boolean = false) {
    const physicalValues = physicalItems.map((item) => data[item]).filter(v => v);
    const functionalValues = functionalItems.map((item) => data[item]).filter(v => v);
    
    const isAllPhysicalOk = physicalValues.length === physicalItems.length && physicalValues.every((v) => v === "ok" || v === "funcionando");
    const isAllFunctionalOk = functionalValues.length === functionalItems.length && functionalValues.every((v) => v === "ok" || v === "funcionando");

    if (isAllPhysicalOk && isAllFunctionalOk) {
       const hasChip = data.entrega_chip !== undefined;
       const hasMicroSD = data.entrega_microchip_sd !== undefined;
       
       if (hasChip && hasMicroSD) {
          onAutoAdvance?.();
       } else if (fromQuickOk) {
          alert("Recordatorio: Por favor indica si incluye Chip y Micro SD en la sección de accesorios.");
       }
    }
  }

  const pendingItems = allItems.filter((itemName) => !checklistData[itemName]);
  const completedItems = allItems.filter((itemName) => Boolean(checklistData[itemName]));

  // Mostrar todos los items de las categorías que están en "detalles", no solo los pendientes
  const visibleItems = editingCompletedItem
    ? [...allItems, editingCompletedItem].filter((item, index, arr) => arr.indexOf(item) === index)
    : allItems;

  const filteredVisibleItems = visibleItems.filter((itemName) => {
    const category = getQuickCategoryForItem(itemName);
    if (category === "fisico" && !detallesMode.fisico && quickCategoryState.fisico !== "detalles")
      return false;
    if (
      category !== "fisico" &&
      !detallesMode.funcional &&
      quickCategoryState.funcional !== "detalles"
    )
      return false;
    return true;
  });

  const visiblePhysicalItems = filteredVisibleItems.filter(item => getQuickCategoryForItem(item) === "fisico");
  const visibleFunctionalItems = filteredVisibleItems.filter(item => getQuickCategoryForItem(item) !== "fisico");

  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    allItems.forEach((itemName) => {
      defaults[itemName] = !checklistData[itemName];
    });
    setExpandedByItem(defaults);
  }, [deviceType, allItems.join("|")]);

  useEffect(() => {
    // Deshabilitado scroll automático para evitar que la página se mueva al
    // aparecer el checklist o al marcar items. El usuario ya ve el panel, no
    // es necesario desplazar la vista.
    // const firstPending = allItems.find((itemName) => !checklistData[itemName]);
    // if (!firstPending) return;
    // const ref = itemRefs.current[firstPending];
    // if (!ref) return;
    // ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [
    Object.entries(checklistData)
      .map(([k, v]) => `${k}:${v}`)
      .join("|"),
    allItems.join("|"),
  ]);

  useEffect(() => {
    setQuickSelectionByCategory({ fisico: null, funcional: null });
  }, [deviceType]);

  function getStatusOptionsForItem(itemName: string) {
    const itemFromDb = items.find((item) => item.item_name === itemName);
    const statusOptionsFromDb = Array.isArray(itemFromDb?.status_options)
      ? (itemFromDb?.status_options || [])
          .filter((value) => typeof value === "string" && value.trim())
          .map((value) => value.trim())
      : [];

    const customItemOptionValues = customItemStatuses[itemName] || [];

    const optionValues =
      statusOptionsFromDb.length > 0
        ? statusOptionsFromDb
        : customItemOptionValues.length > 0
          ? customItemOptionValues
          : DEFAULT_STATUS_OPTIONS.map((option) => option.value);

    const currentValue = checklistData[itemName];
    if (currentValue && !optionValues.includes(currentValue)) {
      optionValues.push(currentValue);
    }

    return optionValues.map((value) => {
      const defaultOption = DEFAULT_STATUS_OPTIONS.find((option) => option.value === value);
      return {
        value,
        label: defaultOption?.label || formatStatusLabel(value),
      };
    });
  }

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 p-4">
        <p className="text-slate-600">Cargando checklist...</p>
      </div>
    );
  }

  // Helper para renderizar items individuales en formato card pequeña
  const renderItemCard = (itemName: string) => {
    const isCustom = customItems.includes(itemName) && !items.some((item) => item.item_name === itemName);
    const selectedValue = checklistData[itemName] || "";
    const statusOptions = getStatusOptionsForItem(itemName);

    return (
      <div
        key={itemName}
        ref={(el) => { itemRefs.current[itemName] = el; }}
        className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="mb-2 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 border border-slate-100">
            {getIconForItem(itemName)}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mb-2">
          <p className="text-center text-xs font-semibold text-slate-800 truncate" title={itemName}>
            {itemName}
          </p>
          {isCustom && <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5" title="Personalizado">P</span>}
        </div>
        
        <div className="mt-auto flex flex-col items-center gap-1">
          {selectedValue ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 text-center w-full truncate border border-slate-200">
              {formatStatusLabel(selectedValue)}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-1 text-[10px] font-semibold text-center w-full truncate border border-amber-200">
              Pendiente
            </span>
          )}
          <div className="flex w-full gap-1 mt-1">
             <button
               type="button"
               onClick={() => setItemToEditModal(itemName)}
               className={`flex-1 rounded-md border py-1 text-[10px] font-medium transition-colors ${!selectedValue ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
             >
               {!selectedValue ? "Elegir estado" : "Editar"}
             </button>
             {isCustom && (
               <button
                 onClick={() => handleRemoveCustomItem(itemName)}
                 className="rounded-md bg-rose-50 border border-rose-100 px-2 text-[10px] text-rose-600 hover:bg-rose-100 transition-colors"
                 type="button"
                 title="Eliminar"
               >
                 ✕
               </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-4">
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold text-slate-900">
            Checklist de verificación
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Verificaremos tu dispositivo en 2 capas para asegurar una evaluación completa y rápida.
          </p>
        </div>
        
        {allItems.length > 0 && completedItems.length !== allItems.length && (
          <button
            type="button"
            onClick={handleMarkAllAsNotTested}
            className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            No se pueden probar funcionalidades ahora
          </button>
        )}
      </div>

      {items.length === 0 && customItems.length === 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            No hay checklist configurado para este tipo de dispositivo. Puedes crear items personalizados abajo.
          </p>
        </div>
      )}

      {/* CAPA 1: PARTE FÍSICA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-sm">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  Capa 1: Parte física (externa)
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Inspección visual
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Revisamos el estado físico y visual de todos los componentes externos.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">¿Cómo está la parte física de tu dispositivo?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => applyQuickCategoryState("fisico", "ok")}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${quickCategoryState.fisico === "ok" ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${quickCategoryState.fisico === "ok" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`font-semibold ${quickCategoryState.fisico === "ok" ? "text-emerald-900" : "text-emerald-700"}`}>Todo funcional</p>
                    <p className={`text-xs mt-1 ${quickCategoryState.fisico === "ok" ? "text-emerald-700/80" : "text-slate-500"}`}>Sin golpes, roturas ni detalles visibles</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickCategoryState("fisico", "detalles")}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${quickCategoryState.fisico === "detalles" ? "border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-500" : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/50"}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${quickCategoryState.fisico === "detalles" ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-600"}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`font-semibold ${quickCategoryState.fisico === "detalles" ? "text-rose-900" : "text-rose-700"}`}>Con detalles</p>
                    <p className={`text-xs mt-1 ${quickCategoryState.fisico === "detalles" ? "text-rose-700/80" : "text-slate-500"}`}>Hay detalles en uno o más componentes</p>
                  </div>
                </button>
              </div>
            </div>


          </div>
          
          <div className="hidden lg:flex w-[35%] xl:w-[40%] items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-6 overflow-hidden">
            <img src="/checklist-exterior.png" alt="Inspección visual exterior del dispositivo" className="w-full h-auto object-contain mix-blend-multiply opacity-90 hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </div>

      {/* CAPA 2: FUNCIONALIDADES */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  Capa 2: Funcionalidades (interna)
                  <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Pruebas rápidas
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Probamos que todas las funciones y características del dispositivo operen correctamente.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">¿Todas las funcionalidades operan correctamente?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => applyQuickCategoryState("funcional", "ok")}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${quickCategoryState.funcional === "ok" ? "border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${quickCategoryState.funcional === "ok" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`font-semibold ${quickCategoryState.funcional === "ok" ? "text-emerald-900" : "text-emerald-700"}`}>Todo funcional</p>
                    <p className={`text-xs mt-1 ${quickCategoryState.funcional === "ok" ? "text-emerald-700/80" : "text-slate-500"}`}>Todas las funciones operan correctamente</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickCategoryState("funcional", "detalles")}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${quickCategoryState.funcional === "detalles" ? "border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-500" : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/50"}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${quickCategoryState.funcional === "detalles" ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-600"}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`font-semibold ${quickCategoryState.funcional === "detalles" ? "text-rose-900" : "text-rose-700"}`}>Con detalles</p>
                    <p className={`text-xs mt-1 ${quickCategoryState.funcional === "detalles" ? "text-rose-700/80" : "text-slate-500"}`}>Hay funciones que presentan fallas o inconsistencias</p>
                  </div>
                </button>
              </div>
            </div>



            {/* Elementos Entregados (Reubicado) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
               <p className="text-sm font-medium text-slate-700 mb-4">¿Incluye accesorios en la entrega?</p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Chip (SIM)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checklistData.entrega_chip === "si"}
                      onChange={(e) => {
                        const nextData = {
                          ...checklistData,
                          entrega_chip: e.target.checked ? "si" : "no",
                        };
                        onChecklistChange(nextData);
                        checkAutoAdvance(nextData, false);
                      }}
                      className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Micro SD</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checklistData.entrega_microchip_sd === "si"}
                      onChange={(e) => {
                        const nextData = {
                          ...checklistData,
                          entrega_microchip_sd: e.target.checked ? "si" : "no",
                        };
                        onChecklistChange(nextData);
                        checkAutoAdvance(nextData, false);
                      }}
                      className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
               </div>
            </div>
          </div>

          <div className="hidden lg:flex w-[35%] xl:w-[40%] items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-6 overflow-hidden">
            <img src="/checklist-interior.png" alt="Inspección de diagnóstico interno" className="w-full h-auto object-contain mix-blend-multiply opacity-90 hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </div>

      {showCompletedModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-slate-900">Checklist completados</h4>
              <button
                type="button"
                onClick={() => setShowCompletedModal(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
              {completedItems.map((itemName) => {
                const selectedValue = checklistData[itemName] || "";
                const isCustom =
                  customItems.includes(itemName) &&
                  !items.some((item) => item.item_name === itemName);
                return (
                  <div
                    key={itemName}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{itemName}</p>
                      <p className="text-xs text-slate-600">
                        Estado: {formatStatusLabel(selectedValue)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCustom && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          Personalizado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompletedModal(false);
                          setEditingCompletedItem(itemName);
                          setExpandedByItem((prev) => ({ ...prev, [itemName]: true }));
                        }}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Editar checklist
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleOpenAddChecklistModal}
          className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          + Agregar nuevo checklist
        </button>
      </div>

      {showAddChecklistModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-slate-900">Agregar nuevo checklist</h4>
              <button
                type="button"
                onClick={() => setShowAddChecklistModal(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre de checklist
                </label>
                <input
                  type="text"
                  value={modalChecklistName}
                  onChange={(e) => setModalChecklistName(e.target.value)}
                  placeholder="Ej: Pantalla, Bocina, Cámara..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Estados (puedes quitar o agregar más)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalNewStatus}
                    onChange={(e) => setModalNewStatus(e.target.value)}
                    placeholder="Agregar otro estado"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddStatusInModal();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddStatusInModal}
                    type="button"
                    className="rounded-xl bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    + Estado
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {modalStatuses.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                    >
                      {formatStatusLabel(status)}
                      <button
                        type="button"
                        onClick={() => handleRemoveStatusInModal(status)}
                        className="text-gray-600 hover:text-gray-700"
                        title="Eliminar estado"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddChecklistModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomChecklist}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Guardar checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {categoryModalOpen === "fisico" ? <Smartphone className="h-5 w-5 text-indigo-600" /> : <Activity className="h-5 w-5 text-blue-600" />}
                {categoryModalOpen === "fisico" ? "Detalles Físicos" : "Detalles Funcionales"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(null)}
                className="rounded-full bg-slate-200 p-2 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                 {(categoryModalOpen === "fisico" ? physicalItems : functionalItems).map((itemName) => {
                    return renderItemCard(itemName);
                 })}
               </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 bg-white rounded-b-3xl flex justify-between items-center">
               <p className="text-sm text-slate-500">
                 Selecciona un componente para editar su estado.
               </p>
               <button onClick={() => setCategoryModalOpen(null)} className="rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm">
                 Listo
               </button>
            </div>
          </div>
        </div>
      )}

      {itemToEditModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700">
                  {getIconForItem(itemToEditModal)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 truncate max-w-[200px]">{itemToEditModal}</h4>
                  <p className="text-xs text-slate-500 font-medium">Seleccionar estado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToEditModal(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 gap-2">
                {getStatusOptionsForItem(itemToEditModal).map((statusOption) => {
                  const isSelected = checklistData[itemToEditModal] === statusOption.value;
                  return (
                    <button
                      key={statusOption.value}
                      type="button"
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        isSelected 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                      onClick={() => {
                        handleItemChange(itemToEditModal, statusOption.value);
                        setItemToEditModal(null);
                      }}
                    >
                      {statusOption.label}
                      {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
