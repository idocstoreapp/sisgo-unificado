import { useState, useEffect } from "react";
import type { DeviceType } from "@/types";
import { 
  Power, Smartphone, Battery, Monitor, Camera, 
  Wifi, Bluetooth, Fingerprint, Home, Usb, Speaker, Mic, CheckCircle2, XCircle,
  AlertTriangle, HelpCircle, ChevronRight, ChevronDown
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
  { id: "pin_gastado", label: "Pin de carga gastado", icon: Usb },
  { id: "no_carga", label: "No carga", icon: Battery },
  { id: "bateria_hinchada", label: "Batería hinchada", icon: Battery },
];

const FUNCTION_TESTS = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
  { id: "camara_frontal", label: "Cámara frontal", icon: Camera },
  { id: "camara_trasera", label: "Cámara trasera", icon: Camera },
  { id: "altavoz", label: "Altavoz", icon: Speaker },
  { id: "microfono", label: "Micrófono", icon: Mic },
  { id: "touch", label: "Touch/Face ID", icon: Fingerprint },
  { id: "sensores", label: "Sensores", icon: AlertTriangle },
];

export default function QuickChecklist({ 
  deviceType, 
  checklistData, 
  onChecklistChange,
  compact = false 
}: QuickChecklistProps) {
  const [powerState, setPowerState] = useState<"si" | "no" | "nose" | null>(
    checklistData._power_state ? checklistData._power_state as "si" | "no" | "nose" : null
  );
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [testedFunctions, setTestedFunctions] = useState<"si" | "no" | null>(
    checklistData._tested_functions ? checklistData._tested_functions as "si" | "no" : null
  );
  const [chipType, setChipType] = useState<"sim" | "esim" | "ambos" | "ninguno" | null>(
    checklistData._chip_type ? checklistData._chip_type as "sim" | "esim" | "ambos" | "ninguno" : null
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
    
    if (powerState === "si") {
      newData["_power_state"] = "si";
      newData["_all_physical"] = "ok";
      newData["_all_functions"] = "ok";
    } else if (powerState === "no") {
      newData["_power_state"] = "no";
      newData["_all_physical"] = "no_probado";
      newData["_all_functions"] = "no_probado";
    } else if (powerState === "nose") {
      newData["_power_state"] = "nose";
      newData["_all_physical"] = "no_probado";
      newData["_all_functions"] = "no_probado";
    }
    
    if (selectedIssues.length > 0) {
      newData["_physical_issues"] = JSON.stringify(selectedIssues);
      selectedIssues.forEach(issue => {
        newData[issue] = "damaged";
      });
    }
    
    if (testedFunctions === "si") {
      newData["_tested_functions"] = "si";
      FUNCTION_TESTS.forEach(test => {
        if (!newData[test.id]) newData[test.id] = "ok";
      });
    } else if (testedFunctions === "no") {
      newData["_tested_functions"] = "no";
    }
    
    if (chipType) {
      newData["_chip_type"] = chipType;
    }

    onChecklistChange({ ...checklistData, ...newData });
  }, [powerState, selectedIssues, testedFunctions, chipType]);

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const getDeviceName = () => {
    const names: Record<DeviceType, string> = {
      iphone: "iPhone",
      ipad: "iPad",
      macbook: "MacBook",
      apple_watch: "Apple Watch",
    };
    return names[deviceType] || "Dispositivo";
  };

  const SectionCard = ({ 
    id, 
    title, 
    icon: Icon, 
    children,
    color = "blue"
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    color?: "blue" | "emerald" | "amber" | "rose";
  }) => {
    const isExpanded = expandedSection === id;
    const colors = {
      blue: "from-blue-50 to-indigo-100 border-blue-200",
      emerald: "from-emerald-50 to-teal-100 border-emerald-200",
      amber: "from-amber-50 to-orange-100 border-amber-200",
      rose: "from-rose-50 to-pink-100 border-rose-200",
    };
    const iconColors = {
      blue: "bg-blue-500",
      emerald: "bg-emerald-500", 
      amber: "bg-amber-500",
      rose: "bg-rose-500",
    };

    return (
      <div className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${colors[color]} shadow-[0_12px_28px_-24px_rgba(15,23,42,0.7)]`}>
        <button
          type="button"
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="flex w-full items-center gap-3 p-4 text-left transition hover:opacity-90"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColors[color]} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-600">
              {id === "power" && powerState && `${powerState === "si" ? "✓ Enciende" : powerState === "no" ? "✗ No enciende" : "⚠ No sabe"}`}
              {id === "issues" && selectedIssues.length > 0 && `${selectedIssues.length} problema(s) seleccionado(s)`}
              {id === "functions" && testedFunctions && `${testedFunctions === "si" ? "✓ Funciones probadas" : "✗ Sin probar"}`}
              {id === "chip" && chipType && `${chipType === "sim" ? "📱 SIM" : chipType === "esim" ? "📱 eSIM" : chipType === "ambos" ? "📱 Ambos" : "✗ Sin chip"}`}
            </p>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 pt-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${compact ? "p-2" : "p-4"}`}>
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/70 to-violet-100/70 p-4 shadow-[0_20px_35px_-30px_rgba(79,70,229,0.55)]">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Checklist Rápido</h3>
            <p className="text-xs font-medium text-indigo-600">{getDeviceName()}</p>
          </div>
        </div>
        <p className="text-xs text-slate-600">Registra lo mínimo en recepción. Lo no marcado se guarda como "no probado".</p>
      </div>

      {/* Pregunta 1: ¿Enciende? */}
      <SectionCard id="power" title="¿El equipo enciende?" icon={Power} color="emerald">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPowerState("si")}
            className={`p-3 rounded-lg border-2 transition-all ${
              powerState === "si" 
                ? "border-emerald-500 bg-emerald-100 text-emerald-800" 
                : "border-white bg-white hover:border-emerald-300"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Sí</span>
          </button>
          <button
            type="button"
            onClick={() => setPowerState("no")}
            className={`p-3 rounded-lg border-2 transition-all ${
              powerState === "no" 
                ? "border-rose-500 bg-rose-100 text-rose-800" 
                : "border-white bg-white hover:border-rose-300"
            }`}
          >
            <XCircle className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">No</span>
          </button>
          <button
            type="button"
            onClick={() => setPowerState("nose")}
            className={`p-3 rounded-lg border-2 transition-all ${
              powerState === "nose" 
                ? "border-amber-500 bg-amber-100 text-amber-800" 
                : "border-white bg-white hover:border-amber-300"
            }`}
          >
            <HelpCircle className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">No sé</span>
          </button>
        </div>
      </SectionCard>

      {/* Pregunta 2: Problemas físicos */}
      <SectionCard id="issues" title="¿Qué problemas físicos ves?" icon={Smartphone} color="amber">
        <p className="text-xs text-slate-600 mb-3">Selecciona los que apliquen</p>
        <div className="grid grid-cols-2 gap-2">
          {PHYSICAL_ISSUES.map(issue => {
            const Icon = issue.icon;
            const isSelected = selectedIssues.includes(issue.id);
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => toggleIssue(issue.id)}
                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-amber-500 bg-amber-100"
                    : "border-white bg-white hover:border-amber-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${isSelected ? "bg-amber-500" : "bg-slate-200"} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-600"}`} />
                </div>
                <span className={`text-xs font-medium ${isSelected ? "text-amber-800" : "text-slate-700"}`}>
                  {issue.label}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Pregunta 3: Probaste funciones */}
      <SectionCard id="functions" title="¿Probaste las funciones?" icon={Wifi} color="blue">
        <p className="text-xs text-slate-600 mb-3">
          {testedFunctions === "si" && "✓ Todas las funciones marcadas como OK"}
          {testedFunctions === "no" && "✗ Funciones no probadas (quedan como 'no probado')"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTestedFunctions("si")}
            className={`p-3 rounded-lg border-2 transition-all ${
              testedFunctions === "si" 
                ? "border-blue-500 bg-blue-100 text-blue-800" 
                : "border-white bg-white hover:border-blue-300"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Sí, todo funciona</span>
          </button>
          <button
            type="button"
            onClick={() => setTestedFunctions("no")}
            className={`p-3 rounded-lg border-2 transition-all ${
              testedFunctions === "no" 
                ? "border-slate-400 bg-slate-100 text-slate-700" 
                : "border-white bg-white hover:border-slate-300"
            }`}
          >
            <HelpCircle className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">No probé</span>
          </button>
        </div>
      </SectionCard>

      {/* Pregunta 4: Chip */}
      <SectionCard id="chip" title="¿Viene con chip?" icon={Smartphone} color="rose">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setChipType("sim")}
            className={`p-2 rounded-lg border-2 transition-all ${
              chipType === "sim" 
                ? "border-rose-500 bg-rose-100 text-rose-800" 
                : "border-white bg-white hover:border-rose-300"
            }`}
          >
            <span className="text-xl">📱</span>
            <span className="text-xs font-medium block">SIM</span>
          </button>
          <button
            type="button"
            onClick={() => setChipType("esim")}
            className={`p-2 rounded-lg border-2 transition-all ${
              chipType === "esim" 
                ? "border-rose-500 bg-rose-100 text-rose-800" 
                : "border-white bg-white hover:border-rose-300"
            }`}
          >
            <span className="text-xl">📲</span>
            <span className="text-xs font-medium block">eSIM</span>
          </button>
          <button
            type="button"
            onClick={() => setChipType("ambos")}
            className={`p-2 rounded-lg border-2 transition-all ${
              chipType === "ambos" 
                ? "border-rose-500 bg-rose-100 text-rose-800" 
                : "border-white bg-white hover:border-rose-300"
            }`}
          >
            <span className="text-xl">📱📲</span>
            <span className="text-xs font-medium block">Ambos</span>
          </button>
          <button
            type="button"
            onClick={() => setChipType("ninguno")}
            className={`p-2 rounded-lg border-2 transition-all ${
              chipType === "ninguno" 
                ? "border-rose-500 bg-rose-100 text-rose-800" 
                : "border-white bg-white hover:border-rose-300"
            }`}
          >
            <span className="text-xl">✗</span>
            <span className="text-xs font-medium block">Ninguno</span>
          </button>
        </div>
      </SectionCard>

      {/* Resumen visual */}
      <div className="mt-2 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-3 shadow-lg">
        <p className="text-xs text-slate-400 mb-2">Resumen del checklist:</p>
        <div className="flex flex-wrap gap-1">
          {powerState && (
            <span className={`text-xs px-2 py-1 rounded ${powerState === "si" ? "bg-emerald-500" : powerState === "no" ? "bg-rose-500" : "bg-amber-500"} text-white`}>
              {powerState === "si" ? "✓ Enciende" : powerState === "no" ? "✗ No enciende" : "⚠ Sin saber"}
            </span>
          )}
          {selectedIssues.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500 text-white">
              {selectedIssues.length} problema(s)
            </span>
          )}
          {testedFunctions && (
            <span className={`text-xs px-2 py-1 rounded ${testedFunctions === "si" ? "bg-blue-500" : "bg-slate-500"} text-white`}>
              {testedFunctions === "si" ? "✓ Funciones OK" : "✗ Sin probar"}
            </span>
          )}
          {chipType && (
            <span className="text-xs px-2 py-1 rounded bg-rose-500 text-white">
              {chipType === "sim" ? "📱 SIM" : chipType === "esim" ? "📲 eSIM" : chipType === "ambos" ? "📱📲 Ambos" : "✗ Sin chip"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
