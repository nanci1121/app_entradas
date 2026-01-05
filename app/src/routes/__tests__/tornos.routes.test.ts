import express from 'express';
import request from 'supertest';

jest.mock('../../middelwares/validar-jwt', () => ({
  validarJWT: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middelwares/validate-date', () => ({
  validateDateMiddleware: (fields: string[]) => (req: any, _res: any, next: any) => {
    req.__validatedFields = fields;
    next();
  },
}));

const setTorno = jest.fn((req: any, res: any) => res.status(201).json({ ok: true, route: 'setTorno', validated: req.__validatedFields }));
const getTornosHoy = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getTornosHoy' }));
const getTorno = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getTorno', id: req.params.id }));
const updateTorno = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'updateTorno', id: req.params.id, validated: req.__validatedFields }));
const consultaTorno = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'consultaTorno', validated: req.__validatedFields }));
const getTornoCode = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getTornoCode' }));

jest.mock('../../controladores/tornos', () => ({
  setTorno,
  getTornosHoy,
  getTorno,
  deleteTorno: jest.fn(),
  updateTorno,
  getTornoCode,
  consultaTorno,
}));

import tornosRouter from '../tornos';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/tornos', tornosRouter);
  return app;
};

describe('Router /api/tornos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /setTorno aplica validateDateMiddleware', async () => {
    const app = buildApp();
    const payload = { fechaEntrada: '2025-01-05', fechaSalida: '2025-01-06' };
    const res = await request(app).post('/api/tornos/setTorno').set('x-token', 'token').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.route).toBe('setTorno');
    expect(res.body.validated).toEqual(['fechaEntrada', 'fechaSalida']);
  });

  it('GET /tornos_hoy llama getTornosHoy', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/tornos/tornos_hoy').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getTornosHoy');
    expect(getTornosHoy).toHaveBeenCalledTimes(1);
  });

  it('GET /:id pasa el id', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/tornos/4').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('4');
    const call = getTorno.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '4' });
  });

  it('PUT /:id aplica validateDateMiddleware en updateTorno', async () => {
    const app = buildApp();
    const payload = { fechaEntrada: '2025-01-05', fechaSalida: '2025-01-06' };
    const res = await request(app).put('/api/tornos/11').set('x-token', 'token').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateTorno');
    expect(res.body.id).toBe('11');
    expect(res.body.validated).toEqual(['fechaEntrada', 'fechaSalida']);
  });

  it('POST /consulta aplica validateDateMiddleware en rango', async () => {
    const app = buildApp();
    const payload = { fechaInicio: '2025-01-01', fechaFin: '2025-01-31' };
    const res = await request(app).post('/api/tornos/consulta').set('x-token', 'token').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('consultaTorno');
    expect(res.body.validated).toEqual(['fechaInicio', 'fechaFin']);
  });
});