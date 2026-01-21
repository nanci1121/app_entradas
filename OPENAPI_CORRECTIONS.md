# Correcciones al Contrato OpenAPI - Basadas en Feedback de Flutter

## Fecha: 2026-01-21

### Correcciones Aplicadas

#### 1. ✅ Campo `firma` Añadido
**Problema**: El campo `firma` no estaba documentado en el contrato original.
**Solución**: 
- Añadido al esquema `EntradaVehiculo`
- Incluido en los endpoints POST y PUT de entradas
- Tipo: `string` (base64)
- Descripción: "Firma del conductor en formato base64"

#### 2. ✅ Campo `fecha_creacion` Añadido
**Problema**: El campo `fecha_creacion` usado en Flutter no estaba en el contrato.
**Solución**:
- Añadido al esquema `EntradaVehiculo`
- Tipo: `string` (date-time)
- Descripción: "Fecha de creación del registro"
- **Nota**: En la base de datos se llama `date_creation` y se mapea automáticamente

#### 3. ✅ Endpoint PUT `/api/entradas/porteria` Corregido
**Problema**: El contrato solo documentaba `{id, fecha}` pero el backend requiere `{id, vigilancia, fecha}`.
**Solución**:
- Actualizado el requestBody para incluir el campo `vigilancia` (boolean)
- Marcado como required: `['id', 'vigilancia', 'fecha']`
- Añadida descripción: "Estado de vigilancia (true para marcar salida)"

#### 4. ✅ Campo `fecha_salida` Marcado como Nullable
**Problema**: El campo `fecha_salida` puede ser null cuando el vehículo aún está dentro.
**Solución**:
- Añadido `nullable: true` al campo en el esquema

#### 5. ❌ Campo `okfirma` / `prueba` NO Existe
**Hallazgo**: El cliente de Flutter mencionó un campo `okfirma` (mapeado a "prueba" en JSON).
**Verificación**: Revisado el esquema de la base de datos - este campo **NO existe**.
**Campos reales en `entradas_vehiculos`**:
- id, firma, recepcion, vigilancia, empresa, nombre_conductor, matricula, 
  date_creation, fecha_entrada, fecha_salida, date_modification, clase_carga, usuario

**Recomendación**: El equipo de Flutter debe eliminar el campo `okfirma` de su modelo `Entrada.dart`.

### Observaciones Adicionales

#### URLs de Servidores
El contrato incluye 3 servidores:
1. **Desarrollo**: `http://10.192.93.0:7302`
2. **Producción**: `http://10.192.92.12:7202`
3. **Localhost**: `http://localhost:7302`

**Nota para Flutter**: Verificar que `environment.dart` use las URLs correctas. El cliente mencionó `10.192.95.0:7002` como respaldo - confirmar si es correcto.

#### Formato de Fechas
**Importante**: Todas las fechas deben enviarse en formato ISO8601 desde Flutter:
```dart
DateTime.now().toIso8601String()
// Ejemplo: "2026-01-21T13:45:00.000Z"
```

#### Naming Convention
- **API (Backend)**: `snake_case` (ej: `nombre_conductor`, `clase_carga`)
- **Flutter (Dart)**: `camelCase` (ej: `nombreConductor`, `claseCarga`)
- **Mapeo**: Se hace automáticamente en los servicios Dart con `Map<String, dynamic>`

### Endpoints Completos Documentados

El contrato ahora incluye **31 endpoints** completos:

#### Entradas (11 endpoints)
- GET /api/entradas
- GET /api/entradas/almacen
- GET /api/entradas/porteria
- GET /api/entradas/by-matricula/{matricula}
- GET /api/entradas/{id}
- POST /api/entradas ✨ (incluye `firma`)
- PUT /api/entradas/recepcion
- PUT /api/entradas/porteria ✨ (incluye `vigilancia`)
- PUT /api/entradas/select
- PUT /api/entradas/{id} ✨ (incluye `firma`)
- DELETE /api/entradas/{id}

#### Externas (9 endpoints)
- POST /api/externas/new_externa
- GET /api/externas/externas_hoy
- GET /api/externas/porteria
- GET /api/externas/{id}
- GET /api/externas/by-nombreConductor/{nombreConductor}
- PUT /api/externas/porteria
- PUT /api/externas/buscar_externa
- PUT /api/externas/{id}
- DELETE /api/externas/externa/{id}

#### Internas (8 endpoints)
- POST /api/internas/new_Interna
- GET /api/internas/internas_hoy
- GET /api/internas/{id}
- POST /api/internas/code
- PUT /api/internas/porteria
- PUT /api/internas/buscar_interna
- PUT /api/internas/{id}
- DELETE /api/internas/interna/{id}

#### Tornos (7 endpoints)
- POST /api/tornos/setTorno
- GET /api/tornos/tornos_hoy
- GET /api/tornos/{id}
- POST /api/tornos/code
- POST /api/tornos/consulta
- PUT /api/tornos/{id}
- DELETE /api/tornos/{id}

### Validación Final

```bash
# Verificar que el JSON es válido
jq empty /home/huayi/ServidorAppEntradas/openapi_contract.json && echo "✓ JSON válido"

# Contar endpoints
jq '.paths | keys | length' /home/huayi/ServidorAppEntradas/openapi_contract.json
# Output: 31

# Verificar campo firma en esquema
jq '.components.schemas.EntradaVehiculo.properties.firma' /home/huayi/ServidorAppEntradas/openapi_contract.json

# Verificar endpoint POST /api/entradas incluye firma
jq '.paths."/api/entradas".post.requestBody.content."application/json".schema.properties.firma' /home/huayi/ServidorAppEntradas/openapi_contract.json

# Verificar endpoint PUT /api/entradas/porteria incluye vigilancia
jq '.paths."/api/entradas/porteria".put.requestBody.content."application/json".schema.properties.vigilancia' /home/huayi/ServidorAppEntradas/openapi_contract.json
```

### Próximos Pasos para el Equipo de Flutter

1. ✅ Actualizar modelos Dart para usar el contrato como fuente de verdad
2. ✅ Eliminar el campo `okfirma` / `prueba` del modelo `Entrada.dart`
3. ✅ Verificar que las URLs de servidores en `environment.dart` coincidan
4. ✅ Asegurar que todas las fechas se envíen en formato ISO8601
5. ✅ Actualizar el servicio `EntradaService` para enviar `vigilancia: true` en PUT /api/entradas/porteria
6. ✅ Considerar usar generadores de código Dart desde OpenAPI (ej: `openapi-generator`)

### Archivos Actualizados

- ✅ `/home/huayi/ServidorAppEntradas/openapi_contract.json` (44 KB, 1848 líneas)
- ✅ `/home/huayi/ServidorAppEntradas/app/src/config/swagger.ts`
- ✅ `/home/huayi/ServidorAppEntradas/app/src/routes/entradas.ts`
- ✅ `/home/huayi/ServidorAppEntradas/OPENAPI_CONTRACT_CHANGELOG.md`
- ✅ `/home/huayi/ServidorAppEntradas/OPENAPI_CORRECTIONS.md` (este archivo)

