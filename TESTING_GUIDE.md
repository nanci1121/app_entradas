# 📚 Guía de Tests para Principiantes (ES)

## ¿Qué es un Test?

Un **test** (prueba) es un código que verifica que tu aplicación funciona como se espera. Es como un inspector de calidad que automáticamente comprueba si todo está bien.

### Ejemplo Analógico:
- **Sin test**: Pruebas tu app manualmente cada vez → lento y propenso a errores
- **Con test**: Jest automatiza las pruebas → rápido y confiable

---

## 📦 Jest: Tu Framework de Testing

**Jest** es una herramienta que ejecuta tests y te dice cuáles pasaron ✅ y cuáles fallaron ❌.

### Conceptos Clave:

#### 1. **describe()** - Agrupar tests relacionados
```typescript
describe('Mi Calculadora', () => {
  // Todos los tests aquí son sobre la calculadora
});
```

#### 2. **it()** - Un test individual
```typescript
it('debería sumar 2 + 2 = 4', () => {
  expect(2 + 2).toBe(4);
});
```

#### 3. **expect()** - Verificar que algo sea verdad
```typescript
expect(resultado).toBe(4);        // ¿Es exactamente 4?
expect(resultado).toEqual(4);     // ¿Es igual a 4?
expect(array).toContain('texto'); // ¿Contiene 'texto'?
expect(objeto).toHaveProperty('id'); // ¿Tiene la propiedad 'id'?
```

---

## 🧪 Tipos de Tests

### **1. Tests Unitarios** ⚙️
Prueban **una función o clase aislada**, sin dependencias externas.

**Ejemplo: `src/helpers/__tests__/jwt.test.ts`**
```typescript
describe('JWT Helper', () => {
  it('debería generar un token válido', () => {
    const token = generarJWT(123);
    expect(typeof token).toBe('string');
  });
});
```

**¿Qué hace?**
- Llama a `generarJWT(123)`
- Verifica que retorna un string
- ✅ Pasa si es string, ❌ Falla si no

**Ventajas:**
- Rápidos (no usan BD ni red)
- Fáciles de escribir
- Detectan bugs en funciones específicas

---

### **2. Tests de Integración** 🔗
Prueban que **múltiples componentes funcionan juntos** (API + rutas + lógica).

**Ejemplo: `src/__tests__/api.integration.test.ts`**
```typescript
describe('GET /api/ping', () => {
  it('debería retornar "pong"', async () => {
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.text).toBe('pong');
  });
});
```

**¿Qué hace?**
1. Haces una petición HTTP a `/api/ping`
2. Verificas que el status sea 200 (OK)
3. Verificas que la respuesta sea "pong"

**Ventajas:**
- Prueban flujos completos
- Detectan problemas entre componentes
- Simulan clientes reales

---

## 🚀 Cómo Ejecutar los Tests

### Ver todos los tests:
```bash
npm test
```

### Ver resultado en tiempo real (útil mientras desarrollas):
```bash
npm run test:watch
```

### Ver cobertura (qué % del código está testeado):
```bash
npm run test:coverage
```

---

## 🏗️ Estructura de Archivos

```
app/
├── src/
│   ├── helpers/
│   │   ├── jwt.ts                    ← Función a testear
│   │   └── __tests__/
│   │       └── jwt.test.ts           ← Tests de jwt.ts
│   ├── __tests__/
│   │   └── api.integration.test.ts   ← Tests de APIs
│   └── index.ts
├── jest.config.js                     ← Configuración de Jest
└── package.json                       ← Scripts de test
```

**Regla**: Los archivos de test van en carpeta `__tests__` o terminan en `.test.ts`

---

## 💡 Matchers Útiles (expect)

| Matcher | Qué verifica | Ejemplo |
|---------|-------------|---------|
| `.toBe(valor)` | Igualdad exacta | `expect(5).toBe(5)` ✅ |
| `.toEqual(obj)` | Igualdad de objetos | `expect({a:1}).toEqual({a:1})` ✅ |
| `.toContain(item)` | Array contiene item | `expect([1,2,3]).toContain(2)` ✅ |
| `.toHaveProperty(key)` | Objeto tiene propiedad | `expect({id:1}).toHaveProperty('id')` ✅ |
| `.toThrow()` | Función lanza error | `expect(() => { throw Error(); }).toThrow()` ✅ |
| `.toBeDefined()` | Variable está definida | `expect(x).toBeDefined()` |
| `.toBeNull()` | Es null | `expect(null).toBeNull()` ✅ |

---

## 🔍 Hooks: Antes y Después de Tests

### **beforeAll()** - Se ejecuta una sola vez al inicio
```typescript
beforeAll(() => {
  app = createTestApp(); // Crear app para todos los tests
});
```

### **beforeEach()** - Se ejecuta antes de cada test
```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Limpiar mocks
});
```

### **afterEach()** - Se ejecuta después de cada test
```typescript
afterEach(() => {
  // Limpiar base de datos, cerrar conexiones, etc.
});
```

---

## 🧩 Supertest: Testing APIs

**Supertest** permite hacer peticiones HTTP en tests sin levantar un servidor real.

```typescript
import request from 'supertest';

// Petición GET
const response = await request(app)
  .get('/api/usuarios/123')
  .expect(200);

// Petición POST con datos
const response = await request(app)
  .post('/api/usuarios')
  .send({ name: 'Juan', email: 'juan@test.com' })
  .expect(201);

// Petición con headers
const response = await request(app)
  .get('/api/protected')
  .set('x-token', 'tu_jwt_token')
  .expect(200);
```

---

## 📝 Flujo Completo: Escribir un Test

### Paso 1: Identificar qué testear
> "Quiero probar que `/api/login` retorna un JWT válido"

### Paso 2: Escribir el test
```typescript
describe('POST /api/login', () => {
  it('debería retornar un JWT válido', async () => {
    // Arrange: Preparar datos
    const credenciales = { email: 'user@test.com', password: 'pass123' };

    // Act: Ejecutar la acción
    const response = await request(app)
      .post('/api/login')
      .send(credenciales);

    // Assert: Verificar el resultado
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });
});
```

### Paso 3: Ejecutar
```bash
npm test -- --testPathPattern="api.integration"
```

### Paso 4: Si falla, arreglar el código
Si el test falla, significa que tu función no hace lo esperado. Arregla el código, no el test.

---

## ⚡ Tips para Buenos Tests

### ✅ Haz:
- Tests **independientes** (no dependen unos de otros)
- Tests **rápidos** (unitarios en ms, integración en algunos segundos)
- Nombres **claros**: `it('debería retornar error si email es inválido')`
- Un **assert principal** por test (puede haber varios pero uno es el objetivo)

### ❌ No hagas:
- Tests que dependen de BD real (usa mocks)
- Tests lentos y complejos
- Tests ambiguos: `it('debería funcionar')`
- Múltiples asserts sin relación

---

## 🎯 Casos de Uso para Cada Test

### **Unitarios** 🔧
```
- Validaciones (email válido, password fuerte, etc.)
- Cálculos (sumar totales, descuentos)
- Helpers/utilities (generarJWT, hashPassword)
```

### **Integración** 🔗
```
- Endpoints REST completos
- Flujos multi-paso (login → crear entrada → salida)
- Base de datos + controladores
```

### **E2E** (próximamente) 🖥️
```
- Usuario real usando la UI
- Cypress / Playwright
```

---

## 📖 Ejemplo Práctico Completo

**Función a testear** (`src/utils/validar.ts`):
```typescript
export const esEmailValido = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**Test** (`src/utils/__tests__/validar.test.ts`):
```typescript
import { esEmailValido } from '../validar';

describe('esEmailValido', () => {
  it('debería aceptar email válido', () => {
    expect(esEmailValido('user@example.com')).toBe(true);
  });

  it('debería rechazar email sin @', () => {
    expect(esEmailValido('userexample.com')).toBe(false);
  });

  it('debería rechazar email sin dominio', () => {
    expect(esEmailValido('user@')).toBe(false);
  });

  it('debería rechazar string vacío', () => {
    expect(esEmailValido('')).toBe(false);
  });
});
```

**Ejecutar**:
```bash
npm test -- validar.test
```

---

## 🤝 Ahora Prueba!

1. Ejecuta: `npm test`
2. Deberías ver:
   - ✅ Tests de JWT pasando
   - ✅ Tests de API de integración pasando

3. Si algo falla, míralo con: `npm run test:coverage`

---

## 📚 Recursos
- [Documentación Jest](https://jestjs.io/)
- [Documentación Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

¿Preguntas?

---

# 📚 Beginner Testing Guide (EN)

## What is a Test?

A **test** checks that your app behaves as expected. Think of it as a quality inspector that automatically verifies everything is fine.

### Analogy:
- **Without tests**: Manual checks every time → slow and error-prone
- **With tests**: Jest automates checks → fast and reliable

---

## 📦 Jest: Your Testing Framework

**Jest** runs tests and reports which ones passed ✅ or failed ❌.

### Key Concepts:

#### 1. **describe()** - Group related tests
```typescript
describe('My Calculator', () => {
  // All tests here cover the calculator
});
```

#### 2. **it()** - A single test
```typescript
it('should add 2 + 2 = 4', () => {
  expect(2 + 2).toBe(4);
});
```

#### 3. **expect()** - Assert something is true
```typescript
expect(result).toBe(4);        // Exactly 4?
expect(result).toEqual(4);     // Equals 4?
expect(array).toContain('text'); // Contains 'text'?
expect(object).toHaveProperty('id'); // Has 'id' property?
```

---

## 🧪 Test Types

### **1. Unit Tests** ⚙️
They verify **one isolated function or class** without external dependencies.

**Example: `src/helpers/__tests__/jwt.test.ts`**
```typescript
describe('JWT Helper', () => {
  it('should generate a valid token', () => {
    const token = generarJWT(123);
    expect(typeof token).toBe('string');
  });
});
```

**What it does**
- Calls `generarJWT(123)`
- Checks it returns a string
- ✅ Passes if it is a string, ❌ fails otherwise

**Benefits**
- Fast (no DB or network)
- Easy to write
- Catch bugs in specific functions

---

### **2. Integration Tests** 🔗
They verify **multiple components working together** (API + routes + logic).

**Example: `src/__tests__/api.integration.test.ts`**
```typescript
describe('GET /api/ping', () => {
  it('should return "pong"', async () => {
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.text).toBe('pong');
  });
});
```

**What it does**
1. Makes an HTTP request to `/api/ping`
2. Verifies status 200 (OK)
3. Verifies response is "pong"

**Benefits**
- Exercise full flows
- Catch issues between components
- Simulate real clients

---

## 🚀 How to Run Tests

### Run all tests
```bash
npm test
```

### Watch mode (while coding)
```bash
npm run test:watch
```

### Coverage report
```bash
npm run test:coverage
```

---

## 🏗️ File Layout

```
app/
├── src/
│   ├── helpers/
│   │   ├── jwt.ts                    ← Function under test
│   │   └── __tests__/
│   │       └── jwt.test.ts           ← Tests for jwt.ts
│   ├── __tests__/
│   │   └── api.integration.test.ts   ← API tests
│   └── index.ts
├── jest.config.js                     ← Jest configuration
└── package.json                       ← Test scripts
```

**Rule**: Test files live in `__tests__` folders or end with `.test.ts`.

---

## 💡 Useful Matchers (expect)

| Matcher | What it checks | Example |
|---------|----------------|---------|
| `.toBe(value)` | Exact equality | `expect(5).toBe(5)` ✅ |
| `.toEqual(obj)` | Object equality | `expect({a:1}).toEqual({a:1})` ✅ |
| `.toContain(item)` | Array contains item | `expect([1,2,3]).toContain(2)` ✅ |
| `.toHaveProperty(key)` | Object has property | `expect({id:1}).toHaveProperty('id')` ✅ |
| `.toThrow()` | Function throws error | `expect(() => { throw Error(); }).toThrow()` ✅ |
| `.toBeDefined()` | Variable is defined | `expect(x).toBeDefined()` |
| `.toBeNull()` | Value is null | `expect(null).toBeNull()` ✅ |

---

## 🔍 Hooks: Before and After Tests

### **beforeAll()** - Runs once at start
```typescript
beforeAll(() => {
  app = createTestApp(); // Create app for all tests
});
```

### **beforeEach()** - Runs before each test
```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Reset mocks
});
```

### **afterEach()** - Runs after each test
```typescript
afterEach(() => {
  // Clean DB, close connections, etc.
});
```

---

## 🧩 Supertest: API Testing

**Supertest** lets you make HTTP requests in tests without starting a real server.

```typescript
import request from 'supertest';

// GET request
const response = await request(app)
  .get('/api/usuarios/123')
  .expect(200);

// POST with body
const response = await request(app)
  .post('/api/usuarios')
  .send({ name: 'Juan', email: 'juan@test.com' })
  .expect(201);

// Request with headers
const response = await request(app)
  .get('/api/protected')
  .set('x-token', 'your_jwt_token')
  .expect(200);
```

---

## 📝 End-to-End Flow: Writing a Test

### Step 1: Identify what to test
> "I want to verify `/api/login` returns a valid JWT"

### Step 2: Write the test
```typescript
describe('POST /api/login', () => {
  it('should return a valid JWT', async () => {
    // Arrange
    const credentials = { email: 'user@test.com', password: 'pass123' };

    // Act
    const response = await request(app)
      .post('/api/login')
      .send(credentials);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });
});
```

### Step 3: Run
```bash
npm test -- --testPathPattern="api.integration"
```

### Step 4: If it fails, fix the code
If the test fails, your function isn't doing what's expected. Fix the code, not the test.

---

## ⚡ Tips for Good Tests

### ✅ Do:
- **Independent** tests (no interdependencies)
- **Fast** tests (unit in ms, integration in seconds)
- **Clear names**: `it('should return error when email is invalid')`
- One **main assertion** per test (others can support it)

### ❌ Avoid:
- Tests that depend on a real DB (mock instead)
- Slow, complex tests
- Ambiguous tests: `it('should work')`
- Many unrelated assertions

---

## 🎯 Use Cases per Test Type

### **Unit** 🔧
```
- Validations (valid email, strong password)
- Calculations (totals, discounts)
- Helpers/utilities (generarJWT, hashPassword)
```

### **Integration** 🔗
```
- Full REST endpoints
- Multi-step flows (login → create entry → exit)
- Database + controllers
```

### **E2E** (later) 🖥️
```
- Real user through the UI
- Cypress / Playwright
```

---

## 📖 Full Practical Example

**Function to test** (`src/utils/validar.ts`):
```typescript
export const esEmailValido = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**Test** (`src/utils/__tests__/validar.test.ts`):
```typescript
import { esEmailValido } from '../validar';

describe('esEmailValido', () => {
  it('should accept a valid email', () => {
    expect(esEmailValido('user@example.com')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(esEmailValido('userexample.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(esEmailValido('user@')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(esEmailValido('')).toBe(false);
  });
});
```

**Run**:
```bash
npm test -- validar.test
```

---

## 🤝 Now You Try!

1. Run: `npm test`
2. You should see:
   - ✅ JWT tests passing
   - ✅ API integration tests passing

3. If something fails, check with: `npm run test:coverage`

---

## 📚 Resources
- [Jest Docs](https://jestjs.io/)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

Questions?
