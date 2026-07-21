import { Request, Response } from 'express';
import { comprobarJWT } from '../helpers/jwt';
import { Entrada } from '../models/entrada';

// Importar pool de conexión (CommonJS)
const pool = require('../database/conexion');

interface PgError extends Error {
    code?: string;
}

// Tipos locales para respuestas API
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    entradas?: T[];
    entrada?: T;
    id?: number;
}

/**
 * @description Esta consulta combina dos condiciones con un OR:
 *              1. Vehículos que entraron recientemente (en las últimas 12 horas).
 *              2. Vehículos que entraron en cualquier momento y todavía no han salido.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con el resultado
 */
const getEntradas = async (_req: Request, res: Response): Promise<void> => {
    try {
        const query: string = `
            SELECT * 
            FROM entradas_vehiculos 
            WHERE 
                -- Condición 1: Entradas recientes (cubre el turno actual)
                fecha_entrada >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '12 hours')
                
                OR
                
                -- Condición 2: Vehículos que siguen dentro (sin fecha de salida)
                fecha_salida IS NULL
            ORDER BY fecha_entrada DESC
        `;
        const entradas = await pool.query(query);
        res.json({
            ok: true,
            cantidad: entradas.rowCount,
            entradas: entradas.rows
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener las entradas'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene entradas de vehículos filtradas por varios criterios con paginación.
 * @param {Request} req - El objeto de solicitud de Express, con filtros en el body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con entradas filtradas
 */
const getEntradasSelect = async (req: Request, res: Response): Promise<void> => {
    try {
        let {
            nombre_conductor,
            empresa,
            matricula,
            clase_carga,
            fecha_entrada1,
            fecha_entrada2,
            limit = 100,
            offset = 0
        } = req.body;

        // El campo fecha_entrada1 es obligatorio para realizar la búsqueda.
        if (!fecha_entrada1 || fecha_entrada1.trim() === '') {
            res.status(400).json({
                ok: false,
                mensaje: 'El campo fecha_entrada1 es obligatorio para la búsqueda.'
            } as ApiResponse);
            return;
        }

        // Si fecha_entrada2 no se proporciona, se usará la fecha y hora actual.
        if (!fecha_entrada2 || fecha_entrada2.trim() === '') {
            const hoy = await pool.query('select now()');
            fecha_entrada2 = hoy.rows[0].now;
        }

        let query: string = `SELECT * FROM entradas_vehiculos WHERE 1=1`;
        const params: any[] = [];
        let paramIndex: number = 1;

        if (nombre_conductor && nombre_conductor.trim() !== '') {
            query += ` AND nombre_conductor ILIKE $${paramIndex++}`;
            params.push(`%${nombre_conductor.trim()}%`);
        }

        if (empresa && empresa.trim() !== '') {
            query += ` AND empresa ILIKE $${paramIndex++}`;
            params.push(`%${empresa.trim()}%`);
        }

        if (matricula && matricula.trim() !== '') {
            query += ` AND matricula ILIKE $${paramIndex++}`;
            params.push(`%${matricula.trim()}%`);
        }

        if (clase_carga && clase_carga.trim() !== '') {
            query += ` AND (clase_carga IS NULL OR clase_carga ILIKE $${paramIndex++})`;
            params.push(`%${clase_carga.trim()}%`);
        }

        query += ` AND fecha_entrada BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(fecha_entrada1, fecha_entrada2);

        query += ` ORDER BY fecha_entrada DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const entradas0 = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: entradas0.rowCount,
            entradas: entradas0.rows
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado en la selección de entradas.'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene las entradas de vehículos que no han sido validadas por recepción (almacén).
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con entradas del almacén
 */
const getEntradasAlmacen = async (_req: Request, res: Response): Promise<void> => {
    try {
        const entradasA = await pool.query(
            'select * from entradas_vehiculos where recepcion = false ORDER BY fecha_entrada ASC'
        );
        res.json({
            ok: true,
            cantidad: entradasA.rowCount,
            entradas: entradasA.rows
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener entradas de almacén'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene las entradas de vehículos que han sido validadas por recepción pero no por vigilancia (portería).
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con entradas de portería
 */
const getEntradasPorteria = async (_req: Request, res: Response): Promise<void> => {
    try {
        const entradasP = await pool.query(
            'select * from entradas_vehiculos where recepcion = true and vigilancia = false'
        );
        res.json({
            ok: true,
            cantidad: entradasP.rowCount,
            entradas: entradasP.rows
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener entradas de portería'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene una entrada de vehículo por su ID.
 * @param {Request} req - El objeto de solicitud de Express, con el ID en los parámetros de la ruta.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con la entrada encontrada
 */
const getEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        const resultado = await pool.query(
            'SELECT * FROM entradas_vehiculos WHERE id = $1 ORDER BY fecha_entrada ASC',
            [id]
        );

        if (resultado.rowCount === 0) {
            res.json({
                id,
                mensaje: `entrada con id ${id} no se encuentra`
            } as ApiResponse);
        } else {
            res.json({
                ok: true,
                entrada: resultado.rows[0]
            } as ApiResponse);
        }
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener la entrada'
        } as ApiResponse);
    }
};

/**
 * @description Crea una nueva entrada de vehículo.
 * @param {Request} req - El objeto de solicitud de Express con datos en el body y x-token en headers.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con la entrada creada
 */
const setEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        if (!token) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { nombre_conductor, firma, empresa, matricula, clase_carga, fecha_entrada } = req.body;

        if (
            nombre_conductor == null ||
            firma == null ||
            empresa == null ||
            matricula == null ||
            clase_carga == null ||
            fecha_entrada == null
        ) {
            res.status(400).json({
                ok: false,
                mensaje: 'Datos enviados nulos o incompletos'
            } as ApiResponse);
            return;
        }

        const insertResult = await pool.query(
            'INSERT INTO entradas_vehiculos (nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, firma, usuario) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, firma',
            [nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, firma, usuarioId]
        );

        const created = insertResult.rows[0];
        const entrada1 = new Entrada(
            created.id,
            created.nombre_conductor,
            created.empresa,
            created.matricula,
            created.clase_carga,
            created.fecha_entrada,
            created.firma
        );

        res.status(200).json({
            ok: true,
            entrada: entrada1
        } as ApiResponse);

    } catch (error) {
        const pgError = error as PgError;
        console.log(pgError.stack);

        if (pgError.code === '23505') {
            res.status(409).json({
                ok: false,
                mensaje: 'Entrada duplicada: ya existe un registro con la misma firma y fecha_entrada.'
            } as ApiResponse);
            return;
        }

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la entrada'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza el estado de recepción de una entrada de vehículo.
 * @param {Request} req - El objeto de solicitud de Express con id y recepcion en el body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON confirmando la actualización
 */
const updateRecepcionEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        if (!token) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { id, recepcion } = req.body;

        if (id === undefined || recepcion === undefined) {
            res.status(400).json({
                ok: false,
                mensaje: 'Los campos id y recepcion son obligatorios.'
            } as ApiResponse);
            return;
        }

        const existe_id = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            } as ApiResponse);
            return;
        }

        await pool.query('UPDATE entradas_vehiculos SET recepcion = $1, usuario = $2 WHERE id = $3', [recepcion, usuarioId, id]);

        res.json({
            ok: true,
            mensaje: 'El estado de recepción de la entrada ha sido actualizado correctamente.'
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada.'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza el estado de vigilancia (salida) de una entrada de vehículo.
 * @param {Request} req - El objeto de solicitud de Express con id, vigilancia y fecha en el body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON confirmando la actualización
 */
const updatePorteriaEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        if (!token) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { id, vigilancia, fecha } = req.body;

        if (id === undefined || vigilancia === undefined || fecha === undefined) {
            res.status(400).json({
                ok: false,
                mensaje: 'Los campos id, vigilancia y fecha son obligatorios.'
            } as ApiResponse);
            return;
        }

        const existe_id = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            } as ApiResponse);
            return;
        }

        await pool.query('UPDATE entradas_vehiculos SET vigilancia = $1, fecha_salida = $2, usuario = $3 WHERE id = $4', [vigilancia, fecha, usuarioId, id]);

        res.json({
            ok: true,
            mensaje: 'El estado de portería de la entrada ha sido actualizado correctamente.'
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada de portería.'
        } as ApiResponse);
    }
};

/**
 * @description Elimina una entrada de vehículo por su ID.
 * @param {Request} req - El objeto de solicitud de Express con el ID en los parámetros.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON confirmando la eliminación
 */
const deleteEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            res.status(400).json({
                ok: false,
                mensaje: 'El ID proporcionado no es un número válido.'
            } as ApiResponse);
            return;
        }

        const existeid = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            } as ApiResponse);
            return;
        }

        const entradaEliminada = existeid.rows[0];

        await pool.query('DELETE FROM entradas_vehiculos WHERE id = $1', [id]);

        res.json({
            ok: true,
            mensaje: 'La entrada ha sido eliminada correctamente.',
            entrada: entradaEliminada
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al eliminar la entrada.'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza los datos de una entrada de vehículo por su ID.
 * @param {Request} req - El objeto de solicitud de Express con el ID en los params y datos en el body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía mensaje confirmando la actualización
 */
const updateEntradas = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        const token = req.headers['x-token'] as string | undefined;

        if (!token) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, fecha_salida } = req.body;

        const existeid = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);
        if (existeid.rowCount === 0) {
            res.json({
                id,
                mensaje: `Entrada con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        await pool.query(
            'UPDATE entradas_vehiculos SET nombre_conductor = $1, empresa = $2, matricula = $3, clase_carga = $4, fecha_entrada = $5, fecha_salida = $6, usuario = $7 WHERE id = $8',
            [nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, fecha_salida, usuarioId, id]
        );

        res.json({
            ok: true,
            mensaje: `Entrada ${id} modificada satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la entrada'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene la última entrada de un vehículo por su matrícula.
 * @param {Request} req - El objeto de solicitud de Express con la matrícula en los parámetros.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} Envía JSON con la entrada encontrada
 */
const getEntradaByMatricula = async (req: Request, res: Response): Promise<void> => {
    try {
        const { matricula } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM entradas_vehiculos WHERE matricula = $1 ORDER BY fecha_entrada DESC LIMIT 1',
            [matricula.toUpperCase()]
        );

        if (resultado.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró entrada para la matrícula ${matricula}`
            } as ApiResponse);
            return;
        }

        const entrada = resultado.rows[0];

        res.json({
            ok: true,
            entrada
        } as ApiResponse);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado, contacte al administrador.'
        } as ApiResponse);
    }
};

export {
    getEntradas,
    getEntrada,
    setEntrada,
    updateRecepcionEntrada,
    getEntradasAlmacen,
    getEntradasPorteria,
    updatePorteriaEntrada,
    getEntradasSelect,
    updateEntradas,
    deleteEntrada,
    getEntradaByMatricula
};
