-- =====================================================
-- SISGO UNIFICADO - SCRIPT 07: POLÍTICAS RLS
-- =====================================================
-- Este script crea políticas de Row Level Security
-- para todas las tablas del sistema
-- Ejecutar DESPUÉS de 06-indexes-and-triggers.sql
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE SOBRE RLS
-- =====================================================
-- RLS asegura que cada usuario solo vea datos de SU empresa
-- Las políticas usan auth.uid() para identificar al usuario
-- y verifican su company_id a través de la tabla users

-- =====================================================
-- 1. EMPRESAS (companies)
-- =====================================================
-- Los usuarios solo ven su propia empresa

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their company" ON companies;
CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = companies.id
    )
  );

-- Super admin puede actualizar su empresa
DROP POLICY IF EXISTS "Super admin can update company" ON companies;
CREATE POLICY "Super admin can update company"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = companies.id
        AND users.role = 'super_admin'
    )
  );

-- =====================================================
-- 2. SUCURSALES (branches)
-- =====================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their branches" ON branches;
CREATE POLICY "Users can view their branches"
  ON branches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = branches.company_id
    )
  );

DROP POLICY IF EXISTS "Admin can manage branches" ON branches;
CREATE POLICY "Admin can manage branches"
  ON branches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = branches.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 3. USUARIOS (users)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio registro
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admin puede ver todos los usuarios de su empresa
DROP POLICY IF EXISTS "Admin can view company users" ON users;
CREATE POLICY "Admin can view company users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
        AND admin_user.company_id = users.company_id
        AND admin_user.role IN ('super_admin', 'admin')
    )
  );

-- Super admin puede gestionar usuarios de su empresa
DROP POLICY IF EXISTS "Super admin can manage users" ON users;
CREATE POLICY "Super admin can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()
        AND admin_user.company_id = users.company_id
        AND admin_user.role = 'super_admin'
    )
  );

-- =====================================================
-- 4. CLIENTES (customers)
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company customers" ON customers;
CREATE POLICY "Users can view company customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = customers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can manage company customers" ON customers;
CREATE POLICY "Users can manage company customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = customers.company_id
    )
  );

-- =====================================================
-- 5. ÓRDENES DE TRABAJO (work_orders)
-- =====================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company orders" ON work_orders;
CREATE POLICY "Users can view company orders"
  ON work_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = work_orders.company_id
    )
  );

-- Técnicos solo ven órdenes asignadas
DROP POLICY IF EXISTS "Technicians can view assigned orders" ON work_orders;
CREATE POLICY "Technicians can view assigned orders"
  ON work_orders FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = work_orders.company_id
        AND users.role IN ('super_admin', 'admin', 'encargado')
    )
  );

DROP POLICY IF EXISTS "Users can manage company orders" ON work_orders;
CREATE POLICY "Users can manage company orders"
  ON work_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = work_orders.company_id
        AND users.role IN ('super_admin', 'admin', 'technician', 'encargado')
    )
  );

-- =====================================================
-- 6. ITEMS DE ORDEN (order_items)
-- =====================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      JOIN users u ON u.company_id = wo.company_id
      WHERE wo.id = order_items.order_id
        AND u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage order items" ON order_items;
CREATE POLICY "Users can manage order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      JOIN users u ON u.company_id = wo.company_id
      WHERE wo.id = order_items.order_id
        AND u.id = auth.uid()
    )
  );

-- =====================================================
-- 7. COTIZACIONES (quotes)
-- =====================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company quotes" ON quotes;
CREATE POLICY "Users can view company quotes"
  ON quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = quotes.company_id
    )
  );

DROP POLICY IF EXISTS "Users can manage company quotes" ON quotes;
CREATE POLICY "Users can manage company quotes"
  ON quotes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = quotes.company_id
        AND users.role IN ('super_admin', 'admin', 'vendedor')
    )
  );

-- =====================================================
-- 8. PRODUCTOS (products)
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company products" ON products;
CREATE POLICY "Users can view company products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = products.company_id
    )
  );

DROP POLICY IF EXISTS "Users can manage company products" ON products;
CREATE POLICY "Users can manage company products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = products.company_id
        AND users.role IN ('super_admin', 'admin', 'mechanic')
    )
  );

-- =====================================================
-- 9. PROVEEDORES (suppliers)
-- =====================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company suppliers" ON suppliers;
CREATE POLICY "Users can view company suppliers"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = suppliers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can manage company suppliers" ON suppliers;
CREATE POLICY "Users can manage company suppliers"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = suppliers.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 10. COMPRAS (purchases)
-- =====================================================

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company purchases" ON purchases;
CREATE POLICY "Users can view company purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = purchases.company_id
    )
  );

DROP POLICY IF EXISTS "Users can manage company purchases" ON purchases;
CREATE POLICY "Users can manage company purchases"
  ON purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = purchases.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 11. MOVIMIENTOS DE STOCK (stock_movements)
-- =====================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company stock movements" ON stock_movements;
CREATE POLICY "Users can view company stock movements"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = stock_movements.company_id
    )
  );

-- =====================================================
-- 12. RESTAURANTE - MESAS
-- =====================================================

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view restaurant tables" ON restaurant_tables;
CREATE POLICY "Users can view restaurant tables"
  ON restaurant_tables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = restaurant_tables.company_id
    )
  );

DROP POLICY IF EXISTS "Restaurant staff can manage tables" ON restaurant_tables;
CREATE POLICY "Restaurant staff can manage tables"
  ON restaurant_tables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = restaurant_tables.company_id
        AND users.role IN ('super_admin', 'admin', 'mesero', 'encargado')
    )
  );

-- =====================================================
-- 13. RESTAURANTE - MENÚ (público para SELECT)
-- =====================================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- El menú es público (para menú digital)
DROP POLICY IF EXISTS "Menu categories are public" ON menu_categories;
CREATE POLICY "Menu categories are public"
  ON menu_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Menu items are public" ON menu_items;
CREATE POLICY "Menu items are public"
  ON menu_items FOR SELECT
  USING (true);

-- Solo admin puede gestionar menú
DROP POLICY IF EXISTS "Admin can manage menu categories" ON menu_categories;
CREATE POLICY "Admin can manage menu categories"
  ON menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = menu_categories.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage menu items" ON menu_items;
CREATE POLICY "Admin can manage menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = menu_items.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 14. RESTAURANTE - ÓRDENES
-- =====================================================

ALTER TABLE restaurant_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view restaurant orders" ON restaurant_orders;
CREATE POLICY "Staff can view restaurant orders"
  ON restaurant_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = restaurant_orders.company_id
    )
  );

DROP POLICY IF EXISTS "Waiters can manage restaurant orders" ON restaurant_orders;
CREATE POLICY "Waiters can manage restaurant orders"
  ON restaurant_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = restaurant_orders.company_id
        AND users.role IN ('super_admin', 'admin', 'mesero', 'encargado')
    )
  );

-- =====================================================
-- 15. FINANZAS - PAGOS A EMPLEADOS
-- =====================================================

ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company payments" ON employee_payments;
CREATE POLICY "Users can view company payments"
  ON employee_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = employee_payments.company_id
    )
  );

-- Técnicos solo ven sus propios pagos
DROP POLICY IF EXISTS "Technicians can view own payments" ON employee_payments;
CREATE POLICY "Technicians can view own payments"
  ON employee_payments FOR SELECT
  USING (
    technician_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.company_id = employee_payments.company_id
        AND users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Deberías ver 30+ políticas
