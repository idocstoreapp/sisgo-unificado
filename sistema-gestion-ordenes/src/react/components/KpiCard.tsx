import { DollarSign, Wrench, Package, ShieldCheck, TrendingUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: "dollar" | "wrench" | "package" | "shield" | "trending";
  color?: "blue" | "emerald" | "amber" | "rose" | "violet";
}

const colorMap = {
  blue: "from-blue-600 via-blue-700 to-blue-800",
  emerald: "from-emerald-600 via-emerald-700 to-emerald-800",
  amber: "from-amber-600 via-amber-700 to-amber-800",
  rose: "from-rose-600 via-rose-700 to-rose-800",
  violet: "from-violet-600 via-violet-700 to-violet-800",
};

const iconMap = {
  dollar: DollarSign,
  wrench: Wrench,
  package: Package,
  shield: ShieldCheck,
  trending: TrendingUp,
};

export default function KpiCard({ title, value, icon, color = "blue" }: KpiCardProps) {
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${colorMap[color]} shadow-lg border border-white/10 overflow-hidden`}>
   
  <div className="flex items-center justify-between gap-3">
     
    <div className="min-w-0 flex-1">
      <p className="text-xs sm:text-sm font-medium text-white/80 mb-1 truncate">
        {title}
      </p>

      <p className="
  font-semibold text-white leading-tight
  text-[clamp(14px,2.5vw,24px)]
  break-words
">
        {value}
      </p>
    </div>

    {IconComponent && (
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <IconComponent className="w-5 h-5 text-white" />
      </div>
    )}
  </div>
</div>
  );
}



