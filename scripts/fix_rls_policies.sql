-- ============================================================
-- FIX RLS POLICIES - EJECUTAR EN SUPABASE SQL EDITOR
-- ============================================================

-- 0. Eliminar TODAS las políticas existentes en las tablas afectadas
-- Obtenemos los nombres de políticas y las eliminamos dinámicamente

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' 
        AND tablename IN ('users', 'customers', 'branches', 'work_orders', 'services')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.policyname, rec.tablename);
    END LOOP;
END $$;

-- 1. Disable RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 3. Crear policies simples - permitir todo para usuarios autenticados
-- Users: permitir lectura y escritura
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_delete" ON users FOR DELETE USING (auth.uid() IS NOT NULL);

-- Customers: permitir todo
CREATE POLICY "customers_select" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Branches: permitir todo
CREATE POLICY "branches_select" ON branches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "branches_insert" ON branches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "branches_update" ON branches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "branches_delete" ON branches FOR DELETE USING (auth.uid() IS NOT NULL);

-- Work Orders: permitir todo
CREATE POLICY "work_orders_select" ON work_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "work_orders_insert" ON work_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "work_orders_update" ON work_orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "work_orders_delete" ON work_orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Services: permitir todo
CREATE POLICY "services_select" ON services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "services_update" ON services FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "services_delete" ON services FOR DELETE USING (auth.uid() IS NOT NULL);

-- Verificar
SELECT policyname, cmd, tablename FROM pg_policies WHERE schemaname = 'public';