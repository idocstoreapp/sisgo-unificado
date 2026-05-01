# 📦 Instalación Paso a Paso

## Paso 1: Verificar Node.js

```bash
node --version
```

Debe ser **18 o superior**. Si no, descarga desde [nodejs.org](https://nodejs.org)

## Paso 2: Instalar Dependencias

### Opción A: Instalación Normal
```bash
cd sistema-gestion-ordenes
npm install
```

### Opción B: Si hay errores, limpia e instala
```bash
# Eliminar node_modules y package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Limpiar caché de npm
npm cache clean --force

# Instalar de nuevo
npm install
```

### Opción C: Si persisten errores con paquetes específicos
```bash
# Instalar sin opcionales (puede omitir algunos paquetes problemáticos)
npm install --no-optional

# O instalar forzando
npm install --force
```

## Paso 3: Si hay errores específicos

### Error con `jspdf` o `qrcode`
Estos paquetes son opcionales (solo para generar PDFs). Puedes comentarlos temporalmente en `package.json`:

```json
{
  "dependencies": {
    // ... otras dependencias
    // "jspdf": "^2.5.1",  // Comentar si da error
    // "qrcode": "^1.5.3"  // Comentar si da error
  }
}
```

Luego ejecuta `npm install` de nuevo.

### Error de permisos en Windows
Ejecuta PowerShell como **Administrador** y luego:
```bash
npm install
```

### Error de versión de npm
Actualiza npm:
```bash
npm install -g npm@latest
```

## Paso 4: Verificar Instalación

Después de `npm install`, verifica que se creó la carpeta `node_modules`:
```bash
Test-Path node_modules
```

Debería retornar `True`.

## Paso 5: Ejecutar el Proyecto

```bash
npm run dev
```

Si todo está bien, verás:
```
  Astro  v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:4321/
```

## 🐛 Si sigues teniendo problemas

**Comparte el error completo** que aparece en la terminal cuando ejecutas `npm install`. Los errores comunes son:

1. **ERR! code EACCES** - Problema de permisos
2. **ERR! code ETIMEDOUT** - Problema de conexión
3. **ERR! peer dep missing** - Dependencia faltante
4. **ERR! Cannot find module** - Módulo no encontrado

Copia y pega el error completo para poder ayudarte mejor.



