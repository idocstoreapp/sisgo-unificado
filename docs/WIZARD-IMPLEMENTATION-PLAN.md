# 🎨 PLAN DE IMPLEMENTACIÓN DEL WIZARD DE ÓRDENES

## ✅ Lo Que Ya Está HECHO

### 1. Base de Datos Completa
- ✅ **9 scripts SQL** (45 tablas)
- ✅ Script **09-device-catalog-and-checklists.sql** con:
  - `device_types` (6 tipos seed)
  - `brands` (11 marcas seed)
  - `product_lines` (11 líneas seed)
  - `models` (~25 modelos iPhone seed)
  - `variants` (tabla lista)
  - `device_catalog_items` (para UI)
  - `device_checklist_items` (33 items seed)
  - `services` (~16 servicios seed)

### 2. Componentes Creados (Copiados y Adaptados)
- ✅ **DeviceSelector.tsx** - Wizard visual de 5 niveles con imágenes
- ✅ **DeviceChecklist.tsx** - Checklist configurable por tipo de dispositivo  
- ✅ **ServiceSelector.tsx** - Selector de servicios con categorías (copiado de original)
- ✅ **PatternDrawer.tsx** - Dibujo de patrones en canvas (copiado de original)
- ✅ **CustomerSearch.tsx** - Búsqueda de clientes con debounce (copiado de original)
- ✅ **OrderWizard.tsx** - Skeleton del wizard principal

---

## 📋 Lo Que FALTA para Completar

### Problema Actual

Los componentes copiados usan `import { supabase } from "@/lib/supabase"` del sistema original, pero en sisgo-unificado la arquitectura es diferente:
- Usa **hooks** (`useOrders`, `useAuth`, etc.)
- Usa **DI Container** para repositories
- No tiene un cliente de Supabase directo en componentes de cliente

### Solución: Crear API Routes + Hooks

Necesitamos crear un puente entre los componentes React y la base de datos.

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Crear API Routes para Catálogo de Dispositivos

Crear archivo: `src/app/api/device-catalog/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [deviceTypesRes, brandsRes, linesRes, modelsRes, variantsRes] = 
    await Promise.all([
      supabase.from("device_types").select("*").eq("is_active", true).order("name"),
      supabase.from("brands").select("*").eq("is_active", true).order("name"),
      supabase.from("product_lines").select("*").eq("is_active", true).order("name"),
      supabase.from("models").select("*").eq("is_active", true).order("name"),
      supabase.from("variants").select("*").eq("is_active", true).order("name"),
    ]);

  return NextResponse.json({
    success: true,
    deviceTypes: deviceTypesRes.data || [],
    brands: brandsRes.data || [],
    lines: linesRes.data || [],
    models: modelsRes.data || [],
    variants: variantsRes.data || [],
  });
}
```

Crear archivos similares para:
- `src/app/api/device-catalog/brands/route.ts`
- `src/app/api/device-catalog/lines/route.ts`
- `src/app/api/device-catalog/models/route.ts`
- `src/app/api/device-catalog/variants/route.ts`
- `src/app/api/checklist-items/route.ts`
- `src/app/api/services/route.ts`
- `src/app/api/customers/route.ts`

### PASO 2: Actualizar Imports en Componentes Copiados

Los componentes copiados tienen:
```typescript
import { supabase } from "@/lib/supabase";
```

Deben cambiarse a llamadas fetch a las API routes:

**Antes:**
```typescript
const { data } = await supabase.from("device_checklist_items").select("*");
```

**Después:**
```typescript
const response = await fetch("/api/checklist-items");
const data = await response.json();
```

### PASO 3: Crear Hook useDeviceCatalog

Crear archivo: `src/presentation/hooks/useDeviceCatalog.ts`

```typescript
"use client";

import { useState, useEffect } from "react";

interface DeviceCatalog {
  deviceTypes: any[];
  brands: any[];
  productLines: any[];
  models: any[];
  variants: any[];
}

export function useDeviceCatalog() {
  const [catalog, setCatalog] = useState<DeviceCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/device-catalog");
        const data = await response.json();
        if (data.success) {
          setCatalog(data);
        }
      } catch (error) {
        console.error("Error loading catalog:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  return { catalog, loading };
}
```

### PASO 4: Integrar Todo en OrderWizard

Actualizar `OrderWizard.tsx` para usar los componentes reales:

**Reemplazar placeholder de DeviceSelector:**
```typescript
// ANTES (placeholder):
<DeviceSelectorModal ... />

// DESPUÉS (real):
<DeviceSelector
  onSelect={(deviceData) => {
    updateDevice(currentDevice.id, {
      deviceType: deviceData.type,
      deviceBrand: deviceData.brand,
      deviceModel: deviceData.model,
    });
    setShowDeviceSelector(false);
  }}
  onClose={() => setShowDeviceSelector(false)}
/>
```

**Reemplazar placeholder de DeviceChecklist:**
```typescript
// ANTES:
<ChecklistModal ... />

// DESPUÉS:
<DeviceChecklist
  deviceType={currentDevice.deviceType!}
  checklistData={currentDevice.checklistData}
  onChecklistChange={(data) => updateDevice(currentDevice.id, { checklistData: data })}
/>
```

**Reemplazar placeholder de ServiceSelector:**
```typescript
<ServiceSelector
  selectedServices={currentDevice.selectedServices}
  onServicesChange={(services) => updateDevice(currentDevice.id, { selectedServices: services })}
  deviceType={currentDevice.deviceType}
  deviceModel={currentDevice.deviceModel}
/>
```

### PASO 5: Crear Tipos TypeScript

Crear archivo: `src/domain/types/OrderTypes.ts`

```typescript
export type DeviceType = "phone" | "tablet" | "laptop" | "console" | "wearable" | "other";

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
  selectedServices: ServiceItem[];
  replacementCost: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  rut?: string;
  address?: string;
}
```

---

## 📦 ARCHIVOS QUE NECESITAN CREARSE

### API Routes (7 archivos)
1. `src/app/api/device-catalog/route.ts`
2. `src/app/api/device-catalog/brands/route.ts`
3. `src/app/api/device-catalog/lines/route.ts`
4. `src/app/api/device-catalog/models/route.ts`
5. `src/app/api/device-catalog/variants/route.ts`
6. `src/app/api/checklist-items/route.ts`
7. `src/app/api/services/route.ts`
8. `src/app/api/customers/route.ts`

### Hooks (1 archivo)
9. `src/presentation/hooks/useDeviceCatalog.ts`

### Types (1 archivo)
10. `src/domain/types/OrderTypes.ts`

### Componentes (Actualizar imports en 3 archivos)
11. `src/presentation/components/orders/ServiceSelector.tsx` - cambiar imports
12. `src/presentation/components/orders/CustomerSearch.tsx` - cambiar imports
13. `src/presentation/components/orders/PatternDrawer.tsx` - ya debería funcionar

### OrderWizard (1 archivo actualizar)
14. `src/presentation/components/orders/OrderWizard.tsx` - integrar componentes reales

---

## 🎯 RECOMENDACIÓN FINAL

**Para que esto funcione completamente necesitas:**

1. **Ejecutar script SQL 09** en Supabase para tener las tablas de catálogo
2. **Crear las 8 API routes** para que los componentes puedan acceder a datos
3. **Actualizar los imports** en los 3 componentes copiados (ServiceSelector, CustomerSearch, PatternDrawer)
4. **Integrar todo** en OrderWizard.tsx

**¿Quieres que continúe implementando estos pasos uno por uno, o prefieres que te dé el código completo de cada archivo para que lo copies directamente?**

Mi recomendación: **Dame la luz verde y creo todos los archivos restantes de una vez en la próxima respuesta.**
