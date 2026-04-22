# Lógica de registro recomendada (Servicio Técnico)

## Objetivo
Definir un onboarding **simple, guiado y completo** para que una empresa configure SISGO sin olvidar datos críticos:
- Empresa
- Admin maestro
- Sucursales
- Usuarios por sucursal (encargados, técnicos y admins adicionales)
- Reglas de operación (comisiones, garantías, numeración)

## Lo que ya existe en SISGO (base técnica)
- El registro actual crea usuario + empresa en 2 pasos y deja al usuario fundador como `super_admin`.
- Ya existe modelo multiempresa y multisucursal (`companies`, `branches`, `users`, `work_orders`).
- La orden ya contempla asignación, costos de repuesto/mano de obra y cierre con pago/factura.
- Existen tablas para pagos/comisiones/adelantos (`employee_payments`, `salary_adjustments`).

## Diseño recomendado: onboarding en 7 pasos

### Paso 1 — Crear cuenta del Admin Maestro (obligatorio)
**Pedir:**
- Nombre completo
- Email
- Contraseña

**Resultado:**
- Usuario Auth creado.
- Perfil interno creado como `super_admin` (admin maestro).

> Regla: solo este rol puede terminar onboarding inicial.

### Paso 2 — Crear empresa (obligatorio)
**Pedir mínimo:**
- Nombre comercial
- Razón social
- RUT/NIT
- Email y teléfono de contacto
- Dirección fiscal
- Tipo de negocio = `servicio_tecnico`

**Pedir configuración inicial recomendada:**
- % IVA
- % comisión por defecto técnico
- días de garantía por defecto
- prefijo de folio/orden
- moneda y zona horaria

**Opcional en este paso:**
- Logo de empresa
- Plantilla de impresión (encabezado, pie, términos)

### Paso 3 — Crear sucursal principal (obligatorio)
**Pedir:**
- Nombre de sucursal (ej. Casa Matriz)
- Código corto (ej. MAT)
- Dirección
- Teléfono
- Email
- Encargado de sucursal (si ya existe)

**Regla UX simple:**
- Si no cargan más sucursales, el sistema funciona con una sola por defecto.

### Paso 4 — Configurar catálogo mínimo operativo (obligatorio)
Para que se puedan crear órdenes útiles desde el primer día:
- Servicios frecuentes (diagnóstico, cambio pantalla, etc.)
- Marcas/modelos base (si aplica)
- Tipos de falla frecuentes
- Checklist base de recepción

### Paso 5 — Crear equipo humano (obligatorio antes de operar)
**Wizard por lotes** con rol y sucursal:
- Admin adicional (opcional)
- Encargado (recomendado por sucursal)
- Técnico (obligatorio para flujo de toma de trabajos)

**Campos por usuario:**
- Nombre
- Email/login
- Rol
- Sucursal
- Activo/inactivo
- % comisión (si técnico)
- Sueldo base/frecuencia (si se usará liquidación)

### Paso 6 — Reglas de operación de órdenes (obligatorio)
Configurar explícitamente:
1. **Creación de orden:** solo admin/encargado.
2. **Trabajo disponible:** orden creada en sucursal X queda visible para técnicos de sucursal X.
3. **Autoasignación:** técnico puede “tomar” orden disponible.
4. **Ejecución técnica:** técnico registra repuestos, proveedor y costo real.
5. **Cierre comercial:** admin/encargado registra total final, N° factura/boleta y medio de pago.
6. **Post-cierre:** cálculo de comisión y métricas.

### Paso 7 — Validación final y activación (obligatorio)
Checklist de salida:
- [ ] Empresa creada
- [ ] Al menos 1 sucursal activa
- [ ] Al menos 1 admin maestro
- [ ] Al menos 1 encargado o admin por sucursal
- [ ] Al menos 1 técnico por sucursal operativa
- [ ] Catálogo base creado
- [ ] Reglas de comisión/garantía definidas

Al finalizar: mostrar botón **“Ir a operar”** y tutorial corto.

## Orden de creación recomendado (back-end)
1. Auth user del fundador
2. Company
3. Membership fundador (`super_admin`)
4. Branch principal
5. Usuarios iniciales
6. Configuración global
7. Configuración por sucursal

Este orden evita registros huérfanos y facilita rollback.

## Mínimo viable de datos (para no friccionar)
Si quieres máxima simplicidad al inicio:
1. Admin maestro (nombre, email, pass)
2. Empresa (nombre + RUT + tipo)
3. 1 sucursal (nombre)
4. 1 técnico (nombre + email + sucursal)

Y dejar el resto como tareas guiadas post-registro con progreso visible.

## Reglas de permisos sugeridas
- `super_admin`/`admin`: crean/editan todo, ven métricas globales, configuran comisiones.
- `encargado`: crea órdenes y gestiona operación de su sucursal.
- `technician`: toma órdenes disponibles de su sucursal, registra repuestos/proveedor/costos, actualiza avance técnico.
- Cierre de pago/factura: `admin` o `encargado` (no técnico, salvo que lo habiliten explícitamente).

## Recomendación UX clave
Hacer onboarding con:
- Barra de progreso (paso X de 7)
- “Guardar y continuar después”
- Validaciones inmediatas por paso
- Plantillas rápidas (“crear empresa demo mínima”)

Así reduces abandono y evitas olvidar datos críticos.
