"use client";

import { useState } from "react";
import BranchExpensesPage from "../financial/BranchExpensesPage";
import GeneralExpenses from "../financial/GeneralExpenses";
import TechnicianPayments from "../financial/TechnicianPayments";
import SalarySettlementPanel from "../financial/SalarySettlementPanel";

export function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<"branch" | "general" | "technicians" | "salary">("branch");

  const tabs = [
    { id: "branch", label: "Gastos de Sucursal" },
    { id: "general", label: "Gastos Generales (Empresa)" },
    { id: "technicians", label: "Pagos a Técnicos" },
    { id: "salary", label: "Ajustes de Sueldo" }
  ] as const;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Módulo Financiero Central</h2>
          <p className="text-gray-600">Gestión de gastos, sueldos y métricas de pagos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Render */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-6 min-h-[60vh]">
        {activeTab === "branch" && <BranchExpensesPage isAdmin={true} />}
        {activeTab === "general" && <GeneralExpenses />}
        {activeTab === "technicians" && <TechnicianPayments isAdmin={true} />}
        {activeTab === "salary" && <SalarySettlementPanel isAdmin={true} />}
      </div>
    </div>
  );
}
