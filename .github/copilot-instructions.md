# Instrucciones para Agentes de IA - ServidorAppEntradas

## Español

**ServidorAppEntradas** es una aplicación Node.js dockerizada para gestión de entradas de vehículos con autenticación JWT, WebSockets en tiempo real (Socket.IO) y PostgreSQL. Diseñada para producción con seguridad y escalabilidad.

## 🏗️ Arquitectura

### Stack Principal
- **Backend**: Node.js 20 (Alpine) + Express (TypeScript + JavaScript mixtos)
- **BD**: PostgreSQL 15.2 (Alpine)
- **Comunicación Real-Time**: Socket.IO (JWT autenticados)
- **Autenticación**: JWT (24h expiration)
- **Deployment**: Docker Compose (producción en `prod/`, dev histórico)

### Flujo de Datos Clave
1. Cliente → Express API (`/api/*`) → BD PostgreSQL
2. Cliente → Socket.IO (conexión con `x-token` header) → Broadcast por sala de usuario
3. Middleware: `validar-jwt` en rutas protegidas; Socket.IO valida en `registerSocketHandlers`

### Estructura de Directorios
```
app/src/
├── index.ts              # Punto de entrada: Express + Socket.IO
├── database/conexion.js  # Pool PostgreSQL (vars de entorno)
├── routes/               # Express routes (usuarios, entradas, externas, internas, tornos)
├── controladores/        # Lógica de negocio (one-to-one con routes)
├── models/               # Clases de datos (Entrada, Usuario, etc.)
├── sockets/socket.ts     # Handlers Socket.IO con JWT validation
├── middelwares/          # validar-jwt.js (middleware de autenticación)
├── helpers/jwt.ts        # generarJWT, comprobarJWT (con tipos TypeScript)
├── types/index.ts        # Tipos TypeScript (JWTPayload, etc.)
└── config/swagger.ts     # Especificación OpenAPI/Swagger
```

## 🔐 Patrones de Autenticación

### REST API
- Header: `x-token` (JWT obtenido en `/api/login`)
- Middleware `validar-jwt` extrae `id` del usuario → `req.id`
- Rutas protegidas requieren este middleware

### WebSockets
- Conexión inicial: cliente envía `x-token` en handshake headers
- `registerSocketHandlers` valida con `comprobarJWT(token)` → desconecta si es inválido
- Usuario conectado se une a sala propia (nombre = string de su `id`)
- Evento `mensaje-personal` emite a sala destino: `io.to(payload.para).emit(...)`

**Importante**: JWT_KEY debe ser muy larga (~32+ chars aleatorios) en `.env`

## 📦 Flujos de Desarrollo

### Build
```bash
npm run build  # TypeScript → dist/
```

### Desarrollo Local
```bash
npm run dev           # ts-node-dev (TypeScript con hot-reload)
npm run dev:simple    # ts-node directo
npm run dev:js        # nodemon sobre .js compilado
```

### Producción (Docker)
```bash
# Construir imagen
docker build -t srv_alpine:prod -f prod/Dockerfile app

# Levantar servicios
docker compose -f prod/docker-compose.yml --env-file .env up -d

# Health check
curl http://localhost:7202/api/ping  # "pong"
```

### Base de Datos en Docker
- Servicio: `db` (PostgreSQL 15.2)
- Red interna: `app-network` (no expuesto en prod)
- Credenciales: variables PGHOST, PGUSER, PGDATABASE, PGPASSWORD

## 🗄️ Modelos Principales

### Entrada (Vehículos)
- **Tabla**: `entradas_vehiculos`
- **Campos**: id, nombreConductor, empresa, matricula, claseCarga, fechaEntrada, firma, fechaSalida, recepcio, vigilancia, usuario
- **Lógica**: Query obtiene vehículos dentro (entrada ≤12h OR sin salida) con `getEntradas()`
- **Controlador**: [entradas.js](app/src/controladores/entradas.js)

### Usuario
- **Autenticación**: JWT en `/api/login`
- **Controlador**: [usuarios.js](app/src/controladores/usuarios.js)
- **Socket**: `usuarioConectado(id)`, `usuarioDesconectado(id)` en [socket.js](app/src/controladores/socket.js)

### Externas / Internas / Tornos
- **Entradas especializadas** (diferentes tipos de vehículos/cargas)
- Controladores [externas.js](app/src/controladores/externas.js), [internas.js](app/src/controladores/internas.js), [tornos.js](app/src/controladores/tornos.js)

## 🔧 Convenciones Específicas

### Estructura Dual TypeScript/JavaScript
El proyecto mantiene archivos `.js` originales + versiones `.ts` tipadas en paralelo:

**Archivos con versión TypeScript** (✅ 100% Completado):
- `src/models/` - Clases tipadas (entrada.ts, usuario.ts, externa.ts, interna.ts, torno.ts) ✅
- `src/middelwares/` - Middlewares tipados (validar-jwt.ts, validar-campos.ts, validate-date.ts) ✅
- `src/routes/` - Routers tipados (usuarios.ts, entradas.ts, externas.ts, internas.ts, tornos.ts) ✅
- `src/database/conexion.ts` - Pool con tipos genéricos ✅
- `src/controladores/` - Controladores tipados (entradas.ts, usuarios.ts, externas.ts, internas.ts, tornos.ts, socket.ts) ✅
- `src/helpers/jwt.ts` - Ya tipado ✅
- `src/types/index.ts` - Interfaces centralizadas ✅

**Archivos solo JavaScript** (mantienen funcionamiento original):
- `src/index.js` - Punto de entrada principal
- Todas las versiones `.js` de los anteriores siguen siendo funcionales

**Razón**: Migración gradual sin breaking changes. Código original sigue funcionando, TypeScript en paralelo.

### Importación y Compilación
- **Archivos .js**: Usar `require()` (CommonJS)
- **Archivos .ts**: Usar `import/export` (ES Modules)
- **Build**: `npm run build` compila `.ts` → `dist/` (no afecta ejecución actual)
- **Detalle**: Rutas `.ts` importan controladores `.js` con `require()` como puente

### Nombre de Variables
- BD: `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` (estándar PostgreSQL)
- JWT: `JWT_KEY`
- Socket: `roomId` = String(id de usuario), `xToken` del header

### Respuestas API
```json
{
  "ok": true/false,
  "cantidad": <number>,
  "entradas": [],
  "mensaje": "<error msg if ok=false>"
}
```

### Logging
- Consola simple: `console.log('[DEBUG] ...')` para debugging
- No hay logger structured (ej. Winston, Pino)
- Logs en Docker: `docker logs <container-id>`

## 🚀 Despliegue

### Variables de Entorno Críticas (`.env`)
```env
PORT=3000
NODE_ENV=production
JWT_KEY=<32+ chars random>
CORS_ORIGIN=http://dominio1.com,http://dominio2.com
PGHOST=db
PGUSER=<user>
PGDATABASE=<db>
PGPASSWORD=<pass>
PGPORT=5432
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<pass>
```

### Health Checks
- `/api/ping` → "pong" (sin JWT requerido)
- Docker: `HEALTHCHECK` en producción
- Monitoreo: revisar logs con `docker compose logs app`

### Migración
- [MIGRATION.md](MIGRATION.md): Procedimiento detallado (backups, DNS, firewall, etc.)
- Backup pre-migración: `pg_dump` o `docker exec db pg_dump`

## 🔒 Seguridad Implementada

- ✅ Alpine images (mínima superficie ataque)
- ✅ Usuario no-root en contenedor
- ✅ Helmet (headers)
- ✅ CORS whitelist (`CORS_ORIGIN`)
- ✅ Rate limiting (100 req/min/IP)
- ✅ JWT 24h expiration
- ✅ Bcryptjs para passwords
- ✅ BD no expuesta públicamente (red interna Docker)

## 📚 Documentación API

- **Swagger/OpenAPI**: `/api-docs` (URL base + puerto)
- **Especificación**: [config/swagger.ts](app/src/config/swagger.ts)
- **JSON**: `/api-docs.json`

### Rutas REST Disponibles

#### Usuarios (`/api/`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/login` | ❌ | Login con email/password → retorna JWT |
| POST | `/api/login/new` | ❌ | Crear nuevo usuario (email, name, password) |
| GET | `/api/login/renew` | ✅ JWT | Renovar token JWT |
| GET | `/api/users` | ✅ JWT | Obtener todos los usuarios |
| GET | `/api/users/:id` | ✅ JWT | Obtener usuario específico |
| PUT | `/api/users/:id` | ❌ | Actualizar usuario (name, email, password) |
| DELETE | `/api/users/:id` | ✅ JWT | Eliminar usuario |

#### Entradas (`/api/entradas`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/entradas/` | ✅ JWT | Obtener vehículos dentro (últimas 12h o sin salida) |
| GET | `/api/entradas/almacen` | ✅ JWT | Entradas filtradas para almacén |
| GET | `/api/entradas/porteria` | ✅ JWT | Entradas filtradas para portería |
| GET | `/api/entradas/by-matricula/:matricula` | ✅ JWT | Buscar entrada por matrícula |
| GET | `/api/entradas/:id` | ✅ JWT | Obtener entrada específica |
| POST | `/api/entradas/` | ✅ JWT | Crear nueva entrada (requiere fecha_entrada válida) |
| PUT | `/api/entradas/:id` | ✅ JWT | Actualizar entrada (fecha_entrada, fecha_salida) |
| PUT | `/api/entradas/recepcion` | ✅ JWT | Actualizar estado de recepción |
| PUT | `/api/entradas/porteria` | ✅ JWT | Actualizar entrada en portería |
| PUT | `/api/entradas/select` | ✅ JWT | Consultar por rango de fechas (fecha_entrada1, fecha_entrada2) |
| DELETE | `/api/entradas/:id` | ✅ JWT | Eliminar entrada |

#### Externas (`/api/externas`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/externas/new_externa` | ✅ JWT | Crear nueva entrada externa |
| GET | `/api/externas/externas_hoy` | ✅ JWT | Externas registradas hoy |
| GET | `/api/externas/porteria` | ✅ JWT | Externas en portería |
| GET | `/api/externas/:id` | ✅ JWT | Obtener externa específica |
| GET | `/api/externas/by-nombreConductor/:nombreConductor` | ✅ JWT | Buscar por nombre de conductor |
| PUT | `/api/externas/:id` | ✅ JWT | Actualizar externa |
| PUT | `/api/externas/porteria` | ✅ JWT | Actualizar en portería |
| PUT | `/api/externas/buscar_externa` | ✅ JWT | Consultar por rango de fechas (fechaEntrada, fechaEntrada2) |
| DELETE | `/api/externas/externa/:id` | ✅ JWT | Eliminar externa |

#### Internas (`/api/internas`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/internas/new_Interna` | ✅ JWT | Crear nueva entrada interna (requiere fechaSalida) |
| GET | `/api/internas/internas_hoy` | ✅ JWT | Internas registradas hoy |
| GET | `/api/internas/:id` | ✅ JWT | Obtener interna específica |
| POST | `/api/internas/code` | ✅ JWT | Obtener por código |
| PUT | `/api/internas/:id` | ✅ JWT | Actualizar interna (fechaEntrada, fechaSalida) |
| PUT | `/api/internas/porteria` | ✅ JWT | Actualizar en portería (requiere fechaEntrada) |
| PUT | `/api/internas/buscar_interna` | ✅ JWT | Consultar por rango de fechas (fechaSalida, fechaSalida2) |
| DELETE | `/api/internas/interna/:id` | ✅ JWT | Eliminar interna |

#### Tornos (`/api/tornos`)

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/tornos/setTorno` | ✅ JWT | Crear torno (requiere fechaEntrada, fechaSalida) |
| GET | `/api/tornos/tornos_hoy` | ✅ JWT | Tornos registrados hoy |
| GET | `/api/tornos/:id` | ✅ JWT | Obtener torno específico |
| POST | `/api/tornos/code` | ✅ JWT | Obtener por código |
| PUT | `/api/tornos/:id` | ✅ JWT | Actualizar torno (fechaEntrada, fechaSalida) |
| DELETE | `/api/tornos/:id` | ✅ JWT | Eliminar torno |
| POST | `/api/tornos/consulta` | ✅ JWT | Consultar por rango de fechas (fechaInicio, fechaFin) |

#### Health Check

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/ping` | ❌ | Health check → retorna "pong" |

### Patrón de Request/Response

**Headers requeridos (rutas autenticadas)**:
```
x-token: <JWT_token>
Content-Type: application/json
```

**Respuesta estándar exitosa**:
```json
{
  "ok": true,
  "cantidad": 10,
  "entradas": [...],
  "id": 123
}
```

**Respuesta estándar error**:
```json
{
  "ok": false,
  "mensaje": "Descripción del error"
}
```

### Validaciones Especiales

- **Fechas**: Rutas con `validateDateMiddleware` requieren formato ISO (YYYY-MM-DD HH:mm:ss)
- **JWT**: Expira en 24h; usar `/api/login/renew` para obtener nuevo token
- **Email**: Validación estricta (express-validator)
- **Passwords**: Hasheados con bcryptjs, mínimo recomendado 8 caracteres

### Puntos Críticos al Editar

1. **Socket.IO**: Cambios en handlers → revisar `registerSocketHandlers()` y `index.ts` para `io` export
2. **JWT**: Modificar `JWT_KEY` o expiration → afecta todas las conexiones autenticadas
3. **Rutas DB**: Nuevas columnas en modelos → actualizar selectores SQL y clases modelo
4. **Docker**: Cambios Dockerfile/compose → reconstruir imagen y redeploy
5. **TypeScript**: Editar `.ts` → require `npm run build` antes de ejecutar
6. **Estructura Dual**: Cambios en `.js` → considerar mantener sincronizado con `.ts` paralelo

## 📖 Archivos de Referencia

- [README.md](README.md) - Overview, configuración, despliegue detallado
- [MIGRATION.md](MIGRATION.md) - Procedimiento migración servidor
- [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) - Guía estructura TypeScript paralela
- [SECURITY.md](SECURITY.md) - Detalles seguridad implementada
- [prod/docker-compose.yml](prod/docker-compose.yml) - Servicios producción
- [prod/Dockerfile](prod/Dockerfile) - Build producción

---

## English

**ServidorAppEntradas** is a Dockerized Node.js app for vehicle entry management with JWT auth, real-time WebSockets (Socket.IO), and PostgreSQL. Production-focused with security and scale in mind.

### Architecture
- Stack: Node.js 20 (Alpine) + Express (mixed TS/JS), Postgres 15.2 (Alpine), Socket.IO, JWT.
- Data flow: Client → Express `/api/*` → Postgres; Client → Socket.IO with `x-token` header → per-user room broadcasting.
- Key files: `app/src/index.ts` entry; DB pool `database/conexion.js`; routes, controllers, models; Socket handlers `sockets/socket.ts`; middlewares `middelwares/validar-jwt.js`; JWT helpers; shared types; swagger config.

### Auth Patterns
- REST: `x-token` header JWT; middleware `validar-jwt` sets `req.id`.
- WebSockets: handshake header `x-token`; `registerSocketHandlers` validates via `comprobarJWT`; user joins room named by `id`; personal messages via `io.to(payload.para).emit(...)`.
- `JWT_KEY` must be long (≥32 chars) in `.env`.

### Development/Build
- Build TS: `npm run build` (outputs to `dist/`).
- Local dev: `npm run dev` (ts-node-dev), `npm run dev:simple` (ts-node), `npm run dev:js` (nodemon on compiled JS).
- Prod Docker: build `docker build -t srv_alpine:prod -f prod/Dockerfile app`; compose `docker compose -f prod/docker-compose.yml --env-file .env up -d`; health `curl :7202/api/ping` → `pong`.

### TypeScript/JS Duality
- JS originals remain active; TS exists in parallel (models, middlewares, routes, DB, controllers, helpers, types).
- JS uses `require`, TS uses `import/export`; TS routes import JS controllers via `require` bridge.

### Critical Editing Points
1) Socket.IO changes → check `registerSocketHandlers()` and `index.ts` export of `io`.
2) JWT secret/expiration changes impact all auth.
3) DB schema changes → update SQL selectors and models.
4) Dockerfile/compose changes need rebuild/redeploy.
5) Editing `.ts` → run `npm run build` before executing.
6) Maintain JS/TS parity when touching `.js` files.

### References
- [README.md](README.md) - Overview, config, deploy
- [MIGRATION.md](MIGRATION.md) - Server migration procedure
- [TYPESCRIPT_MIGRATION.md](TYPESCRIPT_MIGRATION.md) - Dual TS structure guide
- [SECURITY.md](SECURITY.md) - Security details
- [prod/docker-compose.yml](prod/docker-compose.yml) - Production services
- [prod/Dockerfile](prod/Dockerfile) - Production build
