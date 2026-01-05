# 🔒 Guía de Seguridad

## Español

Documentación de las medidas de seguridad implementadas y mejores prácticas para mantener la aplicación segura.

## 📋 Resumen de Medidas Implementadas

### ✅ Seguridad de Contenedores

| Medida | Implementación | Archivo |
|--------|----------------|---------|
| Usuario no root | Usuario `node` en contenedores | `prod/Dockerfile`, `dev/Dockerfile.dev` |
| Imágenes mínimas | Alpine Linux | Todos los Dockerfiles |
| Health checks | Endpoints de salud | `prod/docker-compose.yml`, `prod/Dockerfile` |
| Log rotation | Límite 10MB × 3 archivos | `prod/docker-compose.yml` |
| Red aislada | `app-network` interna | Todos los docker-compose |

### ✅ Seguridad de Aplicación

| Medida | Implementación | Archivo |
|--------|----------------|---------|
| Helmet | Headers de seguridad HTTP | `app/src/index.js` |
| CORS estricto | Whitelist configurable | `app/src/index.js` |
| Rate limiting | 100 req/min por IP | `app/src/index.js` |
| JWT con expiración | 24 horas | `app/src/helpers/jwt.js` |
| Passwords hasheados | bcrypt | `app/src/controladores/usuarios.js` |
| Variables externalizadas | `.env` | Raíz del proyecto |
| Trust proxy | Para X-Forwarded headers | `app/src/index.js` |

### ✅ Seguridad de Base de Datos

| Medida | Implementación | Archivo |
|--------|----------------|---------|
| Sin exposición pública | Puerto no publicado en prod | `prod/docker-compose.yml` |
| Credenciales desde .env | Variables de entorno | `.env` |
| Red interna Docker | Solo app puede conectar | `prod/docker-compose.yml` |
| Health checks | Verificación de disponibilidad | Todos los docker-compose |

---

## 🔐 Configuración de Seguridad

### 1. Helmet (Headers HTTP Seguros)

**Ubicación**: `app/src/index.js`

Headers configurados automáticamente:
- `X-DNS-Prefetch-Control`: Controla prefetching DNS
- `X-Frame-Options`: Previene clickjacking
- `X-Content-Type-Options`: Previene MIME sniffing
- `Strict-Transport-Security`: Fuerza HTTPS
- `X-Download-Options`: Previene descargas automáticas (IE)
- `X-Permitted-Cross-Domain-Policies`: Controla políticas cross-domain

**Verificar**:
```bash
curl -I http://localhost:7202/api/ping
```

### 2. CORS (Cross-Origin Resource Sharing)

**Ubicación**: `app/src/index.js`

**Configuración**:
```javascript
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
```

**Configurar en .env**:
```env
# Un origen
CORS_ORIGIN=https://mi-frontend.com

# Múltiples orígenes (separados por comas)
CORS_ORIGIN=https://mi-frontend.com,https://app.ejemplo.com,http://localhost:3000
```

**Probar CORS**:
```bash
curl -H "Origin: https://mi-frontend.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://localhost:7202/api/ping -v
```

### 3. Rate Limiting

**Ubicación**: `app/src/index.js`

**Configuración actual**:
```javascript
const limiter = rateLimit({ 
  windowMs: 60 * 1000,  // 1 minuto
  max: 100,              // 100 requests por ventana
  standardHeaders: true, 
  legacyHeaders: false 
});
```

**Personalizar** (editar `app/src/index.js`):
```javascript
// Más estricto
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 50                     // 50 requests
});

// Diferentes límites por ruta
const loginLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 5  // Solo 5 intentos de login en 15 min
});
app.use('/api/login', loginLimiter);
```

**Probar rate limit**:
```bash
for i in {1..101}; do 
  curl http://localhost:7202/api/ping
  echo " - Request $i"
done
```

### 4. JWT (JSON Web Tokens)

**Ubicación**: `app/src/helpers/jwt.js`

**Configuración**:
- Expiración: 24 horas
- Algoritmo: HS256 (HMAC con SHA-256)
- Secret: Variable `JWT_KEY` en `.env`

**Generar JWT_KEY seguro**:
```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: /dev/urandom
head -c 32 /dev/urandom | base64
```

**Uso del token**:
```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:7202/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' \
  | jq -r '.token')

# 2. Usar token en requests protegidos
curl http://localhost:7202/api/users \
  -H "x-token: $TOKEN"
```

**Renovar token**:
```bash
curl http://localhost:7202/api/login/renew \
  -H "x-token: $TOKEN"
```

### 5. Passwords con Bcrypt

**Ubicación**: `app/src/controladores/usuarios.js`

**Configuración**:
- Algoritmo: bcrypt
- Rounds: 10 (por defecto con `genSaltSync()`)

**Aumentar seguridad** (editar `usuarios.js`):
```javascript
// Más rounds = más seguro pero más lento
const salt = bcrypt.genSaltSync(12);  // 12 rounds
```

**Benchmark de rounds**:
- 10 rounds: ~100ms
- 12 rounds: ~400ms
- 14 rounds: ~1.6s

### 6. Validación de Entrada

**Ubicación**: `app/src/routes/*.js`

**Ejemplo actual**:
```javascript
router.post('/login', [
  check('email', 'El email es obligatorio').isEmail(),
  check('password', 'El password es obligatorio').not().isEmpty(),
  validarCampos
], login);
```

**Añadir más validaciones**:
```javascript
const { check, body } = require('express-validator');

router.post('/login', [
  check('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
    .matches(/\d/).withMessage('Debe contener un número'),
  validarCampos
], login);
```

---

## 🛡️ Hardening de Producción

### PostgreSQL

**Medidas implementadas**:
1. ✅ No exponer puerto públicamente
2. ✅ Credenciales en variables de entorno
3. ✅ Red interna Docker

**Mejoras adicionales recomendadas**:

```bash
# Dentro del contenedor de Postgres
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi

# Cambiar password del usuario
ALTER USER vmv WITH PASSWORD 'nuevo_password_muy_seguro';

# Revisar conexiones permitidas
SHOW hba_file;

# Ver usuarios
\du
```

**Configurar pg_hba.conf** (opcional, avanzado):
```bash
docker compose -f prod/docker-compose.yml exec db sh
vi /var/lib/postgresql/data/pg_hba.conf
```

### HTTPS con Reverse Proxy

**Nginx con Let's Encrypt** (recomendado):

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Auto-renovación (certbot lo configura automáticamente)
sudo certbot renew --dry-run
```

**Configuración nginx** (`/etc/nginx/sites-available/app-entradas`):
```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:7202;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:7202/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Si NO usas reverse proxy, permitir puerto de app directamente
sudo ufw allow 7202/tcp

# Ver reglas
sudo ufw status verbose
```

---

## 🔍 Auditoría y Monitoreo

### 1. Auditoría de Dependencias

```bash
cd app/
npm audit

# Ver solo vulnerabilidades críticas y altas
npm audit --audit-level=high

# Intentar arreglar automáticamente
npm audit fix

# Si hay breaking changes
npm audit fix --force
```

### 2. Escaneo de Vulnerabilidades en Imágenes

```bash
# Instalar Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Escanear imagen
trivy image srv_alpine:prod

# Solo críticas y altas
trivy image --severity CRITICAL,HIGH srv_alpine:prod
```

### 3. Monitoreo de Logs de Seguridad

```bash
# Errores de autenticación
docker compose -f prod/docker-compose.yml logs app | grep -i "token no valido"
docker compose -f prod/docker-compose.yml logs app | grep -i "NO hay token"

# Rate limit triggers
docker compose -f prod/docker-compose.yml logs app | grep -i "rate"

# Intentos de login fallidos
docker compose -f prod/docker-compose.yml logs app | grep -i "contraseña no es validad"
```

### 4. Alertas con Fail2Ban (Opcional)

```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar para Docker logs
sudo nano /etc/fail2ban/jail.local
```

Configuración básica:
```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[app-entradas]
enabled = true
filter = app-entradas
logpath = /var/lib/docker/containers/*/*.log
action = iptables-multiport[name=app, port="7202"]
```

---

### Checklist de Seguridad

### Antes de Producción

- [ ] `.env` con credenciales únicas (no valores por defecto)
- [ ] `JWT_KEY` de mínimo 32 caracteres aleatorios
- [ ] `CORS_ORIGIN` limitado a dominios específicos
- [ ] Postgres sin puerto expuesto públicamente
- [ ] HTTPS configurado (si aplica)
- [ ] Firewall activo y configurado

---

## English

Security measures in place and best practices to keep the app secure.

### 📋 Implemented Measures

- **Containers**: Non-root `node` user, Alpine images, health checks, log rotation (10MB × 3), isolated `app-network`.
- **App**: Helmet headers, strict CORS whitelist, rate limit 100 req/min/IP, JWT 24h (HS256), bcrypt passwords, env vars externalized, trust proxy set.
- **Database**: Not exposed publicly, creds from `.env`, Docker internal network, health checks.

### 🔐 Security Configuration

- **Helmet**: Enabled in `app/src/index.js`; verify with `curl -I /api/ping`.
- **CORS**: Origins from `CORS_ORIGIN` (comma-separated). Example env shown; test with Origin header via `curl`.
- **Rate limiting**: Default 100 req/min; can customize per route (e.g., login limiter) in `app/src/index.js`.
- **JWT**: 24h HS256, secret `JWT_KEY`; generate via Node/openssl/urandom. Login to get token; renew at `/api/login/renew`.
- **Bcrypt**: Defaults to 10 rounds; increase in `controladores/usuarios.js` if needed (note performance impact).
- **Validation**: Express-validator checks in routes; strengthen with length/format constraints as needed.

### 🛡️ Production Hardening

- **PostgreSQL**: Keep port internal, env creds, optional pg_hba tuning; rotate DB passwords; inspect connections.
- **HTTPS/Proxy**: nginx + Let's Encrypt example provided (TLS 1.2/1.3, security headers, WebSocket support, HTTP→HTTPS redirect).
- **Firewall**: UFW defaults deny incoming/allow outgoing; allow ssh, 80/443 (or 7202 if no proxy); review rules.

### 🔍 Audit & Monitoring

- **Dependencies**: `npm audit`, filter by severity, `npm audit fix` (careful with `--force`).
- **Image scan**: Trivy example for full and critical/high severities.
- **Logs**: Grep app logs for auth/token/rate-limit errors.
- **Fail2Ban (optional)**: Example jail targeting Docker logs with basic defaults.

### 📋 Security Checklist (Pre-prod)

- [ ] `.env` with unique secrets (no defaults)
- [ ] `JWT_KEY` ≥ 32 random chars
- [ ] `CORS_ORIGIN` limited to allowed domains
- [ ] Postgres not publicly exposed
- [ ] HTTPS configured (if applicable)
- [ ] Firewall active and configured
- [ ] Rate limiting apropiado para tu caso de uso
- [ ] Backups automáticos configurados
- [ ] Monitoreo de logs activo

### Mantenimiento Regular

- [ ] Actualizar dependencias mensualmente (`npm audit`)
- [ ] Escanear imágenes Docker trimestralmente (`trivy`)
- [ ] Rotar `JWT_KEY` cada 6-12 meses
- [ ] Revisar logs de seguridad semanalmente
- [ ] Probar restauración de backups mensualmente
- [ ] Renovar certificados SSL (automático con certbot)

### Respuesta a Incidentes

Si detectas actividad sospechosa:

1. **Bloquear acceso inmediatamente**:
   ```bash
   # Detener app temporalmente
   docker compose -f prod/docker-compose.yml stop app
   
   # O bloquear IP específica
   sudo ufw deny from <IP_SOSPECHOSA>
   ```

2. **Recopilar evidencia**:
   ```bash
   # Exportar logs
   docker compose -f prod/docker-compose.yml logs --no-color > incident_$(date +%Y%m%d_%H%M%S).log
   ```

3. **Rotar credenciales**:
   ```bash
   # Cambiar JWT_KEY, PGPASSWORD en .env
   nano .env
   
   # Reiniciar servicios
   docker compose -f prod/docker-compose.yml restart
   ```

4. **Investigar y parchear**:
   - Revisar qué endpoints fueron accedidos
   - Actualizar dependencias vulnerables
   - Aplicar parches necesarios
   - Reconstruir y redesplegar

---

## 🔗 Referencias y Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Docker Security](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 📞 Contacto de Seguridad

Si descubres una vulnerabilidad, por favor:
1. NO la publiques públicamente
2. Documenta los pasos para reproducirla
3. Contacta al equipo de desarrollo directamente

**Última actualización**: 22 de diciembre de 2025
