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

const setInterna = jest.fn((req: any, res: any) => res.status(201).json({ ok: true, route: 'setInterna', validated: req.__validatedFields }));
const getInternasHoy = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getInternasHoy' }));
const getInterna = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getInterna', id: req.params.id }));
const updatePorteriaInterna = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'updatePorteriaInterna', validated: req.__validatedFields }));
const consultaInterna = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'consultaInterna', validated: req.__validatedFields }));
const updateInternas = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'updateInternas', id: req.params.id, validated: req.__validatedFields }));
const getInternaCode = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getInternaCode' }));

jest.mock('../../controladores/internas', () => ({
  setInterna,
  getInternasHoy,
  getInterna,
  updatePorteriaInterna,
  deleteInterna: jest.fn(),
  consultaInterna,
  updateInternas,
  getInternaCode,
}));

import internasRouter from '../internas';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/internas', internasRouter);
  return app;
};

describe('Router /api/internas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /new_Interna aplica validateDateMiddleware en setInterna', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/internas/new_Interna')
      .set('x-token', 'token')
      .send({ fechaSalida: '2025-01-05' });

    expect(res.status).toBe(201);
    expect(res.body.route).toBe('setInterna');
    expect(res.body.validated).toEqual(['fechaSalida']);
  });

  it('GET /internas_hoy llama getInternasHoy', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/internas/internas_hoy').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getInternasHoy');
    expect(getInternasHoy).toHaveBeenCalledTimes(1);
  });

  it('GET /:id pasa el id', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/internas/3').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('3');
    const call = getInterna.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '3' });
  });

  it('PUT /porteria aplica validateDateMiddleware', async () => {
    const app = buildApp();
    const res = await request(app)
      .put('/api/internas/porteria')
      .set('x-token', 'token')
      .send({ fechaEntrada: '2025-01-05' });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updatePorteriaInterna');
    expect(res.body.validated).toEqual(['fechaEntrada']);
  });

  it('PUT /buscar_interna aplica validateDateMiddleware en rango', async () => {
    const app = buildApp();
    const res = await request(app)
      .put('/api/internas/buscar_interna')
      .set('x-token', 'token')
      .send({ fechaSalida: '2025-01-05', fechaSalida2: '2025-01-06' });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('consultaInterna');
    expect(res.body.validated).toEqual(['fechaSalida', 'fechaSalida2']);
  });

  it('PUT /:id aplica validateDateMiddleware en updateInternas', async () => {
    const app = buildApp();
    const payload = { fechaEntrada: '2025-01-05', fechaSalida: '2025-01-06' };
    const res = await request(app)
      .put('/api/internas/8')
      .set('x-token', 'token')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('updateInternas');
    expect(res.body.id).toBe('8');
    expect(res.body.validated).toEqual(['fechaEntrada', 'fechaSalida']);
  });
});