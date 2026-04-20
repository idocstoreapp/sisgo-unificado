export type DeviceType = "phone" | "tablet" | "laptop" | "console" | "wearable" | "other" | string;

export interface DeviceItem {
  id: string;
  deviceType: DeviceType | null;
  deviceBrand: string;
  deviceModel: string;
  deviceSerial: string;
  unlockType: "code" | "pattern" | "none";
  deviceUnlockCode: string;
  deviceUnlockPattern: number[];
  problemDescription: string;
  checklistData: Record<string, string>;
  selectedServices: Service[];
  replacementCost: number;
}

export interface Service {
  id: string;
  name: string;
  category?: string;
  price?: number;
  description?: string;
  category_image_url?: string;
  image_url?: string;
  default_price?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phone_country_code?: string;
  phoneCountryCode?: string;
  rut_document?: string;
  rut?: string;
  address?: string;
}
