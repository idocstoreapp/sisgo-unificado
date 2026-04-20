# 🗄️ SCRIPT SQL COMPLETO - SISGO UNIFICADO

## Instrucciones de Ejecución

### 1. Crear Proyecto en Supabase
1. Ir a https://supabase.com/dashboard
2. Click "New Project"
3. Elegir región cercana (US East recomendado)
4. Establecer contraseña segura para la base de datos
5. Esperar a que el proyecto esté listo (~2 minutos)

### 2. Ejecutar Scripts en Orden

**IMPORTANTE:** Ejecutar los scripts en el siguiente orden en el SQL Editor de Supabase:

```
PASO 1: 01-extensions-and-types.sql
PASO 2: 02-core-tables.sql
PASO 3: 03-business-modules.sql
PASO 4: 04-finance-module.sql
PASO 5: 05-restaurant-module.sql
PASO 6: 06-indexes-and-triggers.sql
PASO 7: 07-rls-policies.sql
PASO 8: 08-functions-and-procedures.sql
PASO 9: 09-seed-data.sql (opcional - datos de ejemplo)
```

### 3. Cómo Ejecutar Cada Script

1. Ir al **SQL Editor** en el dashboard de Supabase
2. Copiar el contenido completo de cada archivo `.sql`
3. Pegar en el editor
4. Click **"Run"** o presionar `Ctrl+Enter`
5. Esperar el mensaje de éxito ("Success. No rows returned")
6. Pasar al siguiente script

### 4. Verificar Instalación

Después de ejecutar todos los scripts, ejecutar:

```sql
-- Verificar que todas las tablas fueron creadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Deberías ver 35+ tablas
```

---

## 📋 Estructura de la Base de Datos

### Tablas Core (7)
- `companies` - Empresas registradas en el sistema
- `branches` - Sucursales de cada empresa
- `users` - Usuarios del sistema (vinculado a auth.users)
- `customers` - Clientes de las empresas
- `roles` - Catálogo de roles disponibles
- `user_roles` - Roles asignados a usuarios
- `permissions` - Permisos del sistema

### Módulo Órdenes/Servicio Técnico (5)
- `work_orders` - Órdenes de trabajo principales
- `order_items` - Items/servicios de cada orden
- `device_checklists` - Checklists por tipo de dispositivo
- `device_checklist_items` - Items individuales del checklist
- `order_notes` - Notas de las órdenes

### Módulo Finanzas (8)
- `employee_payments` - Pagos a empleados con comisiones
- `expenses` - Gastos generales
- `small_expenses` - Gastos menores diarios
- `salary_adjustments` - Adelantos y descuentos
- `salary_adjustment_applications` - Aplicación de ajustes
- `salary_settlements` - Liquidaciones semanales
- `savings_funds` - Cajas de ahorro
- `savings_fund_movements` - Movimientos de caja de ahorro

### Módulo Cotizaciones/Mueblería (6)
- `quotes` - Cotizaciones de clientes
- `quote_items` - Items de cada cotización
- `quote_materials` - Materiales en cotizaciones
- `quote_services` - Servicios en cotizaciones
- `quote_payments` - Pagos recibidos de cotizaciones
- `furniture_catalog` - Catálogo de muebles

### Módulo Inventario/Taller Mecánico (6)
- `products` - Productos y repuestos
- `stock_movements` - Movimientos de inventario
- `suppliers` - Proveedores
- `purchases` - Compras a proveedores
- `purchase_items` - Items de compras
- `oil_barrels` - Barriles de aceite (específico taller)

### Módulo Restaurante (9)
- `restaurant_tables` - Mesas del restaurante
- `menu_categories` - Categorías del menú
- `menu_items` - Platos del menú
- `ingredients` - Ingredientes con stock
- `recipes` - Recetas de platos
- `recipe_ingredients` - Ingredientes por receta
- `restaurant_orders` - Órdenes de restaurante
- `restaurant_order_items` - Items de órdenes
- `employee_tips` - Distribución de propinas

### Reportes (1)
- `reports_cache` - Cache de reportes para performance

---

## 🎯 Cómo Crear Usuario Maestro (Super Admin)

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

#### Paso 1: Crear Usuario en Authentication
1. Ir a **Authentication → Users** en Supabase
2. Click **"Add user"** → **"Create new user"**
3. Llenar:
   - **Email:** admin@tuempresa.cl
   - **Password:** (contraseña segura, mínimo 8 caracteres)
   - **Auto Confirm User:** ✅ (marcar esta casilla)
4. Click **"Create user"**
5. **Copiar el UUID** del usuario creado (ej: `550e8400-e29b-41d4-a716-446655440000`)

#### Paso 2: Crear Empresa
```sql
-- Crear la empresa principal
INSERT INTO companies (
  id,
  name,
  business_type,
  rut,
  razon_social,
  email,
  phone,
  iva_percentage,
  commission_percentage,
  config
) VALUES (
  gen_random_uuid(),
  'Mi Empresa SpA',
  'servicio_tecnico', -- O el tipo de negocio que corresponda
  '76.123.456-7',
  'Mi Empresa Servicios Limitada',
  'admin@tuempresa.cl',
  '+56912345678',
  19,
  40,
  '{"warranty_days": 30, "max_orders_per_day": 20}'::jsonb
)
RETURNING id;
```

#### Paso 3: Asignar Usuario como Super Admin
```sql
-- Insertar usuario con rol super_admin
-- REEMPLAZAR 'USER-UUID-HERE' con el UUID del Paso 1
-- REEMPLAZAR 'COMPANY-ID-HERE' con el ID del Paso 2

INSERT INTO users (
  id,  -- DEBE ser el mismo UUID de auth.users
  company_id,
  role,
  name,
  email,
  phone,
  permissions,
  is_active
) VALUES (
  'USER-UUID-HERE',  -- <-- UUID de auth.users
  'COMPANY-ID-HERE', -- <-- ID de la empresa creada
  'super_admin',
  'Nombre del Admin',
  'admin@tuempresa.cl',
  '+56912345678',
  '{"all": true}'::jsonb,
  true
);
```

#### Paso 4: Crear Sucursal Principal (Opcional)
```sql
-- Crear sucursal principal
INSERT INTO branches (
  company_id,
  name,
  code,
  address,
  phone,
  is_active
) VALUES (
  'COMPANY-ID-HERE', -- <-- ID de la empresa
  'Casa Matriz',
  'MAIN-01',
  'Dirección de la empresa 123, Ciudad',
  '+56912345678',
  true
);
```

### Opción 2: Script Automático (Para Desarrollo)

Ejecutar este script completo en el SQL Editor:

```sql
-- =====================================================
-- SCRIPT PARA CREAR ADMIN INICIAL
-- =====================================================

-- 1. Crear usuario en auth.users (esto se hace desde el dashboard de Supabase)
-- Authentication → Users → Add User → Create new user
-- Email: admin@tuempresa.cl
-- Password: TuPasswordSeguro123!
-- Auto Confirm: ✅

-- 2. Obtener el UUID del usuario creado
-- Después de crear el usuario, copiar su UUID

-- 3. Crear empresa
DO $$
DECLARE
  v_company_id UUID;
  v_user_id UUID := 'REEMPLAZAR-CON-UUID-DE-AUTH-USERS'; -- <-- CAMBIAR ESTO
BEGIN
  -- Crear empresa
  INSERT INTO companies (
    name,
    business_type,
    email,
    iva_percentage,
    commission_percentage
  ) VALUES (
    'Empresa Demo SpA',
    'servicio_tecnico',
    'admin@demo.cl',
    19,
    40
  ) RETURNING id INTO v_company_id;

  -- Crear usuario super_admin
  INSERT INTO users (
    id,  -- Debe ser el mismo que auth.users
    company_id,
    role,
    name,
    email,
    permissions,
    is_active
  ) VALUES (
    v_user_id,
    v_company_id,
    'super_admin',
    'Administrador Principal',
    'admin@demo.cl',
    '{"all": true}'::jsonb,
    true
  );

  -- Crear sucursal principal
  INSERT INTO branches (
    company_id,
    name,
    code,
    is_active
  ) VALUES (
    v_company_id,
    'Casa Matriz',
    'MAIN-01',
    true
  );

  RAISE NOTICE 'Empresa creada con ID: %', v_company_id;
  RAISE NOTICE 'Usuario admin creado con UUID: %', v_user_id;
END $$;
```

### Opción 3: Registro desde la Aplicación

Una vez que la app está deployed:

1. Ir a `http://localhost:3000/register` (o tu URL)
2. Llenar formulario de registro:
   - Nombre de la empresa
   - RUT de la empresa
   - Email del admin
   - Contraseña
   - Tipo de negocio
3. El sistema automáticamente:
   - Crea usuario en auth.users
   - Crea la empresa
   - Asigna rol super_admin
   - Crea sucursal principal

---

## 📊 Tipos de Negocio Soportados

### `business_type` en tabla `companies`:

| Valor | Descripción | Módulos Activados |
|-------|-------------|-------------------|
| `servicio_tecnico` | Reparación de dispositivos | Órdenes, Finanzas |
| `taller_mecanico` | Taller de motos/autos | Órdenes, Inventario, Finanzas |
| `muebleria` | Cotizador de muebles | Cotizaciones, Inventario, Finanzas |
| `restaurante` | Restaurante/POS | Restaurante, Inventario, Finanzas |
| `multi_business` | Múltiples tipos | Todos los módulos |

---

## 👥 Roles de Usuario

### `role` en tabla `users`:

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `super_admin` | Dueño de la empresa | Todos los permisos |
| `admin` | Administrador de sucursal | Gestión completa de su sucursal |
| `technician` | Técnico (servicio técnico) | Crear/ver órdenes asignadas |
| `mechanic` | Mecánico (taller) | Similar a technician |
| `vendedor` | Vendedor (mueblería) | Crear cotizaciones |
| `mesero` | Mesero (restaurante) | Crear órdenes de restaurante |
| `cocina` | Cocina (restaurante) | Ver/completar órdenes de cocina |
| `encargado` | Encargado de sucursal | Similar a admin |
| `recepcionista` | Recepcionista | Crear órdenes, ver clientes |
| `responsable` | Responsable de turno | Gestión de órdenes |

---

## 🔐 Row Level Security (RLS)

### Políticas Implementadas:

1. **Aislamiento por Empresa:**
   - Cada usuario solo ve datos de SU empresa
   - `company_id` es el filtro principal en todas las políticas

2. **Roles Granulares:**
   - Super admin ve todo de su empresa
   - Admin ve todo de su sucursal
   - Técnicos solo ven sus órdenes asignadas

3. **Datos Públicos:**
   - Menú digital del restaurante es público (SELECT para todos)
   - Catálogo de muebles es público para cotizaciones

4. **Operaciones Restringidas:**
   - DELETE solo para super_admin
   - UPDATE de configs solo para super_admin/admin
   - INSERT según rol específico

---

## 💾 Money Handling (Sin Decimales)

### Convención de Precios:

**TODOS los campos monetarios usan `NUMERIC(15,0)` - SIN decimales**

Ejemplos:
- `$1.000.000` se almacena como `1000000` (no `1000000.00`)
- `$15.500` se almacena como `15500`
- IVA y comisiones se calculan sobre valores enteros

**Campos de porcentaje** (iva, comisiones) usan `NUMERIC(5,2)`:
- `19.00` para 19%
- `40.00` para 40%

---

## 📝 Notes Importantes

1. **auth.users**: La tabla `users` tiene FK a `auth.users(id)`. Cuando creas un usuario desde la app, Supabase Auth crea automáticamente el registro en `auth.users`.

2. **Triggers**: Los triggers actualizan automáticamente:
   - `updated_at` en cada UPDATE
   - Totales de órdenes y compras
   - Costos de recetas
   - Números de orden automáticos

3. **Índices**: Todos los campos de búsqueda frecuente están indexados para performance.

4. **JSONB**: Campos como `config`, `permissions`, `metadata` usan JSONB para flexibilidad.

---

## 🚀 Próximos Pasos

Después de crear las tablas:

1. ✅ Verificar que todas las tablas existen
2. ✅ Crear usuario maestro (ver sección arriba)
3. ✅ Probar login con el usuario creado
4. ✅ Configurar variables de entorno en la app
5. ✅ Ejecutar `npm run dev` para probar
6. ✅ Crear más usuarios y roles según necesidad

---

**Documentación creada:** 14 de abril de 2026  
**Versión del schema:** 1.0  
**Base de datos:** PostgreSQL 15 (Supabase)
