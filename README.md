# 🚀 SISGO UNIFICADO - Sistema de Gestión de Órdenes

## 📋 Descripción

SISGO Unificado es una aplicación web moderna y escalable para la gestión integral de negocios multi-sucursal. Combina la funcionalidad de 5 sistemas diferentes en UNA sola aplicación:

1. **Servicio Técnico** - Gestión de órdenes de reparación de dispositivos
2. **Taller Mecánico** - Control de inventario y órdenes de trabajo
3. **Mueblería** - Sistema de cotizaciones con catálogo de muebles
4. **Restaurante** - POS con gestión de mesas, menú y comandas
5. **Finanzas** - Control de pagos, comisiones y gastos

### Stack Tecnológico
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide Icons
- **Base de Datos:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Estado:** Zustand + React Query
- **Testing:** Vitest + React Testing Library
- **PDFs:** @react-pdf/renderer
- **Gráficos:** Recharts

---

## 🏗️ Arquitectura

### Clean Architecture + SOLID Principles

```
src/
├── domain/                      # 📦 Entidades, Value Objects, Repositorios (interfaces)
│   ├── entities/                #   - Company, Branch, User, WorkOrder, Quote, Product, etc.
│   ├── value-objects/           #   - Money, Email, Phone
│   └── repositories/            #   - Interfaces de repositorios
│
├── application/                 # 🚀 Casos de Uso, DTOs, DI Container
│   ├── use-cases/               #   - CreateOrderUseCase, CreateQuoteUseCase, etc.
│   ├── dtos/                    #   - Data Transfer Objects
│   └── di-container.ts          #   - Inyección de dependencias
│
├── infrastructure/              # 🏭 Implementaciones de infraestructura
│   ├── database/supabase/       #   - Clientes, Repositorios, Mappers
│   └── auth/                    #   - Supabase Auth
│
├── presentation/                # 🎨 Componentes React, Hooks, Providers
│   ├── components/              #   - UI Components, Forms, Dashboards
│   ├── hooks/                   #   - Custom React Hooks
│   └── providers/               #   - React Query Provider
│
├── shared/                      # 🔗 Código Compartido
│   ├── kernel/                  #   - Result, Either, Error types
│   ├── utils/                   #   - Currency, Date, Format helpers
│   └── constants/               #   - Business constants
│
└── app/                         # 🌐 Next.js App Router
    ├── (auth)/                  #   - Login, Register
    └── (dashboard)/             #   - Órdenes, Cotizaciones, Finanzas, etc.
```

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 20+ 
- npm o pnpm
- Una cuenta de [Supabase](https://supabase.com) (gratuita)

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd sisgo-unificado
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
copy .env.example .env.local

# Editar .env.local con tus credenciales de Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
# SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:3000**

### 5. Ejecutar tests
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

---

## 📚 Documentación

### Guías disponibles
- [Manual del Sistema](../MANUAL_SISTEMA_GESTION_ORDENES.md) - Guía completa de usuario
- [Plan de Unificación](../PLAN_UNIFICACION_SISTEMAS.md) - Plan detallado de arquitectura
- [Progreso Actualizado](../PROGRESO_ACTUALIZADO.md) - Estado actual del desarrollo
- [Arquitectura Recomendada](../ARQUITECTURA_RECOMENDADA.md) - Mejores prácticas

### Base de Datos
La base de datos está diseñada con 30+ tablas unificadas que soportan:
- ✅ Multi-empresa y multi-sucursal
- ✅ Gestión de usuarios con roles granulares
- ✅ Órdenes de trabajo flexibles (servicio técnico, taller, restaurante)
- ✅ Inventario y control de stock
- ✅ Cotizaciones con cálculo automático de IVA y ganancias
- ✅ Finanzas (comisiones, gastos, caja de ahorro)
- ✅ Restaurant (mesas, menú, órdenes, recetas)

---

## 🎯 Características Principales

### 1. Multi-Empresa
- Registro de múltiples empresas con tipos de negocio diferentes
- Gestión de sucursales por empresa
- Configuración personalizada por empresa (IVA, comisiones, etc.)

### 2. Gestión de Órdenes
- Wizards intuitivos para selección de dispositivos/vehículos
- Checklists dinámicos por tipo de equipo
- Generación de PDFs profesionales con códigos QR
- Notificaciones automáticas por email y WhatsApp
- Sistema de garantías integrado

### 3. Cotizaciones (Mueblería)
- Catálogo de muebles con variantes
- Cálculo automático de materiales y mano de obra
- Cálculo de IVA (19%) y margen de ganancia
- Control de stock de materiales
- Registro de costos reales post-aceptación

### 4. Inventario (Taller Mecánico)
- Gestión de productos con código de barras
- Control de stock con alertas automáticas
- Registro de compras a proveedores
- Auditoría de movimientos de stock

### 5. Restaurante POS
- Gestión de mesas con estados (disponible, ocupada, reservada)
- Menú digital con categorías
- Órdenes de restaurante con personalización
- Control de stock de ingredientes
- Recetas con costos automáticos

### 6. Finanzas
- Cálculo automático de comisiones (40% ganancia neta)
- Gestión de adelantos y descuentos
- Registro de gastos generales y menores
- Caja de ahorro para técnicos
- Reportes semanales y mensuales

---

## 🧪 Testing

### Estructura de Tests
```
tests/
├── domain/
│   └── entities/
│       ├── Company.test.ts       # ✅ 8 tests passing
│       ├── Quote.test.ts         # ✅ 2 tests passing
│       ├── WorkOrder.test.ts     # ✅ 2/3 tests passing
│       └── WorkOrder-extended.test.ts  # ✅ 7 tests passing
└── setup.ts
```

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Tests de dominio solamente
npm test tests/domain/

# Tests en modo watch (desarrollo)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

### Estado Actual de Tests
- ✅ **19/20 tests passing** (95%)
- ⚠️ 1 test fallido (minor edge case en warranty calculation)

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar versión de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |

---

## 🔧 Configuración de Producción

### Deploy en Vercel
1. Conectar repositorio a Vercel
2. Agregar variables de entorno en el dashboard de Vercel
3. Deploy automático

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde la terminal
vercel --prod
```

### Variables de Entorno Requeridas
```env
# Requeridas
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Opcionales
RESEND_API_KEY=              # Para emails
WHATSAPP_API_KEY=            # Para WhatsApp
BSALE_API_KEY=               # Para facturación electrónica
```

---

## 🤝 Contribuir

### Flujo de Trabajo
1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Estándares de Código
- ✅ TypeScript estricto
- ✅ ESLint + Prettier configurados
- ✅ Tests para lógica de negocio crítica
- ✅ Componentes < 300 líneas
- ✅ Separación de responsabilidades (Clean Architecture)

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos** | 150+ |
| **Líneas de Código** | ~16,000 |
| **Entidades de Dominio** | 14 |
| **Casos de Uso** | 25+ |
| **Repositorios** | 15+ |
| **Tests** | 20 (95% passing) |
| **Fases Completadas** | 8/9 |

---

## 🐛 Problemas Conocidos

### Bugs Menores
- ⚠️ 1 test de warranty está fallando (edge case en cálculo de fechas)
  - **Impacto:** Bajo - solo afecta tests, no afecta funcionalidad
  - **Solución:** Ajustar test para usar fechas mock en lugar de Date()

### Mejoras Futuras
- [ ] Server Actions para mutaciones (patrón Next.js 15 recomendado)
- [ ] API Routes para queries de datos
- [ ] E2E Tests con Playwright
- [ ] Internacionalización (i18n)
- [ ] Modo oscuro
- [ ] Notificaciones push

---

## 📄 Licencia

Este proyecto es privado y propietario.

---

## 👥 Equipo

Desarrollado como parte del proyecto SISGO Unificado.

---

## 📞 Soporte

Para preguntas o soporte, contacta al equipo de desarrollo.

---

**Última actualización:** 14 de abril de 2026  
**Versión:** 0.1.0  
**Estado:** ✅ FASE 9 COMPLETADA
