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

const setExterna = jest.fn((req: any, res: any) => res.status(201).json({ ok: true, route: 'setExterna', body: req.body }));
const getExternasHoy = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getExternasHoy' }));
const getExterna = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'getExterna', id: req.params.id }));
const buscarExterna = jest.fn((req: any, res: any) => res.status(200).json({ ok: true, route: 'buscarExterna', validated: req.__validatedFields }));

jest.mock('../../controladores/externas', () => ({
  setExterna,
  getExternasHoy,
  getExterna,
  updatePorteriaExterna: jest.fn(),
  deleteExterna: jest.fn(),
  buscarExterna,
  getExternaPorteria: jest.fn(),
  updateExternas: jest.fn(),
  getExternaByNombreConductor: jest.fn(),
}));

import externasRouter from '../externas';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/externas', externasRouter);
  return app;
};

describe('Router /api/externas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /new_externa llama setExterna', async () => {
    const app = buildApp();
    const payload = { nombrePersona: 'Ana' };
    const res = await request(app).post('/api/externas/new_externa').set('x-token', 'token').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.route).toBe('setExterna');
    expect(setExterna).toHaveBeenCalledTimes(1);
  });

  it('GET /externas_hoy llama getExternasHoy', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/externas/externas_hoy').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getExternasHoy');
    expect(getExternasHoy).toHaveBeenCalledTimes(1);
  });

  it('GET /:id pasa el id al controlador', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/externas/9').set('x-token', 'token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('9');
    const call = getExterna.mock.calls[0]?.[0];
    expect(call.params).toEqual({ id: '9' });
  });

  it('PUT /buscar_externa aplica validateDateMiddleware', async () => {
    const app = buildApp();
    const payload = { fechaEntrada: '2025-01-05', fechaEntrada2: '2025-01-06' };
    const res = await request(app).put('/api/externas/buscar_externa').set('x-token', 'token').send(payload);

    expect(res.status).toBe(200);
    expect(res.body.route).toBe('buscarExterna');
    expect(res.body.validated).toEqual(['fechaEntrada', 'fechaEntrada2']);
  });
});