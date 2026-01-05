import request from 'supertest';
import express from 'express';

// Mocks de infraestructura
jest.mock('../database/conexion', () => ({ query: jest.fn() }));
jest.mock('../helpers/jwt', () => ({
  comprobarJWT: jest.fn(() => [true, 1]),
  generarJWT: jest.fn(() => Promise.resolve('jwt')),
}));
jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(() => true),
  genSaltSync: jest.fn(() => 'salt'),
  hashSync: jest.fn(() => 'hashed'),
}));
jest.mock('../middelwares/validar-jwt', () => ({ validarJWT: (req: any, _res: any, next: any) => { req.id = 1; next(); } }));
jest.mock('../middelwares/validate-date', () => ({ validateDateMiddleware: () => (_req: any, _res: any, next: any) => next() }));
jest.mock('../middelwares/validar-campos', () => ({ validarCampos: (_req: any, _res: any, next: any) => next() }));

// Mock de modelos para evitar dependencias de tipos
jest.mock('../models/externa', () => ({ Externa: { fromRequest: (data: any) => ({ ...data }) } }));
jest.mock('../models/usuario', () => {
  return {
    Usuario: class {
      id: any; name: any; email: any; password: any; online: any; type: any; codigo_empleado: any;
      constructor(id: any, name: any, email: any, password: any, online: any, type: any, codigo_empleado: any) {
        this.id = id; this.name = name; this.email = email; this.password = password; this.online = online; this.type = type; this.codigo_empleado = codigo_empleado;
      }
    }
  };
});

const pool = require('../database/conexion');

// Routers reales
import entradasRouter from '../routes/entradas';
import externasRouter from '../routes/externas';
import internasRouter from '../routes/internas';
import tornosRouter from '../routes/tornos';
import usuariosRouter from '../routes/usuarios';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/api/ping', (_req, res) => res.send('pong'));
  app.use('/api/entradas', entradasRouter);
  app.use('/api/externas', externasRouter);
  app.use('/api/internas', internasRouter);
  app.use('/api/tornos', tornosRouter);
  app.use('/api', usuariosRouter);
  return app;
};

describe('Rutas completas - smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responde ping', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.text).toBe('pong');
  });

  it('GET /api/entradas devuelve lista', async () => {
    // Simplificamos: un mock que devuelve filas
    pool.query.mockResolvedValue({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });

    const app = buildApp();
    const res = await request(app).get('/api/entradas').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.entradas)).toBe(true);
  });

  it('POST /api/externas/new_externa crea registro', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 5 }] });

    const app = buildApp();
    const res = await request(app)
      .post('/api/externas/new_externa')
      .set('x-token', 'token')
      .send({
        nombrePersona: 'Ana',
        empresaExterior: 'ACME',
        peticionario: 'Bob',
        telefonoPersona: '123',
        firma: 'firma',
        fechaEntrada: '2025-01-05',
        nota: 'N'
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.externa).toBeDefined();
  });

  it('GET /api/internas/internas_hoy devuelve lista', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    const app = buildApp();
    const res = await request(app).get('/api/internas/internas_hoy').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.internas).toBeDefined();
  });

  it('GET /api/tornos/tornos_hoy devuelve lista', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    const app = buildApp();
    const res = await request(app).get('/api/tornos/tornos_hoy').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.tornos).toBeDefined();
  });

  it('GET /api/users devuelve lista', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'Ana' }] });

    const app = buildApp();
    const res = await request(app).get('/api/users').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.usuarios).toBeDefined();
  });

  it('POST /api/login responde con token', async () => {
    // login: busca usuario, bcrypt.compareSync => true, generarJWT => 'jwt'
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'Ana', email: 'a@a.com', password: 'hashed', online: false, type: 'user', codigo_empleado: '123' }] });

    const app = buildApp();
    const res = await request(app).post('/api/login').send({ email: 'a@a.com', password: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/login/new crea usuario', async () => {
    // existemail -> 0, insert -> {}, select id -> rowCount 1
    pool.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2 }] });

    const app = buildApp();
    const res = await request(app)
      .post('/api/login/new')
      .send({ name: 'Ana', email: 'a@a.com', password: 'secret', type: 'user' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('GET /api/login/renew devuelve token y usuario', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'Ana', email: 'a@a.com', password: 'hashed', online: false, type: 'user', codigo_empleado: '123' }] });

    const app = buildApp();
    const res = await request(app).get('/api/login/renew').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toBeDefined();
  });

  it('GET /api/users/:id devuelve usuario', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1, name: 'Ana' }] });

    const app = buildApp();
    const res = await request(app).get('/api/users/1').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('PUT /api/users/:id actualiza usuario', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] }) // existe id
      .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // email libre
      .mockResolvedValueOnce({}); // update

    const app = buildApp();
    const res = await request(app)
      .put('/api/users/1')
      .set('x-token', 'token')
      .send({ name: 'Ana', email: 'a@a.com', password: 'secret', type: 'user', codigo_empleado: '123' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('DELETE /api/users/:id elimina usuario', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] }) // existe
      .mockResolvedValueOnce({}); // delete

    const app = buildApp();
    const res = await request(app).delete('/api/users/1').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
