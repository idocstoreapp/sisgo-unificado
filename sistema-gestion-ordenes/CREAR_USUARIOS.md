# 👤 Crear Usuarios para el Sistema

## ✅ Opción 1: Usar Usuarios Existentes (MÁS FÁCIL)

Si ya tienes usuarios creados en el sistema de reparaciones, **puedes usar los mismos usuarios** porque ambos sistemas comparten la misma base de datos.

### Verificar Usuarios Existentes

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. Ve a **Authentication** → **Users**
3. Ahí verás todos los usuarios existentes

### Verificar que el Usuario está en la Tabla `users`

1. Ve a **SQL Editor** en Supabase
2. Ejecuta esta consulta:

```sql
SELECT id, email, name, role FROM users;
```

3. Si ves tu usuario, puedes usar su email y contraseña para hacer login

## ✅ Opción 2: Crear Usuario Nuevo

### Paso 1: Crear Usuario en Authentication

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. Ve a **Authentication** → **Users**
3. Haz clic en **"Add user"** o **"Create new user"**
4. Completa:
   - **Email**: El email del usuario
   - **Password**: Una contraseña segura (guárdala, la necesitarás para login)
   - **Auto Confirm User**: ✅ Marca esta opción (para que no necesite confirmar email)
5. Haz clic en **"Create user"**
6. **IMPORTANTE**: Copia el **User UID** que se muestra (lo necesitarás en el siguiente paso)

### Paso 2: Agregar Usuario a la Tabla `users`

1. Ve a **SQL Editor** en Supabase
2. Ejecuta esta consulta (reemplaza los valores):

```sql
INSERT INTO users (id, email, name, role)
VALUES (
  'USER_UID_AQUI',  -- El UID que copiaste del paso anterior
  'usuario@ejemplo.com',  -- El email del usuario
  'Nombre del Usuario',  -- Nombre completo
  'technician'  -- Rol: 'admin', 'technician', 'encargado', o 'recepcionista'
);
```

### Roles Disponibles

- **`admin`**: Acceso completo al sistema (puede gestionar usuarios, sucursales, ver todas las órdenes)
- **`technician`**: Puede crear y gestionar sus propias órdenes
- **`encargado`**: Puede ver órdenes de su sucursal y gestionar gastos
- **`recepcionista`**: Puede ver y buscar información, pero no crear órdenes

### Ejemplo Completo

```sql
-- Crear usuario técnico
INSERT INTO users (id, email, name, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Reemplaza con el UID real
  'juan@ejemplo.com',
  'Juan Pérez',
  'technician'
);

-- Crear usuario administrador
INSERT INTO users (id, email, name, role)
VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f12345678901',  -- Reemplaza con el UID real
  'admin@ejemplo.com',
  'Administrador',
  'admin'
);
```

## 🔑 Hacer Login

Una vez que tienes el usuario:

1. Ve a `http://localhost:4321/login`
2. Ingresa el **email** del usuario
3. Ingresa la **contraseña** que configuraste
4. Haz clic en **"Entrar"**

## 🔍 Verificar Usuarios Creados

Para ver todos los usuarios:

```sql
SELECT 
  id,
  email,
  name,
  role,
  sucursal_id,
  created_at
FROM users
ORDER BY created_at DESC;
```

## ⚠️ Notas Importantes

1. **El ID debe coincidir**: El `id` en la tabla `users` DEBE ser exactamente el mismo que el `id` en `auth.users` (el User UID)

2. **Email único**: Cada email solo puede usarse una vez

3. **Roles**: Asegúrate de usar un rol válido: `admin`, `technician`, `encargado`, o `recepcionista`

4. **Sucursal**: Si es técnico o encargado, puedes asignar una sucursal:

```sql
-- Asignar sucursal a un usuario
UPDATE users 
SET sucursal_id = (
  SELECT id FROM branches WHERE name = 'Tienda Mall Trebol' LIMIT 1
)
WHERE email = 'juan@ejemplo.com';
```

## 🆘 Problemas Comunes

### "Invalid login credentials"
- Verifica que el email y contraseña son correctos
- Verifica que el usuario existe en Authentication
- Verifica que el usuario está en la tabla `users`

### "User not found"
- Verifica que ejecutaste el INSERT en la tabla `users`
- Verifica que el ID coincide con el User UID de Authentication

### No puedo ver ciertas secciones
- Verifica que el rol del usuario es correcto
- Los administradores ven todo
- Los técnicos solo ven sus órdenes
- Los encargados ven las órdenes de su sucursal

---

**¿Necesitas ayuda?** Verifica que seguiste todos los pasos y que los IDs coinciden correctamente.



