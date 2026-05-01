# ⚙️ Configurar Variables de Entorno

## ⚠️ ERROR: Missing Supabase environment variables

Si ves este error, necesitas configurar las variables de entorno.

## 🚀 Solución Rápida

### Paso 1: Crear archivo .env.local

En la raíz del proyecto `sistema-gestion-ordenes`, crea un archivo llamado `.env.local`

### Paso 2: Obtener las credenciales de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (el mismo que usa sistema-reparaciones)
3. Ve a **Settings** → **API**
4. Copia estos valores:

   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon public** (Project API keys) → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (Project API keys) → `PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (opcional)

### Paso 3: Crear .env.local

Crea el archivo `.env.local` en la raíz del proyecto con este contenido:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

**Reemplaza** los valores con los que copiaste de Supabase.

### Paso 4: Reiniciar el servidor

```powershell
# Detén el servidor (Ctrl+C)
# Luego inícialo de nuevo
npm run dev
```

## ✅ Verificación

Después de configurar las variables y reiniciar, el error debería desaparecer.

## 💡 Si ya tienes sistema-reparaciones configurado

Puedes copiar las variables directamente:

1. Abre `.env.local` de `sistema-reparaciones`
2. Copia las variables de Supabase
3. Pega en `.env.local` de `sistema-gestion-ordenes`

## 📝 Estructura del archivo .env.local

El archivo debe estar en:
```
sistema-gestion-ordenes/
└── .env.local  ← Aquí
```

Y debe contener:
```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## ⚠️ Importante

- ❌ **NO** subas `.env.local` a git (ya está en .gitignore)
- ✅ Las variables que empiezan con `PUBLIC_` son visibles en el navegador
- ⚠️ `PUBLIC_SUPABASE_SERVICE_ROLE_KEY` tiene permisos completos, úsala con cuidado

---

**Después de configurar esto, el sistema debería funcionar correctamente.**



