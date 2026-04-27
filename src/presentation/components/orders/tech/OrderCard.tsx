import type { WorkOrder } from "@/types";
import { Clock, Play, CheckCircle, Smartphone, AlertCircle } from "lucide-react";
import { formatCLP } from "@/lib/currency";

interface OrderCardProps {
  order: WorkOrder;
  onTake: () => void;
  onComplete: () => void;
  isActiveTab: boolean;
}

export default function OrderCard({ order, onTake, onComplete, isActiveTab }: OrderCardProps) {
  const isUrgent = order.priority === "urgente";

  return (
    <div className={`relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${isUrgent ? 'border-red-200' : 'border-slate-200'}`}>
      {/* Indicador de prioridad superior */}
      {isUrgent && (
        <div className="bg-red-500 px-4 py-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white">
          <AlertCircle className="h-3.5 w-3.5" />
          PRIORIDAD URGENTE
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                #{order.order_number}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-1">
              {order.device_model}
            </h3>
            <p className="text-sm text-slate-500">{order.device_type}</p>
          </div>
          
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
            <Smartphone className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 flex-1">
          <p className="font-medium mb-1">Problema reportado:</p>
          <p className="line-clamp-2 text-slate-600">{order.problem_description}</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium text-slate-900 line-clamp-1">{order.customer?.name}</p>
          </div>
          <div>
            <p className="text-slate-500">Presupuesto</p>
            <p className="font-medium text-slate-900">{formatCLP(order.total_repair_cost || 0)}</p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
          {!isActiveTab ? (
            <button
              onClick={onTake}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-100"
            >
              <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
              Tomar Reparación
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-100"
            >
              <CheckCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              Completar Reparación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
