import { Pool, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../helpers/logger';

// Configurar pool de conexión con variables de entorno
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
    max: parseInt(process.env.PGPOOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.PGPOOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.PGPOOL_CONN_TIMEOUT || '5000', 10),
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined
});

// Verificar conexión (log solo en error)
pool.connect()
    .then(() => logger.info('Pool PG inicializado'))
    .catch((err: Error) => logger.error({ err }, 'Error en conexión de BD'));

// Wrapper tipado para queries
const query = async <T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]): Promise<QueryResult<T>> => {
    return pool.query<T>(text, values);
};

export { pool, query };
export default { query, pool };
