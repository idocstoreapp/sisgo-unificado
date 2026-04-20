-- =====================================================
-- SISGO UNIFICADO - SCRIPT 01: EXTENSIONES Y TIPOS
-- =====================================================
-- Este script habilita extensiones y crea tipos enum
-- Ejecutar PRIMERO en el SQL Editor de Supabase
-- =====================================================

-- Habilitar extensión UUID (ya viene en Supabase, pero aseguramos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TIPOS ENUM PERSONALIZADOS
-- =====================================================

-- Tipo de negocio
DO $$ BEGIN
  CREATE TYPE business_type AS ENUM (
    'servicio_tecnico',
    'taller_mecanico',
    'muebleria',
    'restaurante',
    'multi_business'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Roles de usuario
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'technician',
    'mechanic',
    'vendedor',
    'mesero',
    'cocina',
    'encargado',
    'recepcionista',
    'responsable'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Estados de orden de trabajo
DO $$ BEGIN
  CREATE TYPE work_order_status AS ENUM (
    'en_proceso',
    'por_entregar',
    'entregada',
    'rechazada',
    'sin_solucion',
    'garantia'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Prioridad de orden
DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM (
    'baja',
    'media',
    'urgente'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Métodos de pago
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'EFECTIVO',
    'TARJETA',
    'TRANSFERENCIA'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Estados de cotización
DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM (
    'borrador',
    'enviada',
    'aprobada',
    'rechazada',
    'expirada'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Estados de orden de restaurante
DO $$ BEGIN
  CREATE TYPE restaurant_order_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'served',
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Estados de mesa
DO $$ BEGIN
  CREATE TYPE table_status AS ENUM (
    'disponible',
    'ocupada',
    'reservada',
    'en_limpieza'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de movimiento de stock
DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'IN',
    'OUT',
    'ADJUST'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de ajuste de salario
DO $$ BEGIN
  CREATE TYPE adjustment_type AS ENUM (
    'adelanto',
    'descuento',
    'bonificacion',
    'prestamo'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Estados de compra
DO $$ BEGIN
  CREATE TYPE purchase_status AS ENUM (
    'pending',
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipos de visualización (restaurante)
DO $$ BEGIN
  CREATE TYPE visual_type AS ENUM (
    'hero',
    'list',
    'drink'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo de pedido (restaurante)
DO $$ BEGIN
  CREATE TYPE order_type AS ENUM (
    'barra',
    'llevar'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Unidades de medida
DO $$ BEGIN
  CREATE TYPE unit_type AS ENUM (
    'un',
    'kg',
    'gr',
    'lt',
    'ml'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que los tipos fueron creados
SELECT typname, typtype 
FROM pg_type 
WHERE typtype = 'e' 
  AND typname IN (
    'business_type',
    'user_role',
    'work_order_status',
    'priority_level',
    'payment_method',
    'quote_status',
    'restaurant_order_status',
    'table_status',
    'stock_movement_type',
    'adjustment_type',
    'purchase_status',
    'visual_type',
    'order_type',
    'unit_type'
  )
ORDER BY typname;

-- Deberías ver 14 filas (una por cada tipo enum)
