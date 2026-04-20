-- =====================================================
-- SISGO UNIFICADO - SCRIPT 09: CATÁLOGO DISPOSITIVOS Y CHECKLISTS
-- =====================================================
-- Este script crea las tablas que FALTABAN y que están en tablas-viejas.md:
-- - device_types, brands, product_lines, models, variants
-- - device_catalog_items (para UI con imágenes)
-- - device_checklist_items (checklists por tipo)
-- - services (servicios con categorías)
-- Ejecutar DESPUÉS de 07-rls-policies.sql
-- 
-- Basado EXACTAMENTE en las tablas reales de sistema-gestion-ordenes
-- =====================================================

-- =====================================================
-- 1. TIPOS DE DISPOSITIVO (device_types)
-- =====================================================
-- Celular, Tablet, Notebook, Consola, Smartwatch, etc.

CREATE TABLE IF NOT EXISTS device_types (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Información
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(code)
);

-- Seed data: Tipos predefinidos
INSERT INTO device_types (code, name, image_url, is_active) VALUES
  ('phone', 'Celular', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', true),
  ('tablet', 'Tablet', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', true),
  ('laptop', 'Notebook/Laptop', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', true),
  ('console', 'Consola de Juegos', 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400', true),
  ('wearable', 'Smartwatch/Wearable', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', true),
  ('other', 'Otro', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. MARCAS (brands)
-- =====================================================
-- Apple, Samsung, Xiaomi, Motorola, etc.

CREATE TABLE IF NOT EXISTS brands (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  device_type_id BIGINT REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  normalized_name TEXT,
  logo_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data: Marcas principales
INSERT INTO brands (device_type_id, name, normalized_name, logo_url) VALUES
  -- Apple (para todos los tipos)
  ((SELECT id FROM device_types WHERE code = 'phone'), 'Apple', 'apple', 'https://cdn.simpleicons.org/apple/000/fff'),
  ((SELECT id FROM device_types WHERE code = 'tablet'), 'Apple', 'apple', 'https://cdn.simpleicons.org/apple/000/fff'),
  ((SELECT id FROM device_types WHERE code = 'laptop'), 'Apple', 'apple', 'https://cdn.simpleicons.org/apple/000/fff'),
  ((SELECT id FROM device_types WHERE code = 'wearable'), 'Apple', 'apple', 'https://cdn.simpleicons.org/apple/000/fff'),
  
  -- Samsung
  ((SELECT id FROM device_types WHERE code = 'phone'), 'Samsung', 'samsung', 'https://cdn.simpleicons.org/samsung/000/fff'),
  ((SELECT id FROM device_types WHERE code = 'tablet'), 'Samsung', 'samsung', 'https://cdn.simpleicons.org/samsung/000/fff'),
  
  -- Xiaomi
  ((SELECT id FROM device_types WHERE code = 'phone'), 'Xiaomi', 'xiaomi', 'https://cdn.simpleicons.org/xiaomi/ff6900'),
  
  -- Motorola
  ((SELECT id FROM device_types WHERE code = 'phone'), 'Motorola', 'motorola', 'https://cdn.simpleicons.org/motorola/000/fff'),
  
  -- Huawei
  ((SELECT id FROM device_types WHERE code = 'phone'), 'Huawei', 'huawei', 'https://cdn.simpleicons.org/huawei/ff0000')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. LÍNEAS DE PRODUCTO (product_lines)
-- =====================================================
-- iPhone, Galaxy S, Galaxy A, Redmi, etc.

CREATE TABLE IF NOT EXISTS product_lines (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  brand_id BIGINT REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  normalized_name TEXT,
  image_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data: Líneas principales
INSERT INTO product_lines (brand_id, name, normalized_name) VALUES
  -- Apple iPhone
  ((SELECT id FROM brands WHERE name = 'Apple' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'iPhone', 'iphone'),
  
  -- Apple iPad
  ((SELECT id FROM brands WHERE name = 'Apple' AND device_type_id = (SELECT id FROM device_types WHERE code = 'tablet')), 'iPad', 'ipad'),
  
  -- Apple MacBook
  ((SELECT id FROM brands WHERE name = 'Apple' AND device_type_id = (SELECT id FROM device_types WHERE code = 'laptop')), 'MacBook', 'macbook'),
  
  -- Apple Watch
  ((SELECT id FROM brands WHERE name = 'Apple' AND device_type_id = (SELECT id FROM device_types WHERE code = 'wearable')), 'Apple Watch', 'apple-watch'),
  
  -- Samsung Galaxy S
  ((SELECT id FROM brands WHERE name = 'Samsung' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Galaxy S', 'galaxy-s'),
  
  -- Samsung Galaxy A
  ((SELECT id FROM brands WHERE name = 'Samsung' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Galaxy A', 'galaxy-a'),
  
  -- Samsung Galaxy Z
  ((SELECT id FROM brands WHERE name = 'Samsung' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Galaxy Z', 'galaxy-z'),
  
  -- Xiaomi Redmi
  ((SELECT id FROM brands WHERE name = 'Xiaomi' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Redmi', 'redmi'),
  
  -- Xiaomi Poco
  ((SELECT id FROM brands WHERE name = 'Xiaomi' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Poco', 'poco'),
  
  -- Motorola Moto G
  ((SELECT id FROM brands WHERE name = 'Motorola' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Moto G', 'moto-g'),
  
  -- Motorola Moto E
  ((SELECT id FROM brands WHERE name = 'Motorola' AND device_type_id = (SELECT id FROM device_types WHERE code = 'phone')), 'Moto E', 'moto-e')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. MODELOS (models)
-- =====================================================
-- iPhone 11, iPhone 12, iPhone 13, Galaxy S21, etc.

CREATE TABLE IF NOT EXISTS models (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_line_id BIGINT REFERENCES product_lines(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  normalized_name TEXT,
  image_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data: Modelos iPhone
DO $$
DECLARE
  v_iphone_line BIGINT;
BEGIN
  SELECT id INTO v_iphone_line FROM product_lines WHERE name = 'iPhone' LIMIT 1;
  
  IF v_iphone_line IS NOT NULL THEN
    INSERT INTO models (product_line_id, name, normalized_name, image_url) VALUES
      (v_iphone_line, 'iPhone 15 Pro Max', 'iphone-15-pro-max', NULL),
      (v_iphone_line, 'iPhone 15 Pro', 'iphone-15-pro', NULL),
      (v_iphone_line, 'iPhone 15 Plus', 'iphone-15-plus', NULL),
      (v_iphone_line, 'iPhone 15', 'iphone-15', NULL),
      (v_iphone_line, 'iPhone 14 Pro Max', 'iphone-14-pro-max', NULL),
      (v_iphone_line, 'iPhone 14 Pro', 'iphone-14-pro', NULL),
      (v_iphone_line, 'iPhone 14 Plus', 'iphone-14-plus', NULL),
      (v_iphone_line, 'iPhone 14', 'iphone-14', NULL),
      (v_iphone_line, 'iPhone 13 Pro Max', 'iphone-13-pro-max', NULL),
      (v_iphone_line, 'iPhone 13 Pro', 'iphone-13-pro', NULL),
      (v_iphone_line, 'iPhone 13', 'iphone-13', NULL),
      (v_iphone_line, 'iPhone 13 mini', 'iphone-13-mini', NULL),
      (v_iphone_line, 'iPhone 12 Pro Max', 'iphone-12-pro-max', NULL),
      (v_iphone_line, 'iPhone 12 Pro', 'iphone-12-pro', NULL),
      (v_iphone_line, 'iPhone 12', 'iphone-12', NULL),
      (v_iphone_line, 'iPhone 12 mini', 'iphone-12-mini', NULL),
      (v_iphone_line, 'iPhone 11 Pro Max', 'iphone-11-pro-max', NULL),
      (v_iphone_line, 'iPhone 11 Pro', 'iphone-11-pro', NULL),
      (v_iphone_line, 'iPhone 11', 'iphone-11', NULL),
      (v_iphone_line, 'iPhone SE (3rd gen)', 'iphone-se-3', NULL),
      (v_iphone_line, 'iPhone SE (2nd gen)', 'iphone-se-2', NULL),
      (v_iphone_line, 'iPhone XS Max', 'iphone-xs-max', NULL),
      (v_iphone_line, 'iPhone XS', 'iphone-xs', NULL),
      (v_iphone_line, 'iPhone XR', 'iphone-xr', NULL),
      (v_iphone_line, 'iPhone X', 'iphone-x', NULL)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 5. VARIANTES (variants)
-- =====================================================
-- Pro Max, Plus, Ultra, etc.

CREATE TABLE IF NOT EXISTS variants (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  model_id BIGINT REFERENCES models(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  normalized_name TEXT,
  image_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. CATÁLOGO VISUAL (device_catalog_items)
-- =====================================================
-- Tabla plana para UI rápida con imágenes y display_name

CREATE TABLE IF NOT EXISTS device_catalog_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Foreign keys a cada nivel
  device_type_id BIGINT REFERENCES device_types(id),
  brand_id BIGINT REFERENCES brands(id),
  product_line_id BIGINT REFERENCES product_lines(id),
  model_id BIGINT REFERENCES models(id),
  variant_id BIGINT REFERENCES variants(id),
  
  -- UI fields
  display_name TEXT NOT NULL,
  label TEXT,
  image_url TEXT,
  sort_order TEXT,
  level TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. CHECKLISTS POR DISPOSITIVO (device_checklist_items)
-- =====================================================
-- Items de checklist configurables por tipo de dispositivo

CREATE TABLE IF NOT EXISTS device_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  device_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_order INTEGER DEFAULT 0,
  
  -- Configuración de estados
  status_options JSONB DEFAULT '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(device_type, item_name)
);

-- Seed data: Checklist para iPhone (10 items como en sistema original)
INSERT INTO device_checklist_items (device_type, item_name, item_order, status_options) VALUES
  ('phone', 'Pantalla', 1, '["Funcionando", "Rota", "Reparada", "No probado"]'::jsonb),
  ('phone', 'Botón Home', 2, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Cámara Frontal', 3, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('phone', 'Cámara Trasera', 4, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('phone', 'WiFi', 5, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Bluetooth', 6, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Altavoz', 7, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Micrófono', 8, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Puerto de Carga', 9, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('phone', 'Batería', 10, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  
  -- Checklist para iPad (8 items)
  ('tablet', 'Pantalla', 1, '["Funcionando", "Rota", "Reparada", "No probado"]'::jsonb),
  ('tablet', 'Cámara Frontal', 2, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('tablet', 'Cámara Trasera', 3, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('tablet', 'WiFi', 4, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('tablet', 'Bluetooth', 5, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('tablet', 'Altavoces', 6, '["Funcionando", "Dañados", "Reparados", "No probado"]'::jsonb),
  ('tablet', 'Puerto de Carga', 7, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('tablet', 'Batería', 8, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  
  -- Checklist para Apple Watch (7 items)
  ('wearable', 'Pantalla', 1, '["Funcionando", "Rota", "Reparada", "No probado"]'::jsonb),
  ('wearable', 'Corona Digital', 2, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('wearable', 'Botón Lateral', 3, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('wearable', 'WiFi', 4, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('wearable', 'Bluetooth', 5, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('wearable', 'Sensores', 6, '["Funcionando", "Dañados", "Reparados", "No probado"]'::jsonb),
  ('wearable', 'Batería', 7, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  
  -- Checklist para MacBook (8 items)
  ('laptop', 'Pantalla', 1, '["Funcionando", "Rota", "Reparada", "No probado"]'::jsonb),
  ('laptop', 'Teclado', 2, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('laptop', 'Trackpad', 3, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('laptop', 'Cámaras', 4, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb),
  ('laptop', 'WiFi', 5, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('laptop', 'Bluetooth', 6, '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb),
  ('laptop', 'Puertos USB/Thunderbolt', 7, '["Funcionando", "Dañados", "Reparados", "No probado"]'::jsonb),
  ('laptop', 'Batería', 8, '["Funcionando", "Dañada", "Reparada", "No probado"]'::jsonb)
ON CONFLICT (device_type, item_name) DO NOTHING;

-- =====================================================
-- 8. SERVICIOS (services)
-- =====================================================
-- Servicios con categorías para selector visual

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  category_image_url TEXT,
  default_price NUMERIC(15,0) DEFAULT 0,
  estimated_hours NUMERIC(5,2),
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data: Servicios comunes (se pueden agregar más por empresa)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Usar primera empresa o NULL para genéricos
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    -- Servicios de Pantalla
    INSERT INTO services (company_id, name, description, category, default_price, estimated_hours, is_recommended) VALUES
      (v_company_id, 'Cambio de Pantalla iPhone', 'Reemplazo completo de pantalla', 'Pantalla', 89990, 1.5, true),
      (v_company_id, 'Cambio de Pantalla Samsung', 'Reemplazo completo de pantalla', 'Pantalla', 79990, 1.5, true),
      (v_company_id, 'Cambio de Pantalla Tablet', 'Reemplazo de pantalla de tablet', 'Pantalla', 69990, 1.5, false),
      (v_company_id, 'Reparación de Pantalla', 'Reparación de pantalla (no reemplazo)', 'Pantalla', 35000, 1.0, false),
      
      -- Servicios de Batería
      (v_company_id, 'Cambio de Batería iPhone', 'Reemplazo de batería original', 'Batería', 35000, 0.75, true),
      (v_company_id, 'Cambio de Batería Samsung', 'Reemplazo de batería', 'Batería', 30000, 0.75, true),
      (v_company_id, 'Cambio de Batería Genérico', 'Reemplazo de batería other device', 'Batería', 25000, 0.75, false),
      
      -- Servicios de Cámara
      (v_company_id, 'Cambio de Cámara Frontal', 'Reemplazo de cámara frontal', 'Cámara', 25000, 0.5, false),
      (v_company_id, 'Cambio de Cámara Trasera', 'Reemplazo de cámara trasera', 'Cámara', 35000, 0.5, false),
      
      -- Servicios de Carga
      (v_company_id, 'Reparación Puerto de Carga', 'Reparación o reemplazo del puerto', 'Carga', 20000, 0.5, false),
      
      -- Servicios de Software
      (v_company_id, 'Diagnóstico de Software', 'Evaluación de problemas de software', 'Software', 15000, 0.5, true),
      (v_company_id, 'Instalación de Sistema Operativo', 'Instalación limpia de OS', 'Software', 30000, 1.5, false),
      (v_company_id, 'Limpieza de Software Malicioso', 'Eliminación de virus y malware', 'Software', 25000, 1.0, false),
      (v_company_id, 'Recuperación de Datos', 'Rescate de información del dispositivo', 'Software', 45000, 2.0, false),
      
      -- Servicios de Mantenimiento
      (v_company_id, 'Limpieza Interna', 'Limpieza profunda del dispositivo', 'Mantenimiento', 15000, 0.5, false),
      (v_company_id, 'Upgrade de RAM', 'Instalación de memoria adicional', 'Mantenimiento', 20000, 0.5, false);
  END IF;
END $$;

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Device Types
CREATE INDEX IF NOT EXISTS idx_device_types_code ON device_types(code);
CREATE INDEX IF NOT EXISTS idx_device_types_active ON device_types(is_active);

-- Brands
CREATE INDEX IF NOT EXISTS idx_brands_device_type ON brands(device_type_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- Product Lines
CREATE INDEX IF NOT EXISTS idx_product_lines_brand ON product_lines(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_lines_name ON product_lines(name);
CREATE INDEX IF NOT EXISTS idx_product_lines_active ON product_lines(is_active);

-- Models
CREATE INDEX IF NOT EXISTS idx_models_product_line ON models(product_line_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active);

-- Variants
CREATE INDEX IF NOT EXISTS idx_variants_model ON variants(model_id);
CREATE INDEX IF NOT EXISTS idx_variants_name ON variants(name);

-- Device Catalog Items
CREATE INDEX IF NOT EXISTS idx_device_catalog_type ON device_catalog_items(device_type_id);
CREATE INDEX IF NOT EXISTS idx_device_catalog_brand ON device_catalog_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_device_catalog_line ON device_catalog_items(product_line_id);
CREATE INDEX IF NOT EXISTS idx_device_catalog_model ON device_catalog_items(model_id);
CREATE INDEX IF NOT EXISTS idx_device_catalog_variant ON device_catalog_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_device_catalog_display ON device_catalog_items(display_name);
CREATE INDEX IF NOT EXISTS idx_device_catalog_active ON device_catalog_items(is_active);

-- Device Checklist Items
CREATE INDEX IF NOT EXISTS idx_device_checklist_type ON device_checklist_items(device_type);
CREATE INDEX IF NOT EXISTS idx_device_checklist_order ON device_checklist_items(item_order);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_recommended ON services(is_recommended);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'device_types',
    'brands',
    'product_lines',
    'models',
    'variants',
    'device_catalog_items',
    'device_checklist_items',
    'services'
  )
ORDER BY tablename;

-- Deberías ver 8 tablas

-- Verificar seed data
SELECT 'device_types' as table_name, COUNT(*) as count FROM device_types
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'product_lines', COUNT(*) FROM product_lines
UNION ALL
SELECT 'models', COUNT(*) FROM models
UNION ALL
SELECT 'variants', COUNT(*) FROM variants
UNION ALL
SELECT 'device_catalog_items', COUNT(*) FROM device_catalog_items
UNION ALL
SELECT 'device_checklist_items', COUNT(*) FROM device_checklist_items
UNION ALL
SELECT 'services', COUNT(*) FROM services;

-- Deberías ver:
-- device_types: 6
-- brands: 11
-- product_lines: 11
-- models: ~25 (iPhone models)
-- variants: 0 (se agregan según necesidad)
-- device_catalog_items: 0 (se puede poblar después)
-- device_checklist_items: 33
-- services: ~16 (si hay empresa)
