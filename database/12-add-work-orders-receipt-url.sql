-- =====================================================
-- SISGO UNIFICADO - SCRIPT 12: AGREGAR receipt_url EN work_orders
-- =====================================================
-- Contexto:
-- Algunas instalaciones no tienen esta columna y consultas del frontend
-- fallan con: "column work_orders.receipt_url does not exist" (42703).
--
-- Este campo NO tiene FK ni relación obligatoria con otra tabla:
-- solo guarda la URL del comprobante/PDF (por ejemplo, Supabase Storage).
-- =====================================================

ALTER TABLE IF EXISTS work_orders
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

COMMENT ON COLUMN work_orders.receipt_url IS
'URL opcional del comprobante/PDF de la orden.';
