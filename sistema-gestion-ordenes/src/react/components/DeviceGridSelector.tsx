import { useState } from "react";
import type { DeviceType } from "@/types";
import { 
  Smartphone, Tablet, Laptop, Watch, ChevronRight
} from "lucide-react";

interface DeviceSelectorProps {
  onSelect: (deviceType: DeviceType) => void;
  selected?: DeviceType | null;
}

interface DeviceOption {
  id: DeviceType;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
}

const DEVICE_OPTIONS: DeviceOption[] = [
  {
    id: "iphone",
    name: "iPhone",
    icon: <Smartphone className="w-12 h-12" />,
    color: "from-indigo-600 to-blue-600",
    gradient: "bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500",
    description: "Smartphones Apple",
  },
  {
    id: "ipad",
    name: "iPad",
    icon: <Tablet className="w-12 h-12" />,
    color: "from-violet-600 to-fuchsia-600",
    gradient: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500",
    description: "Tablets Apple",
  },
  {
    id: "macbook",
    name: "MacBook",
    icon: <Laptop className="w-12 h-12" />,
    color: "from-emerald-600 to-teal-600",
    gradient: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500",
    description: "Notebooks Apple",
  },
  {
    id: "apple_watch",
    name: "Apple Watch",
    icon: <Watch className="w-12 h-12" />,
    color: "from-orange-500 to-rose-500",
    gradient: "bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500",
    description: "Relojes Apple",
  },
];

export default function DeviceGridSelector({ onSelect, selected }: DeviceSelectorProps) {
  const [hoveredId, setHoveredId] = useState<DeviceType | null>(null);

  return (
<<<<<<< codex/improve-design-of-service-module-572yzr
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/40 p-4 shadow-[0_24px_50px_-30px_rgba(67,56,202,0.45)]">
=======
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.7)] backdrop-blur">
>>>>>>> main
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold tracking-tight text-slate-900">¿Qué dispositivo recibes?</h3>
          <p className="text-xs text-slate-500">Selecciona la familia del equipo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEVICE_OPTIONS.map((device) => {
          const isSelected = selected === device.id;
          const isHovered = hoveredId === device.id;
          
          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelect(device.id)}
              onMouseEnter={() => setHoveredId(device.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative overflow-hidden rounded-2xl border border-white/30 p-4 text-left transition-all duration-300
                ${device.gradient}
                ${isSelected ? "scale-[1.02] ring-4 ring-emerald-400 ring-offset-2 shadow-2xl" : "hover:scale-[1.02] hover:shadow-xl"}
                ${isHovered && !isSelected ? "ring-2 ring-white/50" : ""}
              `}
            >
              {/* Brillo efecto */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity" />
              
              {/* Checkmark si seleccionado */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {/* Icono del dispositivo */}
              <div className="text-white mb-2 drop-shadow-lg">
                {device.icon}
              </div>
              
              {/* Nombre */}
              <h4 className="text-lg font-bold text-white">{device.name}</h4>
              <p className="text-white/70 text-xs">{device.description}</p>
              
              {/* Flecha指示 */}
              <div className={`
                absolute bottom-4 right-3 text-white/70 transition-all
                ${isHovered || isSelected ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"}
              `}>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
