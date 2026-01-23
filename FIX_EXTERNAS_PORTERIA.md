# Fix: Problema con Fecha de Salida en Externas - Portería

## Problema Identificado

Cuando se creaba una nueva entrada externa y se procedía a cerrarla desde la ventana de portería colocando la fecha de salida, el registro desaparecía de la pantalla de portería y aparecía en la pantalla de inicio de externas, **pero la fecha de cierre no se guardaba correctamente en la base de datos**.

## Causa del Problema

El problema se encontraba en la función `updatePorteriaExterna` en [controladores/externas.js](app/src/controladores/externas.js):

### 1. **Falta de validaciones**
```javascript
// ANTES - Sin validaciones
const { id, fechaSalida, recepcion } = req.body;
// Si faltaba algún campo, continuaba sin avisar
```

### 2. **Respuesta en texto plano en lugar de JSON**
```javascript
// ANTES
res.json('Entrada Porteria Updated Successfully');
// El cliente esperaba un objeto JSON con estructura estándar
```

### 3. **Sin verificación de actualización**
```javascript
// ANTES - No se verificaba que realmente se guardó
await pool.query('UPDATE empresas_exteriores SET ...');
res.json('...');  // Asumía éxito sin verificar
```

### 4. **Modelo incompleto**
El modelo `Externa.fromRequest` no estaba mapeando el campo `recepcion`, necesario para las actualizaciones desde portería.

## Solución Implementada

### 1. **Validaciones agregadas** ✅
```javascript
// Validar que vengan los campos necesarios
if (!id) {
    return res.status(400).json({
        ok: false,
        mensaje: 'El campo id es obligatorio'
    });
}

if (recepcion === undefined || recepcion === null) {
    return res.status(400).json({
        ok: false,
        mensaje: 'El campo recepcion es obligatorio'
    });
}
```

### 2. **Verificación de existencia** ✅
```javascript
// Verificar que la externa existe
const existe_id = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

if (existe_id.rowCount === 0) {
    return res.status(404).json({
        ok: false,
        mensaje: `Empresa exterior con id ${id} no se encuentra`
    });
}
```

### 3. **Verificación de actualización** ✅
```javascript
// Verificar que la actualización se realizó
const result = await pool.query(updateQuery, [recepcion, fechaSalida, id_usuaio, id]);

if (result.rowCount === 0) {
    return res.status(500).json({
        ok: false,
        mensaje: 'No se pudo actualizar la entrada'
    });
}
```

### 4. **Logging de debug para verificación** ✅
```javascript
// Obtener el registro actualizado para verificar
const registroActualizado = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

console.log('[DEBUG] Externa actualizada:', {
    id,
    recepcion,
    fechaSalida,
    fechaSalidaGuardada: registroActualizado.rows[0].fecha_salida
});
```

### 5. **Respuesta JSON estándar** ✅
```javascript
res.status(200).json({
    ok: true,
    mensaje: 'Entrada de portería actualizada satisfactoriamente',
    externa: registroActualizado.rows[0]
});
```

### 6. **Modelo Externa mejorado** ✅
```javascript
// En models/externa.js
static fromRequest(body) {
    const externa = new Externa();
    // ... campos existentes
    externa.fechaSalida = body.fecha_entrada2 || body.fecha_salida || body.fechaSalida;
    externa.recepcion = body.recepcion;  // ✅ Agregado
    return externa;
}
```

## Cómo Probar el Fix

### Paso 1: Crear una Nueva Externa
```bash
POST /api/externas/new_externa
Headers: x-token: <tu_jwt_token>
Body:
{
  "nombre_persona": "Test Usuario",
  "empresa_exterior": "Empresa Test",
  "peticionario": "Juan Pérez",
  "telefono_persona": "123456789",
  "firma": "firma_base64...",
  "fecha_entrada": "2026-01-23 10:00:00",
  "nota": "Prueba"
}
```

### Paso 2: Verificar en Portería
```bash
GET /api/externas/porteria
Headers: x-token: <tu_jwt_token>

# Deberías ver la externa creada con recepcion = false
```

### Paso 3: Actualizar desde Portería (Cerrar)
```bash
PUT /api/externas/porteria
Headers: x-token: <tu_jwt_token>
Body:
{
  "id": <id_de_la_externa>,
  "fechaSalida": "2026-01-23 11:00:00",
  "recepcion": true
}

# Respuesta esperada:
{
  "ok": true,
  "mensaje": "Entrada de portería actualizada satisfactoriamente",
  "externa": {
    "id": ...,
    "fecha_salida": "2026-01-23 11:00:00",
    "recepcion": true,
    ...
  }
}
```

### Paso 4: Verificar en Base de Datos
```sql
-- Conectarse a la BD
SELECT id, nombre_persona, fecha_entrada, fecha_salida, recepcion 
FROM empresas_exteriores 
WHERE id = <id_de_la_externa>;

-- Verificar que fecha_salida NO es NULL
-- Verificar que recepcion es TRUE
```

### Paso 5: Verificar en Portería (no debe aparecer)
```bash
GET /api/externas/porteria
Headers: x-token: <tu_jwt_token>

# La externa NO debe aparecer aquí porque recepcion = true
```

### Paso 6: Verificar en Inicio de Externas (debe aparecer)
```bash
GET /api/externas/externas_hoy
Headers: x-token: <tu_jwt_token>

# La externa DEBE aparecer aquí con fecha_salida guardada
```

## Verificación desde la Aplicación Cliente

1. **Crear Externa**: Ve a la pantalla de creación de externas y crea una nueva entrada
2. **Ir a Portería**: Navega a la ventana de portería, deberías ver la externa recién creada
3. **Colocar Fecha de Salida**: Ingresa la fecha/hora de salida y confirma
4. **Verificar Desaparición**: La externa debe desaparecer de la pantalla de portería (comportamiento esperado)
5. **Verificar en Inicio**: Ve a la pantalla de inicio de externas, la entrada debe aparecer **con la fecha de salida visible**

## Logs de Debug

Si quieres verificar que la fecha se está guardando correctamente, revisa los logs del servidor:

```bash
docker logs dev-app-1 | grep "DEBUG.*Externa actualizada"
```

Deberías ver algo como:
```json
{
  "level": 30,
  "msg": "[DEBUG] Externa actualizada:",
  "data": {
    "id": 123,
    "recepcion": true,
    "fechaSalida": "2026-01-23 11:00:00",
    "fechaSalidaGuardada": "2026-01-23 11:00:00"
  }
}
```

## Cambios en Archivos

- ✅ [app/src/controladores/externas.js](app/src/controladores/externas.js) - Función `updatePorteriaExterna` reescrita
- ✅ [app/src/models/externa.js](app/src/models/externa.js) - Agregado mapeo de `recepcion` en `fromRequest`
- ✅ [app/src/controladores/__tests__/externas.test.ts](app/src/controladores/__tests__/externas.test.ts) - Tests actualizados

## Estado del Servidor

✅ Servidor reiniciado correctamente  
✅ Cambios aplicados  
✅ Logs muestran funcionamiento normal  

## Próximos Pasos

Si el problema persiste:

1. **Verificar formato de fecha**: Asegúrate que el cliente envía `fechaSalida` en formato correcto (`YYYY-MM-DD HH:mm:ss`)
2. **Revisar logs**: Buscar mensajes `[ERROR]` o `[DEBUG]` en los logs del contenedor
3. **Verificar request**: Usar herramientas como Postman o ver logs de red en el cliente para confirmar que `fechaSalida` se está enviando
4. **Base de datos**: Conectarse directamente a PostgreSQL y verificar el tipo de dato de la columna `fecha_salida`

---

**Fecha de Fix**: 2026-01-23  
**Versión Servidor**: Dockerizado en dev-app-1  
**Autor**: GitHub Copilot (Assistant)
