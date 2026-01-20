import { swaggerSpec } from '../swagger';

describe('Swagger config smoke', () => {
  it('usa x-token como apiKey', () => {
    const spec = swaggerSpec as any;
    const schemes = spec.components?.securitySchemes;
    expect(schemes).toBeDefined();
    expect(schemes.xTokenAuth).toMatchObject({ type: 'apiKey', in: 'header', name: 'x-token' });
  });

  it('incluye servidor de desarrollo', () => {
    const spec = swaggerSpec as any;
    const servers = spec.servers || [];
    expect(servers.some((s: any) => s.url.includes('10.192.93.0:7302') || s.url.includes('localhost'))).toBe(true);
  });

  it('expone paths principales documentados via JSDoc', () => {
    const spec = swaggerSpec as any;
    const paths = spec.paths || {};
    const pathKeys = Object.keys(paths);

    // Verificar que existen endpoints documentados para cada módulo
    expect(pathKeys.some(p => p.startsWith('/api/login'))).toBe(true);
    expect(pathKeys.some(p => p.startsWith('/api/entradas'))).toBe(true);
    expect(pathKeys.some(p => p.startsWith('/api/externas'))).toBe(true);
    expect(pathKeys.some(p => p.startsWith('/api/internas'))).toBe(true);
    expect(pathKeys.some(p => p.startsWith('/api/tornos'))).toBe(true);
    expect(pathKeys.some(p => p.startsWith('/api/users'))).toBe(true);

    // Verificar que hay un número razonable de endpoints (>30)
    expect(pathKeys.length).toBeGreaterThan(30);
  });
});
