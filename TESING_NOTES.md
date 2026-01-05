# Referencia rapida de pruebas

## Como ejecutar
- Suite completa: `npm test`
- Archivo individual: `npm test -- --runTestsByPath <path>`

## Cobertura
- Controladores: entradas, externas, internas, tornos, usuarios
- Middlewares: validar-jwt, validar-campos, validate-date
- Helpers: jwt (generar/comprobar)
- Base de datos: wrapper del pool en `src/database/conexion.ts`
- Sockets: handshake, union a sala, emitir mensaje personal, desconexion
- Rutas (smoke con Supertest): ping, entradas, externas, internas, tornos, usuarios (login/new/renew, CRUD)
- Modelos: constructores de entidades principales

## Notas
- Las pruebas mockean el pool de BD, los helpers JWT y los middlewares para aislar el cableado.
- La especificacion Swagger tiene una prueba smoke que valida apiKey `x-token`, rutas principales y el servidor local `http://localhost:3000`.
- Se quitaron logs de depuracion para mantener la salida limpia.

---

# Testing quick reference

## How to run
- Full suite: `npm test`
- Single file: `npm test -- --runTestsByPath <path>`

## What is covered
- Controllers: entradas, externas, internas, tornos, usuarios
- Middlewares: validar-jwt, validar-campos, validate-date
- Helpers: jwt (generar/comprobar)
- Database: pool wrapper in `src/database/conexion.ts`
- Sockets: handshake, room join, personal message emit, disconnect
- Routes (smoke via Supertest): ping, entradas, externas, internas, tornos, usuarios (login/new/renew, CRUD)
- Models: constructors for core entities

## Notes
- Tests mock DB pool, JWT helpers, and middlewares to isolate wiring.
- Swagger spec has a smoke test ensuring `x-token` apiKey, main paths, and local server `http://localhost:3000`.
- Debug logs were removed to keep test output clean.
