-- =====================================================
-- SISGO UNIFICADO - SCRIPT 08: CREAR USUARIO MAESTRO
-- =====================================================
-- Este script crea un usuario super_admin inicial
-- Ejecutar DESPUÉS de 07-rls-policies.sql
-- 
-- INSTRUCCIONES:
-- 1. Crear usuario en Supabase Auth Dashboard
-- 2. Copiar el UUID del usuario creado
-- 3. Reemplazar 'YOUR-AUTH-USER-ID-HERE' con ese UUID
-- 4. Ejecutar este script
-- =====================================================

-- =====================================================
-- PASO 1: CREAR EMPRESA DE EJEMPLO
-- =====================================================

DO $$
DECLARE
  v_company_id UUID;
  v_branch_id UUID;
BEGIN
  -- Crear empresa
  INSERT INTO companies (
    name,
    business_type,
    rut,
    razon_social,
    email,
    phone,
    address,
    iva_percentage,
    commission_percentage,
    config
  ) VALUES (
    'Idoc Store',
    'servicio_tecnico',
    '76.123.456-7',
    'Mi Empresa Servicios Limitada',
    'admin@miempresa.cl',
    '+56912345678',
    'Av. Principal 1234, Santiago',
    19.00,
    40.00,
    '{"warranty_days": 30, "max_orders_per_day": 20}'::jsonb
  ) RETURNING id INTO v_company_id;

  RAISE NOTICE 'Empresa creada con ID: %', v_company_id;

  -- Crear sucursal principal
  INSERT INTO branches (
    company_id,
    name,
    code,
    address,
    phone,
    is_active,
    config
  ) VALUES (
    v_company_id,
    'Casa Matriz',
    'MAIN-01',
    'Av. Principal 1234, Santiago',
    '+56912345678',
    true,
    '{"business_hours": "09:00-18:00", "has_parking": true}'::jsonb
  ) RETURNING id INTO v_branch_id;

  RAISE NOTICE 'Sucursal creada con ID: %', v_branch_id;

  -- Crear servicios de ejemplo
  INSERT INTO catalog_services (company_id, name, description, category, default_price, estimated_hours, is_active) VALUES
    (v_company_id, 'Diagnóstico de Dispositivo', 'Evaluación completa del dispositivo', 'Diagnóstico', 15000, 0.5, true),
    (v_company_id, 'Reparación de Pantalla iPhone', 'Cambio de pantalla completa', 'Reparación', 89990, 1.5, true),
    (v_company_id, 'Reparación de Pantalla Samsung', 'Cambio de pantalla completa', 'Reparación', 79990, 1.5, true),
    (v_company_id, 'Cambio de Batería', 'Reemplazo de batería original', 'Reparación', 35000, 0.75, true),
    (v_company_id, 'Recuperación de Datos', 'Rescate de información', 'Servicio Especial', 45000, 2.0, true),
    (v_company_id, 'Limpieza de Software Malicioso', 'Eliminación de virus y malware', 'Software', 25000, 1.0, true),
    (v_company_id, 'Instalación de Sistema Operativo', 'Instalación limpia de OS', 'Software', 30000, 1.5, true),
    (v_company_id, 'Upgrade de RAM', 'Instalación de memoria adicional', 'Hardware', 20000, 0.5, true);

  RAISE NOTICE 'Servicios de ejemplo creados';

  -- Crear checklist templates genéricos
  INSERT INTO checklist_templates (company_id, business_type, template_type, item_name, item_order, status_options) VALUES
    (v_company_id, 'servicio_tecnico', 'iphone', 'Pantalla', 1, '["Funcionando", "Rota", "Reparada", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Botón Home', 2, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Cámara Frontal', 3, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Cámara Trasera', 4, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'WiFi', 5, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Bluetooth', 6, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Altavoz', 7, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Micrófono', 8, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Puerto de Carga', 9, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
    (v_company_id, 'servicio_tecnico', 'iphone', 'Batería', 10, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb);

  RAISE NOTICE 'Checklist templates creados';

END $$;

-- =====================================================
-- PASO 2: INSTRUCCIONES PARA CREAR USUARIO ADMIN
-- =====================================================

-- IMPORTANTE: Ejecutar este bloque después de crear el usuario en Auth
-- Reemplazar 'YOUR-AUTH-USER-ID-HERE' con el UUID real del usuario

/*
-- PASO A: Ir a Supabase Dashboard → Authentication → Users
-- PASO B: Click "Add user" → "Create new user"
-- PASO C: Llenar:
--   Email: admin@miempresa.cl
--   Password: Admin123! (o la contraseña que prefieras)
--   Auto Confirm User: ✅ MARCAR ESTA CASILLA
-- PASO D: Click "Create user"
-- PASO E: Copiar el UUID del usuario creado
-- PASO F: Ejecutar el siguiente INSERT (reemplazando el UUID):

INSERT INTO users (
  id,  -- <-- DEBE SER EL UUID DE auth.users
  company_id,  -- <-- UUID de la empresa creada arriba
  branch_id,  -- <-- UUID de la sucursal creada arriba
  role,
  name,
  email,
  phone,
  permissions,
  commission_percentage,
  sueldo_base,
  sueldo_frecuencia,
  is_active
) VALUES (
  'YOUR-AUTH-USER-ID-HERE',  -- <-- REEMPLAZAR CON UUID REAL
  (SELECT id FROM companies WHERE email = 'admin@miempresa.cl' LIMIT 1),
  (SELECT id FROM branches WHERE code = 'MAIN-01' LIMIT 1),
  'super_admin',
  'Administrador Principal',
  'admin@miempresa.cl',
  '+56912345678',
  '{"all": true}'::jsonb,
  40.00,
  500000,
  'mensual',
  true
);
*/

-- =====================================================
-- PASO 3: VERIFICACIÓN
-- =====================================================

-- Verificar empresa creada
SELECT 
  id,
  name,
  business_type,
  rut,
  email,
  iva_percentage,
  commission_percentage
FROM companies
WHERE email = 'admin@miempresa.cl';

-- Verificar sucursal
SELECT 
  id,
  company_id,
  name,
  code,
  is_active
FROM branches
WHERE code = 'MAIN-01';

-- Verificar servicios
SELECT 
  id,
  name,
  category,
  default_price,
  estimated_hours,
  is_active
FROM catalog_services
WHERE company_id = (SELECT id FROM companies WHERE email = 'admin@miempresa.cl')
ORDER BY category, name;

-- Verificar checklists
SELECT 
  template_type,
  COUNT(*) as items
FROM checklist_templates
WHERE company_id = (SELECT id FROM companies WHERE email = 'admin@miempresa.cl')
GROUP BY template_type;

-- =====================================================
-- RESUMEN DE INSTALACIÓN
-- =====================================================

-- Después de ejecutar todo, deberías ver:
-- ✅ 1 empresa creada
-- ✅ 1 sucursal creada
-- ✅ 8 servicios de ejemplo
-- ✅ 10 checklist templates
-- ✅ 1 usuario admin (después de completar el PASO 2)

-- Credenciales de prueba (una vez creado el usuario):
-- Email: admin@miempresa.cl
-- Password: La que configuraste en Supabase Auth

-- URL de login: http://localhost:3000/login
-- Dashboard: http://localhost:3000/dashboard
