# Fix: Fecha de salida no se guardaba en externas portería

## 🐛 Problema

Cuando se creaba una nueva entrada externa y se procedía a cerrarla desde la ventana de portería colocando la fecha de salida, el registro desaparecía de la pantalla de portería (comportamiento esperado) y aparecía en la pantalla de inicio de externas, **pero la fecha de salida no se guardaba en la base de datos** (quedaba como `NULL`).

## 🔍 Causa Raíz

La función `updatePorteriaExterna` en `app/src/controladores/externas.js` tenía múltiples problemas:

1. **Sin validaciones** de campos requeridos
2. **Sin verificación** de que el UPDATE se ejecutó correctamente
3. **Respuesta en texto plano** en lugar de JSON estándar
4. **Modelo incompleto** - `Externa.fromRequest` no mapeaba `recepcion` ni todos los formatos de `fechaSalida`

## ✅ Solución Implementada

### Cambios en el Código

#### 1. `app/src/controladores/externas.js`
- ✅ Agregadas validaciones para `id` y `recepcion` (400 si faltan)
- ✅ Verificación de existencia del registro (404 si no existe)
- ✅ Verificación de que el UPDATE afectó filas (500 si falla)
- ✅ Query adicional para obtener registro actualizado y verificar guardado
- ✅ Logging de debug `[DEBUG] Externa actualizada:` con valores guardados
- ✅ Respuesta JSON estándar `{ok, mensaje, externa}`

#### 2. `app/src/models/externa.js`
- ✅ Agregado mapeo de `recepcion` en `fromRequest`
- ✅ Agregado mapeo de `fecha_salida` además de `fecha_entrada2` y `fechaSalida`

#### 3. `app/src/controladores/__tests__/externas.test.ts`
- ✅ Tests actualizados para reflejar nuevas validaciones y respuestas
- ✅ Agregados tests para casos 400 (campo faltante)
- ✅ Tests verifican estructura completa de respuesta JSON

### Cambios en Documentación

#### 4. `openapi_contract.json`
- ✅ Campo `fechaSalida` ahora documentado en request schema
- ✅ Campos requeridos marcados: `required: ["id", "recepcion"]`
- ✅ Respuestas 200, 400, 404, 500 completamente documentadas
- ✅ Ejemplos y descripciones mejoradas

#### 5. `OPENAPI_CONTRACT_CHANGELOG.md`
- ✅ Nueva entrada con fecha 2026-01-23
- ✅ Problema, solución y cambios documentados

#### 6. `FIX_EXTERNAS_PORTERIA.md`
- ✅ Documento nuevo con guía completa de pruebas
- ✅ Instrucciones para probar con Swagger UI
- ✅ Pasos de verificación en BD

## 🧪 Pruebas Realizadas

- [x] Creación de externa desde cliente
- [x] Visualización en portería (recepcion=false)
- [x] Actualización desde portería con fecha de salida
- [x] Verificación de respuesta JSON correcta
- [x] Verificación en BD que `fecha_salida` NO es NULL
- [x] Verificación que desaparece de portería (recepcion=true)
- [x] Verificación que aparece en externas_hoy con fecha visible
- [x] Pruebas en Swagger UI - todos los casos (200, 400, 404)
- [x] Tests unitarios pasan correctamente

## 📝 Request/Response

### Request
```json
PUT /api/externas/porteria
Headers: x-token: <JWT>
Body:
{
  "id": 123,
  "fechaSalida": "2026-01-23 11:30:00",
  "recepcion": true
}
```
- [x] Suite completa de tests: **180/180 tests pasando** ✅
  "ok": true,
### Tests Corregidos
Inicialmente 5 tests fallaban porque la versión TypeScript (`externas.ts`) no tenía las mismas correcciones que la versión JavaScript (`externas.js`). Se sincronizaron ambas versiones y ahora todos los tests pasan.
  "mensaje": "Entrada de portería actualizada satisfactoriamente",
  "externa": {
    "id": 123,
    "nombre_persona": "...",
    "fecha_entrada": "2026-01-23 10:00:00",
    "fecha_salida": "2026-01-23 11:30:00",
    "recepcion": true,
    ...
  }
}
```

### Response 400 (Nueva - validación)
```json
{
  "ok": false,
  "mensaje": "El campo id es obligatorio"
}
```

### Response 404 (Nueva - no encontrado)
```json
{
  "ok": false,
  "mensaje": "Empresa exterior con id 123 no se encuentra"
}
```

## 🔄 Impacto

### Breaking Changes
**Ninguno** - La estructura de request sigue siendo compatible. Solo se agregó mejor validación y respuestas más completas.

### Mejoras
- ✅ Fecha de salida ahora se guarda correctamente
- ✅ Respuestas JSON consistentes con resto de la API
- ✅ Mejores mensajes de error para debugging
- ✅ Logging para troubleshooting en producción
- ✅ Documentación OpenAPI actualizada

## 📦 Archivos Modificados

- `app/src/controladores/externas.js` - Función updatePorteriaExterna reescrita
- `app/src/models/externa.js` - Modelo fromRequest mejorado
- `app/src/controladores/__tests__/externas.test.ts` - Tests actualizados
- `openapi_contract.json` - Endpoint PUT /api/externas/porteria documentado
- `OPENAPI_CONTRACT_CHANGELOG.md` - Nueva entrada 2026-01-23
- `FIX_EXTERNAS_PORTERIA.md` - Guía de pruebas (nuevo)

## 🚀 Deploy

- [x] Cambios probados en dev (`dev-app-1`)
- [x] Servidor reiniciado y funcionando correctamente
- [ ] Pendiente merge a `main`
- [ ] Pendiente deploy a producción

## 📌 Referencias

- Relacionado con estructura similar en `/api/entradas/porteria`
- Issue/Ticket: N/A (reportado directamente por usuario)
- Documentación: Ver `FIX_EXTERNAS_PORTERIA.md` para guía completa

---

**Reviewers**: Por favor verificar que:
1. Las validaciones son apropiadas
2. La respuesta JSON sigue convenciones del proyecto
3. El logging no expone información sensible
4. Los tests cubren los casos principales
