# Orquestador de Agentes - SISGO Servicio Tecnico

## Objetivo

Este documento te permite ejecutar trabajo paralelo con multiples agentes para acelerar la salida a terreno del modulo de servicio tecnico.

La meta es:
- dividir el trabajo en tareas claras,
- asignar 1 agente por tarea,
- consolidar resultados con formato uniforme,
- reducir semanas de trabajo a rondas cortas de prompts.

---

## Como usar este archivo

Cuando quieras arrancar, di exactamente algo como:

`Lee docs/ORQUESTADOR_AGENTES_SISGO.md y ejecuta Fase 1 completa con agentes en paralelo.`

O para una parte concreta:

`Lee docs/ORQUESTADOR_AGENTES_SISGO.md y ejecuta solo los agentes A1, A2 y A4.`

O para retomar:

`Lee docs/ORQUESTADOR_AGENTES_SISGO.md y reanuda Fase 2 con enfoque en bloqueos pendientes.`

---

## Reglas del orquestador (para la IA)

1. Crear un agente por tarea definida en este documento.
2. Ejecutar en paralelo todo lo que no tenga dependencia directa.
3. No mezclar objetivos entre agentes.
4. Cada agente debe devolver:
   - hallazgos,
   - cambios realizados,
   - riesgos,
   - siguiente accion recomendada.
5. El agente orquestador debe cerrar cada fase con:
   - estado por agente (OK/BLOQUEADO),
   - resumen consolidado,
   - lista exacta de siguientes pasos.

---

## Definicion de fases

## Fase 1 - Base tecnica para poder salir

### A1 - Build Doctor (P0 compilacion)
**Mision:** dejar `npm run build` en verde.

**Entradas sugeridas:**
- `src/app/api/checklist-items/route.ts`
- errores de TypeScript actuales de build.

**Salida esperada:**
- listado de errores corregidos,
- comandos ejecutados,
- resultado final de build.

---

### A2 - API Gaps Doctor (endpoints faltantes)
**Mision:** detectar y reparar llamadas API usadas por frontend que no tienen ruta implementada.

**Entradas sugeridas:**
- busqueda de `fetch('/api/...')`,
- carpeta `src/app/api`.

**Salida esperada:**
- tabla de endpoint usado vs existente,
- implementaciones faltantes creadas,
- validacion rapida funcional.

---

### A3 - Order Flow QA Tecnico
**Mision:** validar de punta a punta el flujo:
crear orden -> tomar orden -> reparar -> por entregar -> entregar -> pago tecnico.

**Entradas sugeridas:**
- `src/presentation/components/orders/**`
- `src/app/(dashboard)/orders/**`

**Salida esperada:**
- puntos que rompen o son friccion,
- bugs P0/P1 con evidencia,
- recomendaciones concretas (sin sobreingenieria).

---

### A4 - Types & Debt Cleaner
**Mision:** reducir deuda de tipos peligrosa (`as any`, tipos legacy conflictivos) en rutas criticas.

**Entradas sugeridas:**
- `src/types.ts`
- `src/shared/kernel/types.ts`
- archivos de ordenes, settings y APIs tocadas por build.

**Salida esperada:**
- lista de riesgos por tipado,
- ajustes minimos seguros,
- impacto en build/test.

---

## Fase 2 - Onboarding comercial adaptativo

### B1 - Landing & Conversion Agent
**Mision:** crear landing clara de SISGO orientada a conversion para prueba.

**Salida esperada:**
- secciones de landing implementadas,
- CTA a registro,
- texto enfocado en taller pequeno/mediano/grande.

---

### B2 - Registration Wizard UX-First
**Mision:** convertir registro actual en wizard guiado adaptativo.

**Debe cubrir:**
- nombre empresa,
- logo PNG con ayuda contextual,
- tamano empresa (solo/local unico/multi sucursal),
- modo de uso (dueno solo vs equipo),
- necesidad de modulo tecnicos y pagos.

**Salida esperada:**
- pasos del wizard implementados,
- validaciones claras por paso,
- UX simplificada para microempresa.

---

### B3 - Trial/Billing Gate Agent
**Mision:** implementar logica de prueba 7-15 dias y bloqueo suave al vencer.

**Salida esperada:**
- modelo de datos de trial,
- asignacion automatica al registrarse,
- control de acceso al expirar trial,
- pantalla de activar pago.

---

### B4 - Company Mode / Feature Flags Agent
**Mision:** habilitar experiencia adaptativa por tipo de empresa sin duplicar codigo.

**Modos objetivo:**
- `solo_owner`
- `team`
- `multi_branch`

**Salida esperada:**
- mecanismo de capacidades por empresa,
- sidebar y pantallas condicionadas por modo,
- ocultar herramientas no necesarias.

---

## Fase 3 - Salida a terreno controlada

### C1 - Pilot Readiness Agent
**Mision:** checklist de salida real para empresas piloto.

**Debe incluir:**
- criterios go/no-go,
- smoke tests de negocio,
- plan de soporte de primera semana.

---

### C2 - Metrics & Feedback Agent
**Mision:** definir que medir en piloto para iterar rapido.

**Metricas minimas:**
- tiempo primer valor (primera orden creada),
- abandono por paso de onboarding,
- errores operativos por rol,
- uso real de pagos tecnicos.

---

## Plantilla de prompt maestro (copiar/pegar)

Usa este prompt para que la IA cree y coordine agentes automaticamente:

```text
Lee el archivo docs/ORQUESTADOR_AGENTES_SISGO.md y actua como orquestador.

Objetivo:
- Ejecutar [FASE X] completa con agentes en paralelo.

Instrucciones:
1) Crea un agente por tarea definida en la fase.
2) Ejecuta en paralelo lo que no dependa de otra tarea.
3) Si un agente queda bloqueado, no detengas los demas.
4) Al finalizar, entrega:
   - estado por agente (OK/BLOQUEADO),
   - cambios concretos realizados,
   - riesgos abiertos,
   - siguiente tanda de agentes recomendada.
5) Mantener foco en servicio tecnico y salida a terreno.
6) No proponer solo teoria: implementar y validar cuando aplique.
```

---

## Prompts directos por agente (copiar/pegar)

## Prompt A1
```text
Actua como agente A1 Build Doctor.
Mision: dejar npm run build en verde en sisgo-unificado.
Enfocate en errores TypeScript/Next de compilacion.
Corrige, vuelve a ejecutar build y reporta:
- errores encontrados,
- solucion aplicada,
- estado final de build.
```

## Prompt A2
```text
Actua como agente A2 API Gaps Doctor.
Mision: identificar endpoints frontend /api/* sin route.ts implementada.
Busca fetch('/api/...') y contrasta con src/app/api.
Implementa faltantes criticos y valida.
Entrega matriz endpoint usado vs endpoint existente vs accion tomada.
```

## Prompt B2
```text
Actua como agente B2 Registration Wizard UX-First.
Mision: rediseñar registro para onboarding adaptativo.
Debe incluir logo PNG con ayuda, tamano de empresa, modo de uso y recomendacion de modulo tecnicos/pagos.
Prioriza microempresa (simple) sin romper crecimiento a multi-sucursal.
Implementa flujo y valida UX.
```

## Prompt B3
```text
Actua como agente B3 Trial/Billing Gate.
Mision: implementar prueba de 7-15 dias segun tipo de empresa y bloqueo suave al vencer.
Incluye modelo de datos, asignacion al registro y pantalla de activar pago.
Entrega tambien riesgos legales/operativos del gating.
```

---

## Secuencia recomendada ultra rapida

1. Ejecutar Fase 1 completa.
2. Si build queda verde, ejecutar B2 + B4 en paralelo.
3. Luego ejecutar B1 + B3 en paralelo.
4. Cerrar con C1 + C2.

---

## Criterio de terminado (Definition of Done)

Se considera listo para salir a terreno cuando:
- build de produccion en verde,
- onboarding adaptativo funcionando,
- trial activo con expiracion y gating,
- flujo principal de ordenes estable sin bloqueos P0,
- checklist de piloto completo con metricas activas.

---

## Modo "No se trabe" (obligatorio)

Cuando el orquestador ejecute agentes, debe seguir estas reglas:

1. **Timeout por agente:** si un agente no progresa en 10-15 min, marcar BLOQUEADO y continuar con los demas.
2. **No bloqueo global:** un agente bloqueado nunca detiene la fase completa.
3. **Fallback inmediato:** si una solucion ideal tarda demasiado, aplicar solucion segura temporal y abrir deuda tecnica explicita.
4. **Entrega incremental:** cada fase debe dejar cambios funcionales verificables (no esperar "todo perfecto").
5. **Reintento controlado:** maximo 2 reintentos por bloqueo; luego escalar decision.
6. **Siempre cerrar con plan siguiente:** que ejecutar en la proxima tanda, con orden exacto.

---

## Cobertura total requerida (lo que SI o SI debe ejecutar)

El orquestador debe cubrir estas lineas de trabajo:

- build y tipos de produccion,
- detalles de deploy,
- landing page comercial,
- onboarding/registro adaptativo,
- trial + gating de pago,
- flujo core de ordenes de servicio tecnico,
- deuda de archivos demasiado grandes y dificiles de testear (refactor incremental),
- smoke tests funcionales de salida a terreno.

---

## Fase 4 - Deploy + calidad + refactor testable

### D1 - Deploy Readiness Agent
**Mision:** dejar checklist de deploy listo (build, env vars, rutas API, errores conocidos, riesgos).

**Salida esperada:**
- lista de chequeo deploy con estado real,
- bloqueadores de release,
- acciones concretas de cierre.

---

### D2 - Large Files Refactor Agent
**Mision:** partir componentes/archivos sobredimensionados en piezas testeables sin romper flujo.

**Objetivo inicial:**
- reducir complejidad de wizard de ordenes,
- extraer responsabilidades por pasos,
- dejar puntos claros para test unitario.

**Salida esperada:**
- archivos extraidos,
- superficie de test mejorada,
- riesgos de regresion y mitigacion.

---

### D3 - Testability Agent
**Mision:** definir e implementar pruebas minimas de alto impacto para no romper salida a terreno.

**Salida esperada:**
- set de pruebas smoke/regresion,
- instrucciones de ejecucion,
- resultados basicos.

---

## Prompt unico "haz todo"

Usa este prompt cuando quieras que arranque todo el plan completo, sin trabarse:

```text
Lee docs/ORQUESTADOR_AGENTES_SISGO.md y ejecuta TODO el plan de punta a punta (Fase 1, 2, 3 y 4) con estrategia anti-bloqueo.

Reglas obligatorias:
1) Crea y coordina agentes por tarea.
2) Corre en paralelo siempre que no haya dependencia.
3) Si un agente se bloquea, no pares: marca BLOQUEADO, aplica fallback y sigue.
4) Prioriza entregar valor funcional incremental en cada fase.
5) En cada cierre de fase, reporta:
   - estado por agente (OK/BLOQUEADO),
   - cambios implementados,
   - pendientes criticos,
   - siguiente tanda recomendada.
6) Objetivo final: dejar servicio tecnico listo para piloto en empresas reales.
```

---

## Orden de ejecucion recomendada (full)

1. Fase 1 completa (A1-A4).
2. Fase 2 en paralelo: B2 + B4, luego B1 + B3.
3. Fase 4: D1 + D2, luego D3.
4. Fase 3: C1 + C2 para cierre de salida a terreno.

---

## Formato de reporte obligatorio por ronda

Cada ronda debe terminar con:

- **Resumen ejecutivo (5-10 lineas)**
- **Estado por agente:** `A1 OK`, `A2 BLOQUEADO`, etc.
- **Cambios listos para usar ahora**
- **Bloqueos y decision tomada**
- **Proximo comando sugerido (copy/paste)**

