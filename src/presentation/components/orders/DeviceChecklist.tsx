"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DeviceChecklistItem as ChecklistItem, DeviceType } from "@/types";

interface DeviceChecklistProps {
  deviceType: DeviceType;
  checklistData: Record<string, string>;
  onChecklistChange: (data: Record<string, string>) => void;
}

type QuickCategory = "fisico" | "funcional";
type QuickState = "ok" | "detalles" | "no_probado" | null;

const DEFAULT_PHYSICAL_DETAIL_ITEMS = [
  "Pantalla",
  "Cámara externa",
  "Pin de carga",
  "Botón encendido",
  "Botones volumen",
  "Carcasa",
  "Tapa trasera",
];

const DEFAULT_FUNCTIONAL_DETAIL_ITEMS = [
  "Vibrador",
  "Altavoz",
  "Auricular llamada",
  "Micrófono",
  "Wifi",
  "Bluetooth",
  "Señal",
  "Flash",
  "Batería",
];

const DEFAULT_STATUS_OPTIONS = [
  { value: "ok", label: "âœ“ Funcionando" },
  { value: "damaged", label: "âš  DaÃ±ado" },
  { value: "replaced", label: "â™» Reparado" },
  { value: "no_probado", label: "âœ— No probado" },
];

const STATUS_STYLES: Record<string, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  funcionando: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  damaged: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
  "dañado": "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
  replaced: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  reparado: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
  entregado: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  no_probado: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  "no probado": "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
};

function getStatusButtonClass(value: string, selected: boolean): string {
  const normalized = value.toLowerCase();
  const base =
    "min-h-[48px] rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-light/40";
  const tone = STATUS_STYLES[normalized] || "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const active = selected ? "ring-2 ring-brand-light shadow-sm scale-[1.01]" : "";
  return `${base} ${tone} ${active}`.trim();
}

function formatStatusLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    "bateria",
    "battery",
  ];

  if (physicalKeywords.some((keyword) => text.includes(keyword))) return "fisico";
  if (functionalKeywords.some((keyword) => text.includes(keyword))) return "funcional";
  return null;
}

export default function DeviceChecklist({
  deviceType,
  checklistData,
  onChecklistChange,
}: DeviceChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [customItemStatuses, setCustomItemStatuses] = useState<Record<string, string[]>>({});
  const [expandedByItem, setExpandedByItem] = useState<Record<string, boolean>>({});
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [modalChecklistName, setModalChecklistName] = useState("");
  const [modalStatuses, setModalStatuses] = useState<string[]>([]);
  const [modalNewStatus, setModalNewStatus] = useState("");
  const [editingCompletedItem, setEditingCompletedItem] = useState<string | null>(null);
  const [quickSelectionByCategory, setQuickSelectionByCategory] = useState<Record<QuickCategory, QuickState>>({
    fisico: null,
    funcional: null,
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
        const normalized = Object.entries(parsed).reduce<Record<string, string[]>>((acc, [itemName, statuses]) => {
          if (typeof itemName !== "string" || !Array.isArray(statuses)) return acc;
          const validStatuses = statuses
            .filter((value) => typeof value === "string" && value.trim())
            .map((value) => value.trim());
          if (validStatuses.length > 0) {
            acc[itemName] = Array.from(new Set(validStatuses));
          }
          return acc;
        }, {});
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
    if (value === "") return; // No permitir valores vacÃ­os
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
      allItems.reduce<Record<string, boolean>>(
        (acc, itemName) => ({ ...acc, [itemName]: false }),
        { ...prev },
      ),
    );
    setEditingCompletedItem(null);
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

    if (customItems.some((item) => item.toLowerCase() === itemName.toLowerCase()) || items.some((item) => item.item_name.toLowerCase() === itemName.toLowerCase())) {
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
    setCustomItems(customItems.filter(item => item !== itemName));
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
    ...items.map(item => item.item_name),
    ...customItems.filter(item => !items.some(dbItem => dbItem.item_name === item))
  ];
  const physicalItems = Array.from(
    new Set([
      ...allItems.filter((itemName) => getQuickCategoryForItem(itemName) === "fisico"),
      ...DEFAULT_PHYSICAL_DETAIL_ITEMS,
    ]),
  );
  const functionalItems = Array.from(
    new Set([
      ...allItems.filter((itemName) => getQuickCategoryForItem(itemName) === "funcional"),
      ...DEFAULT_FUNCTIONAL_DETAIL_ITEMS,
    ]),
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
    if (values.every((value) => value === "no_probado" || value === "no probado")) return "no_probado";
    return "detalles";
  }

  const quickCategoryState: Record<QuickCategory, QuickState> = {
    fisico: quickSelectionByCategory.fisico ?? getQuickStateForItems(physicalItems),
    funcional: quickSelectionByCategory.funcional ?? getQuickStateForItems(functionalItems),
  };

  function applyQuickCategoryState(category: QuickCategory, value: "ok" | "detalles" | "no_probado") {
    setQuickSelectionByCategory((prev) => ({ ...prev, [category]: value }));
    const categoryItems = category === "fisico" ? physicalItems : functionalItems;
    if (categoryItems.length === 0) return;

    if (value === "detalles") {
      const clearedData = { ...checklistData };
      categoryItems.forEach((itemName) => {
        if (clearedData[itemName] === "ok" || clearedData[itemName] === "funcionando" || clearedData[itemName] === "no_probado") {
          delete clearedData[itemName];
        }
      });
      onChecklistChange(clearedData);
      setExpandedByItem((prev) => ({
        ...prev,
        ...categoryItems.reduce<Record<string, boolean>>((acc, itemName) => ({ ...acc, [itemName]: true }), {}),
      }));
      return;
    }

    const normalizedValue = value === "no_probado" ? "no_probado" : "ok";
    const nextData = { ...checklistData };
    categoryItems.forEach((itemName) => {
      nextData[itemName] = normalizedValue;
    });
    onChecklistChange(nextData);
    setExpandedByItem((prev) => ({
      ...prev,
      ...categoryItems.reduce<Record<string, boolean>>((acc, itemName) => ({ ...acc, [itemName]: false }), {}),
    }));
  }

  const pendingItems = allItems.filter((itemName) => !checklistData[itemName]);
  const completedItems = allItems.filter((itemName) => Boolean(checklistData[itemName]));
  const baseVisibleItems = editingCompletedItem
    ? [...pendingItems, editingCompletedItem].filter((item, index, arr) => arr.indexOf(item) === index)
    : pendingItems;
  const visibleItems = Array.from(
    new Set([
      ...baseVisibleItems,
      ...(quickCategoryState.fisico === "detalles" ? physicalItems : []),
      ...(quickCategoryState.funcional === "detalles" ? functionalItems : []),
    ]),
  );
  const filteredVisibleItems = visibleItems.filter((itemName) => {
    const category = getQuickCategoryForItem(itemName);
    if (category === "fisico" && quickCategoryState.fisico !== "detalles") return false;
    if (category === "funcional" && quickCategoryState.funcional !== "detalles") return false;
    return true;
  });
  const physicalVisibleItems = filteredVisibleItems.filter((itemName) => getQuickCategoryForItem(itemName) === "fisico");
  const functionalVisibleItems = filteredVisibleItems.filter((itemName) => getQuickCategoryForItem(itemName) === "funcional");
  const uncategorizedVisibleItems = filteredVisibleItems.filter((itemName) => {
    const category = getQuickCategoryForItem(itemName);
    return category !== "fisico" && category !== "funcional";
  });

  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    allItems.forEach((itemName) => {
      defaults[itemName] = !checklistData[itemName];
    });
    setExpandedByItem(defaults);
  }, [deviceType, allItems.join("|")]);

  useEffect(() => {
    // Deshabilitado scroll automÃ¡tico para evitar que la pÃ¡gina se mueva al
    // aparecer el checklist o al marcar items. El usuario ya ve el panel, no
    // es necesario desplazar la vista.
    // const firstPending = allItems.find((itemName) => !checklistData[itemName]);
    // if (!firstPending) return;
    // const ref = itemRefs.current[firstPending];
    // if (!ref) return;
    // ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [Object.entries(checklistData).map(([k, v]) => `${k}:${v}`).join("|"), allItems.join("|")]);

  useEffect(() => {
    setQuickSelectionByCategory({ fisico: null, funcional: null });
  }, [deviceType]);

  function getStatusOptionsForItem(itemName: string) {
    const itemFromDb = items.find((item) => item.item_name === itemName);
    const statusOptionsFromDb = Array.isArray(itemFromDb?.status_options)
      ? (itemFromDb?.status_options || []).filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim())
      : [];

    const customItemOptionValues = customItemStatuses[itemName] || [];

    const optionValues = statusOptionsFromDb.length > 0
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
      <div className="border border-slate-200 rounded-md p-4">
        <p className="text-slate-600">Cargando checklist...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-900 md:text-xl">Checklist de VerificaciÃ³n *</h3>

      {completedItems.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">
            {completedItems.length} checklist{completedItems.length > 1 ? "s" : ""} completado{completedItems.length > 1 ? "s" : ""}.
          </p>
          <button
            type="button"
            onClick={() => setShowCompletedModal(true)}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Ver checklist completados
          </button>
        </div>
      )}
      
      {items.length === 0 && customItems.length === 0 && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
          <p className="mb-2 text-sm text-yellow-800">
            No hay checklist configurado para este tipo de dispositivo. Puedes crear items personalizados abajo.
          </p>
        </div>
      )}

      {allItems.length > 0 && completedItems.length !== allItems.length && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">
              Â¿No puedes probar ninguna funciÃ³n ahora? Puedes marcar todo como <span className="font-semibold">No probado</span> y continuar al siguiente paso.
            </p>
            <button
              type="button"
              onClick={handleMarkAllAsNotTested}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Marcar todo como no probado
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm font-semibold text-blue-900">Recepción rápida (40 segundos)</p>
        <p className="text-xs text-blue-800 mt-1">
          Primero marca estado global. Solo entra al detalle cuando el bloque está en <strong>Con detalles</strong>.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">1) Estado físico externo</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => applyQuickCategoryState("fisico", "ok")} className={getStatusButtonClass("ok", quickCategoryState.fisico === "ok")}>OK</button>
              <button type="button" onClick={() => applyQuickCategoryState("fisico", "detalles")} className={getStatusButtonClass("damaged", quickCategoryState.fisico === "detalles")}>Con detalles</button>
              <button type="button" onClick={() => applyQuickCategoryState("fisico", "no_probado")} className={getStatusButtonClass("no_probado", quickCategoryState.fisico === "no_probado")}>No probado</button>
            </div>
            {!quickCategoryHasItems.fisico && <p className="mt-2 text-xs text-slate-500">No hay ítems físicos configurados para este equipo.</p>}
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">2) Pruebas funcionales</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => applyQuickCategoryState("funcional", "ok")} className={getStatusButtonClass("ok", quickCategoryState.funcional === "ok")}>OK</button>
              <button type="button" onClick={() => applyQuickCategoryState("funcional", "detalles")} className={getStatusButtonClass("damaged", quickCategoryState.funcional === "detalles")}>Con detalles</button>
              <button type="button" onClick={() => applyQuickCategoryState("funcional", "no_probado")} className={getStatusButtonClass("no_probado", quickCategoryState.funcional === "no_probado")}>No probado</button>
            </div>
            {!quickCategoryHasItems.funcional && <p className="mt-2 text-xs text-slate-500">No hay ítems funcionales configurados para este equipo.</p>}
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">3) Elementos entregados</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-center justify-between text-sm text-slate-700">
                Chip
                <input
                  type="checkbox"
                  checked={checklistData.entrega_chip === "si"}
                  onChange={(e) => onChecklistChange({ ...checklistData, entrega_chip: e.target.checked ? "si" : "no" })}
                  className="h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between text-sm text-slate-700">
                Microchip / SD
                <input
                  type="checkbox"
                  checked={checklistData.entrega_microchip_sd === "si"}
                  onChange={(e) => onChecklistChange({ ...checklistData, entrega_microchip_sd: e.target.checked ? "si" : "no" })}
                  className="h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 space-y-4">
        {physicalVisibleItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Capa exterior (físico)</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {physicalVisibleItems.map((itemName) => {
                const isCustom = customItems.includes(itemName) && !items.some(item => item.item_name === itemName);
                const selectedValue = checklistData[itemName] || "";
                const statusOptions = getStatusOptionsForItem(itemName);
                return (
                  <div
                    key={itemName}
                    ref={(el) => {
                      itemRefs.current[itemName] = el;
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-base font-semibold text-slate-800">{itemName}</span>
                        {selectedValue && (
                          <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                            {formatStatusLabel(selectedValue)}
                          </span>
                        )}
                      </div>
                      {isCustom && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Personalizado</span>
                      )}
                    </div>

                    {(expandedByItem[itemName] || !selectedValue) ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {statusOptions.map((statusOption) => {
                          const isSelected = selectedValue === statusOption.value;
                          return (
                            <button
                              key={statusOption.value}
                              type="button"
                              className={getStatusButtonClass(statusOption.value, isSelected)}
                              aria-pressed={isSelected}
                              onClick={() => handleItemChange(itemName, statusOption.value)}
                            >
                              {statusOption.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Estado: {formatStatusLabel(selectedValue)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedByItem((prev) => ({ ...prev, [itemName]: true }))}
                          className="rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {selectedValue ? "Toca otro estado para cambiar rápido." : "Selecciona un estado."}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustomItem(itemName)}
                          className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          type="button"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {functionalVisibleItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pruebas con equipo encendido (funcional)</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {functionalVisibleItems.map((itemName) => {
                const isCustom = customItems.includes(itemName) && !items.some(item => item.item_name === itemName);
                const selectedValue = checklistData[itemName] || "";
                const statusOptions = getStatusOptionsForItem(itemName);
                return (
                  <div
                    key={itemName}
                    ref={(el) => {
                      itemRefs.current[itemName] = el;
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-base font-semibold text-slate-800">{itemName}</span>
                        {selectedValue && (
                          <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                            {formatStatusLabel(selectedValue)}
                          </span>
                        )}
                      </div>
                      {isCustom && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Personalizado</span>
                      )}
                    </div>

                    {(expandedByItem[itemName] || !selectedValue) ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {statusOptions.map((statusOption) => {
                          const isSelected = selectedValue === statusOption.value;
                          return (
                            <button
                              key={statusOption.value}
                              type="button"
                              className={getStatusButtonClass(statusOption.value, isSelected)}
                              aria-pressed={isSelected}
                              onClick={() => handleItemChange(itemName, statusOption.value)}
                            >
                              {statusOption.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Estado: {formatStatusLabel(selectedValue)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedByItem((prev) => ({ ...prev, [itemName]: true }))}
                          className="rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {selectedValue ? "Toca otro estado para cambiar rápido." : "Selecciona un estado."}
                      </span>
                      {isCustom && (
                        <button
                          onClick={() => handleRemoveCustomItem(itemName)}
                          className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                          type="button"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uncategorizedVisibleItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Otros checks</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {uncategorizedVisibleItems.map((itemName) => {
          const isCustom = customItems.includes(itemName) && !items.some(item => item.item_name === itemName);
          const selectedValue = checklistData[itemName] || "";
          const statusOptions = getStatusOptionsForItem(itemName);
          return (
            <div
              key={itemName}
              ref={(el) => {
                itemRefs.current[itemName] = el;
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-base font-semibold text-slate-800">{itemName}</span>
                  {selectedValue && (
                    <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                      {formatStatusLabel(selectedValue)}
                    </span>
                  )}
                </div>
                {isCustom && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Personalizado</span>
                )}
              </div>

              {(expandedByItem[itemName] || !selectedValue) ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {statusOptions.map((statusOption) => {
                    const isSelected = selectedValue === statusOption.value;
                    return (
                      <button
                        key={statusOption.value}
                        type="button"
                        className={getStatusButtonClass(statusOption.value, isSelected)}
                        aria-pressed={isSelected}
                        onClick={() => handleItemChange(itemName, statusOption.value)}
                      >
                        {statusOption.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Estado: {formatStatusLabel(selectedValue)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedByItem((prev) => ({ ...prev, [itemName]: true }))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                  >
                    Editar
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {selectedValue ? "Toca otro estado para cambiar rÃ¡pido." : "Selecciona un estado."}
                </span>
                {isCustom && (
                  <button
                    onClick={() => handleRemoveCustomItem(itemName)}
                    className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                    type="button"
                  >
                    âœ•
                  </button>
                )}
              </div>
            </div>
          );
              })}
            </div>
          </div>
        )}
      </div>

      {filteredVisibleItems.length === 0 && allItems.length > 0 && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm text-emerald-800">
            Â¡Excelente! Todos los items del checklist ya tienen estado asignado.
          </p>
        </div>
      )}

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
                const isCustom = customItems.includes(itemName) && !items.some(item => item.item_name === itemName);
                return (
                  <div
                    key={itemName}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{itemName}</p>
                      <p className="text-xs text-slate-600">Estado: {formatStatusLabel(selectedValue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCustom && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Personalizado</span>
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
          className="rounded-xl bg-brand-light px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de checklist</label>
                <input
                  type="text"
                  value={modalChecklistName}
                  onChange={(e) => setModalChecklistName(e.target.value)}
                  placeholder="Ej: Pantalla, Bocina, CÃ¡mara..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Estados (puedes quitar o agregar mÃ¡s)</p>
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
                    <span key={status} className="inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {formatStatusLabel(status)}
                      <button
                        type="button"
                        onClick={() => handleRemoveStatusInModal(status)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar estado"
                      >
                        âœ•
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
                  className="rounded-xl bg-brand-light px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Guardar checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
