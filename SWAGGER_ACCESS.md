# Acceso a Swagger API Documentation

## 🔐 Autenticación Requerida

La documentación Swagger está protegida con autenticación JWT. Para acceder:

### Paso 1: Hacer Login
Primero debes obtener un token JWT haciendo login:

```bash
curl -X POST http://10.192.92.12:7202/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@hcb.es",
    "password": "tu-contraseña"
  }'
```

Esto te devolverá un JSON con tu token:
```json
{
  "ok": true,
  "usuario": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 2: Acceder a Swagger

**Opción A: Desde el navegador**

1. Abre: `http://10.192.92.12:7202/api-docs`
2. El navegador te mostrará un error 401 (No autorizado)
3. Añade el header `x-token` con tu token usando una extensión de navegador como:
   - [ModHeader](https://chrome.google.com/webstore/detail/modheader) (Chrome/Edge)
   - [Simple Modify Headers](https://addons.mozilla.org/firefox/addon/simple-modify-header/) (Firefox)

**Opción B: Usar un cliente HTTP** (Recomendado)

Usa Postman, Insomnia o similar:
1. GET `http://10.192.92.12:7202/api-docs`
2. Añade header: `x-token: <tu-token-aqui>`

**Opción C: Script de acceso rápido**

```bash
# 1. Hacer login y guardar token
TOKEN=$(curl -s -X POST http://10.192.92.12:7202/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@hcb.es","password":"tu-pass"}' \
  | jq -r '.token')

# 2. Acceder a Swagger
curl -H "x-token: $TOKEN" http://10.192.92.12:7202/api-docs
```

## 📍 URLs Disponibles

- **Desarrollo**: http://10.192.93.0:7302/api-docs
- **Producción**: http://10.192.92.12:7202/api-docs
- **OpenAPI JSON**: http://10.192.92.12:7202/api-docs.json (también requiere token)

## ⏰ Nota Temporal

La autenticación en Swagger está habilitada temporalmente (2 meses desde enero 2026).
Si necesitas desactivarla más adelante, edita `app/src/index.ts` y quita `validarJWT` de las rutas `/api-docs`.

## 🛠️ Para Desarrolladores Flutter

1. Descarga el contrato OpenAPI:
   ```bash
   curl -H "x-token: $TOKEN" \
     http://10.192.92.12:7202/api-docs.json \
     > openapi_contract.json
   ```

2. Usa herramientas como `openapi-generator` o `quicktype.io` para generar el cliente Dart automáticamente.
