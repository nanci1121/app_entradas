import express from 'express';
import request from 'supertest';

// Mocks de middlewares
jest.mock('../../middelwares/validar-jwt', () => ({
  validarJWT: (req: any, _res: any, next: any) => {
    req.id = 'mock-user';
    next();
  },
}));

jest.mock('../../middelwares/validate-date', () => ({
  validateDateMiddleware: (fields: string[]) => (req: any, _res: any, next: any) => {
    req.__validatedFields = fields;
    next();
  },
}));

// Mocks de controladores (responden con una marca para validar el wiring de la ruta)
const getEntradas = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getEntradas', user: req.id }));
const getEntrada = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getEntrada', id: req.params.id }));
const setEntrada = jest.fn((req: any, res: any) => res.status(201).json({ ok: true, route: 'setEntrada', body: req.body, validated: req.__validatedFields }));
const updateEntradas = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'updateEntradas', id: req.params.id, validated: req.__validatedFields }));

jest.mock('../../controladores/entradas', () => ({
  getEntradas,
  getEntrada,
  deleteEntrada: jest.fn(),
  updateEntradas,
  setEntrada,
  updateRecepcionEntrada: jest.fn(),
  getEntradasAlmacen: jest.fn(),
  getEntradasPorteria: jest.fn(),
  updatePorteriaEntrada: jest.fn(),
  getEntradasSelect: jest.fn(),
  getEntradaByMatricula: jest.fn(),
}));

import entradasRouter from '../entradas';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/entradas', entradasRouter);
  return app;
};

describe('Router /api/entradas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/entradas usa validarJWT y llama getEntradas', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/entradas').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getEntradas');
    expect(getEntradas).toHaveBeenCalledTimes(1);
    expect(res.body.user).toBe('mock-user');
  });

  it('GET /api/entradas/:id pasa el id al controlador', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/entradas/42').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getEntrada');
    expect(res.body.id).toBe('42');
    const call = getEntrada.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '42' });
  });

  it('POST /api/entradas ejecuta validateDateMiddleware y setEntrada', async () => {
    const app = buildApp();
    const payload = { fecha_entrada: '2025-01-05 10:00:00', nombre_conductor: 'Ana' };
    const res = await request(app).post('/api/entradas').set('x-token', 'token').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.route).toBe('setEntrada');
    expect(res.body.body).toMatchObject(payload);
    expect(res.body.validated).toEqual(['fecha_entrada']);
    expect(setEntrada).toHaveBeenCalledTimes(1);
  });

  it('PUT /api/entradas/:id aplica validateDateMiddleware y updateEntradas', async () => {
    const app = buildApp();
    const payload = { fecha_entrada: '2025-01-05 10:00:00', fecha_salida: '2025-01-05 11:00:00' };
    const res = await request(app).put('/api/entradas/7').set('x-token', 'token').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateEntradas');
    expect(res.body.id).toBe('7');
    expect(res.body.validated).toEqual(['fecha_entrada', 'fecha_salida']);
    const call = updateEntradas.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '7' });
    expect(call.body).toEqual(payload);
    expect(call.__validatedFields).toEqual(['fecha_entrada', 'fecha_salida']);
  });
});