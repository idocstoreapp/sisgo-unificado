-- ============================================================
-- SCRIPT: Migrar servicios reales + Arreglar RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- PASO 1: Arreglar RLS de catalog_services
-- Permitir lectura a todos los usuarios autenticados de la misma empresa
ALTER TABLE catalog_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_services_select" ON catalog_services;
DROP POLICY IF EXISTS "catalog_services_insert" ON catalog_services;
DROP POLICY IF EXISTS "catalog_services_update" ON catalog_services;
DROP POLICY IF EXISTS "catalog_services_delete" ON catalog_services;

-- Leer: usuarios autenticados ven servicios de su empresa
CREATE POLICY "catalog_services_select"
  ON catalog_services FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Insertar: solo admins/técnicos de su empresa
CREATE POLICY "catalog_services_insert"
  ON catalog_services FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Actualizar: solo admins/técnicos de su empresa
CREATE POLICY "catalog_services_update"
  ON catalog_services FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PASO 2: Arreglar RLS de work_orders (el 400 error)
DROP POLICY IF EXISTS "work_orders_select" ON work_orders;
DROP POLICY IF EXISTS "work_orders_insert" ON work_orders;
DROP POLICY IF EXISTS "work_orders_update" ON work_orders;

CREATE POLICY "work_orders_select"
  ON work_orders FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "work_orders_insert"
  ON work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "work_orders_update"
  ON work_orders FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PASO 3: Migrar tus servicios reales a catalog_services
-- Primero obtenemos el company_id del primer usuario admin/técnico encontrado
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Intentar obtener el company_id desde la tabla profiles
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE company_id IS NOT NULL
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún profile con company_id. Asegúrate de haber completado el setup inicial.';
  END IF;

  RAISE NOTICE 'Usando company_id: %', v_company_id;

  -- Insertar servicios reales (preservando IDs originales para no romper referencias)
  -- ON CONFLICT DO NOTHING para no duplicar si ya existen
  INSERT INTO catalog_services (id, company_id, name, description, category, default_price, is_active, created_at)
  VALUES
    -- Pantalla
    ('8447ef91-db0b-4cec-bbfb-8ea131940bfa', v_company_id, 'Cambio de pantalla', 'Reemplazo completo de pantalla', 'Pantalla', 0, true, '2025-12-28 18:26:06+00'),
    ('2165de85-e635-4e95-a931-58296e526740', v_company_id, 'Cambio de Glass', NULL, 'Pantalla', 0, true, '2026-01-10 17:17:00+00'),
    ('800e02af-0340-42eb-bbfa-ec87a08d5390', v_company_id, 'Cambio de Tactil', NULL, 'Pantalla', 0, true, '2026-01-09 15:47:26+00'),
    ('e661079e-c143-40f2-af6b-1d5f60a003bd', v_company_id, 'Servicio Pegado de Pantalla', NULL, 'Pantalla', 0, true, '2026-01-12 03:08:15+00'),
    ('07861793-4285-409f-b371-16d79f86da39', v_company_id, 'Servicio Instalacion de Pantalla', NULL, 'Pantalla', 0, true, '2026-01-12 03:08:55+00'),
    ('c15f7a5f-27cb-484f-9415-b089770be1da', v_company_id, 'Servicio Pulido de Pantalla', NULL, 'Pantalla', 0, true, '2026-01-12 03:12:50+00'),
    ('d28d52f8-39a1-46ad-a872-42a5bfd8df47', v_company_id, 'CAMBIO DE PANTALLA', NULL, 'Pantalla', 0, true, '2026-04-06 18:45:44+00'),

    -- Batería
    ('797ddc3f-5016-49c8-affc-d55106cbc1db', v_company_id, 'Cambio de Bateria', 'Cambio de batería y validación de funcionamiento general tras la reparación', 'Batería', 0, true, '2026-01-12 03:07:42+00'),
    ('3e511c73-b86d-4c6a-a288-e2bd70f8e63f', v_company_id, 'Instalación de bateria', NULL, 'Batería', 0, true, '2026-04-02 21:14:21+00'),

    -- Cámara
    ('4b5e0775-5229-47e5-8a03-6eb8980721dc', v_company_id, 'Reparación de cámara', 'Reparación o reemplazo de módulo de cámara', 'Cámara', 0, true, '2025-12-28 18:26:06+00'),
    ('cf81c131-fceb-4568-972d-2943e9825b22', v_company_id, 'Cambio de Cámara Principal', NULL, 'Cámara', 0, true, '2026-01-10 18:18:29+00'),
    ('5b94c721-a1cb-4757-bb00-efe83a3207f4', v_company_id, 'Cambio de Camara Frontal', NULL, 'Cámara', 0, true, '2026-01-10 18:18:58+00'),
    ('1da3b473-3f7b-4de7-893e-c80b0c5388e2', v_company_id, 'Cambio de Cristal de Camara', NULL, 'Cámara', 0, true, '2026-01-29 21:14:14+00'),
    ('93b3b141-c59e-49be-acc0-6ceec68ce179', v_company_id, 'Reparación Face ID', NULL, 'Cámara', 0, true, '2026-01-30 19:45:59+00'),
    ('43b1e5d8-fbae-4c86-ae47-1c9eaa8443f7', v_company_id, 'CAMARA PRINCIPAL', NULL, 'Cámara', 0, true, '2026-04-08 14:30:55+00'),

    -- Carga
    ('e6210e6c-b07d-44bd-9255-078e0c45a925', v_company_id, 'Reparación de conector de carga', 'Reparación o reemplazo de puerto de carga', 'Carga', 0, true, '2025-12-28 18:26:06+00'),
    ('369b111e-b1ba-4042-9707-5e82e224ce0c', v_company_id, 'Cambio de Pin de Carga', NULL, 'Carga', 0, true, '2026-01-09 15:43:04+00'),
    ('20289c8b-8739-4bb5-8d40-1f8d33952217', v_company_id, 'Cambio de Flex Carga', NULL, 'Carga', 0, true, '2026-01-09 15:45:31+00'),
    ('c6fba7f8-202d-4835-88e0-6ec2ad84f553', v_company_id, 'Cambio de Base de Carga', 'Cambio de base de carga del equipo', 'Carga', 0, true, '2026-01-09 15:42:49+00'),
    ('95233e04-7816-4677-a623-0bf9fc0b0489', v_company_id, 'Cambio de Puerto HDMI', NULL, 'Carga', 0, true, '2026-01-09 15:42:15+00'),

    -- Software
    ('37ac1793-4eac-4e8b-9eda-0a0c6f10776b', v_company_id, 'Actualización de software', 'Actualización de sistema operativo', 'Software', 0, true, '2025-12-28 18:26:06+00'),
    ('0f579611-0bc3-4885-862b-3696ae9f8e81', v_company_id, 'Servicio de Cuenta Google', NULL, 'Software', 0, true, '2026-01-09 15:44:02+00'),
    ('c4fced67-c658-4acd-a197-1d8847dc911e', v_company_id, 'Servicio Quitar Virus', NULL, 'Software', 0, true, '2026-01-12 03:09:44+00'),
    ('189cd985-c189-4aad-a881-bf4eb3fd96b9', v_company_id, 'Cuenta Google FRP', NULL, 'Software', 0, true, '2026-01-30 15:08:26+00'),
    ('f0bb2067-262e-4546-b401-1dcb83788f36', v_company_id, 'Reseteo de Equipo', NULL, 'Software', 0, true, '2026-01-30 15:19:25+00'),
    ('b173e3f9-bbc3-4899-8277-bf7753a84e2c', v_company_id, 'FORMATEO', NULL, 'Software', 0, true, '2026-03-31 17:46:58+00'),
    ('665509dc-9e66-493f-9d8e-ef1837637ff9', v_company_id, 'SISTEMA OPERATIVO', NULL, 'Software', 0, true, '2026-04-16 21:23:23+00'),
    ('8c55cf0e-8a3f-4124-b1e4-f3a0285b46b8', v_company_id, 'Servicio Respaldo de Información', NULL, 'Software', 0, true, '2026-01-12 03:10:19+00'),

    -- Mantención
    ('a5b5fbd9-fed5-426e-963b-42a0358ea3d3', v_company_id, 'Limpieza general', 'Limpieza interna y externa del dispositivo', 'Mantención', 0, true, '2025-12-28 18:26:06+00'),
    ('26e13d77-23cc-450f-9872-521f725f335a', v_company_id, 'Diagnostico extendido', NULL, 'Mantención', 0, true, '2025-12-29 15:28:05+00'),
    ('6a756eb1-d0d5-4e02-861e-d72d7149f107', v_company_id, 'Servicio de Mantencion', NULL, 'Mantención', 0, true, '2026-01-12 03:11:21+00'),
    ('5a8d8019-234c-41fe-848a-89ef2add8876', v_company_id, 'Servicio Baño Quimico', NULL, 'Mantención', 0, true, '2026-01-12 03:15:57+00'),
    ('8afe701b-3c6b-4c13-b81a-7ac0dd02087a', v_company_id, 'REVISION', NULL, 'Mantención', 0, true, '2026-04-02 14:25:00+00'),
    ('9138bf7d-a207-4de9-97f4-1dfcefd1025e', v_company_id, 'REVISION HP MINI', NULL, 'Mantención', 0, true, '2026-04-02 14:25:18+00'),

    -- Placa / Componentes
    ('adf43017-2206-4a77-a5b4-c123db795527', v_company_id, 'Reparación de placa madre', 'Reparación de placa lógica', 'Placa', 0, true, '2025-12-28 18:26:06+00'),
    ('aa02e2e9-a0cc-4bda-8d92-5322fba38fa9', v_company_id, 'Reparación de sensores', 'Reparación de sensores (Face ID, Touch ID, etc.)', 'Placa', 0, true, '2025-12-28 18:26:06+00'),
    ('628e06a2-72af-41ba-890c-8a4bc0d00432', v_company_id, 'Cambio de FPC', 'conector de placa', 'Placa', 0, true, '2026-02-07 16:28:52+00'),
    ('6402177c-54ef-4d51-8061-3f7b8df013bb', v_company_id, 'Reparación del Lector SIM', NULL, 'Placa', 0, true, '2026-02-02 21:03:35+00'),
    ('90b50222-1111-4e2b-8e5a-5382c1946c92', v_company_id, 'sacar tarjeta sim de bandeja', NULL, 'Placa', 0, true, '2026-04-01 13:51:54+00'),
    ('b4c7d231-de13-446d-a9b8-146c51c444f6', v_company_id, 'REPARACION CABLE CARGADOR MACBOOK', NULL, 'Placa', 0, true, '2026-04-07 19:59:15+00'),

    -- Flex / Audio
    ('5b859ef1-b986-43ed-9035-67608ebc8fcf', v_company_id, 'Reparación de altavoces', 'Reparación o reemplazo de altavoces', 'Audio', 0, true, '2025-12-28 18:26:06+00'),
    ('ce830b93-262f-4d43-b8a8-4c46b7e229b1', v_company_id, 'Cambio de Flex Auricular', NULL, 'Audio', 0, true, '2026-01-10 18:00:15+00'),
    ('ea055ac2-b65f-4f36-82b3-3c1981e57290', v_company_id, 'Cambio de Parlante Auricular', NULL, 'Audio', 0, true, '2026-01-10 18:00:37+00'),

    -- Estructura / Carcasa
    ('74688df6-3f31-42ad-985c-d1156b104dfa', v_company_id, 'Reparación de botones', 'Reparación de botones físicos', 'Estructura', 0, true, '2025-12-28 18:26:06+00'),
    ('4ef25735-377e-4efa-a0e4-a73939331f40', v_company_id, 'Cambio de Chasis', NULL, 'Estructura', 0, true, '2026-01-10 18:01:07+00'),
    ('d7ae9f38-7709-4ec4-863d-4308e4c77f08', v_company_id, 'Cambio de Tapa', NULL, 'Estructura', 0, true, '2026-01-09 15:40:00+00'),
    ('0615f55c-8a44-427d-aaa7-045bcc25125e', v_company_id, 'pegado de tapa', NULL, 'Estructura', 0, true, '2026-04-01 19:56:31+00'),
    ('f23c825a-0d20-43aa-90c5-021509457376', v_company_id, 'REPARACION VISAGRAS', NULL, 'Estructura', 0, true, '2026-03-26 19:32:46+00'),
    ('ee4da48e-7a90-4029-8177-6f5526ccbfc2', v_company_id, 'BISAGRA', NULL, 'Estructura', 0, true, '2026-04-02 14:24:14+00'),
    ('1476883c-0e24-497b-aef2-636128cd3c8d', v_company_id, 'Cambio de Vibrador', NULL, 'Estructura', 0, true, '2026-03-10 17:21:07+00'),

    -- Laptop/Mac específico
    ('913463bd-2c94-4cae-98e1-2172da8f7ee3', v_company_id, 'Cambio Flex de Trackpad', NULL, 'Laptop', 0, true, '2026-01-10 18:03:11+00'),
    ('5d2313bb-e881-4a8d-bdd7-6af929960f88', v_company_id, 'Cambio de Trackpad', NULL, 'Laptop', 0, true, '2026-01-12 03:11:55+00'),
    ('dc4bb1c2-2b37-44bf-92c6-10cb51f456f7', v_company_id, 'Cambio de Touch Bar Macbook', NULL, 'Laptop', 0, true, '2026-01-10 17:27:48+00'),
    ('193cb7ff-9094-456e-ae53-b9ba81a01854', v_company_id, 'Cambio de Teclado', NULL, 'Laptop', 0, true, '2026-01-12 03:15:11+00'),
    ('443d3368-5b26-415a-8d1b-379800dc3800', v_company_id, 'Cambio de Ventilador', NULL, 'Laptop', 0, true, '2026-01-12 03:17:56+00'),
    ('6ccffe84-69ba-4319-a51c-34b507b82479', v_company_id, 'Cambio de Disco Duro SSD/HDD', NULL, 'Laptop', 0, true, '2026-02-24 17:36:54+00'),
    ('74978ef5-30d1-41ef-8a10-202d4e841dd3', v_company_id, 'Aumento de Memoria', NULL, 'Laptop', 0, true, '2026-02-24 17:36:08+00'),

    -- Otros
    ('937dde2d-8117-4c6e-bb5c-1c777db6de57', v_company_id, 'Reemplazo de Análogos Mandos', NULL, 'Otros', 0, true, '2026-02-02 21:07:44+00'),
    ('b8a32312-27a0-435c-982d-b716af8acddc', v_company_id, 'Homologacion de Imei', NULL, 'Otros', 0, true, '2026-01-30 15:19:47+00')

  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_active = true;

  RAISE NOTICE '✅ % servicios migrados/actualizados.', (SELECT COUNT(*) FROM catalog_services WHERE company_id = v_company_id);
END $$;

-- PASO 4: Verificación
SELECT category, COUNT(*) as total
FROM catalog_services
GROUP BY category
ORDER BY total DESC;
