import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DeviceType } from "@/types";
import {
  Bluetooth,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  HelpCircle,
  Home,
  Mic,
  Monitor,
  Power,
  Smartphone,
  Speaker,
  Usb,
  Wifi,
  XCircle,
} from "lucide-react";

interface QuickChecklistProps {
  deviceType: DeviceType;
  checklistData: Record<string, string>;
  onChecklistChange: (data: Record<string, string>) => void;
  compact?: boolean;
}

const PHYSICAL_ISSUES = [
  { id: "pantalla_rota", label: "Pantalla rota", icon: Monitor },
  { id: "pantalla_rayada", label: "Pantalla rayada", icon: Monitor },
  { id: "carcasa_danada", label: "Carcasa dañada", icon: Smartphone },
  { id: "boton_flojo", label: "Botones flojos", icon: Home },
  { id: "pin_gastado", label: "Pin de carga", icon: Usb },
  { id: "bateria_hinchada", label: "Batería hinchada", icon: Power },
];

const FUNCTION_TESTS = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { id: "camara_frontal", label: "Cámara", icon: Camera },
  { id: "altavoz", label: "Altavoz", icon: Speaker },
  { id: "microfono", label: "Micrófono", icon: Mic },
  { id: "touch", label: "Touch / Face ID", icon: Fingerprint },
];

export default function QuickChecklist({
  deviceType,
  checklistData,
  onChecklistChange,
  compact = false,
}: QuickChecklistProps) {
  const [powerState, setPowerState] = useState<"si" | "no" | "nose" | null>(
    checklistData._power_state ? (checklistData._power_state as "si" | "no" | "nose") : null,
  );
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [testedFunctions, setTestedFunctions] = useState<"si" | "no" | null>(
    checklistData._tested_functions ? (checklistData._tested_functions as "si" | "no") : null,
  );
  const [chipType, setChipType] = useState<"sim" | "esim" | "ambos" | "ninguno" | null>(
    checklistData._chip_type
      ? (checklistData._chip_type as "sim" | "esim" | "ambos" | "ninguno")
      : null,
  );
  const [expandedSection, setExpandedSection] = useState<string | null>("power");

  useEffect(() => {
    if (checklistData._physical_issues) {
      try {
        setSelectedIssues(JSON.parse(checklistData._physical_issues));
      } catch {
        setSelectedIssues([]);
      }
    }
  }, [checklistData._physical_issues]);

  useEffect(() => {
    const newData: Record<string, string> = {};
    if (powerState) {
      newData._power_state = powerState;
      newData._all_physical = powerState === "si" ? "ok" : "no_probado";
      newData._all_functions = powerState === "si" ? "ok" : "no_probado";
    }

    if (selectedIssues.length > 0) {
      newData._physical_issues = JSON.stringify(selectedIssues);
      selectedIssues.forEach((issue) => {
        newData[issue] = "damaged";
      });
    }

    if (testedFunctions) {
      newData._tested_functions = testedFunctions;
      if (testedFunctions === "si") {
        FUNCTION_TESTS.forEach((test) => {
          if (!newData[test.id]) newData[test.id] = "ok";
        });
      }
    }

    if (chipType) newData._chip_type = chipType;

    onChecklistChange({ ...checklistData, ...newData });
  }, [powerState, selectedIssues, testedFunctions, chipType]);

  const statusBadges = useMemo(() => {
    const badges: string[] = [];
    if (powerState === "si") badges.push("Encendido OK");
    if (powerState === "no") badges.push("No enciende");
    if (powerState === "nose") badges.push("Sin validar encendido");
    if (selectedIssues.length) badges.push(`${selectedIssues.length} detalle(s) físico(s)`);
    if (testedFunctions === "si") badges.push("Funciones verificadas");
    if (testedFunctions === "no") badges.push("Funciones no probadas");
    if (chipType) badges.push(`Chip: ${chipType}`);
    return badges;
  }, [powerState, selectedIssues, testedFunctions, chipType]);

  const SectionCard = ({
    id,
    title,
    subtitle,
    children,
  }: {
    id: string;
    title: string;
    subtitle: string;
    children: ReactNode;
  }) => {
    const isExpanded = expandedSection === id;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {isExpanded && <div className="border-t border-slate-100 px-4 py-3">{children}</div>}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${compact ? "p-2" : "p-0"}`}>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-light rounded-xl p-2 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Checklist de Verificación</p>
            <p className="text-xs text-slate-600">
              {deviceType.replace("_", " ")} · verificación rápida sin scroll
            </p>
          </div>
        </div>
      </div>

      <SectionCard id="power" title="Estado global" subtitle="Marca el estado general del equipo.">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPowerState("si")}
            className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
              powerState === "si"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200"
            }`}
          >
            <CheckCircle2 className="mx-auto mb-1 h-4 w-4" /> OK
          </button>
          <button
            type="button"
            onClick={() => setPowerState("no")}
            className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
              powerState === "no" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200"
            }`}
          >
            <XCircle className="mx-auto mb-1 h-4 w-4" /> Con detalles
          </button>
          <button
            type="button"
            onClick={() => setPowerState("nose")}
            className={`rounded-xl border px-2 py-3 text-xs font-semibold ${
              powerState === "nose"
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-slate-200"
            }`}
          >
            <HelpCircle className="mx-auto mb-1 h-4 w-4" /> No probado
          </button>
        </div>
      </SectionCard>

      <SectionCard
        id="issues"
        title="Verificación física"
        subtitle="Selecciona solo los componentes con observaciones."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {PHYSICAL_ISSUES.map((issue) => {
            const Icon = issue.icon;
            const selected = selectedIssues.includes(issue.id);
            return (
              <button
                type="button"
                key={issue.id}
                onClick={() =>
                  setSelectedIssues((prev) =>
                    prev.includes(issue.id)
                      ? prev.filter((id) => id !== issue.id)
                      : [...prev, issue.id],
                  )
                }
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                  selected ? "border-brand-light bg-brand-light/10" : "border-slate-200"
                }`}
              >
                <Icon className="h-4 w-4 text-slate-500" />
                <span>{issue.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        id="functions"
        title="Pruebas funcionales"
        subtitle="Registra si hubo validación funcional en recepción."
      >
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTestedFunctions("si")}
            className={`rounded-xl border px-3 py-2 text-sm ${
              testedFunctions === "si"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200"
            }`}
          >
            Sí, probadas
          </button>
          <button
            type="button"
            onClick={() => setTestedFunctions("no")}
            className={`rounded-xl border px-3 py-2 text-sm ${
              testedFunctions === "no"
                ? "border-slate-300 bg-slate-100 text-slate-700"
                : "border-slate-200"
            }`}
          >
            No probado
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {FUNCTION_TESTS.map((test) => {
            const Icon = test.icon;
            return (
              <div
                key={test.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs text-slate-600"
              >
                <Icon className="h-3.5 w-3.5" />
                {test.label}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        id="chip"
        title="Elementos entregados"
        subtitle="Registro rápido de chip en recepción."
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "sim", label: "SIM" },
            { value: "esim", label: "eSIM" },
            { value: "ambos", label: "Ambos" },
            { value: "ninguno", label: "Ninguno" },
          ].map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setChipType(option.value as "sim" | "esim" | "ambos" | "ninguno")}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold ${
                chipType === option.value
                  ? "border-brand-light bg-brand-light/10 text-brand-dark"
                  : "border-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl bg-slate-900 p-3">
        <p className="text-xs font-semibold text-slate-300">Resumen automático</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {statusBadges.length ? (
            statusBadges.map((status) => (
              <span
                key={status}
                className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white"
              >
                {status}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Todavía sin información en checklist.</span>
          )}
        </div>
      </div>
    </div>
  );
}
