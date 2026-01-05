import { Request, Response } from 'express';
import { comprobarJWT } from '../helpers/jwt';

// Importar pool de conexión (CommonJS)
const pool = require('../database/conexion');

// Tipos locales
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    msg?: string;
    cantidad?: number;
    internas?: T[];
    interna?: T;
    usuario?: T;
    id?: number;
}

/**
 * @description Obtiene todas las salidas de empleados del día actual.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con salidas del día
 */
const getInternasHoy = async (_req: Request, res: Response): Promise<void> => {
    try {
        const query = `
            SELECT * 
            FROM salidas_empleados 
            WHERE fecha_salida::DATE = NOW()::DATE 
            ORDER BY fecha_salida ASC
        `;

        const internas = await pool.query(query);

        res.status(200).json({
            ok: true,
            cantidad: internas.rowCount,
            internas: internas.rows
        } as ApiResponse);

    } catch (error) {
        console.log('Error en getInternasHoy:', (error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor. Por favor, contacte al administrador.'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene una salida de empleado por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con interna encontrada
 */
const getInterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        const resultado = await pool.query(
            'SELECT * FROM salidas_empleados WHERE id = $1 ORDER BY fecha_entrada ASC',
            [id]
        );

        if (resultado.rowCount === 0) {
            res.json({
                id,
                mensaje: `empleado con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        res.json({
            ok: true,
            interna: resultado.rows[0]
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener interna'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene un usuario por su código de empleado.
 * @param {Request} req - El objeto de solicitud con code en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con datos del usuario
 */
const getInternaCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const code: string = req.body.code;

        const resultado = await pool.query('SELECT * FROM users WHERE codigo_empleado = $1', [code]);

        if (resultado.rowCount === 0) {
            res.status(400).json({
                ok: false,
                codigo_empleado: code,
                mensaje: `empleado con codigo empleado ${code} no se encuentra`
            } as ApiResponse);
            return;
        }

        res.json({
            usuario: resultado.rows[0]
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener código'
        } as ApiResponse);
    }
};

/**
 * @description Crea una nueva salida de empleado.
 * @param {Request} req - El objeto de solicitud con datos en body y x-token en headers.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con ID de interna creada
 */
const setInterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        if (!token) {
            res.status(401).json({
                ok: false,
                msg: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                msg: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { codigoEmpleado, nombrePersona, fechaSalida, motivo } = req.body;
        const fechaEntrada = null;

        if (!codigoEmpleado || !nombrePersona || !fechaSalida) {
            res.status(400).json({
                ok: false,
                entrada: 'datos empleado enviados nulos'
            } as ApiResponse);
            return;
        }

        await pool.query(
            'INSERT INTO salidas_empleados (codigo_empleado, nombre_persona, fecha_entrada, fecha_salida, motivo, usuario) VALUES ($1, $2, $3, $4, $5, $6)',
            [codigoEmpleado, nombrePersona, fechaEntrada, fechaSalida, motivo, usuarioId]
        );

        const interna = await pool.query(
            'SELECT * FROM salidas_empleados WHERE codigo_empleado = $1 and fecha_salida = $2 ORDER BY fecha_salida ASC',
            [codigoEmpleado, fechaSalida]
        );

        res.status(200).json({
            ok: true,
            interna: interna.rows[0].id
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear interna'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza la fecha de entrada de una salida de empleado (portería).
 * @param {Request} req - El objeto de solicitud con id y fechaEntrada en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updatePorteriaInterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        if (!token) {
            res.status(401).json({
                ok: false,
                msg: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                msg: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const { id, fechaEntrada } = req.body;

        const existe_id = await pool.query('SELECT * FROM salidas_empleados WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            res.status(404).json({
                ok: false,
                msg: `No se encontró interna con id ${id}`
            } as ApiResponse);
            return;
        }

        await pool.query(
            'UPDATE salidas_empleados SET fecha_salida = $1, usuario = $2 WHERE id = $3',
            [fechaEntrada, usuarioId, id]
        );

        res.json({
            ok: true,
            mensaje: 'Entrada empleado actualizada correctamente'
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar portería'
        } as ApiResponse);
    }
};

/**
 * @description Elimina una salida de empleado por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando eliminación
 */
const deleteInterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        const token = req.headers['x-token'] as string | undefined;

        if (!token) {
            res.status(401).json({
                ok: false,
                msg: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                msg: 'Token inválido'
            } as ApiResponse);
            return;
        }

        const existeid = await pool.query('SELECT * FROM salidas_empleados WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.json({
                id,
                mensaje: `Persona interna con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        await pool.query('DELETE FROM salidas_empleados where id = $1', [id]);

        res.json({
            ok: true,
            mensaje: `Salida empleado ${id} eliminada satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar interna'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene salidas de empleados filtradas por criterios con paginación.
 * @param {Request} req - El objeto de solicitud con filtros en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con internas filtradas
 */
const consultaInterna = async (req: Request, res: Response): Promise<void> => {
    try {
        let {
            codigo_empleado,
            nombre_persona,
            fecha_entrada,
            fecha_entrada2,
            motivo,
            limit = 100,
            offset = 0
        } = req.body;

        if (!fecha_entrada || fecha_entrada.toString().trim() === '') {
            res.status(400).json({
                ok: false,
                mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.'
            } as ApiResponse);
            return;
        }

        if (!fecha_entrada2 || fecha_entrada2.toString().trim() === '') {
            const hoy = await pool.query(
                "SELECT TO_CHAR(date_trunc('minute', current_timestamp), 'YYYY-MM-DD HH24:MI') AS fecha"
            );
            fecha_entrada2 = hoy.rows[0].fecha;
        }

        let query = 'SELECT * FROM salidas_empleados WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (codigo_empleado && codigo_empleado.trim() !== '') {
            query += ` AND codigo_empleado ILIKE $${paramIndex++}`;
            params.push(`%${codigo_empleado.trim()}%`);
        }

        if (nombre_persona && nombre_persona.trim() !== '') {
            query += ` AND nombre_persona ILIKE $${paramIndex++}`;
            params.push(`%${nombre_persona.trim()}%`);
        }

        if (motivo && motivo.trim() !== '') {
            query += ` AND motivo ILIKE $${paramIndex++}`;
            params.push(`%${motivo.trim()}%`);
        }

        query += ` AND fecha_salida BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(fecha_entrada, fecha_entrada2);

        query += ` ORDER BY fecha_salida DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const internas = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: internas.rowCount ?? 0,
            internas: internas.rows ?? []
        } as ApiResponse);

    } catch (error) {
        console.error('Error en consultaInterna:', (error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza los datos de una salida de empleado por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params y datos en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updateInternas = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        const token = req.headers['x-token'] as string | undefined;

        if (!token) {
            res.status(401).json({
                ok: false,
                msg: 'Token no proporcionado'
            } as ApiResponse);
            return;
        }

        const [valid, usuarioId] = comprobarJWT(token);
        if (!valid || !usuarioId) {
            res.status(401).json({
                ok: false,
                msg: 'Token inválido'
            } as ApiResponse);
            return;
        }

        let { codigo_empleado, nombre_persona, fecha_entrada, fecha_salida, motivo } = req.body;

        fecha_entrada = fecha_entrada || null;
        fecha_salida = fecha_salida || null;

        const existeid = await pool.query('SELECT 1 FROM salidas_empleados WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No existe registro con id ${id}`
            } as ApiResponse);
            return;
        }

        await pool.query(
            `UPDATE salidas_empleados
             SET codigo_empleado = $1, nombre_persona = $2, fecha_salida = $3, motivo = $4, fecha_entrada = $5, usuario = $6
             WHERE id = $7`,
            [codigo_empleado, nombre_persona, fecha_salida, motivo, fecha_entrada, usuarioId, id]
        );

        res.json({
            ok: true,
            mensaje: `Registro ${id} modificado satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.error('Error en updateInternas:', (error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        } as ApiResponse);
    }
};

export {
    setInterna,
    getInternaCode,
    getInternasHoy,
    getInterna,
    updatePorteriaInterna,
    deleteInterna,
    consultaInterna,
    updateInternas
};
