-- =====================================================
-- SISGO UNIFICADO - SCRIPT 02: TABLAS CORE
-- =====================================================
-- Este script crea las tablas fundamentales:
-- companies, branches, users, customers, roles, permissions
-- Ejecutar DESPUÉS de 01-extensions-and-types.sql
-- =====================================================

-- =====================================================
-- 1. EMPRESAS (companies)
-- =====================================================
-- Dueños del sistema, registran su negocio aquí

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica
  name TEXT NOT NULL,
  business_type business_type NOT NULL,
  rut TEXT UNIQUE,
  razon_social TEXT,
  
  -- Contacto
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  
  -- Configuración por defecto
  config JSONB DEFAULT '{}'::jsonb,
  iva_percentage NUMERIC(5,2) DEFAULT 19.00,
  commission_percentage NUMERIC(5,2) DEFAULT 40.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT companies_name_check CHECK (length(trim(name)) >= 2)
);

-- =====================================================
-- 2. SUCURSALES (branches)
-- =====================================================
-- Cada empresa puede tener múltiples sucursales

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, code)
);

-- =====================================================
-- 3. USUARIOS (users)
-- =====================================================
-- Extiende auth.users de Supabase
-- Cada usuario pertenece a UNA empresa y UNA sucursal

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Rol y permisos
  role user_role NOT NULL DEFAULT 'technician',
  permissions JSONB DEFAULT '{}'::jsonb,
  commission_percentage NUMERIC(5,2),
  
  -- Información personal
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  -- Configuración laboral
  sueldo_base NUMERIC(15,0) DEFAULT 0,
  sueldo_frecuencia TEXT CHECK (sueldo_frecuencia IN ('semanal', 'quincenal', 'mensual')),
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CLIENTES (customers)
-- =====================================================
-- Clientes de las empresas (sin auth)

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone_country_code TEXT DEFAULT '+56',
  rut_document TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. SERVICIOS CATÁLOGO (catalog_services)
-- =====================================================
-- Catálogo de servicios que ofrece cada empresa

CREATE TABLE IF NOT EXISTS catalog_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  default_price NUMERIC(15,0) DEFAULT 0,
  estimated_hours NUMERIC(5,2),
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. PLANTILLAS DE CHECKLIST (checklist_templates)
-- =====================================================
-- Checklists predefinidos por tipo de dispositivo

CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Identificación
  business_type TEXT NOT NULL,
  template_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_order INTEGER DEFAULT 0,
  
  -- Configuración
  status_options JSONB DEFAULT '["Funcionando", "Dañado", "Reparado", "No probado"]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, business_type, template_type, item_name)
);

-- =====================================================
-- 7. CONFIGURACIÓN DEL SISTEMA (system_settings)
-- =====================================================
-- Settings globales del sistema

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Configuración
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, setting_key)
);

-- =====================================================
-- ÍNDICES PARA TABLAS CORE
-- =====================================================

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_business_type ON companies(business_type);
CREATE INDEX IF NOT EXISTS idx_companies_rut ON companies(rut);

-- Branches
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Catalog Services
CREATE INDEX IF NOT EXISTS idx_catalog_services_company ON catalog_services(company_id);
CREATE INDEX IF NOT EXISTS idx_catalog_services_category ON catalog_services(category);
CREATE INDEX IF NOT EXISTS idx_catalog_services_active ON catalog_services(is_active);

-- Checklist Templates
CREATE INDEX IF NOT EXISTS idx_checklist_templates_company ON checklist_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON checklist_templates(template_type);

-- System Settings
CREATE INDEX IF NOT EXISTS idx_system_settings_company ON system_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar tablas creadas
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies',
    'branches',
    'users',
    'customers',
    'catalog_services',
    'checklist_templates',
    'system_settings'
  )
ORDER BY tablename;

-- Deberías ver 7 tablas
