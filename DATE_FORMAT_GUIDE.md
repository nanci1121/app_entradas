# Guía de Formatos de Fecha - API Entradas

## 📅 Resumen Ejecutivo

**No te preocupes**: El backend acepta **múltiples formatos de fecha**, incluyendo ISO8601 completo y formatos simplificados.

## ✅ Formatos Aceptados

El middleware `validateDateMiddleware` acepta fechas en los siguientes formatos:

### 1. **Formato Simple (Solo Fecha)**
```
YYYY-MM-DD
Ejemplo: "2026-01-21"
```

### 2. **Formato ISO8601 Completo (Fecha + Hora)**
```
YYYY-MM-DDTHH:mm:ss
Ejemplo: "2026-01-21T14:30:00"
```

### 3. **Formato ISO8601 con Milisegundos**
```
YYYY-MM-DDTHH:mm:ss.SSS
Ejemplo: "2026-01-21T14:30:00.123"
```

### 4. **Formato ISO8601 con Zona Horaria (UTC)**
```
YYYY-MM-DDTHH:mm:ss.SSSZ
Ejemplo: "2026-01-21T14:30:00.123Z"
```

### 5. **Formato ISO8601 con Offset de Zona Horaria**
```
YYYY-MM-DDTHH:mm:ss.SSS+HH:mm
Ejemplo: "2026-01-21T14:30:00.123+01:00"
```

## 🔍 Validación del Backend

El middleware valida:

1. ✅ **Formato correcto**: Debe seguir el patrón YYYY-MM-DD (con o sin hora)
2. ✅ **Fecha válida**: No acepta fechas inválidas como "2026-02-30"
3. ✅ **No futuro**: Las fechas no pueden ser futuras (excepto para algunos casos específicos)

### Regex de Validación
```javascript
/^\d{4}-\d{2}-\d{2}([\sT]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?)?$/
```

## 📱 Desde Flutter (Dart)

### ✅ Opción 1: ISO8601 Completo (Recomendado)
```dart
// Esto es lo que mencionó el cliente de Flutter
DateTime.now().toIso8601String()
// Resultado: "2026-01-21T14:30:00.123Z"
```

**Ventaja**: Incluye hora exacta y zona horaria.

### ✅ Opción 2: Solo Fecha
```dart
DateTime now = DateTime.now();
String fecha = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
// Resultado: "2026-01-21"
```

**Ventaja**: Más simple si solo necesitas la fecha.

### ✅ Opción 3: Formato Personalizado con intl
```dart
import 'package:intl/intl.dart';

// Solo fecha
DateFormat('yyyy-MM-dd').format(DateTime.now())
// Resultado: "2026-01-21"

// Fecha y hora
DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now())
// Resultado: "2026-01-21 14:30:00"
```

## 🎯 Recomendación para Flutter

**Usa `toIso8601String()`** - Es el estándar y funciona perfectamente:

```dart
// En tu modelo o servicio
Map<String, dynamic> toJson() {
  return {
    'fecha_entrada': fechaEntrada.toIso8601String(),
    'fecha_salida': fechaSalida?.toIso8601String(),
    // ... otros campos
  };
}
```

### Ejemplo Completo en Flutter

```dart
// Servicio de Entradas
Future<void> crearEntrada(Entrada entrada) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/entradas'),
    headers: {
      'Content-Type': 'application/json',
      'x-token': token,
    },
    body: jsonEncode({
      'empresa': entrada.empresa,
      'nombre_conductor': entrada.nombreConductor,
      'matricula': entrada.matricula,
      'clase_carga': entrada.claseCarga,
      'firma': entrada.firma,
      // ✅ Esto funciona perfectamente
      'fecha_entrada': entrada.fechaEntrada.toIso8601String(),
    }),
  );
}
```

## 🔄 Conversión en PostgreSQL

PostgreSQL maneja automáticamente la conversión de strings ISO8601 a `timestamp with time zone`:

```sql
-- Todos estos formatos funcionan en PostgreSQL
INSERT INTO entradas_vehiculos (fecha_entrada) VALUES 
  ('2026-01-21'),                          -- ✅ Solo fecha
  ('2026-01-21 14:30:00'),                 -- ✅ Fecha + hora (espacio)
  ('2026-01-21T14:30:00'),                 -- ✅ Fecha + hora (T)
  ('2026-01-21T14:30:00.123Z'),            -- ✅ ISO8601 completo
  ('2026-01-21T14:30:00.123+01:00');       -- ✅ Con offset
```

## ⚠️ Formatos NO Aceptados

```javascript
// ❌ Formato de mes en texto
"21 de enero de 2026"
"21-enero-2026"

// ❌ Formato DD/MM/YYYY
"21/01/2026"

// ❌ Formato MM/DD/YYYY (americano)
"01/21/2026"

// ❌ Formato con mes en otro idioma
"21-octubre-2026"
```

## 🧪 Pruebas

### Desde la Terminal (curl)

```bash
# ✅ Con ISO8601 completo
curl -X POST http://localhost:3000/api/entradas \
  -H "Content-Type: application/json" \
  -H "x-token: YOUR_TOKEN" \
  -d '{
    "empresa": "Test SA",
    "nombre_conductor": "Juan Pérez",
    "matricula": "ABC-1234",
    "clase_carga": "Material",
    "firma": "base64string...",
    "fecha_entrada": "2026-01-21T14:30:00.000Z"
  }'

# ✅ Con formato simple
curl -X POST http://localhost:3000/api/entradas \
  -H "Content-Type: application/json" \
  -H "x-token: YOUR_TOKEN" \
  -d '{
    "empresa": "Test SA",
    "nombre_conductor": "Juan Pérez",
    "matricula": "ABC-1234",
    "clase_carga": "Material",
    "firma": "base64string...",
    "fecha_entrada": "2026-01-21"
  }'
```

## 📊 Resumen de Endpoints que Usan Fechas

### Entradas
- `POST /api/entradas` → `fecha_entrada` (required)
- `PUT /api/entradas/porteria` → `fecha` (required)
- `PUT /api/entradas/select` → `fecha_entrada1`, `fecha_entrada2` (required)
- `PUT /api/entradas/:id` → `fecha_entrada`, `fecha_salida` (optional)

### Externas
- `PUT /api/externas/buscar_externa` → `fechaEntrada`, `fechaEntrada2` (required)

### Internas
- `POST /api/internas/new_Interna` → `fechaSalida` (required)
- `PUT /api/internas/porteria` → `fechaEntrada` (required)
- `PUT /api/internas/buscar_interna` → `fechaSalida`, `fechaSalida2` (required)
- `PUT /api/internas/:id` → `fechaEntrada`, `fechaSalida` (optional)

### Tornos
- `POST /api/tornos/setTorno` → `fechaEntrada`, `fechaSalida` (optional)
- `POST /api/tornos/consulta` → `fechaInicio`, `fechaFin` (required)
- `PUT /api/tornos/:id` → `fechaEntrada`, `fechaSalida` (optional)

## 🎯 Conclusión

**No hay problema con ISO8601**: El backend acepta perfectamente el formato que genera `DateTime.toIso8601String()` de Dart.

**Recomendación final**:
```dart
// ✅ Usa esto en toda tu app Flutter
fecha.toIso8601String()
```

Es el estándar internacional, funciona en todos los backends modernos, y PostgreSQL lo maneja sin problemas.

