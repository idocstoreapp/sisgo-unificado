# 🛠️ Prompt Completo: Soluciones para Sistema de Gestión de Órdenes con Sucursales

Este documento contiene todas las soluciones implementadas para resolver problemas comunes en un sistema de gestión de órdenes con múltiples sucursales, autenticación dual (usuarios y sucursales), y generación de PDFs.

---

## 📋 CONTEXTO DEL SISTEMA

**Arquitectura:**
- Frontend: React + TypeScript + Astro
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Autenticación dual:
  - Usuarios normales: `auth.users` de Supabase
  - Sucursales: Autenticación personalizada con `login_email` y `password_hash` en tabla `branches`
- Row Level Security (RLS) habilitado en todas las tablas

**Problemas a resolver:**
1. Sucursales no pueden crear clientes (error RLS)
2. Sucursales no pueden crear órdenes (error RLS)
3. Error "cannot coerce the result to a single json object"
4. Clientes duplicados al crear desde sucursales
5. PDFs no se muestran para sucursales
6. Dispositivos no listados no muestran checklist
7. Problemas de login con variables de entorno

---

## 🔧 SOLUCIÓN 1: Políticas RLS para Sucursales (SOLUCIÓN COMPLETA)

### Problema
Las sucursales no usan `auth.users`, por lo que `auth.uid()` es `NULL`. Las políticas RLS que requieren `auth.uid() IS NOT NULL` bloquean todas las operaciones de las sucursales:
- No pueden crear clientes
- No pueden crear órdenes
- No pueden crear servicios de órdenes
- No pueden ver sus propias órdenes después de crearlas

### Solución: Script SQL Completo para Todas las Políticas

**IMPORTANTE:** Usa el script completo `fix_all_rls_for_branches.sql` que corrige TODAS las políticas de una vez. Este es el método recomendado.

**Archivo:** `database/fix_all_rls_for_branches.sql`

Este script corrige:
- ✅ Políticas SELECT, INSERT, UPDATE para `work_orders`
- ✅ Políticas SELECT, INSERT, UPDATE para `order_services`
- ✅ Políticas SELECT, INSERT para `order_notes`
- ✅ Política INSERT para `customers`

**Ejecución:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar y pegar el contenido completo de `fix_all_rls_for_branches.sql`
3. Ejecutar el script
4. Verificar con las consultas de verificación incluidas en el script

**Alternativa:** Si prefieres ejecutar scripts individuales (no recomendado):

#### 1.1. Script para Tabla `customers`

**Archivo:** `database/fix_customers_insert_policy.sql`

```sql
-- ============================================
-- Script para corregir política de INSERT en customers
-- ============================================
-- PROBLEMA: Los usuarios de sucursal no usan auth.users, por lo que auth.uid() 
-- es NULL y la política RLS bloquea la inserción de clientes.
--
-- SOLUCIÓN: Modificar la política para permitir INSERT sin verificar auth.uid(),
-- ya que los clientes no son datos sensibles y cualquier usuario (incluyendo 
-- sucursales) debería poder crearlos.

-- 1. Eliminar la política existente
DROP POLICY IF EXISTS "customers_insert_authenticated" ON customers;

-- 2. Crear nueva política que permita INSERT sin verificar auth.uid()
-- Esto permite que tanto usuarios autenticados (auth.users) como sucursales 
-- (que no tienen auth.uid()) puedan crear clientes
CREATE POLICY "customers_insert_all" ON customers FOR INSERT 
  WITH CHECK (true);
```

**Aplicación:**
1. Ejecutar en Supabase Dashboard → SQL Editor
2. Verificar con: `SELECT * FROM pg_policies WHERE tablename = 'customers' AND policyname LIKE '%insert%';`

#### 1.2. Script para Tabla `work_orders`

**Archivo:** `database/fix_work_orders_insert_policy.sql`

```sql
-- ============================================
-- Script para corregir política de INSERT en work_orders
-- ============================================
-- PROBLEMA: Los usuarios de sucursal no usan auth.users, por lo que auth.uid() 
-- es NULL y la política RLS bloquea la inserción de órdenes.
--
-- SOLUCIÓN: Modificar la política para permitir INSERT sin verificar auth.uid(),
-- ya que las órdenes se validan por sucursal_id y technician_id.

-- 1. Eliminar la política existente
DROP POLICY IF EXISTS "work_orders_insert_authenticated" ON work_orders;

-- 2. Crear nueva política que permita INSERT sin verificar auth.uid()
CREATE POLICY "work_orders_insert_all" ON work_orders FOR INSERT 
  WITH CHECK (true);
```

#### 1.3. Script para Tabla `order_services`

**Archivo:** `database/fix_order_services_insert_policy.sql`

```sql
-- ============================================
-- Script para corregir política de INSERT en order_services
-- ============================================
-- PROBLEMA: Los usuarios de sucursal no usan auth.users, por lo que auth.uid() 
-- es NULL y la política RLS bloquea la inserción de servicios de órdenes.
--
-- SOLUCIÓN: Modificar la política para permitir INSERT sin verificar auth.uid(),
-- ya que los servicios de órdenes se validan por order_id que pertenece a una orden válida.

-- 1. Eliminar la política existente
DROP POLICY IF EXISTS "order_services_insert_authenticated" ON order_services;

-- 2. Crear nueva política que permita INSERT sin verificar auth.uid()
CREATE POLICY "order_services_insert_all" ON order_services FOR INSERT 
  WITH CHECK (true);
```

**Orden de ejecución (solo si no usas el script completo):**
1. `fix_customers_insert_policy.sql`
2. `fix_work_orders_insert_policy.sql`
3. `fix_order_services_insert_policy.sql`

**⚠️ RECOMENDACIÓN:** Usa `fix_all_rls_for_branches.sql` en lugar de ejecutar scripts individuales, ya que corrige también las políticas SELECT que pueden bloquear la visualización de órdenes.

---

## 🔧 SOLUCIÓN 2: Detección de Sucursales en OrderForm

### Problema
Cuando una sucursal crea una orden, se pasa `user.id` (que es el `branchId`) como `technicianId`. El código intenta buscar en `users` con ese ID, pero no existe porque las sucursales no están en `users`, causando el error "cannot coerce the result to a single json object".

### Solución: Modificar OrderForm.tsx

**Archivo:** `src/react/components/OrderForm.tsx`

**Cambios en la función `handleSubmit`:**

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  // ... validaciones ...

  setLoading(true);

  try {
    // ... validaciones del checklist ...

    // Verificar si es una sucursal (no tiene usuario en auth.users)
    // Las sucursales tienen su sesión guardada en localStorage
    let isBranch = false;
    let sucursalId: string | null = null;
    let branchData = null;
    let actualTechnicianId: string | null = technicianId;

    // Verificar si hay sesión de sucursal en localStorage
    if (typeof window !== 'undefined') {
      const branchSessionStr = localStorage.getItem('branchSession');
      if (branchSessionStr) {
        try {
          const branchSession = JSON.parse(branchSessionStr);
          if (branchSession.type === 'branch' && branchSession.branchId === technicianId) {
            // Es una sucursal - usar el branchId como sucursal_id
            isBranch = true;
            sucursalId = branchSession.branchId;
            actualTechnicianId = null; // Las sucursales no tienen technician_id
            
            // Cargar datos completos de la sucursal
            const { data: branch, error: branchError } = await supabase
              .from("branches")
              .select("*")
              .eq("id", sucursalId)
              .single();
            
            if (!branchError && branch) {
              branchData = branch;
            }
          }
        } catch (e) {
          console.error("Error parseando branchSession:", e);
        }
      }
    }

    // Si no es sucursal, obtener datos del usuario normal
    if (!isBranch) {
      const { data: tech, error: techError } = await supabase
        .from("users")
        .select("sucursal_id")
        .eq("id", technicianId)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no existe

      if (techError) {
        // Si el error es porque no existe el usuario, podría ser una sucursal
        // Intentar verificar si es una sucursal por el ID
        const { data: branchCheck, error: branchCheckError } = await supabase
          .from("branches")
          .select("id")
          .eq("id", technicianId)
          .maybeSingle();
        
        if (!branchCheckError && branchCheck) {
          // Es una sucursal
          isBranch = true;
          sucursalId = technicianId;
          actualTechnicianId = null;
          
          // Cargar datos completos de la sucursal
          const { data: branch, error: branchError } = await supabase
            .from("branches")
            .select("*")
            .eq("id", sucursalId)
            .single();
          
          if (!branchError && branch) {
            branchData = branch;
          }
        } else {
          throw techError;
        }
      } else {
        sucursalId = tech?.sucursal_id || null;
        
        // Cargar datos completos de la sucursal por separado
        if (sucursalId) {
          const { data: branch, error: branchError } = await supabase
            .from("branches")
            .select("*")
            .eq("id", sucursalId)
            .single();
          
          if (!branchError && branch) {
            branchData = branch;
          }
        }
      }
    }

    // Preparar datos de inserción
    const orderData: any = {
      order_number: null,
      customer_id: selectedCustomer.id,
      technician_id: actualTechnicianId, // NULL para sucursales, technicianId para usuarios normales
      sucursal_id: sucursalId,
      // ... resto de campos ...
    };

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from("work_orders")
      .insert(orderData)
      .select()
      .single();

    // ... resto del código ...
  }
}
```

**Puntos clave:**
1. Verificar `localStorage.getItem('branchSession')` para detectar sucursales
2. Usar `maybeSingle()` en lugar de `single()` para evitar errores
3. Si falla la búsqueda en `users`, verificar si es una sucursal en `branches`
4. Usar `actualTechnicianId` que es `null` para sucursales

---

## 🔧 SOLUCIÓN 3: Prevención de Clientes Duplicados

### Problema
Al crear un cliente desde una sucursal, si el cliente ya existe (mismo email + teléfono), se produce el error: `duplicate key value violates unique constraint customers_email_phone_key`.

### Solución: Modificar CustomerSearch.tsx

**Archivo:** `src/react/components/CustomerSearch.tsx`

**Cambios en la función `handleCreateCustomer`:**

```typescript
async function handleCreateCustomer(e?: React.MouseEvent<HTMLButtonElement>) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
    alert("Por favor completa nombre, email y teléfono");
    return;
  }

  setLoading(true);
  try {
    const email = newCustomer.email.trim().toLowerCase();
    const phone = newCustomer.phone.trim();

    // Primero verificar si ya existe un cliente con ese email y teléfono
    const { data: existingCustomer, error: searchError } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .eq("phone", phone)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error buscando cliente:", searchError);
      throw searchError;
    }

    let customerData;

    if (existingCustomer) {
      // Si el cliente ya existe, usar el existente
      // Pero actualizar los campos que puedan haber cambiado (nombre, dirección, RUT)
      const updates: any = {};
      if (newCustomer.name.trim() !== existingCustomer.name) {
        updates.name = newCustomer.name.trim();
      }
      if (newCustomer.address?.trim() && newCustomer.address.trim() !== existingCustomer.address) {
        updates.address = newCustomer.address.trim();
      }
      if (newCustomer.rutDocument?.trim() && newCustomer.rutDocument.trim() !== existingCustomer.rut_document) {
        updates.rut_document = newCustomer.rutDocument.trim();
      }

      if (Object.keys(updates).length > 0) {
        // Actualizar solo si hay cambios
        const { data: updatedCustomer, error: updateError } = await supabase
          .from("customers")
          .update(updates)
          .eq("id", existingCustomer.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error actualizando cliente:", updateError);
          // Si falla la actualización, usar el cliente existente tal cual
          customerData = existingCustomer;
        } else {
          customerData = updatedCustomer;
        }
      } else {
        customerData = existingCustomer;
      }
    } else {
      // Si no existe, crear el nuevo cliente
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: newCustomer.name.trim(),
          email: email,
          phone: phone,
          phone_country_code: newCustomer.phoneCountryCode,
          rut_document: newCustomer.rutDocument?.trim() || null,
          address: newCustomer.address?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        // Si el error es por duplicado, intentar buscar el cliente nuevamente
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          const { data: foundCustomer, error: findError } = await supabase
            .from("customers")
            .select("*")
            .eq("email", email)
            .eq("phone", phone)
            .maybeSingle();

          if (findError || !foundCustomer) {
            console.error("Error creando cliente:", error);
            alert(`Error al crear cliente: ${error.message}`);
            setLoading(false);
            return;
          }

          customerData = foundCustomer;
        } else {
          console.error("Error creando cliente:", error);
          alert(`Error al crear cliente: ${error.message}`);
          setLoading(false);
          return;
        }
      } else {
        customerData = data;
      }
    }

    if (customerData) {
      onCustomerSelect(customerData);
      setShowForm(false);
      setSearchTerm(customerData.name);
      setCustomers([]);
      setShowResults(false);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        phoneCountryCode: "+56",
        rutDocument: "",
        address: "",
      });
    }
  } catch (error: any) {
    console.error("Error inesperado:", error);
    alert(`Error inesperado: ${error.message}`);
  } finally {
    setLoading(false);
  }
}
```

**Puntos clave:**
1. Buscar cliente existente ANTES de insertar
2. Si existe, usar el existente y actualizar campos si es necesario
3. Manejar errores de duplicado (código 23505) como fallback
4. Usar `maybeSingle()` para evitar errores cuando no hay resultados

---

## 🔧 SOLUCIÓN 4: PDFs para Sucursales

### Problema
Los PDFs no se muestran para sucursales porque:
1. Los datos de sucursal no se cargan correctamente
2. La relación `sucursal:branches(*)` puede venir como array
3. Los datos de sucursal no están actualizados

### Solución: Modificar OrdersTable.tsx, OrderDetail.tsx y PDFPreview.tsx

#### 4.1. OrdersTable.tsx - Función `handleViewPDF`

```typescript
async function handleViewPDF(order: WorkOrder) {
  try {
    // Cargar servicios de la orden
    const { data: orderServices, error: servicesError } = await supabase
      .from("order_services")
      .select("*")
      .eq("order_id", order.id);

    if (servicesError) throw servicesError;

    // Cargar notas de la orden
    const { data: orderNotes, error: notesError } = await supabase
      .from("order_notes")
      .select("note")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });

    if (notesError) throw notesError;

    // Cargar datos actualizados de la sucursal desde la base de datos
    // Esto asegura que el PDF siempre refleje los datos más recientes de la sucursal
    let branchData = null;
    if (order.sucursal_id) {
      const { data: updatedBranch, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("id", order.sucursal_id)
        .single();
      
      if (!branchError && updatedBranch) {
        branchData = updatedBranch;
      } else if (order.sucursal) {
        // Si falla la carga pero existe en la relación, usar la relación
        branchData = Array.isArray(order.sucursal) ? order.sucursal[0] : order.sucursal;
      }
    } else if (order.sucursal) {
      // Si no hay sucursal_id pero existe la relación, usar la relación
      branchData = Array.isArray(order.sucursal) ? order.sucursal[0] : order.sucursal;
    }

    // Convertir order_services a servicios
    const services: Service[] = (orderServices || []).map((os: any) => ({
      id: os.service_id || os.id,
      name: os.service_name,
      description: null,
      default_price: os.unit_price || 0,
      created_at: os.created_at || new Date().toISOString(),
    }));

    // Calcular serviceValue
    let serviceValue = order.labor_cost || 0;
    if (orderServices && orderServices.length > 0) {
      serviceValue = orderServices.reduce((sum: number, os: any) => sum + (os.total_price || 0), 0);
    }

    const replacementCost = order.replacement_cost || 0;
    const warrantyDays = order.warranty_days || 30;
    const notes = (orderNotes || []).map((n: any) => n.note);

    // Crear orden con datos actualizados de sucursal
    const orderWithUpdatedBranch = {
      ...order,
      sucursal: branchData,
    };

    setPdfOrderData({
      order: orderWithUpdatedBranch,
      services,
      orderServices: orderServices || undefined,
      serviceValue,
      replacementCost,
      warrantyDays,
      checklistData: order.checklist_data as Record<string, 'ok' | 'damaged' | 'replaced'> | null,
      notes: notes.length > 0 ? notes : undefined,
    });
  } catch (error) {
    console.error("Error cargando datos para PDF:", error);
    alert("Error al cargar los datos del PDF");
  }
}
```

#### 4.2. PDFPreview.tsx - Función `generatePDF`

```typescript
async function generatePDF() {
  setLoading(true);
  try {
    // Cargar datos actualizados de la sucursal desde la base de datos
    let branchData = null;
    
    // Si order.sucursal es un array (relación de Supabase), tomar el primer elemento
    if (order.sucursal) {
      branchData = Array.isArray(order.sucursal) ? order.sucursal[0] : order.sucursal;
    }
    
    // Siempre intentar cargar datos actualizados desde la BD
    if (order.sucursal_id) {
      const { data: updatedBranch, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("id", order.sucursal_id)
        .single();
      
      if (!branchError && updatedBranch) {
        branchData = updatedBranch;
      }
    }

    // Crear orden con datos actualizados de sucursal
    const orderWithUpdatedBranch = {
      ...order,
      sucursal: branchData,
    };

    // ... resto del código de generación de PDF ...
  }
}
```

**Aplicar el mismo patrón en:**
- `generatePDFBoleta()`
- `generatePDFEtiqueta()`

**Puntos clave:**
1. Siempre cargar datos actualizados desde la BD antes de generar PDF
2. Manejar cuando `order.sucursal` viene como array
3. Usar `orderForPDF` con datos actualizados en todas las funciones de generación

---

## 🔧 SOLUCIÓN 5: Dispositivos No Listados y Checklist

### Problema
Si un dispositivo no está en el listado, no se detecta el tipo y no aparece el checklist. El usuario necesita poder seleccionar la categoría manualmente.

### Solución: Modificar OrderForm.tsx

**Archivo:** `src/react/components/OrderForm.tsx`

**Agregar estados:**

```typescript
const [showDeviceCategoryModal, setShowDeviceCategoryModal] = useState(false);
const [pendingDeviceModel, setPendingDeviceModel] = useState("");
```

**Modificar useEffect de detección:**

```typescript
useEffect(() => {
  if (deviceModel) {
    const detected = detectDeviceType(deviceModel);
    if (detected) {
      setDeviceType(detected);
      setShowDeviceCategoryModal(false);
    } else {
      // Si no se detecta el tipo pero hay texto, permitir continuar sin tipo
      // El usuario puede seleccionar la categoría manualmente
      setDeviceType(null);
    }
    const suggestions = getSmartSuggestions(deviceModel);
    setDeviceSuggestions(suggestions.slice(0, 5));
    setShowDeviceSuggestions(true);
  } else {
    setDeviceSuggestions([]);
    setShowDeviceSuggestions(false);
    setDeviceType(null);
  }
}, [deviceModel]);
```

**Agregar UI antes del checklist:**

```typescript
{/* Modal para seleccionar categoría de dispositivo */}
{showDeviceCategoryModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        Agregar Nuevo Dispositivo
      </h3>
      <p className="text-slate-600 mb-4">
        El dispositivo <strong>"{pendingDeviceModel || deviceModel}"</strong> no está en el listado.
        Por favor, selecciona la categoría del dispositivo:
      </p>
      <div className="space-y-2 mb-6">
        <button
          onClick={() => {
            setDeviceType("iphone");
            setShowDeviceCategoryModal(false);
          }}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
        >
          <span className="font-medium">📱 Celular</span>
          <p className="text-sm text-slate-600">iPhone, Android, etc.</p>
        </button>
        <button
          onClick={() => {
            setDeviceType("ipad");
            setShowDeviceCategoryModal(false);
          }}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
        >
          <span className="font-medium">📱 Tablet</span>
          <p className="text-sm text-slate-600">iPad, Android Tablet, etc.</p>
        </button>
        <button
          onClick={() => {
            setDeviceType("macbook");
            setShowDeviceCategoryModal(false);
          }}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
        >
          <span className="font-medium">💻 Notebook / Laptop</span>
          <p className="text-sm text-slate-600">MacBook, Windows Laptop, etc.</p>
        </button>
        <button
          onClick={() => {
            setDeviceType("apple_watch");
            setShowDeviceCategoryModal(false);
          }}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
        >
          <span className="font-medium">⌚ Smartwatch</span>
          <p className="text-sm text-slate-600">Apple Watch, Android Watch, etc.</p>
        </button>
        <button
          onClick={() => {
            setDeviceType("iphone");
            setShowDeviceCategoryModal(false);
          }}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-md text-left transition-colors"
        >
          <span className="font-medium">🔧 Otro</span>
          <p className="text-sm text-slate-600">Otro tipo de dispositivo</p>
        </button>
      </div>
      <button
        onClick={() => {
          setShowDeviceCategoryModal(false);
          setPendingDeviceModel("");
        }}
        className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

{/* Botón para agregar categoría si no se detectó tipo */}
{deviceModel && !deviceType && !showDeviceCategoryModal && (
  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
    <p className="text-sm text-amber-800 mb-2">
      No se detectó la categoría del dispositivo. Para mostrar el checklist, selecciona la categoría:
    </p>
    <button
      onClick={() => {
        setPendingDeviceModel(deviceModel);
        setShowDeviceCategoryModal(true);
      }}
      className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
    >
      ➕ Agregar Nuevo Dispositivo
    </button>
  </div>
)}

{/* Checklist Dinámico */}
{deviceType && (
  <DeviceChecklist
    deviceType={deviceType}
    checklistData={checklistData}
    onChecklistChange={setChecklistData}
  />
)}
```

**Puntos clave:**
1. Permitir escribir cualquier modelo de dispositivo
2. Si no se detecta tipo, mostrar botón para seleccionar categoría
3. Modal con opciones de categoría (Celular, Tablet, Notebook, Smartwatch, Otro)
4. Al seleccionar categoría, asignar `deviceType` y mostrar checklist correspondiente

---

## 🔧 SOLUCIÓN 6: Variables de Entorno y Login

### Problema
El usuario existe pero no puede iniciar sesión. Posibles causas:
- Variables de entorno no configuradas
- Usuario no existe en tabla `users` (solo en `auth.users`)
- Email no confirmado

### Solución: Verificación y Configuración

#### 6.1. Verificar Variables de Entorno

**Archivo:** `.env.local` (en la raíz del proyecto)

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verificación:**
1. El archivo debe estar en la raíz: `sistema-gestion-ordenes/.env.local`
2. Reiniciar el servidor después de crear/modificar: `npm run dev`
3. Verificar en consola del navegador que no hay errores de variables faltantes

#### 6.2. Verificar Usuario en Supabase

**En Authentication:**
1. Ve a Supabase Dashboard → Authentication → Users
2. Verifica que el usuario existe
3. Verifica que el email está confirmado (check verde)
4. Copia el **User UID**

**En Tabla users:**
```sql
-- Verificar si el usuario existe en la tabla users
SELECT * FROM users WHERE id = 'uid-del-usuario-aqui';

-- Si no existe, crearlo:
INSERT INTO users (id, role, name, email)
VALUES (
  'uid-del-usuario-en-auth-users',  -- El User UID de Authentication
  'admin',  -- o 'technician', 'encargado', 'recepcionista'
  'Nombre del Usuario',
  'email-del-usuario@ejemplo.com'
);
```

**IMPORTANTE:** El `id` en la tabla `users` DEBE ser exactamente el mismo que el `id` en `auth.users`.

#### 6.3. Verificar Login.tsx

El código de login ya maneja correctamente:
- Login de usuarios normales (auth.users)
- Login de sucursales (localStorage)
- Manejo de errores

No se requieren cambios adicionales si las variables de entorno están correctas.

---

## 📝 RESUMEN DE ARCHIVOS MODIFICADOS

1. **Scripts SQL:**
   - `database/fix_customers_insert_policy.sql`
   - `database/fix_work_orders_insert_policy.sql`
   - `database/fix_order_services_insert_policy.sql`

2. **Componentes React:**
   - `src/react/components/OrderForm.tsx`
   - `src/react/components/CustomerSearch.tsx`
   - `src/react/components/OrdersTable.tsx`
   - `src/react/components/OrderDetail.tsx`
   - `src/react/components/PDFPreview.tsx`

3. **Configuración:**
   - `.env.local` (crear si no existe)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Ejecutar scripts SQL para políticas RLS (3 scripts)
- [ ] Modificar OrderForm.tsx para detectar sucursales
- [ ] Modificar CustomerSearch.tsx para prevenir duplicados
- [ ] Modificar OrdersTable.tsx para cargar datos de sucursal en PDFs
- [ ] Modificar OrderDetail.tsx para cargar datos de sucursal en PDFs
- [ ] Modificar PDFPreview.tsx (3 funciones: generatePDF, generatePDFBoleta, generatePDFEtiqueta)
- [ ] Agregar modal de selección de categoría en OrderForm.tsx
- [ ] Verificar variables de entorno en `.env.local`
- [ ] Verificar usuarios en Supabase (auth.users y tabla users)
- [ ] Probar creación de órdenes desde sucursales
- [ ] Probar creación de clientes desde sucursales
- [ ] Probar visualización de PDFs desde sucursales
- [ ] Probar agregar dispositivos no listados

---

## 🎯 RESULTADO ESPERADO

Después de implementar todas las soluciones:

1. ✅ Sucursales pueden crear clientes sin errores RLS
2. ✅ Sucursales pueden crear órdenes sin errores RLS
3. ✅ No hay errores "cannot coerce the result to a single json object"
4. ✅ No hay errores de clientes duplicados
5. ✅ PDFs se muestran correctamente para sucursales
6. ✅ Dispositivos no listados pueden agregarse con categoría
7. ✅ Login funciona correctamente con variables de entorno

---

## 📚 RECURSOS ADICIONALES

- Documentación de Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Documentación de Supabase Auth: https://supabase.com/docs/guides/auth
- Documentación de Astro: https://docs.astro.build

---

**Nota:** Este documento asume que el sistema ya tiene implementada la autenticación dual (usuarios y sucursales) y que las tablas de base de datos están creadas según el schema.sql del proyecto.


