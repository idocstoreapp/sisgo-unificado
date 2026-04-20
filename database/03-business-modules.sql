-- =====================================================
-- SISGO UNIFICADO - SCRIPT 03: MÓDULOS DE NEGOCIO
-- =====================================================
-- Este script crea:
-- work_orders, order_items, quotes, products, stock
-- Ejecutar DESPUÉS de 02-core-tables.sql
-- =====================================================

-- =====================================================
-- 1. ÓRDENES DE TRABAJO (work_orders)
-- =====================================================
-- Órdenes principales de servicio técnico/taller

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Identificación
  order_number TEXT NOT NULL,
  business_type TEXT NOT NULL,
  
  -- Metadata específica del negocio (JSONB flexible)
  -- Servicio Técnico: device_type, device_model, serial, checklist_data
  -- Taller Mecánico: vehicle_id, mileage, fuel_level, plate
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Estado y prioridad
  status work_order_status NOT NULL DEFAULT 'en_proceso',
  priority priority_level DEFAULT 'media',
  
  -- Fechas
  commitment_date DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Costos y precios (SIN decimales - NUMERIC(15,0))
  replacement_cost NUMERIC(15,0) DEFAULT 0,
  labor_cost NUMERIC(15,0) DEFAULT 0,
  total_cost NUMERIC(15,0) DEFAULT 0,
  total_price NUMERIC(15,0) DEFAULT 0,
  
  -- Pago
  payment_method payment_method,
  receipt_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Garantía
  warranty_days INTEGER DEFAULT 30,
  warranty_expires_at DATE,
  
  -- Notas
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, order_number)
);

-- =====================================================
-- 2. ITEMS DE ÓRDENES (order_items)
-- =====================================================
-- Servicios/productos incluidos en cada orden

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. NOTAS DE ÓRDENES (order_notes)
-- =====================================================
-- Notas internas o públicas de las órdenes

CREATE TABLE IF NOT EXISTS order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Nota
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'internal' CHECK (note_type IN ('internal', 'public')),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. COTIZACIONES (quotes)
-- =====================================================
-- Cotizaciones de mueblería

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Identificación
  quote_number TEXT NOT NULL,
  
  -- Estado
  status quote_status NOT NULL DEFAULT 'borrador',
  
  -- Cálculos (SIN decimales)
  subtotal_materials NUMERIC(15,0) DEFAULT 0,
  subtotal_services NUMERIC(15,0) DEFAULT 0,
  subtotal_general NUMERIC(15,0) DEFAULT 0,
  iva_amount NUMERIC(15,0) DEFAULT 0,
  profit_margin NUMERIC(15,0) DEFAULT 0,
  total NUMERIC(15,0) DEFAULT 0,
  
  -- Configuración
  profit_margin_percentage NUMERIC(5,2) DEFAULT 30.00,
  iva_percentage NUMERIC(5,2) DEFAULT 19.00,
  
  -- Fechas
  valid_until DATE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata del proyecto
  project_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, quote_number)
);

-- =====================================================
-- 5. ITEMS DE COTIZACIÓN (quote_items)
-- =====================================================
-- Materiales y servicios en cotizaciones

CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Tipo
  item_type TEXT NOT NULL CHECK (item_type IN ('material', 'service')),
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_type unit_type DEFAULT 'un',
  unit_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. PAGOS DE COTIZACIÓN (quote_payments)
-- =====================================================
-- Pagos recibidos en cotizaciones aceptadas

CREATE TABLE IF NOT EXISTS quote_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Pago
  amount NUMERIC(15,0) NOT NULL,
  payment_method payment_method,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Referencia
  reference_number TEXT,
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PRODUCTOS (products)
-- =====================================================
-- Productos/repuestos para inventario (taller mecánico)

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('producto', 'servicio')),
  category TEXT,
  barcode TEXT,
  image_url TEXT,
  
  -- Precios (SIN decimales)
  cost_price NUMERIC(15,0) DEFAULT 0,
  sale_price NUMERIC(15,0) DEFAULT 0,
  
  -- Stock
  stock NUMERIC(10,2) DEFAULT 0,
  min_stock NUMERIC(10,2) DEFAULT 5,
  unit_type unit_type DEFAULT 'un',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. PROVEEDORES (suppliers)
-- =====================================================
-- Proveedores de repuestos/materiales

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  contact_info TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  rut TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. COMPRAS (purchases)
-- =====================================================
-- Compras a proveedores

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Factura
  invoice_number TEXT,
  invoice_date DATE,
  
  -- Total (SIN decimales)
  total NUMERIC(15,0) NOT NULL DEFAULT 0,
  
  -- Pago
  payment_method payment_method,
  status purchase_status DEFAULT 'pending',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. ITEMS DE COMPRA (purchase_items)
-- =====================================================
-- Items en compras a proveedores

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Información
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(15,0) NOT NULL,
  total_price NUMERIC(15,0) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. MOVIMIENTOS DE STOCK (stock_movements)
-- =====================================================
-- Auditoría de movimientos de inventario

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Movimiento
  quantity NUMERIC(10,2) NOT NULL,
  direction stock_movement_type NOT NULL,
  reason TEXT,
  
  -- Referencia
  reference_id UUID,
  reference_type TEXT,
  
  -- Responsable
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. CATÁLOGO DE MUEBLES (furniture_catalog)
-- =====================================================
-- Catálogo de muebles para mueblería

CREATE TABLE IF NOT EXISTS furniture_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price NUMERIC(15,0) DEFAULT 0,
  image_url TEXT,
  
  -- Variantes
  has_variants BOOLEAN DEFAULT false,
  variants_config JSONB DEFAULT '{}'::jsonb,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MÓDULOS DE NEGOCIO
-- =====================================================

-- Work Orders
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_branch ON work_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created ON work_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(order_number);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Order Notes
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);

-- Quotes
CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);

-- Quote Items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

-- Quote Payments
CREATE INDEX IF NOT EXISTS idx_quote_payments_quote ON quote_payments(quote_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(invoice_date);

-- Purchase Items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_direction ON stock_movements(direction);

-- Furniture Catalog
CREATE INDEX IF NOT EXISTS idx_furniture_catalog_company ON furniture_catalog(company_id);
CREATE INDEX IF NOT EXISTS idx_furniture_catalog_category ON furniture_catalog(category);
CREATE INDEX IF NOT EXISTS idx_furniture_catalog_active ON furniture_catalog(is_active);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'work_orders',
    'order_items',
    'order_notes',
    'quotes',
    'quote_items',
    'quote_payments',
    'products',
    'suppliers',
    'purchases',
    'purchase_items',
    'stock_movements',
    'furniture_catalog'
  )
ORDER BY tablename;

-- Deberías ver 12 tablas
