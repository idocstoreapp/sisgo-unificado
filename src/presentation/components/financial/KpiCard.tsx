"use client";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  className?: string;
}

export default function KpiCard({ title, value, className = "" }: KpiCardProps) {
  return (
    <div className={`bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-blue-100 mb-1">{title}</div>
          <div className="text-2xl font-semibold text-white">{value}</div>
        </div>
        { <div className="text-3xl opacity-60"></div>}
      </div>
    </div>
  );
}

