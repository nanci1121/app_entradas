# Changelog del Contrato OpenAPI

## Fecha: 2026-01-23

### Cambios Realizados

#### 1. Endpoint `PUT /api/externas/porteria` Corregido y Actualizado

**Problema identificado y corregido:**
- La función `updatePorteriaExterna` no guardaba correctamente la `fecha_salida` en la base de datos
- Faltaban validaciones de campos requeridos
- Respuesta era texto plano en lugar de JSON
- No se verificaba que la actualización se ejecutara correctamente

**Cambios en el código:**
- ✅ Agregadas validaciones para campos `id` y `recepcion` (obligatorios)
- ✅ Verificación de existencia del registro (404 si no existe)
- ✅ Verificación de éxito de actualización
- ✅ Respuesta JSON estándar con estructura `{ok, mensaje, externa}`
- ✅ Logging de debug para troubleshooting
- ✅ Modelo `Externa.fromRequest` actualizado para mapear `recepcion` y `fecha_salida`

**Cambios en documentación OpenAPI:**
- Campo `fechaSalida` ahora documentado en el schema de request
- Campos marcados como `required: ["id", "recepcion"]`
- Respuestas completas documentadas: 200, 400, 404, 500
- Descripción mejorada con ejemplos
- Estructura de respuesta JSON definida

**Request Body actualizado:**
```json
{
  "id": 123,
  "fechaSalida": "2026-01-23 11:30:00",
  "recepcion": true
}
```

**Response 200 actualizada:**
```json
{
  "ok": true,
  "mensaje": "Entrada de portería actualizada satisfactoriamente",
  "externa": { ...objeto_completo... }
}
```

---

## Fecha: 2026-01-21

### Cambios Realizados

#### 1. Esquema `EntradaVehiculo` Actualizado

Se han añadido los siguientes campos que faltaban y que son utilizados por la aplicación Flutter:

- **`firma`** (string): Firma del conductor en formato base64
  - Descripción: Permite capturar y almacenar la firma digital del conductor
  - Ejemplo: `"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."`

- **`fecha_creacion`** (string, date-time): Fecha de creación del registro
  - Descripción: Timestamp de cuándo se creó el registro en la base de datos

- **`fecha_salida`**: Ahora marcado como `nullable: true` para reflejar que puede ser null cuando el vehículo aún está dentro

#### 2. Endpoints de Entradas Actualizados

Los siguientes endpoints ahora incluyen el campo `firma` en sus request bodies:

- **POST `/api/entradas`**: Crear nueva entrada
  - Ahora acepta el campo `firma` para guardar la firma del conductor al momento de la entrada

- **PUT `/api/entradas/{id}`**: Actualizar entrada completa
  - Ahora permite actualizar el campo `firma`

#### 3. Endpoints Documentados

El contrato OpenAPI ahora incluye **TODOS** los endpoints que usa la aplicación Flutter:

##### Entradas (Vehículos)
- `GET /api/entradas` - Obtener vehículos dentro
- `GET /api/entradas/almacen` - Entradas para almacén
- `GET /api/entradas/porteria` - Entradas para portería
- `GET /api/entradas/by-matricula/{matricula}` - Buscar por matrícula
- `GET /api/entradas/{id}` - Obtener entrada específica
- `POST /api/entradas` - Crear nueva entrada
- `PUT /api/entradas/recepcion` - Actualizar estado de recepción
- `PUT /api/entradas/porteria` - Actualizar en portería
- `PUT /api/entradas/select` - Consultar por rango de fechas
- `PUT /api/entradas/{id}` - Actualizar entrada completa
- `DELETE /api/entradas/{id}` - Eliminar entrada

##### Externas (Empresas Exteriores)
- `POST /api/externas/new_externa` - Crear nueva externa
- `GET /api/externas/externas_hoy` - Externas de hoy
- `GET /api/externas/porteria` - Externas en portería
- `GET /api/externas/{id}` - Obtener externa específica
- `GET /api/externas/by-nombreConductor/{nombreConductor}` - Buscar por nombre
- `PUT /api/externas/porteria` - Actualizar estado en portería
- `PUT /api/externas/buscar_externa` - Buscar por rango de fechas
- `PUT /api/externas/{id}` - Actualizar externa
- `DELETE /api/externas/externa/{id}` - Eliminar externa

##### Internas (Salidas de Empleados)
- `POST /api/internas/new_Interna` - Crear nueva salida interna
- `GET /api/internas/internas_hoy` - Internas de hoy
- `GET /api/internas/{id}` - Obtener interna específica
- `POST /api/internas/code` - Obtener por código de empleado
- `PUT /api/internas/porteria` - Actualizar entrada de retorno
- `PUT /api/internas/buscar_interna` - Buscar por rango de fechas
- `PUT /api/internas/{id}` - Actualizar interna
- `DELETE /api/internas/interna/{id}` - Eliminar interna

##### Tornos (Registros de Torniquete)
- `POST /api/tornos/setTorno` - Crear registro de torno
- `GET /api/tornos/tornos_hoy` - Tornos de hoy
- `GET /api/tornos/{id}` - Obtener torno específico
- `POST /api/tornos/code` - Obtener por código de empleado
- `POST /api/tornos/consulta` - Consultar por rango de fechas
- `PUT /api/tornos/{id}` - Actualizar torno
- `DELETE /api/tornos/{id}` - Eliminar torno

##### Usuarios
- `POST /api/login` - Autenticar usuario (devuelve token JWT)
- `POST /api/login/new` - Crear nuevo usuario
- `GET /api/login/renew` - Renovar token JWT
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/{id}` - Obtener usuario específico
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario

### Servidores Configurados

El contrato incluye 3 servidores:

1. **Desarrollo**: `http://10.192.93.0:7302`
2. **Producción**: `http://10.192.92.12:7202`
3. **Localhost**: `http://localhost:7302`

### Autenticación

Todos los endpoints (excepto `/api/login` y `/api/login/new`) requieren autenticación mediante JWT:

- **Header**: `x-token`
- **Tipo**: `apiKey`
- **Obtención**: Llamar a `POST /api/login` con email y password

### Notas para el Equipo de Flutter

1. El campo `firma` ahora está documentado y puede ser usado en las peticiones POST y PUT de entradas
2. Todos los endpoints que usa la app están ahora en el contrato
3. El contrato es la **fuente de verdad** - cualquier discrepancia debe reportarse
4. Los nombres de campos usan `snake_case` en el API (ej: `nombre_conductor`) pero pueden mapearse a `camelCase` en Dart

### Archivo Generado

El contrato completo está en: `/home/huayi/ServidorAppEntradas/openapi_contract.json`

Puede ser usado para:
- Generar código Dart automáticamente
- Validar requests/responses
- Documentación de referencia
- Testing de integración
