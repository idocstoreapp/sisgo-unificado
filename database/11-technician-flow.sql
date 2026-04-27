-- =====================================================
-- SISGO UNIFICADO - SCRIPT 11: FLUJO TÉCNICO
-- =====================================================
-- Agrega soporte completo para el flujo de técnicos:
-- - Nuevos estados en work_order_status
-- - Columnas en work_orders
-- - Tablas repair_parts y technician_commissions
-- =====================================================

-- 1. Modificar ENUM work_order_status
-- PostgreSQL no permite ALTER TYPE ADD VALUE IF NOT EXISTS de manera limpia dentro de una transacción en todas las versiones,
-- pero sí a partir de PG 12 si no está en bloque de transacción.
-- Supabase usa PG 15+.
DO $$ BEGIN
  ALTER TYPE work_order_status ADD VALUE 'pendiente';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE work_order_status ADD VALUE 'en_reparacion';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Modificar work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS repair_completed_at TIMESTAMP WITH TIME ZONE;
-- Usaremos payment_method que ya existe, pero si el técnico cambia a un método diferente al final, 
-- sobreescribe o usa el mismo. Según plan no crearemos otro.

-- 3. Crear repair_parts
CREATE TABLE IF NOT EXISTS repair_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  
  description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,0) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear technician_commissions
CREATE TABLE IF NOT EXISTS technician_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  commission_amount NUMERIC(15,0) NOT NULL DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS repair_parts
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_parts_select" ON repair_parts;
CREATE POLICY "repair_parts_select"
  ON repair_parts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = repair_parts.work_order_id
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.company_id = wo.company_id
        )
    )
  );

DROP POLICY IF EXISTS "repair_parts_insert" ON repair_parts;
CREATE POLICY "repair_parts_insert"
  ON repair_parts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.company_id = wo.company_id
        )
    )
  );

DROP POLICY IF EXISTS "repair_parts_delete" ON repair_parts;
CREATE POLICY "repair_parts_delete"
  ON repair_parts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = repair_parts.work_order_id
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.company_id = wo.company_id
        )
    )
  );

-- 6. RLS technician_commissions
ALTER TABLE technician_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technician_commissions_select" ON technician_commissions;
CREATE POLICY "technician_commissions_select"
  ON technician_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND (
          users.role IN ('super_admin', 'admin', 'encargado') OR 
          technician_commissions.technician_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "technician_commissions_insert" ON technician_commissions;
CREATE POLICY "technician_commissions_insert"
  ON technician_commissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'encargado', 'technician')
    )
  );

DROP POLICY IF EXISTS "technician_commissions_update" ON technician_commissions;
CREATE POLICY "technician_commissions_update"
  ON technician_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'admin', 'encargado')
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_repair_parts_wo ON repair_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tech_comm_wo ON technician_commissions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tech_comm_tech ON technician_commissions(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_comm_status ON technician_commissions(payment_status);
