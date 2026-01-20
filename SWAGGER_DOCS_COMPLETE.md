# Documentación Swagger - Estado Actual

## ✅ Rutas Documentadas

### Entradas (11 endpoints)
- ✅ GET /api/entradas
- ✅ GET /api/entradas/almacen
- ✅ GET /api/entradas/porteria
- ✅ GET /api/entradas/by-matricula/{matricula}
- ✅ GET /api/entradas/{id}
- ✅ POST /api/entradas
- ✅ PUT /api/entradas/recepcion
- ✅ PUT /api/entradas/porteria
- ✅ PUT /api/entradas/select
- ✅ PUT /api/entradas/{id}
- ✅ DELETE /api/entradas/{id}

### Usuarios (6 endpoints)
- POST /api/login
- POST /api/login/new
- GET /api/login/renew
- GET /api/users
- GET /api/users/{id}
- PUT /api/users/{id}
- DELETE /api/users/{id}

### Externas (9 endpoints)
- POST /api/externas/new_externa
- GET /api/externas/externas_hoy
- GET /api/externas/porteria
- GET /api/externas/{id}
- GET /api/externas/by-nombreConductor/{nombreConductor}
- PUT /api/externas/porteria
- PUT /api/externas/buscar_externa
- PUT /api/externas/{id}
- DELETE /api/externas/externa/{id}

### Internas (8 endpoints)
- POST /api/internas/new_Interna
- POST /api/internas/code
- GET /api/internas/internas_hoy
- GET /api/internas/{id}
- PUT /api/internas/porteria
- PUT /api/internas/buscar_interna
- PUT /api/internas/{id}
- DELETE /api/internas/interna/{id}

### Tornos (7 endpoints)
- POST /api/tornos/setTorno
- POST /api/tornos/code
- POST /api/tornos/consulta
- GET /api/tornos/tornos_hoy
- GET /api/tornos/{id}
- PUT /api/tornos/{id}
- DELETE /api/tornos/{id}

## Total: 41+ endpoints
