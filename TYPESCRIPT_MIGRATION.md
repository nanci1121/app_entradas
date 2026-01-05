# Estructura TypeScript Paralela (ES)

## 📋 Visión General

Este proyecto mantiene una estructura **dual TypeScript/JavaScript** para migración gradual:
- ✅ **Archivos `.js` originales**: Funcionando, sin cambios
- ✅ **Archivos `.ts` nuevos**: Versiones tipadas, documentadas
- ✅ **Coexistencia**: Ambos funcionan en paralelo

## 🗂️ Estructura de Migración

### Base de Datos
```
database/
├── conexion.js      ← Original (CommonJS)
└── conexion.ts      ← Tipado (TypeScript con Pool<T> genérico)
```
**Cambios**: Tipos genéricos para `QueryResult<T>`, manejo de errores mejorado

### Modelos
```
models/
├── entrada.js       ← Original (clases simples)
├── entrada.ts       ← Tipado (propiedades públicas con tipos)
├── usuario.js       ← Original
├── usuario.ts       ← Tipado
├── externa.js       ← Original
├── externa.ts       ← Tipado (+ método `fromRequest()`)
├── interna.js       ← Original
├── interna.ts       ← Tipado
├── torno.js         ← Original
└── torno.ts         ← Tipado
```
**Cambios**: Propiedades opcionales tipadas, métodos estáticos helpers

### Middlewares
```
middelwares/
├── validar-jwt.js        ← Original
├── validar-jwt.ts        ← Tipado (AuthRequest interface)
├── validar-campos.js     ← Original
├── validar-campos.ts     ← Tipado
├── validate-date.js      ← Original
└── validate-date.ts      ← Tipado
```
**Cambios**: Tipos `Request`, `Response`, `NextFunction` de Express, early returns

### Rutas
```
routes/
├── usuarios.js      ← Original
├── usuarios.ts      ← Tipado (Router tipado)
├── entradas.js      ← Original
├── entradas.ts      ← Tipado
├── externas.js      ← Original
├── externas.ts      ← Tipado
├── internas.js      ← Original
├── internas.ts      ← Tipado
├── tornos.js        ← Original
└── tornos.ts        ← Tipado
```
**Cambios**: Tipado de Router, documentación JSDoc completa

### Controladores
```
controladores/
├── entradas.js      ← Original
├── entradas.ts      ← Tipado (Request, Response, ApiResponse<T>)
├── usuarios.js      ← Original
├── usuarios.ts      ← Por crear
├── externas.js      ← Original
├── externas.ts      ← Por crear
├── internas.js      ← Original
├── internas.ts      ← Por crear
├── tornos.js        ← Original
├── tornos.ts        ← Por crear
└── socket.js        ← Original
    └── socket.ts    ← Por crear
```
**Cambios**: Tipado completo, interfaces `ApiResponse<T>`, manejo de errores robusto

## 🔄 Flujo de Migración Gradual

### Fase 1: Estructura Base (✅ Completada)
- ✅ Modelos tipados
- ✅ Middlewares tipados
- ✅ Rutas tipadas
- ✅ Database pool tipado
- ✅ Controlador entradas.ts

### Fase 2: Completar Controladores
- ⏳ usuarios.ts
- ⏳ externas.ts
- ⏳ internas.ts
- ⏳ tornos.ts
- ⏳ socket.ts

### Fase 3: Index.ts Principal
- ⏳ Convertir `index.js` → `index.ts` completo

### Fase 4: Integración
- ⏳ Actualizar `tsconfig.json` si es necesario
- ⏳ Probar `npm run build`
- ⏳ Opcionalmente cambiar imports en routes

## 📚 Patrones de Conversión

### Modelos: De función constructora a clase
```javascript
// Original (entradas.js)
module.exports = class Entrada { ... }

// TypeScript (entradas.ts)
export class Entrada {
    id: number;
    nombreConductor: string;
    // ... propiedades tipadas
}
export default Entrada;
```

### Middlewares: Tipado de Request/Response
```javascript
// Original
const validarJWT = (req, res, next) => { ... }

// TypeScript
export const validarJWT = (req: Request, res: Response, next: NextFunction): void => { ... }
```

### Controladores: Interface ApiResponse genérica
```javascript
// Original
res.json({ ok: true, cantidad: 10, entradas: [] })

// TypeScript
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    entradas?: T[];
}

res.json({ ok: true, cantidad: 10, entradas: [] } as ApiResponse);
```

### Rutas: Router tipado
```javascript
// Original
const router = Router();
router.get('/', validarJWT, getEntradas);

// TypeScript
import { Router } from 'express';
const router = Router();
router.get('/', validarJWT, getEntradas);
```

## 🔧 Cómo Usar Ahora

### Mantener lo original funcionando
Los archivos `.js` siguen siendo el código activo. La aplicación funciona sin cambios:
```bash
npm run dev           # Sigue usando .js
npm start             # Sigue usando .js
npm run build         # Compila .ts a dist/, pero no afecta ejecución
```

### Prepararse para migración
1. Completar todos los archivos `.ts` (Fase 2-3)
2. Probar `npm run build` para asegurar compilación sin errores
3. Actualizar un controlador a la vez en `routes/*.js`
4. Cambiar import de `.js` a `.ts` cuando esté listo

## 📖 Documentación de Tipos

### Types principales (types/index.ts)
```typescript
export interface EntradaVehiculo {
    id: number;
    firma: string;
    recepcion: boolean;
    vigilancia: boolean;
    empresa: string;
    nombre_conductor: string;
    matricula: string;
    fecha_entrada: Date;
    fecha_salida?: Date;
    clase_carga?: string;
    usuario: number;
}

export interface JWTPayload {
    id: number;
}
```

### Respuestas API tipadas
```typescript
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    entradas?: T[];
    entrada?: T;
    id?: number;
}

// Uso
res.json({
    ok: true,
    cantidad: 10,
    entradas: entradas.rows
} as ApiResponse<EntradaVehiculo>);
```

## ⚡ Ventajas de la Estructura Dual

1. **Sin breaking changes**: Código existente sigue funcionando
2. **Gradual**: Se puede migrar a ritmo propio
3. **Documentación viva**: `.ts` sirve como referencia tipada
4. **IDE mejor**: Completado de código en editores
5. **Debugging**: Stack traces claros con tipos
6. **Seguridad**: Errores en tiempo de compilación

## 🚀 Próximos Pasos

1. Completar los 4 controladores restantes (usuarios, externas, internas, tornos)
2. Crear `socket.ts` para handlers de Socket.IO
3. Probar con `npm run build`
4. Migrar routes a usar `.ts` cuando esté todo listo
5. Opcionalmente convertir `index.js` → `index.ts`

---

# Parallel TypeScript Structure (EN)

## 📋 Overview

This project keeps a **dual TypeScript/JavaScript** structure for gradual migration:
- ✅ **Original `.js` files**: Still running unchanged
- ✅ **New `.ts` files**: Typed, documented versions
- ✅ **Coexistence**: Both run side-by-side

## 🗂️ Migration Layout

### Database
```
database/
├── conexion.js      ← Original (CommonJS)
└── conexion.ts      ← Typed (TypeScript with generic Pool<T>)
```
**Changes**: Generic `QueryResult<T>` typing, improved error handling

### Models
```
models/
├── entrada.js       ← Original (simple classes)
├── entrada.ts       ← Typed (public, typed props)
├── usuario.js       ← Original
├── usuario.ts       ← Typed
├── externa.js       ← Original
├── externa.ts       ← Typed (+ `fromRequest()` helper)
├── interna.js       ← Original
├── interna.ts       ← Typed
├── torno.js         ← Original
└── torno.ts         ← Typed
```
**Changes**: Optional props typed, static helper methods

### Middlewares
```
middelwares/
├── validar-jwt.js        ← Original
├── validar-jwt.ts        ← Typed (AuthRequest interface)
├── validar-campos.js     ← Original
├── validar-campos.ts     ← Typed
├── validate-date.js      ← Original
└── validate-date.ts      ← Typed
```
**Changes**: Express `Request`, `Response`, `NextFunction` types, early returns

### Routes
```
routes/
├── usuarios.js      ← Original
├── usuarios.ts      ← Typed router
├── entradas.js      ← Original
├── entradas.ts      ← Typed
├── externas.js      ← Original
├── externas.ts      ← Typed
├── internas.js      ← Original
├── internas.ts      ← Typed
├── tornos.js        ← Original
└── tornos.ts        ← Typed
```
**Changes**: Typed Router, full JSDoc docs

### Controllers
```
controladores/
├── entradas.js      ← Original
├── entradas.ts      ← Typed (Request, Response, ApiResponse<T>)
├── usuarios.js      ← Original
├── usuarios.ts      ← To create
├── externas.js      ← Original
├── externas.ts      ← To create
├── internas.js      ← Original
├── internas.ts      ← To create
├── tornos.js        ← Original
├── tornos.ts        ← To create
└── socket.js        ← Original
    └── socket.ts    ← To create
```
**Changes**: Full typing, `ApiResponse<T>` interfaces, stronger error handling

## 🔄 Gradual Migration Flow

### Phase 1: Base Structure (✅ Done)
- ✅ Typed models
- ✅ Typed middlewares
- ✅ Typed routes
- ✅ Typed DB pool
- ✅ `entradas.ts` controller

### Phase 2: Complete Controllers
- ⏳ usuarios.ts
- ⏳ externas.ts
- ⏳ internas.ts
- ⏳ tornos.ts
- ⏳ socket.ts

### Phase 3: Main Index.ts
- ⏳ Convert full `index.js` → `index.ts`

### Phase 4: Integration
- ⏳ Update `tsconfig.json` if needed
- ⏳ Run `npm run build`
- ⏳ Optionally swap imports in routes

## 📚 Conversion Patterns

### Models: From constructor function to class
```javascript
// Original (entradas.js)
module.exports = class Entrada { ... }

// TypeScript (entradas.ts)
export class Entrada {
    id: number;
    nombreConductor: string;
    // ... typed properties
}
export default Entrada;
```

### Middlewares: Typed Request/Response
```javascript
// Original
const validarJWT = (req, res, next) => { ... }

// TypeScript
export const validarJWT = (req: Request, res: Response, next: NextFunction): void => { ... }
```

### Controllers: Generic ApiResponse interface
```javascript
// Original
res.json({ ok: true, cantidad: 10, entradas: [] })

// TypeScript
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    entradas?: T[];
}

res.json({ ok: true, cantidad: 10, entradas: [] } as ApiResponse);
```

### Routes: Typed Router
```javascript
// Original
const router = Router();
router.get('/', validarJWT, getEntradas);

// TypeScript
import { Router } from 'express';
const router = Router();
router.get('/', validarJWT, getEntradas);
```

## 🔧 How to Use Now

### Keep originals running
`.js` files remain the active runtime code. The app works unchanged:
```bash
npm run dev           # Still uses .js
npm start             # Still uses .js
npm run build         # Compiles .ts to dist/ without changing runtime
```

### Prepare for migration
1. Complete all `.ts` files (Phases 2-3)
2. Run `npm run build` to ensure error-free compilation
3. Update one controller at a time in `routes/*.js`
4. Switch imports from `.js` to `.ts` when ready

## 📖 Types Reference

### Key types (types/index.ts)
```typescript
export interface EntradaVehiculo {
    id: number;
    firma: string;
    recepcion: boolean;
    vigilancia: boolean;
    empresa: string;
    nombre_conductor: string;
    matricula: string;
    fecha_entrada: Date;
    fecha_salida?: Date;
    clase_carga?: string;
    usuario: number;
}

export interface JWTPayload {
    id: number;
}
```

### Typed API responses
```typescript
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    entradas?: T[];
    entrada?: T;
    id?: number;
}

// Usage
res.json({
    ok: true,
    cantidad: 10,
    entradas: entradas.rows
} as ApiResponse<EntradaVehiculo>);
```

## ⚡ Benefits of the Dual Structure

1. **No breaking changes**: Existing code still works
2. **Gradual**: Migrate at your own pace
3. **Living docs**: `.ts` acts as typed reference
4. **Better IDE**: Autocomplete and hints
5. **Debugging**: Clear stack traces with types
6. **Safety**: Compile-time errors

## 🚀 Next Steps

1. Finish the remaining 4 controllers (usuarios, externas, internas, tornos)
2. Add `socket.ts` for Socket.IO handlers
3. Run `npm run build`
4. Switch routes to use `.ts` when ready
5. Optionally convert `index.js` → `index.ts`
