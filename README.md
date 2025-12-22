# Servidor App Entradas

Aplicación Node.js dockerizada para gestión de entradas con autenticación JWT, WebSockets (Socket.IO) y base de datos PostgreSQL.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Despliegue](#despliegue)
- [Migración a Nuevo Servidor](#migración-a-nuevo-servidor)
- [Administración de Base de Datos](#administración-de-base-de-datos)
- [Seguridad](#seguridad)
- [Monitorización](#monitorización)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Backend**: Node.js 20 (Alpine) con Express
- **Base de datos**: PostgreSQL 15.2 (Alpine)
- **WebSockets**: Socket.IO para comunicación en tiempo real
- **Autenticación**: JWT (JSON Web Tokens)
- **Containerización**: Docker + Docker Compose

### Estructura de Servicios

```
┌─────────────┐
│   App       │  Puerto 7202 (Prod) / 7002 (Dev)
│  Node.js    │  - API REST
│  Socket.IO  │  - WebSockets
└──────┬──────┘
       │
       │ red interna (app-network)
       │
┌──────▼──────┐
│  PostgreSQL │  Puerto interno 5432
│   Database  │  - Sin exposición pública en prod
└─────────────┘
```

### Endpoints Principales

- **API REST**: `/api/*`
  - `/api/login` - Autenticación
  - `/api/users` - Gestión de usuarios
  - `/api/entradas` - Gestión de entradas
  - `/api/externas` - Entradas externas
  - `/api/internas` - Entradas internas
  - `/api/tornos` - Gestión de tornos
  - `/api/ping` - Health check

- **WebSockets**: Comunicación en tiempo real con autenticación JWT

---

## 📦 Requisitos

### Servidor de Producción

- Docker Engine 20.10+
- Docker Compose v2+
- Linux (Ubuntu/Debian recomendado)
- Puertos disponibles:
  - `7202` para la aplicación
- Mínimo 2GB RAM, 10GB disco

### Desarrollo Local

- Docker Desktop o Docker Engine
- Node.js 20+ (opcional, para desarrollo sin Docker)
- Puerto `7002` disponible

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus valores **reales y seguros**:

```env
# App
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://tu-dominio.com,http://tu-frontend.com
JWT_KEY=clave_secreta_muy_larga_y_aleatoria_cambiar_en_produccion

# Postgres
PGHOST=db
PGUSER=tu_usuario_db
PGDATABASE=nombre_base_datos
PGPASSWORD=contraseña_segura_db
PGPORT=5432

# Postgres Docker
POSTGRES_USER=tu_usuario_db
POSTGRES_PASSWORD=contraseña_segura_db
```

⚠️ **IMPORTANTE**: 
- Cambia `JWT_KEY` por una cadena aleatoria larga (mínimo 32 caracteres).
- Usa contraseñas fuertes para `PGPASSWORD`.
- En `CORS_ORIGIN`, lista los dominios autorizados separados por comas.

### 2. Seguridad Implementada

✅ **Contenedores**
- Usuario no root (`node`)
- Imágenes Alpine (mínima superficie de ataque)
- Health checks activos
- Logs rotados (máx 10MB × 3 archivos)

✅ **Aplicación**
- Helmet para headers de seguridad
- CORS con whitelist configurable
- Rate limiting (100 req/min por IP)
- JWT con expiración de 24h
- Passwords hasheados con bcrypt

✅ **Base de Datos**
- Sin exposición pública en producción
- Acceso solo desde red interna Docker
- Variables de entorno externalizadas

---

## 🚀 Despliegue

### Producción

1. **Construir imagen**:
   ```bash
   docker build -t srv_alpine:prod -f prod/Dockerfile app
   ```

2. **Levantar servicios**:
   ```bash
   docker compose -f prod/docker-compose.yml --env-file .env up -d
   ```

3. **Verificar salud**:
   ```bash
   docker compose -f prod/docker-compose.yml ps
   curl http://localhost:7202/api/ping
   ```
   Respuesta esperada: `pong`

4. **Ver logs**:
   ```bash
   docker compose -f prod/docker-compose.yml logs -f app
   ```

### Desarrollo

1. **Levantar con hot-reload**:
   ```bash
   docker compose -f dev/docker-compose.dev.yml --env-file .env up -d
   ```

2. **Ver logs en tiempo real**:
   ```bash
   docker compose -f dev/docker-compose.dev.yml logs -f app
   ```

3. **Reconstruir tras cambios en dependencias**:
   ```bash
   docker compose -f dev/docker-compose.dev.yml up -d --build
   ```

### Comandos Útiles

```bash
# Detener servicios
docker compose -f prod/docker-compose.yml down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker compose -f prod/docker-compose.yml down -v

# Ver estado de contenedores
docker compose -f prod/docker-compose.yml ps

# Ejecutar comandos en contenedor
docker compose -f prod/docker-compose.yml exec app sh
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi

# Ver health checks
docker inspect --format='{{json .State.Health}}' <container_id>
```

---

## 🔄 Migración a Nuevo Servidor

### Paso 1: Preparar el Servidor Destino

```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker compose version
```

### Paso 2: Transferir Código

```bash
# En el servidor origen
cd /ruta/ServidorAppEntradas
tar czf app-backup.tar.gz app/ prod/ .env.example

# Transferir (ejemplo con scp)
scp app-backup.tar.gz usuario@nuevo-servidor:/home/usuario/

# En el servidor destino
cd /home/usuario
tar xzf app-backup.tar.gz
cd ServidorAppEntradas
```

### Paso 3: Configurar Variables

```bash
# Crear .env con valores del nuevo servidor
cp .env.example .env
nano .env
```

### Paso 4: Backup y Migración de Base de Datos

**En el servidor ORIGEN**:

```bash
# Backup completo de la base de datos
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv firstapi > backup_migracion.sql

# O si Postgres no está en Docker
pg_dump -U vmv -h localhost -p 7200 firstapi > backup_migracion.sql

# Transferir backup
scp backup_migracion.sql usuario@nuevo-servidor:/home/usuario/ServidorAppEntradas/
```

**En el servidor DESTINO**:

```bash
# Levantar solo la base de datos primero
docker compose -f prod/docker-compose.yml up -d db

# Esperar a que esté lista
sleep 10

# Restaurar backup
cat backup_migracion.sql | docker compose -f prod/docker-compose.yml exec -T db psql -U vmv -d firstapi

# O copiar y ejecutar dentro del contenedor
docker cp backup_migracion.sql $(docker compose -f prod/docker-compose.yml ps -q db):/backup.sql
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi -f /backup.sql
```

### Paso 5: Construir y Desplegar

```bash
# Construir imagen
docker build -t srv_alpine:prod -f prod/Dockerfile app

# Levantar todos los servicios
docker compose -f prod/docker-compose.yml --env-file .env up -d

# Verificar
docker compose -f prod/docker-compose.yml ps
curl http://localhost:7202/api/ping
```

### Paso 6: Verificación Post-Migración

```bash
# 1. Verificar health checks
docker compose -f prod/docker-compose.yml ps

# 2. Test de autenticación (ajustar email/password)
curl -X POST http://localhost:7202/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"tu_password"}'

# 3. Verificar logs
docker compose -f prod/docker-compose.yml logs app | tail -50

# 4. Probar conexión de base de datos
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi -c "SELECT COUNT(*) FROM users;"
```

### Paso 7: Configurar Firewall (Opcional)

```bash
# Permitir solo puerto de la app
sudo ufw allow 7202/tcp
sudo ufw enable
```

---

## 🗄️ Administración de Base de Datos

### Conexión desde PgAdmin (Windows)

PgAdmin **NO** está incluido en el stack Docker. Para administrar la base de datos desde tu PC Windows:

#### Opción 1: Conexión Directa (Solo Desarrollo)

Si Postgres está expuesto (entorno dev, puerto 7000):

1. Abrir PgAdmin en Windows
2. Crear nueva conexión:
   - **Host**: IP del servidor (ej: 192.168.1.100)
   - **Port**: 7000 (dev) 
   - **Database**: firstapi (o tu `PGDATABASE`)
   - **Username**: vmv (o tu `PGUSER`)
   - **Password**: [tu PGPASSWORD]

⚠️ **En producción**, Postgres NO está expuesto públicamente por seguridad.

#### Opción 2: Túnel SSH (Producción)

Para acceder en producción de forma segura:

```bash
# En tu PC Windows (PowerShell o Git Bash)
ssh -L 5433:localhost:5432 usuario@servidor-produccion

# Mantener esta terminal abierta
```

Luego en PgAdmin:
- **Host**: localhost
- **Port**: 5433
- **Database**: firstapi
- **Username/Password**: [tus credenciales]

#### Opción 3: Exponer Temporalmente

```bash
# Modificar prod/docker-compose.yml temporalmente
# Agregar en servicio db:
    ports:
      - "127.0.0.1:5432:5432"  # Solo accesible desde localhost

# Reiniciar
docker compose -f prod/docker-compose.yml up -d db
```

### Comandos de Administración

```bash
# Entrar al CLI de PostgreSQL
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi

# Dentro de psql:
\dt              # Listar tablas
\d users         # Describir tabla users
\q               # Salir

# Backup manual
docker compose -f prod/docker-compose.yml exec -T db pg_dump -U vmv firstapi > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20251222.sql | docker compose -f prod/docker-compose.yml exec -T db psql -U vmv -d firstapi

# Ver conexiones activas
docker compose -f prod/docker-compose.yml exec db psql -U vmv -d firstapi -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔒 Seguridad

### Checklist Pre-Producción

- [ ] `.env` con credenciales únicas y fuertes
- [ ] `JWT_KEY` de mínimo 32 caracteres aleatorios
- [ ] `CORS_ORIGIN` limitado a dominios autorizados
- [ ] Postgres sin exposición pública (`ports` eliminado en prod)
- [ ] Firewall configurado (solo puertos necesarios)
- [ ] Backups automáticos configurados
- [ ] Logs siendo monitorizados
- [ ] Health checks funcionando

### Actualizar Dependencias

```bash
# Dentro del directorio app/
cd app
npm audit
npm audit fix

# Si hay vulnerabilidades críticas, actualizar package.json y reconstruir
docker build -t srv_alpine:prod -f prod/Dockerfile app
```

### Rotación de Secretos

```bash
# 1. Generar nuevo JWT_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Actualizar .env
nano .env

# 3. Reiniciar app (los tokens antiguos dejarán de funcionar)
docker compose -f prod/docker-compose.yml restart app
```

---

## 📊 Monitorización

### Comandos de Sistema

```bash
# Memoria RAM
free -h

# Espacio en disco
df -h

# Carga de CPU y procesos
top -bn1

# Puertos en uso
ss -tuln

# Estadísticas de contenedores Docker
docker stats --no-stream

# Logs de aplicación (últimas 100 líneas)
docker compose -f prod/docker-compose.yml logs --tail=100 app

# Logs en tiempo real
docker compose -f prod/docker-compose.yml logs -f
```

### Health Checks

```bash
# Verificar health de todos los servicios
docker compose -f prod/docker-compose.yml ps

# Detalle del health check de app
docker inspect --format='{{json .State.Health}}' $(docker compose -f prod/docker-compose.yml ps -q app) | jq

# Detalle del health check de db
docker inspect --format='{{json .State.Health}}' $(docker compose -f prod/docker-compose.yml ps -q db) | jq
```

### Monitoreo de Logs

```bash
# Errores recientes
docker compose -f prod/docker-compose.yml logs app | grep -i error

# Filtrar por fecha
docker compose -f prod/docker-compose.yml logs --since 2h app

# Exportar logs
docker compose -f prod/docker-compose.yml logs --no-color > logs_$(date +%Y%m%d).txt
```

---

## 🔧 Troubleshooting

### Problema: App no inicia

```bash
# Ver logs detallados
docker compose -f prod/docker-compose.yml logs app

# Verificar variables de entorno
docker compose -f prod/docker-compose.yml exec app env | grep PG

# Reiniciar app
docker compose -f prod/docker-compose.yml restart app
```

### Problema: No conecta a la base de datos

```bash
# Verificar que DB esté healthy
docker compose -f prod/docker-compose.yml ps db

# Probar conexión desde app
docker compose -f prod/docker-compose.yml exec app sh -c 'nc -zv db 5432'

# Ver logs de Postgres
docker compose -f prod/docker-compose.yml logs db

# Reiniciar DB
docker compose -f prod/docker-compose.yml restart db
```

### Problema: Error de autenticación JWT

```bash
# Verificar JWT_KEY en .env
grep JWT_KEY .env

# Los tokens antiguos no funcionarán si cambias JWT_KEY
# Solución: Re-login de usuarios
```

### Problema: CORS bloqueando requests

```bash
# Verificar CORS_ORIGIN
grep CORS_ORIGIN .env

# Debe incluir el origen del frontend
# Ejemplo: CORS_ORIGIN=http://frontend.com,https://app.example.com

# Reiniciar app tras cambios
docker compose -f prod/docker-compose.yml restart app
```

### Problema: Rate limit bloqueando

```bash
# Ajustar en app/src/index.js si es necesario
# Línea del rate limiter: windowMs y max

# Reconstruir imagen
docker build -t srv_alpine:prod -f prod/Dockerfile app
docker compose -f prod/docker-compose.yml up -d app
```

### Limpiar y Reiniciar Completamente

```bash
# ⚠️ CUIDADO: Esto elimina datos
docker compose -f prod/docker-compose.yml down -v
docker compose -f prod/docker-compose.yml up -d

# Solo reiniciar sin perder datos
docker compose -f prod/docker-compose.yml restart
```

---

## 📚 Referencias

- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

## 📝 Notas Adicionales

- Los archivos `.sql` en la raíz son backups de referencia.
- El archivo `wait-for.sh` en `app/` se puede usar para dependencias más complejas.
- El rate limiting está configurado en 100 req/min por IP; ajustar según necesidad.
- Los logs de Docker se rotan automáticamente (máx 10MB × 3 archivos).

---

**Última actualización**: 22 de diciembre de 2025# app_entradas
