# Script nuevo flujo (versión simplificada y operativa)

## Rol
Actúa como **Senior Product Designer + UX Engineer + Arquitecto de Base de Datos** para un SaaS de servicio técnico.
Tu trabajo es **simplificar el flujo sin romper la lógica actual** ni perder trazabilidad legal/técnica.

---

## Contexto
La app gestiona órdenes de servicio técnico (celulares, notebooks, tablets, smartwatch, etc.).

Flujo actual (muy largo):
1. Cliente
2. Dispositivo (tipo → marca → serie → modelo → variante)
3. Checklist técnico (muchos ítems)
4. Descripción del problema
5. Servicio
6. Prioridad
7. Fecha estimada
8. Garantía
9. Orden + PDF

### Dolor principal
- Demasiados pasos y decisiones para atención en mostrador.
- Mucha escritura manual.
- Checklist obligatorio pero cansador.
- Se necesita rapidez sin perder respaldo ante reclamos.

---

## Objetivo final del rediseño
Diseñar un flujo de **4 pasos reales** para recepción rápida (20–40 segundos), con diagnóstico ampliado condicional.

- Muchos taps, pocos inputs.
- Mostrar solo lo necesario en cada momento.
- Mantener checklist legalmente útil.
- Mantener compatibilidad con base de datos existente.

---

## Reglas de diseño (no negociables)
1. No eliminar lógica crítica (checklist + detalle equipo + evidencia).
2. Separar modo **Recepción rápida** y **Diagnóstico detallado**.
3. Usar defaults inteligentes y autocompletado.
4. UI táctil: tarjetas grandes, grids, selección visual.
5. El checklist debe evitar pasos innecesarios:
   - Si físico está OK, no abrir sub-checklist físico.
   - Si funcional tiene detalles, abrir solo categoría afectada.
6. Debe funcionar igual para celular, notebook y smartwatch (mismo patrón mental).

---

## Flujo propuesto (4 pasos)

## Paso 1 — Cliente + empresa/sucursal/encargado (rápido)
**Objetivo:** identificar quién entrega, dónde se recibe y quién será responsable interno.

**UI:**
- Buscador principal (RUT/teléfono/email).
- Si existe: 1 tap para usar cliente.
- Si no existe: formulario mínimo (nombre + teléfono).
- Select rápido de empresa/sucursal/encargado (último usado como default).

**Obligatorio:** cliente, sucursal, encargado.
**Opcional:** email, razón social completa, notas administrativas.

---

## Paso 2 — Equipo en 3 decisiones
**Objetivo:** registrar equipo sin fricción pero con precisión suficiente.

**UI:**
- Grid de tipo: Celular / Notebook / Tablet / Smartwatch / Otro.
- Marca (chips visuales + buscador).
- Modelo (autocompletar).
- Campos que aparecen solo si aplica: serie, IMEI, capacidad, color.

**Regla UX:**
- “Detalle progresivo”: primero tipo/marca/modelo.
- Datos avanzados se autocompletan o quedan en “Diagnóstico”.

---

## Paso 3 — Estado del equipo (checklist inteligente)
**Objetivo:** tener respaldo legal/técnico en pocos taps.

### 3.1 Pregunta base (3 bloques)
Cada bloque tiene 3 estados: **OK / Con detalles / No probado**.

1. **Estado físico externo**
   - pantalla, cámara externa, carcasa, botones, pin de carga
2. **Pruebas funcionales por software/uso**
   - audio llamada, altavoz, auricular, micrófono, wifi, bluetooth, sensores, vibrador, flash
3. **Entrega de elementos**
   - ¿Viene con chip?
   - ¿Viene con microchip/SD?
   - Selector rápido: Ambos / Solo chip / Solo microchip-SD / Ninguno

### 3.2 Lógica condicional (clave)
- Si bloque = **OK**: no mostrar sub-checklist.
- Si bloque = **No probado**: registrar motivo rápido (sin batería, sin clave, etc.).
- Si bloque = **Con detalles**: abrir sub-checklist de esa categoría únicamente.

### 3.3 Sub-checklists por excepción
Solo se abren cuando hay detalles.

- **Físico:** pantalla, vidrio cámara, carcasa, botones, bisagras (notebook), corona (watch), etc.
- **Funcional:** módulo afectado + severidad (leve/media/alta).
- **Internos/entrega:** chip sí/no, microchip/SD sí/no, observación opcional.

### 3.4 Evidencia opcional pero recomendada
- Botón “Agregar fotos” (1 a 3 fotos).
- Botón “Marcar todo OK”.

---

## Paso 4 — Orden final (problema + servicio)
**Objetivo:** cerrar recepción con lo mínimo necesario para trabajar.

### 4.1 Descripción del problema (simplificada)
En lugar de texto libre largo:
1) **Síntoma principal** (chips): no enciende / se apaga / pantalla dañada / no carga / mojado / lento / etc.
2) **Desde cuándo**: hoy / <7 días / >7 días / no sabe.
3) **Texto corto opcional** (máx 140 caracteres).

### 4.2 Servicio
- Selector rápido: Diagnóstico, Cambio pantalla, Batería, Conector carga, Software, Limpieza, Otro.
- Prioridad por defecto: Normal (editable).
- Fecha estimada sugerida automática según servicio.

### 4.3 Cierre
- Resumen en una sola vista.
- Confirmar y generar orden + PDF.

---

## Entregable esperado del asistente
Cuando respondas este prompt, entrega:
1. Qué está mal/qué funciona del flujo actual.
2. Diseño detallado de estas 4 pantallas.
3. Matriz de lógica condicional del checklist.
4. Propuesta de campos mínimos vs avanzados.
5. Impacto en BD (cambios mínimos + migración segura).
6. Recomendaciones para onboarding en menos de 5 minutos.

---

## Criterios de éxito
- Una orden de recepción se crea en 20–40 segundos.
- El operador no siente fatiga por exceso de decisiones.
- El checklist mantiene protección legal real.
- El flujo se siente simple, moderno y consistente entre tipos de equipo.
