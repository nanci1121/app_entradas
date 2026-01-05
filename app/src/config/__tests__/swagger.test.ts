import { swaggerSpec } from '../swagger';

describe('Swagger config smoke', () => {
  it('usa x-token como apiKey', () => {
    const spec = swaggerSpec as any;
    const schemes = spec.components?.securitySchemes;
    expect(schemes).toBeDefined();
    expect(schemes.xTokenAuth).toMatchObject({ type: 'apiKey', in: 'header', name: 'x-token' });
  });

  it('incluye servidor local http://localhost:3000', () => {
    const spec = swaggerSpec as any;
    const servers = spec.servers || [];
    expect(servers.some((s: any) => s.url === 'http://localhost:3000')).toBe(true);
  });

  it('expone paths principales', () => {
    const spec = swaggerSpec as any;
    const paths = spec.paths || {};
    ['/api/login', '/api/entradas', '/api/externas', '/api/internas', '/api/tornos'].forEach((p) => {
      expect(paths).toHaveProperty(p);
    });
  });
});
