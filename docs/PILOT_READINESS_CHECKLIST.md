# Pilot Readiness - SISGO Servicio Técnico

## Go / No-Go
- Build de producción ejecuta sin errores críticos.
- Registro de empresa + primera orden + avance de estados funciona.
- API críticas (`/api/customers`, `/api/device-catalog`, `/api/send-order-email`) responden.

## Smoke tests de negocio
1. Registro empresa piloto.
2. Crear orden desde `/orders/new`.
3. Técnico toma orden y marca reparación.
4. Orden pasa a `por_entregar` y luego `entregada`.
5. Flujo de pagos técnicos visible en `/finance/payments`.

## Soporte primera semana
- Canal único de incidencias (WhatsApp/Slack) con SLA de 2h hábil.
- Ventana de monitoreo diaria 09:00 y 17:00.
- Bitácora de bloqueos operativos con prioridad P0/P1.
