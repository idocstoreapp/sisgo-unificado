# Métricas & Feedback para piloto

## Métricas mínimas
- **Tiempo a primer valor:** minutos entre registro y primera orden creada.
- **Abandono onboarding:** porcentaje de salida por paso del registro.
- **Errores operativos por rol:** admin vs técnico, por pantalla.
- **Uso de pagos técnicos:** número de pagos y técnicos pagados por semana.

## Instrumentación sugerida (incremental)
- Evento `onboarding_step_completed` con `{step, companyMode}`.
- Evento `order_status_changed` con `{from, to, role}`.
- Evento `trial_gate_viewed` y `trial_payment_clicked`.

## Ciclo semanal
- Lunes: revisar métricas de adopción.
- Miércoles: corregir 3 fricciones top.
- Viernes: decisión de continuidad por empresa piloto.
