import request from 'supertest';
import express from 'express';

// Crear una app simple para pruebas (sin conectar a BD)
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Ruta de prueba: health check
  app.get('/api/ping', (_req, res) => {
    res.status(200).send('pong');
  });

  // Ruta de prueba: obtener usuario (sin autenticación por ahora)
  app.get('/api/test-user/:id', (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }
    return res.status(200).json({ ok: true, id: Number(id), name: 'Test User' });
  });

  // Ruta POST: crear algo
  app.post('/api/test-create', (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos' });
    }
    
    return res.status(201).json({ ok: true, id: 1, name, email });
  });

  return app;
};

describe('API REST - Tests de Integración', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/ping', () => {
    it('debería retornar "pong" y status 200', async () => {
      const response = await request(app)
        .get('/api/ping')
        .expect(200);

      expect(response.text).toBe('pong');
    });
  });

  describe('GET /api/test-user/:id', () => {
    it('debería retornar un usuario con ID válido', async () => {
      const response = await request(app)
        .get('/api/test-user/123')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('id', 123);
      expect(response.body).toHaveProperty('name');
    });

    it('debería retornar error 400 con ID inválido', async () => {
      const response = await request(app)
        .get('/api/test-user/abc')
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.mensaje).toContain('inválido');
    });

    it('debería retornar 404 sin ID', async () => {
      await request(app)
        .get('/api/test-user/')
        .expect(404); // 404 porque la ruta no existe sin ID
    });
  });

  describe('POST /api/test-create', () => {
    it('debería crear un recurso con datos válidos', async () => {
      const response = await request(app)
        .post('/api/test-create')
        .send({ name: 'Juan', email: 'juan@example.com' })
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.name).toBe('Juan');
      expect(response.body.email).toBe('juan@example.com');
      expect(response.body).toHaveProperty('id');
    });

    it('debería retornar error 400 sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/test-create')
        .send({ name: 'Juan' }) // Falta email
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.mensaje).toContain('Faltan campos');
    });

    it('debería retornar error 400 con body vacío', async () => {
      const response = await request(app)
        .post('/api/test-create')
        .send({})
        .expect(400);

      expect(response.body.ok).toBe(false);
    });
  });

  describe('Rutas inexistentes', () => {
    it('debería retornar 404 para rutas que no existen', async () => {
      await request(app)
        .get('/api/ruta-inexistente')
        .expect(404);
    });
  });
});
