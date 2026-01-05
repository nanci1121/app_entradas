import { Pool } from 'pg';

jest.mock('pg', () => {
  const connect = jest.fn(() => Promise.resolve());
  const query = jest.fn();
  const mockPool = jest.fn(() => ({ connect, query }));
  return { __esModule: true, Pool: mockPool, __connect: connect, __query: query };
});

describe('conexion.ts', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      PGUSER: 'u', PGHOST: 'h', PGDATABASE: 'd', PGPASSWORD: 'p', PGPORT: '6543',
      PGPOOL_MAX: '10', PGPOOL_IDLE_TIMEOUT: '30000', PGPOOL_CONN_TIMEOUT: '5000'
    };
    const pgMock = jest.requireMock('pg');
    (pgMock.Pool as jest.Mock).mockClear();
    (pgMock.__connect as jest.Mock).mockClear();
    (pgMock.__query as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('crea Pool con variables de entorno y llama connect', async () => {
    const pgMock = jest.requireMock('pg');
    const connect = pgMock.__connect as jest.Mock;
    const query = pgMock.__query as jest.Mock;
    const { pool } = require('../conexion');

    expect(pgMock.Pool as jest.Mock).toHaveBeenCalledWith({
      user: 'u',
      host: 'h',
      database: 'd',
      password: 'p',
      port: 6543,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: undefined,
    });

    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).toBeDefined();
  });

  it('expone wrapper query que delega en pool.query', async () => {
    const pgMock = jest.requireMock('pg');
    const query = pgMock.__query as jest.Mock;
    const { query: wrapperQuery } = require('../conexion');
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const result = await wrapperQuery('SELECT 1');

    expect(query).toHaveBeenCalledWith('SELECT 1', undefined);
    expect(result.rows[0]).toEqual({ id: 1 });
  });
});
