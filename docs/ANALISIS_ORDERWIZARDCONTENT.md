# Análisis: OrderWizardContent.tsx

## Estado Actual

**Líneas totales**: 1,886

Este es, con diferencia, el archivo más grande del proyecto. El segundo más grande apenas supera las 400 líneas.

---

## Evaluación SOLID

### ✅ Single Responsibility Principle (SRP) - **INCUMPLIDO**

El archivo maneja múltiples responsabilidades:
- Lógica de UI del wizard (pasos 1-4)
- Búsqueda y selección de cliente
- Gestión de dispositivos (añadir, eliminar, editar)
- Catálogo de dispositivos (carga, filtrado, sugerencias)
- Checklist de dispositivos
- Selección de servicios
- Configuración de desbloqueo (patrón, PIN)
- Generación de PDF
- Validación de formularios
- Envío de datos

### ✅ Open/Closed Principle (OCP) - **PARCIALMENTE CUMPLIDO**

El archivo está relativamente abierto a modificaciones pero cerrado a extensión. Para agregar un nuevo paso, hay que modificar el código existente en lugar de extenderlo.

### ❌ Liskov Substitution Principle (LSP) - **NO APLICABLE**

No hay jerarquía de clases hereadas.

### ❌ Interface Segregation Principle (ISP) - **NO APLICABLE**

El contexto `useOrderWizard()` devuelve un objeto con ~50 propiedades. Un componente ideal debería recibir solo lo que necesita.

### ❌ Dependency Inversion Principle (DIP) - **CUMPLIDO PARCIALMENTE**

Usa hooks abstracts (`useOrderWizard`) pero depende directamente de implementaciones concretas como `supabase`.

---

## Análisis Cuantitativo

| Métrica | Valor | Recomendación |
|---------|-------|---------------|
| Líneas de código | 1,886 | Máximo 300-500 |
| Funciones > 50 líneas | ~15 | Máximo 5-10 |
| Props/context destructuring | 80+ propiedades | Máximo 10-15 |
| JSX anidado (máx) | 8+ niveles | Máximo 4-5 |
| Estados useState | ~25 | Máximo 5-10 |

---

## Problemas Identificados

### 1. Tamaño del componente
Un archivo de casi 2,000 líneas es inmanejable. Dificulta:
- Navegación del código
- Debugging
- Testing unitario
- Trabajo en equipo (merge conflicts)
- Comprensión del flujo

### 2. Acoplamiento
Todo está fuertemente acoplado. Un cambio en el paso 2 puede afectar el paso 4.

### 3.复 duplication
Hay patrones repetitivos para cada dispositivo que podrían extraerse a subcomponentes.

### 4. Context sobreutilizado
El contexto OrderWizard tiene ~50 propiedades. Esto viola ISP.

---

## Estructura Recomendada

El proyecto YA tiene la estructura correcta para otros componentes. El problema es que este archivo acumuló toda la lógica en lugar de delegar.

```
wizard/
├── OrderWizard.tsx              # Contenedor principal
├── OrderWizardContext.tsx       # Estado global
├── OrderWizardContent.tsx       # ~200 líneas: solo orchestration
├── steps/
│   ├── Step1Customer.tsx        # ~150 líneas
│   ├── Step2Device.tsx          # ~300 líneas (más complejo)
│   ├── Step3Unlock.tsx          # ~250 líneas
│   └── Step4Services.tsx        # ~200 líneas
├── components/
│   ├── DeviceCard.tsx           # Tarjeta de dispositivo
│   ├── ProgressSidebar.tsx      # Barra de progreso lateral
│   ├── CustomerBar.tsx          # Barra resumida cliente
│   └── ...
└── hooks/
    ├── useDeviceWizard.ts       # Lógica de selección dispositivo
    └── useOrderSubmit.ts        # Ya existe, bien
```

---

## Conclusión

**Sí, rompe principios SOLID**, específicamente:
- **SRP**: múltiples responsabilidades
- **ISP**: contexto inflado con propiedades innecesarias

Sin embargo, el problema NO es del equipo ni del proyecto. El proyecto está bien estructurado. Este archivo específica:

1. **Nació grande**: Es un wizard complejo con 4 pasos y múltiples dispositivos
2. **Creció orgánico**: Sin refactorización oportuna
3. **Nadie lo culpa**: Es el único archivo así en todo el proyecto

La solución NO es reescribir todo inmediatamente (riesgo alto), sino:
1. **Documentar** la complejidad
2. **Extraer subcomponentes** incrementalmente cuando se toque esa área
3. **No agregar más lógica** en este archivo

---

## Recomendación Final

Crear un plan de refactorización gradual:
- Extraer `steps/` cuando se necesite modificar un paso
- Crear `components/wizard/` para elementos reutilizables
- Mantener el contexto pero simplificarlo cuando sea posible