-- =====================================================
-- SISGO UNIFICADO - SCRIPT 05: MÓDULO RESTAURANTE
-- =====================================================
-- Este script crea todas las tablas del restaurante:
-- tables, menu, orders, ingredients, recipes, tips
-- Ejecutar DESPUÉS de 04-finance-module.sql
-- =====================================================

-- =====================================================
-- 1. MESAS (restaurant_tables)
-- =====================================================
-- Mesas del restaurante con estados

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  location TEXT, -- 'terraza', 'interior', 'barra', etc.
  
  -- Estado
  status table_status DEFAULT 'disponible',
  current_order_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, table_number)
);

-- =====================================================
-- 2. CATEGORÍAS DEL MENÚ (menu_categories)
-- =====================================================
-- Categorías de platos del menú

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  visual_type visual_type, -- 'hero', 'list', 'drink'
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PLATOS DEL MENÚ (menu_items)
-- =====================================================
-- Platos individuales del menú

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15,0) NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'plato', -- 'plato', 'bebida', 'postre', etc.
  
  -- Visual
  image_url TEXT,
  visual_type visual_type,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Disponibilidad
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER, -- en minutos
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INGREDIENTES (ingredients)
-- =====================================================
-- Ingredientes con control de stock

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  unit unit_type NOT NULL DEFAULT 'un',
  
  -- Stock
  stock_current NUMERIC(10,2) DEFAULT 0,
  stock_min NUMERIC(10,2) DEFAULT 5,
  
  -- Precio (SIN decimales)
  cost_price NUMERIC(15,0) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RECETAS (recipes)
-- =====================================================
-- Recetas de platos (vincula menú con ingredientes)

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  
  -- Costo (SIN decimales)
  cost_per_unit NUMERIC(15,0) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INGREDIENTES DE RECETA (recipe_ingredients)
-- =====================================================
-- Ingredientes necesarios por receta

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  
  -- Cantidad
  quantity NUMERIC(10,2) NOT NULL,
  unit unit_type NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(recipe_id, ingredient_id)
);

-- =====================================================
-- 7. ÓRDENES DE RESTAURANTE (restaurant_orders)
-- =====================================================
-- Órdenes de mesas/restaurante

CREATE TABLE IF NOT EXISTS restaurant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Identificación
  order_number TEXT NOT NULL,
  
  -- Tipo de pedido
  order_type order_type DEFAULT 'barra',
  
  -- Estado
  status restaurant_order_status DEFAULT 'pending',
  
  -- Totales (SIN decimales)
  subtotal NUMERIC(15,0) DEFAULT 0,
  tax NUMERIC(15,0) DEFAULT 0,
  total NUMERIC(15,0) DEFAULT 0,
  
  -- Propinas
  waiter_tip NUMERIC(15,0) DEFAULT 0,
  calculated_tip NUMERIC(15,0) DEFAULT 0, -- 10% automático
  
  -- Pago
  payment_method payment_method,
  notes TEXT,
  
  -- Fechas
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_week INTEGER,
  payout_year INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, order_number)
);

-- =====================================================
-- 8. ITEMS DE ORDEN RESTAURANTE (restaurant_order_items)
-- =====================================================
-- Platos en cada orden de restaurante

CREATE TABLE IF NOT EXISTS restaurant_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  
  -- Personalización
  notes TEXT, -- JSON con modificaciones (sin cebolla, extra queso, etc.)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. PROPINAS DE EMPLEADOS (employee_tips)
-- =====================================================
-- Distribución de propinas

CREATE TABLE IF NOT EXISTS employee_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES restaurant_orders(id) ON DELETE SET NULL,
  
  -- Propina
  amount NUMERIC(15,0) NOT NULL,
  
  -- Período
  period_week INTEGER,
  period_month INTEGER,
  period_year INTEGER,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. TRABAJOS DE IMPRESIÓN (print_jobs)
-- =====================================================
-- Cola de impresión para comandas/boletas

CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Trabajo
  order_id UUID REFERENCES restaurant_orders(id) ON DELETE SET NULL,
  print_type TEXT NOT NULL CHECK (print_type IN ('comanda', 'boleta', 'cocina', 'barra')),
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'printed', 'failed')),
  
  -- Contenido
  content JSONB DEFAULT '{}'::jsonb,
  printer_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  printed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ÍNDICES PARA MÓDULO RESTAURANTE
-- =====================================================

-- Restaurant Tables
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_company ON restaurant_tables(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_location ON restaurant_tables(location);

-- Menu Categories
CREATE INDEX IF NOT EXISTS idx_menu_categories_company ON menu_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_visual ON menu_categories(visual_type);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_company ON menu_items(company_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_visual ON menu_items(visual_type);

-- Ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_company ON ingredients(company_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_supplier ON ingredients(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(stock_current);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Recipes
CREATE INDEX IF NOT EXISTS idx_recipes_company ON recipes(company_id);
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON recipes(menu_item_id);

-- Recipe Ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- Restaurant Orders
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_company ON restaurant_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_table ON restaurant_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_waiter ON restaurant_orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status ON restaurant_orders(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_created ON restaurant_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_number ON restaurant_orders(order_number);

-- Restaurant Order Items
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_order ON restaurant_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_menu_item ON restaurant_order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_status ON restaurant_order_items(status);

-- Employee Tips
CREATE INDEX IF NOT EXISTS idx_employee_tips_company ON employee_tips(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_tips_employee ON employee_tips(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_tips_order ON employee_tips(order_id);
CREATE INDEX IF NOT EXISTS idx_employee_tips_period ON employee_tips(period_year, period_month, period_week);

-- Print Jobs
CREATE INDEX IF NOT EXISTS idx_print_jobs_company ON print_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_order ON print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'restaurant_tables',
    'menu_categories',
    'menu_items',
    'ingredients',
    'recipes',
    'recipe_ingredients',
    'restaurant_orders',
    'restaurant_order_items',
    'employee_tips',
    'print_jobs'
  )
ORDER BY tablename;

-- Deberías ver 10 tablas
