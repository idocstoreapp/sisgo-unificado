"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { currentWeekRange } from "@/lib/date";

export default function TopTechniciansWidget() {
  const router = useRouter();
  const [topTechs, setTopTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTopTechnicians() {
      setLoading(true);
      try {
        const { start, end } = currentWeekRange();
        
        // Obtenemos los técnicos primero
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, name, branch_id, branches:branch_id(name)")
          .eq("role", "technician");
          
        if (usersError) throw usersError;
        if (!users || users.length === 0) return;

        // Obtenemos órdenes completadas esta semana
        const { data: orders, error: ordersError } = await supabase
          .from("work_orders")
          .select("assigned_to, status, id")
          .in("status", ["por_entregar", "entregada"])
          .gte("updated_at", start.toISOString())
          .lte("updated_at", end.toISOString())
          .not("assigned_to", "is", null);

        if (ordersError) throw ordersError;

        // Agrupamos y contamos
        const counts: Record<string, number> = {};
        orders?.forEach(order => {
          if (order.assigned_to) {
            counts[order.assigned_to] = (counts[order.assigned_to] || 0) + 1;
          }
        });

        // Combinamos con info de usuario y ordenamos
        const ranked = users
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            branchName: (user.branches as any)?.name || "Sin Sucursal",
            count: counts[user.id] || 0
          }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5); // Top 5

        setTopTechs(ranked);
      } catch (err) {
        console.error("Error loading top technicians:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTopTechnicians();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-amber-400" />;
      case 1: return <Medal className="w-5 h-5 text-slate-300" />;
      case 2: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <Award className="w-5 h-5 text-indigo-300" />;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "bg-amber-50 border-amber-200 text-amber-800";
      case 1: return "bg-slate-50 border-slate-200 text-slate-800";
      case 2: return "bg-orange-50 border-orange-200 text-orange-800";
      default: return "bg-indigo-50 border-indigo-100 text-indigo-700";
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-sm overflow-hidden flex flex-col h-full text-white">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Top Técnicos
          </h3>
          <p className="text-sm text-indigo-200/70 mt-1">Más reparaciones esta semana</p>
        </div>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
          </div>
        ) : topTechs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-indigo-200/50">
            <Award className="w-10 h-10 mb-2 opacity-50" />
            <p>Aún no hay reparaciones esta semana</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topTechs.map((tech, index) => (
              <button
                type="button"
                key={tech.id} 
                onClick={() => router.push(`/finance/payments?tech=${tech.id}`)}
                className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${getRankColor(index)}`}>
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{tech.name}</h4>
                  <p className="text-xs text-indigo-200 truncate">{tech.branchName}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white leading-none">{tech.count}</div>
                  <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold mt-1">Órdenes</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
