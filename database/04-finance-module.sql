-- =====================================================
-- SISGO UNIFICADO - SCRIPT 04: MÓDULO FINANCIERO
-- =====================================================
-- Este script crea todas las tablas financieras:
-- employee_payments, expenses, salary_adjustments,
-- savings_funds, settlements
-- Ejecutar DESPUÉS de 03-business-modules.sql
-- =====================================================

-- =====================================================
-- 1. PAGOS A EMPLEADOS (employee_payments)
-- =====================================================
-- Registro de pagos con comisiones calculadas

CREATE TABLE IF NOT EXISTS employee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Orden relacionada
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  
  -- Período
  week_start DATE,
  month INTEGER,
  year INTEGER,
  
  -- Costos (SIN decimales)
  repair_cost NUMERIC(15,0) DEFAULT 0,
  replacement_cost NUMERIC(15,0) DEFAULT 0,
  total_charged NUMERIC(15,0) DEFAULT 0,
  
  -- Comisión
  commission_percentage NUMERIC(5,2) DEFAULT 40.00,
  commission_amount NUMERIC(15,0) DEFAULT 0,
  
  -- Estado de pago
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_week INTEGER,
  payout_year INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. GASTOS GENERALES (expenses)
-- =====================================================
-- Gastos generales de la empresa/sucursal

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Gasto
  description TEXT NOT NULL,
  amount NUMERIC(15,0) NOT NULL,
  category TEXT,
  
  -- Fecha y pago
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method,
  
  -- Comprobante
  receipt_url TEXT,
  invoice_number TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. GASTOS MENORES (small_expenses)
-- =====================================================
-- Gastos pequeños diarios (caja chica)

CREATE TABLE IF NOT EXISTS small_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Gasto
  description TEXT NOT NULL,
  amount NUMERIC(15,0) NOT NULL,
  category TEXT,
  
  -- Fecha y pago
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. AJUSTES DE SUELDO (salary_adjustments)
-- =====================================================
-- Adelantos, descuentos, bonificaciones, préstamos

CREATE TABLE IF NOT EXISTS salary_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Tipo
  type adjustment_type NOT NULL,
  amount NUMERIC(15,0) NOT NULL,
  note TEXT,
  
  -- Disponibilidad
  available_from DATE DEFAULT CURRENT_DATE,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. APLICACIÓN DE AJUSTES (salary_adjustment_applications)
-- =====================================================
-- Registro de cuándo se aplican los ajustes

CREATE TABLE IF NOT EXISTS salary_adjustment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  adjustment_id UUID NOT NULL REFERENCES salary_adjustments(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Período
  week_start DATE,
  month INTEGER,
  year INTEGER,
  
  -- Monto aplicado
  applied_amount NUMERIC(15,0) NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. LIQUIDACIONES (salary_settlements)
-- =====================================================
-- Liquidaciones semanales/mensuales

CREATE TABLE IF NOT EXISTS salary_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Período
  week_start DATE,
  month INTEGER,
  year INTEGER,
  
  -- Liquidación
  amount NUMERIC(15,0) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  context TEXT,
  
  -- Pago
  payment_method payment_method,
  note TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. CAJA DE AHORRO (savings_funds)
-- =====================================================
-- Fondos de ahorro de empleados

CREATE TABLE IF NOT EXISTS savings_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL DEFAULT 'Caja de Ahorro',
  description TEXT,
  
  -- Saldos (SIN decimales)
  current_balance NUMERIC(15,0) DEFAULT 0,
  total_deposits NUMERIC(15,0) DEFAULT 0,
  total_withdrawals NUMERIC(15,0) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. MOVIMIENTOS DE CAJA DE AHORRO (savings_fund_movements)
-- =====================================================
-- Depósitos y retiros de caja de ahorro

CREATE TABLE IF NOT EXISTS savings_fund_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_fund_id UUID NOT NULL REFERENCES savings_funds(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Movimiento
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount NUMERIC(15,0) NOT NULL,
  balance_after NUMERIC(15,0) NOT NULL,
  
  -- Referencia
  note TEXT,
  reference_number TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MÓDULO FINANCIERO
-- =====================================================

-- Employee Payments
CREATE INDEX IF NOT EXISTS idx_employee_payments_company ON employee_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_technician ON employee_payments(technician_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_order ON employee_payments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_period ON employee_payments(year, month, week_start);
CREATE INDEX IF NOT EXISTS idx_employee_payments_status ON employee_payments(payment_status);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Small Expenses
CREATE INDEX IF NOT EXISTS idx_small_expenses_company ON small_expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_small_expenses_date ON small_expenses(expense_date);

-- Salary Adjustments
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_company ON salary_adjustments(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_technician ON salary_adjustments(technician_id);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_type ON salary_adjustments(type);
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_available ON salary_adjustments(available_from);

-- Adjustment Applications
CREATE INDEX IF NOT EXISTS idx_adj_applications_adjustment ON salary_adjustment_applications(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_adj_applications_technician ON salary_adjustment_applications(technician_id);
CREATE INDEX IF NOT EXISTS idx_adj_applications_period ON salary_adjustment_applications(year, month, week_start);

-- Salary Settlements
CREATE INDEX IF NOT EXISTS idx_salary_settlements_company ON salary_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_settlements_technician ON salary_settlements(technician_id);
CREATE INDEX IF NOT EXISTS idx_salary_settlements_period ON salary_settlements(year, month, week_start);

-- Savings Funds
CREATE INDEX IF NOT EXISTS idx_savings_funds_company ON savings_funds(company_id);
CREATE INDEX IF NOT EXISTS idx_savings_funds_owner ON savings_funds(owner_id);

-- Savings Fund Movements
CREATE INDEX IF NOT EXISTS idx_savings_movements_fund ON savings_fund_movements(savings_fund_id);
CREATE INDEX IF NOT EXISTS idx_savings_movements_created ON savings_fund_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_savings_movements_type ON savings_fund_movements(type);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'employee_payments',
    'expenses',
    'small_expenses',
    'salary_adjustments',
    'salary_adjustment_applications',
    'salary_settlements',
    'savings_funds',
    'savings_fund_movements'
  )
ORDER BY tablename;

-- Deberías ver 8 tablas
