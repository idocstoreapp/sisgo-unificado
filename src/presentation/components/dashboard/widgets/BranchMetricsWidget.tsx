"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCLP } from "@/lib/currency";
import { currentMonthRange } from "@/lib/date";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Building2 } from "lucide-react";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

interface BranchData {
  name: string;
  value: number; // Total income
  ordersCount: number;
}

export default function BranchMetricsWidget() {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { start, end } = currentMonthRange();

        // 1. Fetch branches
        const { data: branches, error: branchError } = await supabase
          .from("branches")
          .select("id, name");
        if (branchError) throw branchError;

        // 2. Fetch paid orders this month
        const { data: orders, error: ordersError } = await supabase
          .from("work_orders")
          .select("branch_id, total_cost")
          .in("status", ["por_entregar", "entregada"])
          .gte("updated_at", start.toISOString())
          .lte("updated_at", end.toISOString());
        
        if (ordersError) {
          console.error("[BranchMetricsWidget] Error:", ordersError);
          throw ordersError;
        }

        // 3. Aggregate
        const branchTotals: Record<string, { sum: number; count: number }> = {};
        
        branches?.forEach(b => {
          branchTotals[b.id] = { sum: 0, count: 0 };
        });

        orders?.forEach(o => {
          if (o.branch_id && branchTotals[o.branch_id]) {
            branchTotals[o.branch_id].sum += (o.total_cost || 0);
            branchTotals[o.branch_id].count += 1;
          }
        });

        const chartData = (branches || [])
          .map(b => ({
            name: b.name,
            value: branchTotals[b.id]?.sum || 0,
            ordersCount: branchTotals[b.id]?.count || 0
          }))
          .filter(d => d.ordersCount > 0) // Only show branches with activity
          .sort((a, b) => b.value - a.value);

        setData(chartData);
      } catch (err) {
        console.error("Error loading branch metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-semibold text-slate-800 mb-1">{data.name}</p>
          <p className="text-indigo-600 font-medium">Ingresos: {formatCLP(data.value)}</p>
          <p className="text-slate-500 text-xs mt-1">{data.ordersCount} órdenes completadas</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Rendimiento por Sucursal
        </h3>
        <p className="text-sm text-slate-500">Ingresos del mes en curso</p>
      </div>
      
      <div className="flex-1 p-5 min-h-[300px] flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-full flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-400">
            <p>No hay datos suficientes este mes</p>
          </div>
        ) : (
          <>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  />
                  <div className="truncate text-slate-600 flex-1">{entry.name}</div>
                  <div className="font-semibold text-slate-800">{formatCLP(entry.value)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
