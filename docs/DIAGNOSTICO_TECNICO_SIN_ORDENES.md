# Diagnóstico: Técnico No Ve Órdenes de su Sucursal

## Síntoma

El técnico autenticado no ve órdenes disponibles en su sucursal. La lista aparece vacía o sin información.

---

## Análisis de Causas Potenciales

### 1. Ordenes sin `branch_id`

**Problema**: Al crear la orden, no se está asignando el `branch_id`.

**Verificación**:
```sql
-- Ejecutar en Supabase SQL Editor
SELECT COUNT(*) as total, 
       COUNT(branch_id) as con_branch_id,
       COUNT(*) - COUNT(branch_id) as sin_branch_id
FROM work_orders;
```

**Si `sin_branch_id > 0`**: Las órdenes se crean sin sucursal, por lo tanto el filtro `branch_id = X` no devuelve resultados.

---

### 2. El perfil de usuario no tiene `company_id`

**Problema**: En `page.tsx` línea 35, se busca la primera sucursal basada en `profile.company_id`. Si el perfil no tiene `company_id`, `branchId` será `null`.

**Verificación**:
```sql
SELECT id, name, role, company_id, branch_id 
FROM users 
WHERE role = 'technician';
```

**Si `company_id` es null**: No se puede determinar la sucursal.

---

### 3. La tabla `branches` no tiene registros para la compañía

**Problema**: Aunque haya `company_id`, no existen sucursales creadas.

**Verificación**:
```sql
-- Verificar que existen sucursales
SELECT id, name, company_id FROM branches;
```

---

### 4. El técnico no tiene `branch_id` en su perfil

**Problema**: El técnico debería tener `branch_id` directo en la tabla `users` para indicar a qué sucursal pertenece.

**Verificación**:
```sql
SELECT u.id, u.name, u.branch_id, b.name as branch_name
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id
WHERE u.role = 'technician';
```

---

## Código Involucrado

### TechnicianDashboardPage (`src/app/(dashboard)/orders/tech/page.tsx`)

Líneas 32-43: Obtiene el branchId buscando la primera sucursal de la compañía.

```typescript
const { data: branchData } = await supabase
  .from("branches")
  .select("id")
  .eq("company_id", profile.company_id)
  .limit(1)
  .maybeSingle();
```

**Problema potencial**: Si hay múltiples sucursales, siempre toma la primera (puede no ser la correcta).

### TechnicianOrdersList (`src/presentation/components/orders/tech/TechnicianOrdersList.tsx`)

Línea 34-36: Filtra por branch_id

```typescript
if (branchId) {
  q = q.eq("branch_id", branchId);
}
```

Línea 39: Filtra por estados

```typescript
q = q.in("status", ["pendiente", "en_reparacion"]);
```

---

## Causa Más Probable

Basado en el código, el flujo es:

```
1. page.tsx obtiene user.id
2. Busca perfil en tabla "users" 
3. Obtiene company_id del perfil
4. Busca primera branch de esa company_id
5. Pasa branchId a TechnicianOrdersList
6. TechnicianOrdersList filtra work_orders por branch_id
```

**Puntos de falla**:
1. Perfil sin `company_id` → `branchId = null` → No filtra, pero también podría mostrar todas las órdenes (si el filtro no se aplica correctamente)
2. Órdenes sin `branch_id` → El filtro no encuentra nada

---

## Plan de Investigación

### Paso 1: Verificar datos en BD

```sql
-- 1. Ver usuarios técnicos
SELECT id, name, role, company_id, branch_id FROM users WHERE role = 'technician';

-- 2. Ver sucursales
SELECT id, name, company_id FROM branches;

-- 3. Ver órdenes recientes
SELECT id, status, branch_id, created_at 
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 10;
```

### Paso 2: Agregar logs temporales en el frontend

En `page.tsx` agregar console.log para ver qué valores recibe:

```typescript
console.log("🔧 Technician ID:", technicianId);
console.log("🏪 Branch ID:", branchId);
console.log("📋 Company ID:", profile?.company_id);
```

### Paso 3: Probar consulta directa

En Supabase SQL Editor, ejecutar con los IDs reales:

```sql
SELECT * FROM work_orders 
WHERE branch_id = 'ID_DE_LA_SUCURSAL' 
AND status IN ('pendiente', 'en_reparacion')
LIMIT 10;
```

---

## Soluciones Posibles

### A) Si el problema es que las órdenes no tienen branch_id

**Opción 1**: Al crear orden, agregar branch_id del usuario actual.

**Opción 2**: Actualizar órdenes existentes con script SQL:

```sql
-- Asignar branch_id a órdenes basadas en el usuario que las creó
UPDATE work_orders wo
SET branch_id = u.branch_id
FROM users u
WHERE wo.created_by = u.id
AND wo.branch_id IS NULL;
```

### B) Si el problema es que el técnico no tiene branch_id en su perfil

**Opción 1**: Asignar manualmente en la tabla `users`.

**Opción 2**: Modificar código para usar `branch_id` directo del perfil en lugar de buscar por compañía.

---

## Recomendación

1. **Verificar con logs** qué valores llegan en el frontend
2. **Ejecutar consultas SQL** para confirmar datos
3. **Corregir el flujo de creación de órdenes** para que siempre tenga branch_id
4. **Asignar branch_id a usuarios técnicos** en el perfil

El problema central parece ser que las órdenes se crean sin `branch_id` o el técnico no tiene sucursal asignada en su perfil.