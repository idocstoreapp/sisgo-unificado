# 🔧 Solución de Errores - Guía Completa

## ❌ Error 1: Missing Supabase environment variables

**Error**: `[supabase] Missing environment variables`

**Solución**:
1. Crea un archivo `.env.local` en la raíz del proyecto `sistema-gestion-ordenes`
2. Agrega estas variables (obtén los valores de Supabase Dashboard → Settings → API):

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
PUBLIC_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

3. Reinicia el servidor (`npm run dev`)

**Ver documentación completa**: `CONFIGURAR_VARIABLES.md`

## ❌ Error 2: 404 del logo

**Error**: `Failed to load resource: the server responded with a status of 404 (Not Found)` para `/logo.png`

**Solución**:
1. Verifica que existe `public/logo.png`
2. Si no existe, cópialo:

```powershell
cd sistema-gestion-ordenes
Copy-Item ..\sistema-reparaciones\public\logo.png public\logo.png
```

3. Reinicia el servidor

**Ver documentación**: `SOLUCION_404_LOGO.md`

## ✅ Checklist de Verificación

Antes de ejecutar el proyecto, verifica:

- [ ] Archivo `.env.local` existe con las variables de Supabase
- [ ] Archivo `public/logo.png` existe
- [ ] Estás en el directorio correcto: `cd sistema-gestion-ordenes`
- [ ] `npm install` se ejecutó correctamente (existe `node_modules/`)
- [ ] El schema SQL se ejecutó en Supabase

## 🚀 Secuencia Correcta de Inicio

```powershell
# 1. Ir al directorio del proyecto
cd sistema-gestion-ordenes

# 2. Verificar que tienes .env.local
Test-Path .env.local

# 3. Verificar que tienes el logo
Test-Path public\logo.png

# 4. Ejecutar el proyecto
npm run dev
```

## 📚 Documentación Relacionada

- `CONFIGURAR_VARIABLES.md` - Configurar variables de entorno
- `SOLUCION_404_LOGO.md` - Solución del error 404 del logo
- `INSTRUCCIONES_SETUP.md` - Guía completa de configuración
- `database/USO_BASE_DATOS.md` - Configuración de base de datos



