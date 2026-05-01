# 🔐 Uso de la Base de Datos - Sistema de Gestión de Órdenes

## ⚠️ IMPORTANTE: Misma Base de Datos de Supabase

Este sistema está diseñado para usar **LA MISMA base de datos de Supabase** que el sistema de reparaciones existente (`sistema-reparaciones`). 

**No necesitas crear una nueva base de datos.** Simplemente ejecuta el script SQL que agrega las nuevas tablas sin afectar las existentes.

## ✅ Ventajas de Usar la Misma Base de Datos

1. **Compartir usuarios**: Los mismos usuarios pueden acceder a ambos sistemas
2. **Compartir sucursales**: Las sucursales ya creadas se reutilizan
3. **Sin duplicación**: No necesitas mantener dos bases de datos separadas
4. **Integración futura**: Los datos pueden relacionarse si es necesario

## 📋 Pasos para Configurar

### Paso 1: Acceder a Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona el proyecto que usa `sistema-reparaciones`
3. Ve a **SQL Editor** (menú lateral izquierdo)

### Paso 2: Ejecutar el Schema SQL

1. Abre el archivo `database/schema.sql` de este proyecto
2. **IMPORTANTE**: El script está diseñado para:
   - ✅ Crear solo las tablas nuevas que NO existen
   - ✅ NO modificar tablas existentes (como `users`, `orders`, etc.)
   - ✅ Insertar datos iniciales solo si no existen

3. Copia todo el contenido del archivo `schema.sql`
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **RUN** (o presiona Ctrl+Enter)

### Paso 3: Verificar que se Crearon las Tablas

Ejecuta esta consulta para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'branches',
  'customers', 
  'services',
  'device_checklist_items',
  'work_orders',
  'order_services',
  'order_notes'
)
ORDER BY table_name;
```

Deberías ver las 7 tablas nuevas listadas.

### Paso 4: Configurar Variables de Entorno

En tu archivo `.env.local` del proyecto `sistema-gestion-ordenes`, usa las **MISMAS** variables que `sistema-reparaciones`:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

## 🔍 Estructura de Tablas

### Tablas Existentes (del sistema-reparaciones)
Estas tablas **NO se tocan**, solo se usan:
- `users` - Usuarios del sistema (compartida)
- `orders` - Órdenes del sistema de reparaciones (se mantiene separada)
- `suppliers` - Proveedores (si la usas, puedes compartirla)
- `branches` - Sucursales (se actualiza con campos nuevos si no existen)

### Tablas Nuevas (de sistema-gestion-ordenes)
Estas son las nuevas tablas que se crean:
- `customers` - Clientes del sistema de órdenes
- `services` - Servicios de reparación disponibles
- `device_checklist_items` - Items de checklist por tipo de dispositivo
- `work_orders` - Órdenes de trabajo (diferente a `orders` del sistema anterior)
- `order_services` - Relación entre órdenes y servicios
- `order_notes` - Notas de órdenes

## 🔒 Seguridad (RLS)

El script SQL incluye Row Level Security (RLS) configurado para las nuevas tablas:

- **Branches**: Todos pueden leer, solo admin puede modificar
- **Customers**: Todos los usuarios autenticados pueden leer/crear/modificar
- **Services**: Todos pueden leer, solo admin puede crear
- **Work Orders**: Los usuarios ven solo sus órdenes o las de su sucursal
- **Order Services/Notes**: Usuarios autenticados pueden gestionar

## ⚠️ Precauciones

1. **Backup antes de ejecutar**: Aunque el script es seguro, siempre haz un backup de tu base de datos antes de ejecutar scripts SQL.

2. **Revisa el script**: El archivo `schema.sql` usa `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`, por lo que es seguro ejecutarlo múltiples veces.

3. **No afecta tablas existentes**: El script NO modifica las tablas `users`, `orders`, etc. del sistema anterior. Solo crea nuevas tablas.

4. **Branches compartidas**: Si ya tienes la tabla `branches` en el sistema anterior, el script verificará si tiene los campos nuevos (`logo_url`, `razon_social`, etc.) y los agregará si no existen.

## 🧪 Prueba después de Configurar

1. Ejecuta el proyecto: `npm run dev`
2. Intenta hacer login con un usuario existente
3. Verifica que puedes ver el dashboard
4. Intenta crear una nueva orden de trabajo

## ❓ ¿Cuándo Crear una Base de Datos Nueva?

Solo deberías crear una base de datos nueva si:
- Quieres mantener los sistemas completamente separados
- Tienes diferentes equipos trabajando en cada sistema
- Tienes políticas de seguridad que requieren separación

En la mayoría de casos, **usar la misma base de datos es la mejor opción**.

## 🔄 Migraciones Futuras

Si necesitas hacer cambios en las tablas en el futuro:

1. Crea un nuevo archivo SQL en `database/` con un nombre descriptivo (ej: `add_field_x_to_work_orders.sql`)
2. Ejecútalo en Supabase SQL Editor
3. Documenta los cambios

---

**¿Problemas?** Verifica:
- ✅ Que estás usando el proyecto correcto de Supabase
- ✅ Que las variables de entorno son correctas
- ✅ Que ejecutaste el SQL completo sin errores
- ✅ Que las tablas se crearon correctamente (consulta de verificación)



