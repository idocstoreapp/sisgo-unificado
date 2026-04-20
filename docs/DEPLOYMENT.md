# 🚀 Guía de Deploy - SISGO Unificado

## Opción 1: Vercel (Recomendada)

### Prerrequisitos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub/GitLab/Bitbucket
- Proyecto de Supabase configurado

### Pasos

#### 1. Conectar Repositorio
1. Ir a https://vercel.com/new
2. Importar repositorio desde GitHub/GitLab/Bitbucket
3. Seleccionar el directorio raíz: `sisgo-unificado`

#### 2. Configurar Variables de Entorno
En el dashboard de Vercel, agregar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

#### 3. Configurar Build Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

#### 4. Deploy
```bash
# Automático al hacer push a main
git push origin main

# O deploy manual desde CLI
vercel --prod
```

---

## Opción 2: Railway

### Pasos

#### 1. Crear Proyecto en Railway
1. Ir a https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Seleccionar repositorio

#### 2. Configurar Variables
En Railway Dashboard → Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NODE_ENV=production
```

#### 3. Configurar Puerto
Railway automáticamente detecta el puerto de Next.js

#### 4. Deploy Automático
Al hacer push, Railway reconstruye y despliega automáticamente

---

## Opción 3: Self-Hosted (VPS)

### Prerrequisitos
- Servidor con Ubuntu 20.04+
- Node.js 20+ instalado
- PM2 para gestión de procesos
- Nginx como reverse proxy

### Pasos

#### 1. Instalar Dependencias en el Servidor
```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt-get install nginx
```

#### 2. Clonar y Build
```bash
# Clonar repositorio
git clone <repo-url>
cd sisgo-unificado

# Instalar dependencias
npm install --production

# Build para producción
npm run build
```

#### 3. Configurar PM2
```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sisgo-unificado',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: '...',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '...',
      SUPABASE_SERVICE_ROLE_KEY: '...',
    }
  }]
}
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración para reinicios
pm2 save
pm2 startup
```

#### 4. Configurar Nginx
```nginx
# /etc/nginx/sites-available/sisgo-unificado
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/sisgo-unificado /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Configurar HTTPS con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Auto-renovación
sudo systemctl enable certbot.timer
```

---

## Base de Datos (Supabase)

### 1. Crear Proyecto
1. Ir a https://supabase.com
2. "New Project"
3. Elegir región cercana (ej: US East)
4. Establecer contraseña de base de datos

### 2. Ejecutar Migraciones
1. Ir a SQL Editor en el dashboard de Supabase
2. Copiar el script SQL del `PLAN_UNIFICACION_SISTEMAS.md`
3. Ejecutar el script completo
4. Verificar que se crearon todas las tablas

### 3. Configurar RLS (Row Level Security)
Las migraciones ya incluyen políticas de RLS básicas. Asegurarse de:
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... etc para todas las tablas
```

### 4. Configurar Auth
1. Ir a Authentication → Settings
2. Habilitar email/password auth
3. Configurar email templates si es necesario
4. Agregar URLs permitidas para redirect

---

## Email (Resend)

### 1. Crear Cuenta
1. Ir a https://resend.com
2. Crear cuenta gratuita (100 emails/día)

### 2. Obtener API Key
1. Dashboard → API Keys
2. Crear nueva API key
3. Agregar a variables de entorno: `RESEND_API_KEY=...`

### 3. Verificar Dominio (Opcional pero recomendado)
1. Agregar dominio en Resend
2. Configurar DNS records (SPF, DKIM, DMARC)
3. Esperar propagación (24-48 horas)

---

## WhatsApp Business API

### Opción 1: Meta Cloud API (Oficial)
1. Crear cuenta en https://developers.facebook.com
2. Configurar WhatsApp Business API
3. Obtener Phone Number ID y API Key
4. Agregar a variables de entorno

### Opción 2: Third-Party Services
- Twilio WhatsApp API
- MessageBird
- Wati

---

## CI/CD con GitHub Actions

### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoreo

### Vercel Analytics
- Automáticamente habilitado en Vercel
- Ver dashboard en vercel.com

### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
```

Configurar `next.config.ts`:
```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // tu config existente
};

export default withSentryConfig(nextConfig, {
  org: "tu-org",
  project: "sisgo-unificado",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

---

## Backup y Restauración

### Backup de Base de Datos
```bash
# Exportar desde Supabase Dashboard
# Settings → Database → Backups
# O usar pg_dump manualmente

pg_dump -h db.tu-proyecto.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup.dump
```

### Restaurar Backup
```bash
pg_restore -h db.tu-proyecto.supabase.co \
  -U postgres \
  -d postgres \
  backup.dump
```

---

## Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Base de datos creada con migraciones
- [ ] RLS habilitado en todas las tablas
- [ ] Auth configurado
- [ ] Tests pasan (`npm test`)
- [ ] Build funciona (`npm run build`)
- [ ] Dominio configurado (si aplica)
- [ ] HTTPS habilitado
- [ ] Email service configurado
- [ ] Backup strategy definida
- [ ] Monitoreo configurado

---

## Troubleshooting

### Build falla en producción
```bash
# Ver logs de build
npm run build 2>&1 | tee build.log

# Verificar TypeScript
npx tsc --noEmit

# Verificar ESLint
npm run lint
```

### Error de conexión a Supabase
- Verificar que las URLs están correctas en .env
- Verificar que las API keys son válidas
- Verificar firewall permite conexiones HTTPS

### Error "Missing Supabase environment variables"
- Asegurarse de que las variables están en el sistema de deploy
- Reiniciar la aplicación después de agregar variables

---

**Última actualización:** 14 de abril de 2026
