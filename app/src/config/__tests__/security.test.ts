import express from 'express';
import request from 'supertest';
import { applySecurityMiddleware } from '../security';
import { globalErrorHandler, notFoundHandler } from '../../middelwares/error-handler';

const originalEnv = { ...process.env };

const buildTestApp = () => {
  const app = express();
  applySecurityMiddleware(app);
  app.get('/test', (_req, res) => res.json({ ok: true }));
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  return app;
};

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

describe('applySecurityMiddleware', () => {
  it('permite orígenes en la whitelist', async () => {
    process.env.CORS_ORIGIN = 'https://allowed.com';
    const app = buildTestApp();

    const response = await request(app)
      .get('/test')
      .set('Origin', 'https://allowed.com')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('https://allowed.com');
    expect(response.body.ok).toBe(true);
  });

  it('rechaza orígenes fuera de la whitelist con 403', async () => {
    process.env.CORS_ORIGIN = 'https://allowed.com';
    const app = buildTestApp();

    const response = await request(app)
      .get('/test')
      .set('Origin', 'https://blocked.com')
      .expect(403);

    expect(response.body.ok).toBe(false);
    expect(response.body.mensaje).toContain('CORS');
  });

  it('aplica rate limiting y retorna 429 al excederlo', async () => {
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    process.env.RATE_LIMIT_MAX = '2';
    const app = buildTestApp();

    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    const response = await request(app).get('/test');

    expect(response.status).toBe(429);
    expect(response.body.ok).toBe(false);
  });
});
