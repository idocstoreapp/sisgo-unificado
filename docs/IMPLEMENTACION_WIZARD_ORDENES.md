# 🎨 IMPLEMENTACIÓN DEL WIZARD DE ÓRDENES - GUÍA COMPLETA

## 📋 Resumen del Problema

El wizard actual de `sisgo-unificado` NO replica la experiencia del sistema original `sistema-gestion-ordenes`. Las diferencias principales son:

### Sistema Original (sistema-gestion-ordenes)
- ✅ Wizard visual con imágenes para selección de dispositivos
- ✅ Jerarquía de 5 niveles: Tipo → Marca → Línea → Modelo → Variante
- ✅ Cada dispositivo tiene su propio wizard de 6 pasos
- ✅ Checklist configurable por tipo de dispositivo
- ✅ Selector de servicios con categorías y recomendaciones
- ✅ Dibujo de patrones de desbloqueo en canvas
- ✅ Soporte para múltiples dispositivos por orden
- ✅ UI profesional y amigable

### Sistema Unificado (sisgo-unificado) - ACTUAL
- ❌ Formulario plano sin imágenes
- ❌ Sin jerarquía de dispositivos
- ❌ Checklist básico sin configuración
- ❌ Sin selector visual de servicios
- ❌ Sin dibujo de patrones

---

## 🏗️ Arquitectura del Sistema Original

### 1. OrderForm.tsx (2,529 líneas)
**Ubicación:** `sistema-gestion-ordenes/src/react/components/OrderForm.tsx`

**Flujo Completo:**
```
1. Selección de Cliente
   └─ Buscar cliente existente
   └─ Crear nuevo cliente inline

2. Configuración de Dispositivos (múltiples)
   └─ Wizard de 6 pasos POR dispositivo:
      ├─ Paso 1: Tipo de Dispositivo (imágenes)
      ├─ Paso 2: Marca (logos)
      ├─ Paso 3: Línea de Producto (imágenes)
      ├─ Paso 4: Modelo (imágenes)
      ├─ Paso 5: Variante (opcional)
      └─ Paso 6: Confirmación

   └─ Sub-flujo de 3 pasos post-selección:
      ├─ Flow 1: Checklist del dispositivo
      ├─ Flow 2: Descripción del problema
      └─ Flow 3: Selección de servicios

   └─ Datos adicionales:
      ├─ Número de serie
      └─ Código/Patrón de desbloqueo

3. Configuración de Orden
   └─ Prioridad (baja/media/urgente)
   └─ Fecha de compromiso
   └─ Días de garantía
   └─ Responsable (sucursales)

4. Creación y PDF
```

### 2. Device Catalog System
**Tablas Normalizadas:**
```sql
device_types (6 tipos: phone, tablet, laptop, console, wearable, other)
brands (Apple, Samsung, Xiaomi, etc.)
product_lines (iPhone, Galaxy S, Galaxy A, etc.)
models (iPhone 11, iPhone 12, etc.)
variants (Pro Max, Plus, Ultra, etc.)
device_catalog_items (materialized view con display_name + image_url)
```

**Imágenes:**
- Cada nivel puede tener `image_url` o `logo_url`
- Fallback en cascada: variante → modelo → línea → marca → tipo
- URLs de Unsplash para imágenes genéricas
- SimpleIcons CDN para logos de marcas

### 3. Checklist System
**Tabla:** `device_checklist_items`
```
- device_type: string (phone, tablet, etc.)
- item_name: string (Pantalla, Batería, etc.)
- item_order: integer
- status_options: JSONB array (configurable)
```

**Checklists Predefinidos:**
- iPhone: 10 items (Pantalla, Botón Home, Cámaras, WiFi, Bluetooth, etc.)
- iPad: 8 items
- Apple Watch: 7 items
- MacBook: 8 items

### 4. Service Selector
**Tabla:** `services`
```
- name: string
- category: string (Pantalla, Batería, Cámara, etc.)
- default_price: numeric
- is_active: boolean
```

**Recomendaciones Inteligentes:**
- Basadas en tipo de dispositivo
- Palabras clave en modelo (ej: "iPhone" + "pantalla")
- Servicios más frecuentes por dispositivo

### 5. Pattern Drawer
**Componente:** `PatternDrawer.tsx`
- Canvas de 3x3 puntos
- Dibujo con click/drag
- Patrón guardado como array: [1,2,5,8,9]
- Mínimo 4 puntos

---

## 📦 Componentes Necesarios para SISGO Unificado

### 1. OrderWizard.tsx (Componente Principal)
**Tamaño estimado:** ~2,500 líneas
**Funcionalidad:**
- Wizard de 3 pasos principales (Cliente → Dispositivos → Configuración)
- Soporte para múltiples dispositivos
- Estado completo de la orden
- Validaciones antes de submit
- Integración con useOrders hook

### 2. DeviceSelector.tsx
**Tamaño estimado:** ~800 líneas
**Funcionalidad:**
- Wizard visual de 5 niveles con imágenes
- Jerarquía: Tipo → Marca → Línea → Modelo → Variante
- Fallback a entrada manual
- Búsqueda de dispositivos recientes
- Integración con catálogo de Supabase

### 3. DeviceChecklist.tsx
**Tamaño estimado:** ~400 líneas
**Funcionalidad:**
- Cargar items desde `device_checklist_items` por tipo de dispositivo
- Botones de estado configurables
- Modal para items completados
- Agregar items personalizados
- "Marcar todo como no probado"

### 4. ServiceSelector.tsx
**Tamaño estimado:** ~500 líneas
**Funcionalidad:**
- Barra de búsqueda de servicios
- Navegación por categorías
- Recomendaciones inteligentes
- Crear nuevos servicios inline
- Precios individuales por servicio

### 5. PatternDrawer.tsx
**Tamaño estimado:** ~200 líneas
**Funcionalidad:**
- Canvas 3x3 para dibujo de patrones
- Click y drag entre puntos
- Visualización de patrón guardado
- Validación de mínimo 4 puntos

### 6. CustomerSearch.tsx
**Tamaño estimado:** ~300 líneas
**Funcionalidad:**
- Búsqueda debounce (300ms)
- Búsqueda por nombre, email, teléfono
- Crear nuevo cliente inline
- Selector de país para teléfono

---

## 🗄️ Cambios en Base de Datos

### Tablas Adicionales Necesarias

```sql
-- Catálogo de Dispositivos (5 niveles)
CREATE TABLE device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(company_id, code)
);

CREATE TABLE device_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE device_product_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES device_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE device_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id UUID REFERENCES device_product_lines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  has_variants BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE device_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES device_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  suffix TEXT, -- "Pro Max", "Plus", "Ultra"
  is_active BOOLEAN DEFAULT true
);

-- Vista materializada para UI
CREATE MATERIALIZED VIEW device_catalog_items AS
SELECT 
  dt.id as type_id,
  dt.code as type_code,
  dt.name as type_name,
  dt.image_url as type_image,
  db.id as brand_id,
  db.name as brand_name,
  db.logo_url as brand_image,
  dpl.id as line_id,
  dpl.name as line_name,
  dpl.image_url as line_image,
  dm.id as model_id,
  dm.name as model_name,
  dv.id as variant_id,
  dv.name as variant_name,
  -- Build display name
  dm.name || COALESCE(' ' || dv.name, '') as display_name,
  -- Resolve image (priority: variant > model > line > brand > type)
  COALESCE(dv.image_url, dm.image_url, dpl.image_url, db.logo_url, dt.image_url) as image_url
FROM device_types dt
LEFT JOIN device_brands db ON db.device_type_id = dt.id
LEFT JOIN device_product_lines dpl ON dpl.brand_id = db.id
LEFT JOIN device_models dm ON dm.product_line_id = dpl.id
LEFT JOIN device_variants dv ON dv.model_id = dm.id
WHERE dt.is_active = true;

-- Checklists por tipo de dispositivo
CREATE TABLE device_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  device_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_order INTEGER DEFAULT 0,
  status_options JSONB DEFAULT '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb,
  UNIQUE(company_id, device_type, item_name)
);

-- Servicios con categorías
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  default_price NUMERIC(15,0) DEFAULT 0,
  estimated_hours NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false
);
```

---

## 🚀 Plan de Implementación

### Paso 1: Actualizar Base de Datos
- [ ] Crear script SQL `09-device-catalog-and-checklists.sql`
- [ ] Ejecutar en Supabase
- [ ] Verificar tablas creadas

### Paso 2: Crear Componentes Base
- [ ] DeviceSelector.tsx (con imágenes y jerarquía)
- [ ] DeviceChecklist.tsx (configurable)
- [ ] ServiceSelector.tsx (con categorías)
- [ ] PatternDrawer.tsx (canvas)
- [ ] CustomerSearch.tsx (búsqueda)

### Paso 3: Actualizar OrderWizard.tsx
- [ ] Integrar DeviceSelector
- [ ] Integrar DeviceChecklist
- [ ] Integrar ServiceSelector
- [ ] Integrar PatternDrawer
- [ ] Integrar CustomerSearch
- [ ] Agregar multi-device support completo

### Paso 4: Actualizar Hooks y Types
- [ ] Actualizar `useOrders.ts` para soportar metadata de dispositivos
- [ ] Actualizar tipos TypeScript
- [ ] Agregar funciones de catálogo

### Paso 5: Testing
- [ ] Probar flujo completo de creación de orden
- [ ] Verificar checklists por tipo de dispositivo
- [ ] Verificar selección de servicios
- [ ] Verificar patrones de desbloqueo

---

## 💡 Recomendación

Dado que esto es una implementación grande (~4,700+ líneas de componentes React), **recomiendo**:

### Opción A: Implementación Gradual (Recomendada)
1. **Primero:** Crear DeviceSelector.tsx con imágenes
2. **Segundo:** Crear DeviceChecklist.tsx
3. **Tercero:** Crear ServiceSelector.tsx
4. **Cuarto:** Crear PatternDrawer.tsx
5. **Quinto:** Integrar todo en OrderWizard.tsx

### Opción B: Copiar del Sistema Original
1. Copiar componentes directamente de `sistema-gestion-ordenes`
2. Adaptar imports y tipos a la arquitectura de sisgo-unificado
3. Actualizar para usar los hooks de sisgo-unificado

### Opción C: Migración Completa
1. Usar `sistema-gestion-ordenes` como base para el módulo de órdenes
2. Mantener la arquitectura de sisgo-unificado solo para integración
3. Esto preserva la UX probada del sistema original

---

## 📊 Comparación de UX

### Sistema Original (Bueno)
```
✅ Visual: Tarjetas con imágenes
✅ Intuitivo: Secuencia guiada paso a paso
✅ Rápido: Click en imágenes vs escribir
✅ Flexible: Múltiples dispositivos
✅ Completo: Checklist, servicios, patrones
```

### Sistema Unificado Actual (Necesita Mejoras)
```
❌ Plano: Formulario tradicional
❌ Manual: Escribir todo
❌ Básico: Sin guías visuales
❌ Limitado: Sin multi-dispositivo
❌ Incompleto: Faltan componentes clave
```

---

## 🎯 Próximos Pasos

**¿Qué prefieres hacer?**

1. **Implementar gradualmente** cada componente aquí (te llevo paso a paso)
2. **Crear un plan detallado** para que lo implementes tú
3. **Copiar y adaptar** del sistema original (más rápido)
4. **Otra opción** que prefieras

**Mi recomendación:** Opción 3 (copiar y adaptar) es la más rápida y preserva la UX que ya funciona bien.

**¿Cómo quieres proceder?**
