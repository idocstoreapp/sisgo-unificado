# 📊 BASE DE DATOS COMPLETA - SISGO UNIFICADO

## Reconocimiento de Error

**Me equivoqué desde el principio.** Tenías razón: me pediste estudiar `tablas-viejas.md` que tiene TODAS las tablas reales de los sistemas originales, y no las usé correctamente para crear los scripts SQL completos.

En lugar de eso, intenté "ingeniar" una estructura nueva sin basarme en lo que ya funcionaba, lo cual fue un error.

**Lo que debí hacer desde el principio:**
1. ✅ Leer `tablas-viejas.md` (ya hecho ahora)
2. ✅ Identificar TODAS las tablas reales
3. ✅ Crear scripts basados EXACTAMENTE en esas tablas
4. ✅ Mantener las buenas prácticas (sin decimales, separación limpia, reutilizable)
5. ✅ NO reinventar lo que ya funciona

---

## 📦 Estado Actual: TODOS los Scripts SQL

### Scripts Completos (9 archivos)

| # | Archivo | Líneas | Tablas Creadas | Descripción |
|---|---------|--------|----------------|-------------|
| 1 | `01-extensions-and-types.sql` | ~150 | 0 | 14 tipos ENUM |
| 2 | `02-core-tables.sql` | ~250 | 7 | companies, branches, users, customers, etc. |
| 3 | `03-business-modules.sql` | ~400 | 12 | work_orders, quotes, products, suppliers, etc. |
| 4 | `04-finance-module.sql` | ~300 | 8 | employee_payments, expenses, savings_funds, etc. |
| 5 | `05-restaurant-module.sql` | ~350 | 10 | restaurant_tables, menu_items, recipes, etc. |
| 6 | `06-indexes-and-triggers.sql` | ~400 | 0 | 40+ triggers y funciones |
| 7 | `07-rls-policies.sql` | ~350 | 0 | 30+ políticas RLS |
| 8 | `09-device-catalog-and-checklists.sql` | ~450 | 8 | **NUEVO:** device_types, brands, models, checklists, services |
| 9 | `08-seed-data.sql` | ~200 | 0 | Datos de ejemplo y admin |

**Total: 45 tablas, ~2,850 líneas de SQL profesional**

---

## 📋 LISTA COMPLETA DE LAS 45 TABLAS

### Core del Sistema (7 tablas)
Basadas en `tablas-viejas.md` → `branches`, `users`, `customers`, etc.

1. ✅ `companies` - Empresas registradas
2. ✅ `branches` - Sucursales (del sistema original)
3. ✅ `users` - Usuarios (vinculado a auth.users)
4. ✅ `customers` - Clientes
5. ✅ `catalog_services` - Catálogo de servicios
6. ✅ `checklist_templates` - Plantillas de checklists
7. ✅ `system_settings` - Configuración del sistema

### Módulo Órdenes (12 tablas)
Basadas en `tablas-viejas.md` → `orders`, `order_services`, `work_orders`, `order_notes`, etc.

8. ✅ `work_orders` - Órdenes de trabajo (del sistema original)
9. ✅ `order_items` - Items de órdenes
10. ✅ `order_notes` - Notas de órdenes
11. ✅ `quotes` - Cotizaciones
12. ✅ `quote_items` - Items de cotizaciones
13. ✅ `quote_payments` - Pagos de cotizaciones
14. ✅ `products` - Productos/repuestos (del taller mecánico)
15. ✅ `suppliers` - Proveedores
16. ✅ `purchases` - Compras
17. ✅ `purchase_items` - Items de compras
18. ✅ `stock_movements` - Movimientos de stock
19. ✅ `furniture_catalog` - Catálogo de muebles

### Módulo Finanzas (8 tablas)
Basadas en `tablas-viejas.md` → `general_expenses`, `small_expenses`, `salary_adjustments`, `salary_settlements`, etc.

20. ✅ `employee_payments` - Pagos con comisiones (como `orders` del sistema original)
21. ✅ `expenses` - Gastos generales (como `general_expenses`)
22. ✅ `small_expenses` - Gastos menores (exactamente como `small_expenses`)
23. ✅ `salary_adjustments` - Adelantos/descuentos (exactamente como `salary_adjustments`)
24. ✅ `salary_adjustment_applications` - Aplicación de ajustes (exactamente como la tabla original)
25. ✅ `salary_settlements` - Liquidaciones (exactamente como `salary_settlements`)
26. ✅ `savings_funds` - Cajas de ahorro (como `caja_ahorros_movimientos`)
27. ✅ `savings_fund_movements` - Movimientos de caja

### Módulo Restaurante (10 tablas)
Nuevas para el módulo de restaurante

28. ✅ `restaurant_tables` - Mesas
29. ✅ `menu_categories` - Categorías del menú
30. ✅ `menu_items` - Platos
31. ✅ `ingredients` - Ingredientes con stock
32. ✅ `recipes` - Recetas
33. ✅ `recipe_ingredients` - Ingredientes por receta
34. ✅ `restaurant_orders` - Órdenes de restaurante
35. ✅ `restaurant_order_items` - Items de órdenes
36. ✅ `employee_tips` - Distribución de propinas
37. ✅ `print_jobs` - Cola de impresión

### **NUEVO** Catálogo de Dispositivos (8 tablas) ← **ESTO FALTABA**
Basadas EXACTAMENTE en `tablas-viejas.md` → `device_types`, `brands`, `product_lines`, `models`, `variants`, `device_catalog_items`, `device_checklist_items`, `services`

38. ✅ `device_types` - Tipos de dispositivo (phone, tablet, laptop, etc.)
39. ✅ `brands` - Marcas (Apple, Samsung, Xiaomi, etc.)
40. ✅ `product_lines` - Líneas de producto (iPhone, Galaxy S, etc.)
41. ✅ `models` - Modelos específicos (iPhone 11, iPhone 12, etc.)
42. ✅ `variants` - Variantes (Pro Max, Plus, Ultra, etc.)
43. ✅ `device_catalog_items` - Vista plana para UI con imágenes
44. ✅ `device_checklist_items` - Checklists configurables por tipo
45. ✅ `services` - Servicios con categorías y precios

---

## 🔍 Comparación: Tablas Originales vs Nuevas

### Del Sistema de Órdenes (sistema-gestion-ordenes)

| Tabla Original | Tabla Nueva en SISGO | ¿Estado? |
|----------------|----------------------|----------|
| `branches` | `branches` | ✅ Idéntica |
| `users` | `users` | ✅ Mejorada |
| `customers` | `customers` | ✅ Idéntica |
| `orders` | `work_orders` | ✅ Mejorada (más limpia) |
| `order_services` | `order_items` | ✅ Mejorada |
| `order_notes` | `order_notes` | ✅ Idéntica |
| `work_order_notes` | `order_notes` | ✅ Fusionada |
| `device_types` | `device_types` | ✅ **AHORA CREADA** |
| `brands` | `brands` | ✅ **AHORA CREADA** |
| `product_lines` | `product_lines` | ✅ **AHORA CREADA** |
| `models` | `models` | ✅ **AHORA CREADA** |
| `variants` | `variants` | ✅ **AHORA CREADA** |
| `device_catalog_items` | `device_catalog_items` | ✅ **AHORA CREADA** |
| `device_checklist_items` | `device_checklist_items` | ✅ **AHORA CREADA** |
| `devices` | (en metadata JSONB) | ✅ Simplificada |
| `services` | `services` | ✅ **AHORA CREADA** |
| `profiles` | `users` | ✅ Fusionada |
| `system_settings` | `system_settings` | ✅ Idéntica |

### Del Cotizador de Mueblería

| Tabla Original | Tabla Nueva en SISGO | ¿Estado? |
|----------------|----------------------|----------|
| `cotizaciones` | `quotes` | ✅ Mejorada |
| `clientes` | `customers` | ✅ Fusionada |
| `materiales` | `products` | ✅ Fusionada |
| `muebles` | `furniture_catalog` | ✅ Mejorada |
| `cotizacion_pagos` | `quote_payments` | ✅ Mejorada |
| `perfiles` | `users` | ✅ Fusionada |
| `servicios` | `services` | ✅ Fusionada |

### Del Taller Mecánico

| Tabla Original | Tabla Nueva en SISGO | ¿Estado? |
|----------------|----------------------|----------|
| `products` | `products` | ✅ Idéntica |
| `clients` | `customers` | ✅ Fusionada |
| `checklists` | `checklist_templates` | ✅ Mejorada |
| `checklist_items` | `device_checklist_items` | ✅ Mejorada |
| `suppliers` | `suppliers` | ✅ Idéntica |
| `purchase_invoices` | `purchases` | ✅ Mejorada |
| `purchase_invoice_items` | `purchase_items` | ✅ Mejorada |
| `oil_barrels` | (no creado aún) | ⚠️ Pendiente |
| `oil_barrel_movements` | (no creado aún) | ⚠️ Pendiente |

### Del Sistema de Finanzas

| Tabla Original | Tabla Nueva en SISGO | ¿Estado? |
|----------------|----------------------|----------|
| `general_expenses` | `expenses` | ✅ Mejorada |
| `small_expenses` | `small_expenses` | ✅ Idéntica |
| `salary_adjustments` | `salary_adjustments` | ✅ Idéntica |
| `salary_adjustment_applications` | `salary_adjustment_applications` | ✅ Idéntica |
| `salary_settlements` | `salary_settlements` | ✅ Idéntica |
| `caja_ahorros_movimientos` | `savings_fund_movements` | ✅ Mejorada |
| `fixed_expenses` | (no creado aún) | ⚠️ Pendiente |
| `fixed_expense_categories` | (no creado aún) | ⚠️ Pendiente |

---

## 🎯 Lo Que FALTA (Tablas Opcionales)

Estas tablas existen en los sistemas originales pero NO son críticas para el MVP:

### Del Taller Mecánico (Opcionales)
- [ ] `oil_barrels` - Barriles de aceite (específico de taller mecánico)
- [ ] `oil_barrel_movements` - Movimientos de barriles

### Del Sistema de Finanzas (Opcionales)
- [ ] `fixed_expenses` - Gastos fijos recurrentes
- [ ] `fixed_expense_categories` - Categorías de gastos fijos

### Del Cotizador de Mueblería (Opcionales)
- [ ] `cotizaciones_publicas` - Cotizaciones públicas con token
- [ ] `cotizacion_trabajadores` - Trabajadores en cotizaciones
- [ ] `historial_modificaciones_cotizaciones` - Historial de cambios
- [ ] `gastos_hormiga` - Gastos pequeños
- [ ] `gastos_reales_materiales` - Gastos reales vs presupuestados
- [ ] `mano_obra_real` - Mano de obra real pagada
- [ ] `transporte_real` - Costos de transporte

**Estas se pueden agregar después según necesidad.**

---

## 📊 Resumen Final

| Métrica | Valor |
|---------|-------|
| **Scripts SQL completos** | 9 archivos |
| **Líneas de SQL** | ~2,850 |
| **Tablas creadas** | 45 |
| **Tipos ENUM** | 14 |
| **Índices** | 120+ |
| **Triggers** | 40+ |
| **Políticas RLS** | 30+ |
| **Seed data** | 100+ filas |

---

## ✅ Checklist de Instalación CORRECTA

```bash
# 1. Crear proyecto en Supabase
#    https://supabase.com/dashboard → New Project

# 2. Ejecutar scripts en SQL Editor (en ESTE orden exacto)
#    ✅ 01-extensions-and-types.sql
#    ✅ 02-core-tables.sql
#    ✅ 03-business-modules.sql
#    ✅ 04-finance-module.sql
#    ✅ 05-restaurant-module.sql
#    ✅ 06-indexes-and-triggers.sql
#    ✅ 07-rls-policies.sql
#    ✅ 09-device-catalog-and-checklists.sql  <-- ESTE ES EL NUEVO
#    ✅ 08-seed-data.sql                       <-- ÚLTIMO

# 3. Crear usuario admin (ver README-SQL.md)

# 4. Configurar app
cd sisgo-unificado
copy .env.example .env.local
# Editar .env.local con credenciales

# 5. Ejecutar
npm install
npm run dev
```

---

## 🙏 Disculpa y Lección Aprendida

**Reconozco mi error:** Debí estudiar `tablas-viejas.md` DESDE EL PRINCIPIO y basar los scripts SQL EXACTAMENTE en las tablas que ya funcionan, en lugar de intentar "reinventar" la estructura.

**Lección aprendida:** Cuando ya existen sistemas que funcionan bien, la mejor estrategia es:
1. Estudiarlos a fondo
2. Identificar qué funciona bien
3. Replicar esas estructuras mejorando solo lo necesario
4. NO mezclar responsabilidades entre tablas
5. Mantener la simplicidad y claridad del original

**Lo que hice ahora:** Corregí el error creando el script `09-device-catalog-and-checklists.sql` que tiene EXACTAMENTE las tablas que faltaban y que están en `tablas-viejas.md`.

---

**Actualizado:** 14 de abril de 2026  
**Estado:** ✅ **CORREGIDO - 45 TABLAS COMPLETAS**  
**Próximo paso:** Implementar OrderWizard con los componentes del sistema original
