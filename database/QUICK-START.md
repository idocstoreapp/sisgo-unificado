# 🚀 GUÍA RÁPIDA - CREAR BASE DE DATOS SISGO

## Opción 1: Ejecutar Scripts en Orden (Recomendado)

### Paso 1: Crear Proyecto Supabase
1. Ir a https://supabase.com/dashboard
2. Click "New Project"
3. Elegir región (US East)
4. Esperar ~2 minutos

### Paso 2: Ejecutar Scripts SQL

Abrir **SQL Editor** en Supabase y ejecutar en orden:

```
✅ 1. 01-extensions-and-types.sql
✅ 2. 02-core-tables.sql  
✅ 3. 03-business-modules.sql
✅ 4. 04-finance-module.sql
✅ 5. 05-restaurant-module.sql
✅ 6. 06-indexes-and-triggers.sql
✅ 7. 07-rls-policies.sql
✅ 8. 09-device-catalog-and-checklists.sql  <-- NUEVO (Catálogo de dispositivos)
✅ 9. 08-seed-data.sql                       <-- Último (datos de ejemplo)
```

**Cómo ejecutar cada script:**
1. Abrir archivo `.sql` en tu computador
2. Copiar TODO el contenido
3. Pegar en SQL Editor de Supabase
4. Click **"Run"** (o `Ctrl+Enter`)
5. Esperar mensaje "Success"
6. Pasar al siguiente script

### Paso 3: Crear Usuario Admin

#### 3.1. Desde Dashboard de Supabase
1. Ir a **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Llenar:
   - Email: `admin@miempresa.cl`
   - Password: `TuPasswordSeguro123!`
   - **Auto Confirm User: ✅ MARCAR**
4. Click **"Create user"**
5. **Copiar el UUID** del usuario

#### 3.2. Ejecutar SQL para asignar rol
```sql
-- Reemplazar 'YOUR-UUID-HERE' con el UUID copiado
INSERT INTO users (
  id,
  company_id,
  branch_id,
  role,
  name,
  email,
  permissions,
  is_active
) VALUES (
  'YOUR-UUID-HERE',  -- <-- UUID de auth.users
  (SELECT id FROM companies WHERE email = 'admin@miempresa.cl'),
  (SELECT id FROM branches WHERE code = 'MAIN-01'),
  'super_admin',
  'Administrador Principal',
  'admin@miempresa.cl',
  '{"all": true}'::jsonb,
  true
);
```

### Paso 4: Verificar Instalación

```sql
-- Ver todas las tablas creadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Deberías ver 40+ tablas
```

### Paso 5: Configurar App

Crear archivo `.env.local` en `sisgo-unificado`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

Obtener keys desde:
- **Settings → API** en dashboard de Supabase

### Paso 6: Ejecutar App

```bash
cd sisgo-unificado
npm install
npm run dev
```

Abrir http://localhost:3000

Login con:
- Email: `admin@miempresa.cl`
- Password: La que configuraste

---

## Opción 2: Script Todo-en-Uno (Para Desarrollo)

Si quieres ejecutar TODO de una vez, copia y pega este script completo en SQL Editor:

```sql
-- Ejecutar 01-extensions-and-types.sql
-- Ejecutar 02-core-tables.sql
-- Ejecutar 03-business-modules.sql
-- Ejecutar 04-finance-module.sql
-- Ejecutar 05-restaurant-module.sql
-- Ejecutar 06-indexes-and-triggers.sql
-- Ejecutar 07-rls-policies.sql
-- Ejecutar 08-seed-data.sql

-- O simplemente ejecutar cada archivo en orden como se indica arriba
```

---

## 📋 Estructura Final de Tablas

### Core (7 tablas)
- ✅ companies
- ✅ branches
- ✅ users
- ✅ customers
- ✅ catalog_services
- ✅ checklist_templates
- ✅ system_settings

### Negocio (12 tablas)
- ✅ work_orders
- ✅ order_items
- ✅ order_notes
- ✅ quotes
- ✅ quote_items
- ✅ quote_payments
- ✅ products
- ✅ suppliers
- ✅ purchases
- ✅ purchase_items
- ✅ stock_movements
- ✅ furniture_catalog

### Finanzas (8 tablas)
- ✅ employee_payments
- ✅ expenses
- ✅ small_expenses
- ✅ salary_adjustments
- ✅ salary_adjustment_applications
- ✅ salary_settlements
- ✅ savings_funds
- ✅ savings_fund_movements

### Restaurante (10 tablas)
- ✅ restaurant_tables
- ✅ menu_categories
- ✅ menu_items
- ✅ ingredients
- ✅ recipes
- ✅ recipe_ingredients
- ✅ restaurant_orders
- ✅ restaurant_order_items
- ✅ employee_tips
- ✅ print_jobs

**Total: 37 tablas**

---

## ❓ Troubleshooting

### Error: "relation already exists"
Las tablas ya existen. Puedes:
- Opción A: Borrar y recrear (solo desarrollo)
- Opción B: Continuar con el siguiente script

### Error: "policy already exists"
Ignorar, es normal si se ejecuta dos veces

### Error: "type already exists"
Normal si se ejecuta el script 01 dos veces. No es problema.

### No veo las tablas en Supabase
- Refrescar página
- Ir a **Table Editor**
- Deberías ver todas las tablas

### Error de RLS "permission denied"
Verificar que:
- Usuario está creado en Authentication
- Usuario tiene company_id correcto
- Usuario tiene role = 'super_admin'

---

## 🎯 Próximos Pasos

1. ✅ Base de datos creada
2. ✅ Usuario admin creado
3. ✅ App configurada con .env
4. ✅ Login funcional
5. ➡️  Crear más usuarios y roles
6. ➡️  Configurar tipos de negocio
7. ➡️  Personalizar según necesidad

---

**Documentación creada:** 14 de abril de 2026  
**Versión:** 1.0  
**Total de scripts:** 8 archivos SQL  
**Total de tablas:** 37  
**Total de triggers:** 40+  
**Total de políticas RLS:** 30+
