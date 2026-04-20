-- =====================================================
-- SISGO UNIFICADO - SCRIPT 06: ÍNDICES Y TRIGGERS
-- =====================================================
-- Este script crea:
-- - Triggers para updated_at
-- - Triggers para cálculos automáticos
-- - Función para generar números de orden
-- Ejecutar DESPUÉS de 05-restaurant-module.sql
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN PARA UPDATED_AT
-- =====================================================
-- Trigger genérico para actualizar updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGERS UPDATED_AT PARA TODAS LAS TABLAS
-- =====================================================

-- Companies
DROP TRIGGER IF EXISTS set_companies_updated_at ON companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Branches
DROP TRIGGER IF EXISTS set_branches_updated_at ON branches;
CREATE TRIGGER set_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Users
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Customers
DROP TRIGGER IF EXISTS set_customers_updated_at ON customers;
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Work Orders
DROP TRIGGER IF EXISTS set_work_orders_updated_at ON work_orders;
CREATE TRIGGER set_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Quotes
DROP TRIGGER IF EXISTS set_quotes_updated_at ON quotes;
CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Products
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Suppliers
DROP TRIGGER IF EXISTS set_suppliers_updated_at ON suppliers;
CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Purchases
DROP TRIGGER IF EXISTS set_purchases_updated_at ON purchases;
CREATE TRIGGER set_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Catalog Services
DROP TRIGGER IF EXISTS set_catalog_services_updated_at ON catalog_services;
CREATE TRIGGER set_catalog_services_updated_at
  BEFORE UPDATE ON catalog_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Menu Categories
DROP TRIGGER IF EXISTS set_menu_categories_updated_at ON menu_categories;
CREATE TRIGGER set_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Menu Items
DROP TRIGGER IF EXISTS set_menu_items_updated_at ON menu_items;
CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ingredients
DROP TRIGGER IF EXISTS set_ingredients_updated_at ON ingredients;
CREATE TRIGGER set_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recipes
DROP TRIGGER IF EXISTS set_recipes_updated_at ON recipes;
CREATE TRIGGER set_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Restaurant Tables
DROP TRIGGER IF EXISTS set_restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER set_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Restaurant Orders
DROP TRIGGER IF EXISTS set_restaurant_orders_updated_at ON restaurant_orders;
CREATE TRIGGER set_restaurant_orders_updated_at
  BEFORE UPDATE ON restaurant_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Savings Funds
DROP TRIGGER IF EXISTS set_savings_funds_updated_at ON savings_funds;
CREATE TRIGGER set_savings_funds_updated_at
  BEFORE UPDATE ON savings_funds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. FUNCIÓN PARA GENERAR NÚMERO DE ORDEN
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_number(
  p_company_id UUID,
  p_prefix TEXT DEFAULT 'OT',
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_sequence INTEGER;
  v_order_number TEXT;
BEGIN
  -- Obtener año
  v_year := EXTRACT(YEAR FROM p_date);
  
  -- Obtener siguiente número de secuencia
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM POSITION('-' IN order_number) + 1) AS INTEGER)
  ), 0) + 1 INTO v_sequence
  FROM work_orders
  WHERE company_id = p_company_id
    AND order_number LIKE p_prefix || '-' || v_year || '-%';
  
  -- Generar número
  v_order_number := p_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. FUNCIÓN PARA GENERAR NÚMERO DE COTIZACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION generate_quote_number(
  p_company_id UUID,
  p_prefix TEXT DEFAULT 'COT',
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_sequence INTEGER;
  v_quote_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM p_date);
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM POSITION('-' IN quote_number) + 1) AS INTEGER)
  ), 0) + 1 INTO v_sequence
  FROM quotes
  WHERE company_id = p_company_id
    AND quote_number LIKE p_prefix || '-' || v_year || '-%';
  
  v_quote_number := p_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_quote_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCIÓN PARA GENERAR NÚMERO DE ORDEN RESTAURANTE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_restaurant_order_number(
  p_company_id UUID,
  p_prefix TEXT DEFAULT 'RO',
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_sequence INTEGER;
  v_order_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM p_date);
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM POSITION('-' IN order_number) + 1) AS INTEGER)
  ), 0) + 1 INTO v_sequence
  FROM restaurant_orders
  WHERE company_id = p_company_id
    AND order_number LIKE p_prefix || '-' || v_year || '-%';
  
  v_order_number := p_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER PARA CALCULAR TOTALES DE ORDEN
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total de la orden
  UPDATE work_orders
  SET 
    total_cost = COALESCE((
      SELECT SUM(total_price) 
      FROM order_items 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ), 0),
    total_price = COALESCE((
      SELECT SUM(total_price) 
      FROM order_items 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_order_totals ON order_items;
CREATE TRIGGER trg_calculate_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_totals();

-- =====================================================
-- 7. TRIGGER PARA CALCULAR TOTALES DE COTIZACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal_materials NUMERIC(15,0);
  v_subtotal_services NUMERIC(15,0);
  v_subtotal_general NUMERIC(15,0);
  v_iva NUMERIC(15,0);
  v_profit NUMERIC(15,0);
  v_total NUMERIC(15,0);
  v_quote_id UUID;
  v_iva_percentage NUMERIC(5,2);
  v_profit_percentage NUMERIC(5,2);
BEGIN
  v_quote_id := COALESCE(NEW.quote_id, OLD.quote_id);
  
  -- Obtener configuración de la cotización
  SELECT iva_percentage, profit_margin_percentage 
  INTO v_iva_percentage, v_profit_percentage
  FROM quotes 
  WHERE id = v_quote_id;
  
  -- Calcular subtotales
  SELECT COALESCE(SUM(CASE WHEN item_type = 'material' THEN total_price ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN item_type = 'service' THEN total_price ELSE 0 END), 0)
  INTO v_subtotal_materials, v_subtotal_services
  FROM quote_items
  WHERE quote_id = v_quote_id;
  
  v_subtotal_general := v_subtotal_materials + v_subtotal_services;
  v_profit := (v_subtotal_general * v_profit_percentage) / 100;
  v_iva := ((v_subtotal_general + v_profit) * v_iva_percentage) / 100;
  v_total := v_subtotal_general + v_profit + v_iva;
  
  -- Actualizar cotización
  UPDATE quotes
  SET 
    subtotal_materials = v_subtotal_materials,
    subtotal_services = v_subtotal_services,
    subtotal_general = v_subtotal_general,
    profit_margin = v_profit,
    iva_amount = v_iva,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_quote_totals ON quote_items;
CREATE TRIGGER trg_calculate_quote_totals
  AFTER INSERT OR UPDATE OR DELETE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quote_totals();

-- =====================================================
-- 8. TRIGGER PARA CALCULAR TOTALES DE COMPRA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_purchase_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchases
  SET 
    total = COALESCE((
      SELECT SUM(total_price) 
      FROM purchase_items 
      WHERE purchase_id = COALESCE(NEW.purchase_id, OLD.purchase_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_purchase_totals ON purchase_items;
CREATE TRIGGER trg_calculate_purchase_totals
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purchase_totals();

-- =====================================================
-- 9. TRIGGER PARA CALCULAR COSTO DE RECETA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_recipe_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET 
    cost_per_unit = COALESCE((
      SELECT SUM(ri.quantity * i.cost_price)
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_recipe_cost ON recipe_ingredients;
CREATE TRIGGER trg_calculate_recipe_cost
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION calculate_recipe_cost();

-- =====================================================
-- 10. TRIGGER PARA CALCULAR TOTALES DE ORDEN RESTAURANTE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_restaurant_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(15,0);
  v_tax NUMERIC(15,0);
  v_total NUMERIC(15,0);
  v_order_id UUID;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  
  -- Calcular subtotal
  SELECT COALESCE(SUM(total_price), 0)
  INTO v_subtotal
  FROM restaurant_order_items
  WHERE order_id = v_order_id;
  
  -- Calcular IVA (19%)
  v_tax := (v_subtotal * 19) / 100;
  v_total := v_subtotal + v_tax;
  
  -- Actualizar orden
  UPDATE restaurant_orders
  SET 
    subtotal = v_subtotal,
    tax = v_tax,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_restaurant_order_totals ON restaurant_order_items;
CREATE TRIGGER trg_calculate_restaurant_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON restaurant_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_restaurant_order_totals();

-- =====================================================
-- 11. FUNCIÓN PARA ACTUALIZAR STOCK
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_id UUID,
  p_quantity NUMERIC(10,2),
  p_direction stock_movement_type
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET 
    stock = CASE 
      WHEN p_direction = 'IN' THEN stock + p_quantity
      WHEN p_direction = 'OUT' THEN stock - p_quantity
      ELSE p_quantity  -- ADJUST
    END,
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. FUNCIÓN PARA ACTUALIZAR BALANCE DE CAJA DE AHORRO
-- =====================================================

CREATE OR REPLACE FUNCTION update_savings_fund_balance(
  p_fund_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_deposits NUMERIC(15,0);
  v_withdrawals NUMERIC(15,0);
  v_balance NUMERIC(15,0);
BEGIN
  -- Calcular totales
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)
  INTO v_deposits, v_withdrawals
  FROM savings_fund_movements
  WHERE savings_fund_id = p_fund_id;
  
  v_balance := v_deposits - v_withdrawals;
  
  -- Actualizar fondo
  UPDATE savings_funds
  SET 
    current_balance = v_balance,
    total_deposits = v_deposits,
    total_withdrawals = v_withdrawals,
    updated_at = NOW()
  WHERE id = p_fund_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER PARA ACTUALIZAR BALANCE DE CAJA DE AHORRO
-- =====================================================

CREATE OR REPLACE FUNCTION trg_update_savings_balance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_savings_fund_balance(COALESCE(NEW.savings_fund_id, OLD.savings_fund_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_savings_fund_balance ON savings_fund_movements;
CREATE TRIGGER trg_update_savings_fund_balance
  AFTER INSERT OR UPDATE OR DELETE ON savings_fund_movements
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_savings_balance();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar triggers creados
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Deberías ver 40+ triggers
