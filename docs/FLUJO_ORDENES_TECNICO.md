# Flujo de Trabajo de Órdenes de Servicio Técnico

## Descripción del Flujo

Sistema de gestión de órdenes de servicio técnico con asignación dinámica a técnicos por sucursal.

---

## Estados de Orden

| Estado | Descripción | Transiciones válidas |
|--------|-------------|---------------------|
| `pendiente` | Orden creada, sin asignar | → `en_reparacion` |
| `en_reparacion` | Técnico trabajando en ella | → `por_entregar`, `rechazada`, `sin_solucion` |
| `por_entregar` | Reparación completada, lista para entregar | → `entregada`, `en_reparacion` |
| `entregada` | Cliente retiró el dispositivo | (Estado final) |
| `rechazada` | No se pudo reparar | (Estado final) |
| `sin_solucion` | Sin solución técnica | (Estado final) |
| `garantia` | En garantía | → `en_reparacion`, `entregada` |

**Nota**: El estado `en_proceso` actual se migrará a `pendiente`/`en_reparacion`.

---

## Actores y Permisos

### Recepcionista / Administrador
- Crear órdenes (ya existe)
- Ver todas las órdenes de su sucursal
- Asignar orden a técnico (automático por sucursal)
- Cambiar a estado `entregada` (cuando llega el cliente)
- Ver histórico y métricas

### Técnico
- Ver solo órdenes de su sucursal en estado `pendiente` o `en_reparacion`
- Seleccionar orden para trabajar (tomarla)
- Registrar:
  - Precio de repuesto(s)
  - Medio de pago del cliente (opcional)
  - Número de factura (opcional)
- Cambiar a estado `por_entregar` (reparación completada)
- Cambiar a estado `en_reparacion` (si la retoma)
- **NO puede** marcar como `entregada`

### Encargado
- Ver todas las órdenes de su sucursal
- Cambiar a estado `entregada`
- Gestionar pagos a técnicos

---

## Flujo Paso a Paso

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE ÓRDEN DE SERVICIO                          │
└─────────────────────────────────────────────────────────────────────────────┘

  1. CREACIÓN                    2. ASIGNACIÓN              3. REPARACIÓN
  ┌──────────────┐              ┌──────────────┐           ┌──────────────┐
  │ Recepcionista│              │   Sistema    │           │   Técnico    │
  │ crea orden   │─────────────>│ asigna a     │──────────>│ selecciona   │
  │ (estado:     │              │ sucursal     │           │ orden        │
  │  pendiente)  │              │              │           │ (estado:     │
  └──────────────┘              └──────────────┘           │  en_reparacion)
                                                           └──────────────┘
                                                                   │
                                                                   v
  6. PAGO TÉCNICO              5. ENTREGA                   4. COMPLETAR
  ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
  │   Sistema    │            │  Encargado   │            │   Técnico    │
  │ calcula      │<───────────│ marca como   │<───────────│ completa    │
  │ comisión     │            │ entregada    │            │ reparación  │
  │              │            │ (estado:     │            │ (estado:     │
  └──────────────┘            │  entregada)  │            │  por_entregar)
                              └──────────────┘            └──────────────┘
```

---

## Pantallas Necesarias

### A) Vista de Órdenes para Técnico (Nueva)

**Ruta**: `/orders/tech` o `/orders/mis-ordenes`

**Filtros por defecto**:
- Solo órdenes de la sucursal del técnico
- Estados: `pendiente`, `en_reparacion`

**Campos a mostrar**:
- Número de orden
- Cliente (nombre)
- Dispositivo (modelo)
- Fecha de ingreso
- Estado actual
- PRIORIDAD (badge visual)

**Acciones por orden**:
- **Tomar orden** (si está `pendiente`) → cambia a `en_reparacion`
- **Ver detalle** → abre modal/panel con info completa
- **Registrar reparación** → formulario de cierre

---

### B) Formulario de Cierre de Reparación

**Acceso**: Desde la orden en estado `en_reparacion`

**Campos**:
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| Repuestos | Array | Sí | Lista de repuestos con precio unitario |
| Costo repuesto total | Currency | Auto | Sumatoria |
| Medio de pago | Select | No | EFECTIVO, TARJETA, TRANSFERENCIA, MIXTO |
| Número factura | String | No | Factura del cliente |
| Observaciones | Text | No | Notas de la reparación |

**Botón**: "Marcar como lista para entregar" → estado `por_entregar`

---

### C) Vista de Órdenes por Entregar (para Encargado)

**Ruta**: `/orders/entregar`

**Filtros**:
- Sucursal del encargado
- Estado: `por_entregar`

**Acciones**:
- **Confirmar entrega** → estado `entregada` + registra fecha
- Ver historial de pagos

---

## Estructura de Datos

### Tabla: work_orders (modificaciones)

```sql
-- Agregar nuevos campos
ALTER TABLE work_orders ADD COLUMN technician_id UUID REFERENCES auth.users(id);
ALTER TABLE work_orders ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE work_orders ADD COLUMN repair_completed_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN delivered_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN delivery_payment_method VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN invoice_number VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN replacement_cost DECIMAL(12,2) DEFAULT 0;
```

### Nueva tabla: repair_parts (repuestos)

```sql
CREATE TABLE repair_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Nueva tabla: technician_commissions (comisiones)

```sql
CREATE TABLE technician_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  technician_id UUID REFERENCES auth.users(id),
  commission_amount DECIMAL(12,2) NOT NULL,
  payment_status 'pending' | 'paid' DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Cálculo de Comisión

**Fórmula**:
```
comisión = precio_servicio * (porcentaje_sucursal / 100)
```

**Donde**:
- `precio_servicio`: Total de servicios de la orden
- `porcentaje_sucursal`: Configurado en la tabla de sucursales (ej: 30%)

**Reglas**:
1. Se calcula al marcar como `entregada`
2. Se acumula en saldo del técnico
3. Encargado puede pagarla (marcar como `paid`)
4. Historial de pagos consultable

---

## APIs / Use Cases Necesarios

### Nuevos

| Use Case | Responsabilidad |
|----------|-----------------|
| `TakeOrderUseCase` | Técnico toma una orden (asigna technician_id) |
| `CompleteRepairUseCase` | Registra repuestos y cambia a `por_entregar` |
| `DeliverOrderUseCase` | Cambia a `entregada`, calcula comisión |
| `GetTechnicianOrdersUseCase` | Órdenes filtradas por técnico/sucursal |
| `CalculateCommissionUseCase` | Calcula comisión por orden |

### Modificar

| Use Case | Cambio |
|----------|--------|
| `CreateOrderUseCase` | Agregar branch_id automáticamente |
| `UpdateOrderStatusUseCase` | Validar transiciones según rol |

---

## Componentes UI a Crear

```
src/presentation/components/orders/tech/
├── TechnicianOrdersList.tsx    # Lista principal
├── OrderCard.tsx               # Tarjeta de orden para técnico
├── RepairCompletionForm.tsx    # Formulario de cierre
├── OrderDetailModal.tsx        # Detalle completo
└── TechnicianDashboard.tsx     # Resumen métricas técnico
```

---

## Validaciones de Negocio

1. **Transiciones de estado**
   - Solo técnico puede cambiar: `pendiente` → `en_reparacion` → `por_entregar`
   - Solo encargado/admin puede: `por_entregar` → `entregada`

2. **Sucursal**
   - Técnico solo ve órdenes de su sucursal
   - Orden creada lleva branch_id del usuario que crea

3. **Comisión**
   - Solo se calcula cuando estado = `entregada`
   - No se puede modificar orden después de entregada (excepto garantía)

---

## Plan de Implementación

### Fase 1: Base de datos (1 día)
- [ ] Agregar columnas a work_orders
- [ ] Crear tabla repair_parts
- [ ] Crear tabla technician_commissions

### Fase 2: Backend / Use Cases (2 días)
- [ ] Modificar CreateOrderUseCase
- [ ] Crear TakeOrderUseCase
- [ ] Crear CompleteRepairUseCase
- [ ] Crear DeliverOrderUseCase
- [ ] Modificar UpdateOrderStatusUseCase

### Fase 3: Frontend - Técnico (3 días)
- [ ] Crear TechnicianOrdersList
- [ ] Crear RepairCompletionForm
- [ ] Integrar con useOrders hook

### Fase 4: Frontend - Entrega (1 día)
- [ ] Agregar botón "Confirmar entrega" en lista de órdenes
- [ ] Modal de confirmación

### Fase 5: Comisiones (2 días)
- [ ] Hook para gestionar comisiones
- [ ] Panel de comisiones por técnico
- [ ] Historial de pagos

---

## Notas

- El sistema actual ya tiene `technician_id` en algunas partes (ver OrdersTable.tsx)
- Las métricas de técnico ya existen en MetricsPage.tsx
- El flujo de pago de técnico ya existe en TechnicianPayments.tsx
- **No reinventar**: reutilizar componentes existentes donde sea posible