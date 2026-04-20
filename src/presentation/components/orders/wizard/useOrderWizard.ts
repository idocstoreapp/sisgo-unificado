"use client";
import { useState, useRef, useEffect } from "react";
import type { Customer, Service, DeviceType, User } from "@/types";
import type { CatalogSnapshot } from "@/lib/device-catalog";

export interface DeviceItem {
  id: string; // ID único para cada equipo
  deviceType: DeviceType | null;
  deviceModel: string;
  deviceSerial: string;
  unlockType: "code" | "pattern" | "none";
  deviceUnlockCode: string;
  deviceUnlockPattern: number[];
  problemDescription: string;
  checklistData: Record<string, string>;
  selectedServices: Service[];
  replacementCost: number;
  serviceValue: number; // DEPRECADO
  servicePrices: Record<string, number>; // Mapa de precios: serviceId -> price
}

export interface DeviceCatalogCard {
  id: number;
  device_type_id: number;
  brand_id: number;
  product_line_id: number;
  model_id: number;
  variant_id: number | null;
  display_name: string;
  image_url: string | null;
  is_active: boolean;
}

export function useOrderWizardState() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [devices, setDevices] = useState<DeviceItem[]>([
    {
      id: `device-${Date.now()}`,
      deviceType: null,
      deviceModel: "",
      deviceSerial: "",
      unlockType: "none",
      deviceUnlockCode: "",
      deviceUnlockPattern: [],
      problemDescription: "",
      checklistData: {},
      selectedServices: [],
      replacementCost: 0,
      serviceValue: 0,
      servicePrices: {},
    }
  ]);

  const [priority, setPriority] = useState<"baja" | "media" | "urgente">("media");
  const [commitmentDate, setCommitmentDate] = useState("");
  const [warrantyDays, setWarrantyDays] = useState(30);
  const [responsibleUserName, setResponsibleUserName] = useState<string>("");

  return {
    selectedCustomer,
    setSelectedCustomer,
    devices,
    setDevices,
    priority,
    setPriority,
    commitmentDate,
    setCommitmentDate,
    warrantyDays,
    setWarrantyDays,
    responsibleUserName,
    setResponsibleUserName,
  };
}
