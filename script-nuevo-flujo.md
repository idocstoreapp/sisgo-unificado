**ROL**
Actúa como un **Senior Product Designer + UX Engineer + Arquitecto de Base de Datos especializado en SaaS operativos (tipo POS / sistemas de órdenes de trabajo)**.
Tu objetivo es rediseñar el sistema existente sin romper su lógica de negocio.

---

**CONTEXTO DEL PROYECTO**
Estoy construyendo una app tipo SaaS para servicios técnicos (reparación de celulares, notebooks, etc.).

Actualmente existe un flujo tipo “wizard” para crear órdenes de trabajo que incluye:

1. Registro de cliente (por RUT o manual)
2. Selección de dispositivo (tipo → marca → serie → modelo → variante)
3. Checklist técnico (≈17 validaciones del estado del equipo)
4. Descripción del problema
5. Selección de servicio
6. Prioridad
7. Fecha estimada
8. Garantía
9. Generación de orden + PDF

Problemas actuales:

* Demasiados pasos → lento en atención real
* Demasiadas decisiones → fatiga del usuario
* Checklist crítico pero tedioso
* Usuarios quieren rapidez, no perfección
* El sistema necesita seguir siendo completo (no perder información clave)

---

**OBJETIVO DEL REDISEÑO**

Rediseñar el flujo de creación de órdenes para que sea:

* Ultra rápido en contexto real (mostrador / cliente presente)
* Entendible en menos de 2 minutos
* Usable todo el día sin fatiga
* Comercializable como producto SaaS
* Sin romper la lógica actual ni la base de datos

---

**REQUISITOS CLAVE**

1. **NO eliminar lógica importante**

   * El checklist es obligatorio (protección contra reclamos)
   * El detalle del dispositivo es importante
   * El sistema debe seguir generando datos completos

2. **DIVIDIR EL FLUJO EN DOS MODOS**

   * Recepción rápida (frente al cliente)
   * Diagnóstico detallado (después)

3. **SIMPLIFICAR SIN PERDER PODER**

   * Reducir decisiones activas del usuario
   * Usar defaults inteligentes
   * Priorizar “tap” sobre escritura

4. **UI ORIENTADA A TOQUE**

   * Grids visuales
   * Botones grandes
   * Selección por imágenes
   * Minimizar inputs de texto

5. **CHECKLIST REDISEÑADO**

   * Basado en:

     * estado global primero
     * excepciones después
   * Interacción visual (zonas del dispositivo)
   * Posibilidad de:

     * “marcar todo como OK”
     * marcar solo problemas
   * Debe ser rápido pero legalmente útil

6. **COMPATIBILIDAD CON BASE DE DATOS**

   * Analiza estructura actual (yo la proporcionaré)
   * No romper relaciones existentes
   * Proponer:

     * cambios mínimos
     * nuevas tablas solo si son necesarias
     * migraciones seguras

---

**LO QUE DEBES ENTREGAR**

### 1. 🧠 Análisis del flujo actual

* Qué está mal
* Qué funciona
* Dónde se pierde tiempo
* Qué partes son críticas y no se pueden tocar

---

### 2. 🔄 Nuevo flujo propuesto (alto nivel)

* Paso a paso simplificado
* Qué se hace en:

  * Recepción
  * Diagnóstico

---

### 3. 📱 Diseño detallado del wizard (pantalla por pantalla)

Para cada paso:

* Objetivo
* Qué se muestra
* Tipo de UI (grid, botones, input, etc.)
* Qué es obligatorio vs opcional
* Cómo reducir fricción
* Ejemplo real

---

### 4. ⚡ Rediseño del checklist (CRÍTICO)

* Nueva lógica de interacción
* Cómo reducir de 17 decisiones a <5 acciones reales
* Cómo mantener protección legal
* Uso de:

  * defaults
  * selección por zonas
  * fotos (opcional)
* Ejemplo completo de uso

---

### 5. 🗄️ Impacto en base de datos

* Qué tablas actuales se usan
* Qué campos cambian de uso (si aplica)
* Nuevos campos sugeridos
* Migración sin romper producción

---

### 6. 🚀 Mejores prácticas tipo SaaS vendible

* Cómo hacer que el usuario entienda la app en minutos
* Qué hace que esto sea “vendible”
* Qué eliminarías si tuvieras que simplificar aún más

---

### 7. 🎯 Principios de diseño aplicados

* Explica qué principios UX estás aplicando:

  * reducción de carga cognitiva
  * defaults inteligentes
  * progressive disclosure
  * etc.

---

**ESTILO DE RESPUESTA**

* No genérico
* No teórico
* Enfocado en producto real
* Explica decisiones con lógica de negocio
* Piensa como alguien que quiere vender este sistema

---

**INPUT ADICIONAL (IMPORTANTE)**
Después de este prompt, te proporcionaré:

* estructura de base de datos (Supabase)
* tablas relevantes

Debes usarlas para ajustar el diseño sin romper el sistema.

---

**OBJETIVO FINAL**

Diseñar un flujo que permita:

👉 Crear una orden en 20–40 segundos
👉 Mantener protección técnica/legal
👉 Sentirse moderno, rápido y profesional
👉 Ser fácilmente vendible como SaaS

---
recuerda siempre que es importante que cada paso se haga pero que sea simple hacer el checklist que sea simple hacer la descripcion que sea simple elegir servicio que sea simple todo lo mas simple posible, muchos taps pocos imputs y pocos pasos si no los necesita el flujo debe ser asi el cliente lleg se crea orden se registra el cliente se hace registro de equipo facil pocos pasos, el checklist pregunta 3 cosas estado fisico funcional? camara fsica, pantalla, carcasa, pin de carga, botones, etc funconal/detalles/no probado
si coloca detalles le despliega checklist de pantallas camaras botones tpin de carga todo lo fisico, uego probar funciones, alta voz, llamada auricular, microfono, wifi, bluetooth, sensor de proximidad, sensor de luz, flash vibrador etc, luego si entrega con chip y microchip rapida opcion si vienem ambos o seleccionar solo el que deja chip o micro chip
esa logica con todo notebooks smartwatch todo asi
luego descripcion del problema no se que hacer alli por eso no lo he tocado mucho .
y servicios tratar de que sean pasos siples sensillos rapido.
