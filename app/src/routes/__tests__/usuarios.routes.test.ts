import express from 'express';
import request from 'supertest';

jest.mock('../../middelwares/validar-jwt', () => ({
  validarJWT: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middelwares/validar-campos', () => ({
  validarCampos: (_req: any, _res: any, next: any) => next(),
}));

// Mock express-validator check para que devuelva un middleware no-op
jest.mock('express-validator', () => ({
  check: () => ({
    isEmail: () => (_req: any, _res: any, next: any) => next(),
    not: () => ({ isEmpty: () => (_req: any, _res: any, next: any) => next() }),
  }),
}));

const todosUsuarios = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'todosUsuarios' }));
const usuarioId = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'usuarioId', id: req.params.id }));
const login = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'login', body: req.body }));
const createUsuario = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'createUsuario', body: req.body }));
const renewToken = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'renewToken' }));
const updateUsuario = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'updateUsuario', id: req.params.id, body: req.body }));
const deleteUsuario = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'deleteUsuario', id: req.params.id }));

jest.mock('../../controladores/usuarios', () => ({
  todosUsuarios,
  usuarioId,
  login,
  deleteUsuario,
  createUsuario,
  updateUsuario,
  renewToken,
}));

import usuariosRouter from '../usuarios';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', usuariosRouter);
  return app;
};

describe('Router /api (usuarios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /users usa validarJWT y llama todosUsuarios', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/users').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('todosUsuarios');
    expect(todosUsuarios).toHaveBeenCalledTimes(1);
  });

  it('GET /users/:id pasa el id a usuarioId', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/users/15').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('15');
    const call = usuarioId.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '15' });
  });

  it('POST /login aplica validarCampos y llama login', async () => {
    const app = buildApp();
    const payload = { email: 'a@a.com', password: 'secret' };
    const res = await request(app).post('/api/login').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('login');
    expect(res.body.body).toEqual(payload);
  });

  it('POST /login/new crea usuario con validarCampos', async () => {
    const app = buildApp();
    const payload = { name: 'Ana', email: 'a@a.com', password: 'secret' };
    const res = await request(app).post('/api/login/new').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('createUsuario');
    expect(res.body.body).toEqual(payload);
  });

  it('GET /login/renew usa validarJWT y llama renewToken', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/login/renew').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('renewToken');
  });

  it('PUT /users/:id aplica validarCampos y llama updateUsuario', async () => {
    const app = buildApp();
    const payload = { name: 'Ana', email: 'a@a.com', password: 'secret' };
    const res = await request(app).put('/api/users/21').set('x-token', 'token').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateUsuario');
    expect(res.body.id).toBe('21');
  });

  it('DELETE /users/:id usa validarJWT y llama deleteUsuario', async () => {
    const app = buildApp();
    const res = await request(app).delete('/api/users/7').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deleteUsuario');
    expect(res.body.id).toBe('7');
  });
});