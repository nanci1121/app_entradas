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
    tornos?: T[];
    torno?: T;
    torno_id?: number;
    usuario?: T;
    id?: number;
}

/**
 * @description Obtiene los registros de torno para una fecha específica con paginación.
 * @param {Request} req - El objeto de solicitud con parámetros de query (date, limit, offset).
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con tornos encontrados
 */
const getTornosHoy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, limit = 50, offset = 0 } = req.query;

        const dateString = (date as string) || new Date().toISOString().split('T')[0];

        const fechaInicio = new Date(`${dateString}T00:00:00.000Z`);
        const fechaFin = new Date(`${dateString}T23:59:59.999Z`);

        const params = [fechaInicio, fechaFin, limit, offset];

        const query = `
            SELECT 
                st.id, 
                st.codigo_empleado, 
                st.fecha_entrada, 
                st.fecha_salida, 
                u.name AS nombre_persona 
            FROM 
                salidas_tornos st
            LEFT JOIN 
                users u ON st.codigo_empleado = u.codigo_empleado
            WHERE 
                (st.fecha_salida >= $1 AND st.fecha_salida <= $2) OR (st.fecha_entrada >= $1 AND st.fecha_entrada <= $2)
            ORDER BY 
                st.fecha_salida DESC, st.fecha_entrada DESC
            LIMIT $3 OFFSET $4
        `;

        const tornosResult = await pool.query(query, params);

        res.json({
            ok: true,
            tornos: tornosResult.rows
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor.'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene un registro de torno específico por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con torno encontrado
 */
const getTorno = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            res.status(400).json({
                ok: false,
                mensaje: 'El ID proporcionado no es un número válido.'
            } as ApiResponse);
            return;
        }

        const resultado = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);

        if (resultado.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró ningún registro de torno con el id ${id}.`
            } as ApiResponse);
            return;
        }

        res.json({
            ok: true,
            torno: resultado.rows[0]
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al obtener el registro del torno.'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene el nombre de un empleado usando su código.
 * @param {Request} req - El objeto de solicitud con code en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con datos del usuario
 */
const getTornoCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const code: string = req.body.code;

        const resultado = await pool.query('SELECT name FROM users WHERE codigo_empleado = $1', [code]);

        if (resultado.rowCount === 0) {
            res.status(404).json({
                ok: false,
                msg: `No se encontró un empleado con el código ${code}`
            } as ApiResponse);
            return;
        }

        const usuario = {
            name: resultado.rows[0].name
        };

        res.json({
            ok: true,
            usuario
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor. Contacte al administrador.'
        } as ApiResponse);
    }
};

/**
 * @description Crea un nuevo registro de torno para un empleado.
 * @param {Request} req - El objeto de solicitud con codigoEmpleado, fechaEntrada, fechaSalida en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con ID de torno creado
 */
const setTorno = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        const [esValido, idOperador] = comprobarJWT(token || '');

        if (!esValido || !idOperador) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no válido o expirado.'
            } as ApiResponse);
            return;
        }

        const { codigoEmpleado, fechaSalida, fechaEntrada } = req.body;

        if (!codigoEmpleado || (!fechaEntrada && !fechaSalida)) {
            res.status(400).json({
                ok: false,
                mensaje: 'El código de empleado y al menos una fecha (entrada o salida) son obligatorios.'
            } as ApiResponse);
            return;
        }

        if (fechaEntrada && fechaSalida && new Date(fechaEntrada).getTime() > new Date(fechaSalida).getTime()) {
            res.status(400).json({
                ok: false,
                mensaje: 'La fecha de entrada no puede ser posterior a la fecha de salida.'
            } as ApiResponse);
            return;
        }

        const empleadoExistente = await pool.query(
            'SELECT id FROM users WHERE codigo_empleado = $1',
            [codigoEmpleado]
        );

        if (empleadoExistente.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `El código de empleado ${codigoEmpleado} no existe.`
            } as ApiResponse);
            return;
        }

        const torno = await pool.query(
            'INSERT INTO salidas_tornos (codigo_empleado, fecha_entrada, fecha_salida, usuario) VALUES ($1, $2, $3, $4) RETURNING id',
            [codigoEmpleado, fechaEntrada || null, fechaSalida || null, idOperador]
        );

        res.status(201).json({
            ok: true,
            torno_id: torno.rows[0].id,
            mensaje: 'Registro de torno creado correctamente'
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al crear el registro.'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza un registro de torno existente por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params y datos en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updateTorno = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        const token = req.headers['x-token'] as string | undefined;
        const [esValido, idOperador] = comprobarJWT(token || '');

        if (!esValido || !idOperador) {
            res.status(401).json({
                ok: false,
                mensaje: 'Token no válido o expirado.'
            } as ApiResponse);
            return;
        }

        const { codigoEmpleado, fechaEntrada, fechaSalida } = req.body;

        if (!codigoEmpleado && fechaEntrada === undefined && fechaSalida === undefined) {
            res.status(400).json({
                ok: false,
                mensaje: 'Debe proporcionar al menos un campo para actualizar.'
            } as ApiResponse);
            return;
        }

        const existe_id = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró un registro de torno con el id ${id}.`
            } as ApiResponse);
            return;
        }

        let query = 'UPDATE salidas_tornos SET ';
        const values: any[] = [];
        let paramIndex = 1;

        if (codigoEmpleado) {
            query += `codigo_empleado = $${paramIndex++}, `;
            values.push(codigoEmpleado);
        }
        if (fechaEntrada !== undefined) {
            query += `fecha_entrada = $${paramIndex++}, `;
            values.push(fechaEntrada);
        }
        if (fechaSalida !== undefined) {
            query += `fecha_salida = $${paramIndex++}, `;
            values.push(fechaSalida);
        }

        query += `usuario = $${paramIndex++} WHERE id = $${paramIndex++}`;
        values.push(idOperador, id);

        await pool.query(query, values);

        res.json({
            ok: true,
            mensaje: `Registro de torno con id ${id} actualizado correctamente.`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar el registro.'
        } as ApiResponse);
    }
};

/**
 * @description Elimina un registro de torno existente por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando eliminación
 */
const deleteTorno = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        const existeid = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró un registro de torno con el id ${id}.`
            } as ApiResponse);
            return;
        }

        await pool.query('DELETE FROM salidas_tornos where id = $1', [id]);

        res.json({
            ok: true,
            mensaje: `Registro de torno con id ${id} eliminado satisfactoriamente.`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al eliminar el registro.'
        } as ApiResponse);
    }
};

/**
 * @description Realiza una consulta de registros de torno con filtros y paginación.
 * @param {Request} req - El objeto de solicitud con filtros en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con tornos encontrados
 */
const consultaTorno = async (req: Request, res: Response): Promise<void> => {
    try {
        let { codigoEmpleado, fechaInicio, fechaFin, limit = 100, offset = 0 } = req.body;
        const params: any[] = [];

        let query = `
            SELECT t.*, u.name as nombre_persona 
            FROM salidas_tornos t
            JOIN users u ON t.codigo_empleado = u.codigo_empleado
            WHERE 1=1
        `;

        let paramIndex = 1;

        if (fechaInicio && fechaFin && new Date(fechaInicio).getTime() > new Date(fechaFin).getTime()) {
            res.status(400).json({
                ok: false,
                mensaje: 'La fecha de inicio no puede ser posterior a la fecha de fin.'
            } as ApiResponse);
            return;
        }

        if (codigoEmpleado) {
            query += ` AND t.codigo_empleado::TEXT ILIKE $${paramIndex++}::VARCHAR`;
            params.push(`%${codigoEmpleado}%`);
        }

        if (fechaInicio && fechaFin) {
            query += ` AND (t.fecha_entrada BETWEEN $${paramIndex++} AND $${paramIndex++}
                        OR t.fecha_salida BETWEEN $${paramIndex++} AND $${paramIndex++})`;
            params.push(fechaInicio, fechaFin, fechaInicio, fechaFin);
        } else if (fechaInicio) {
            query += ` AND (t.fecha_entrada >= $${paramIndex++} OR t.fecha_salida >= $${paramIndex++})`;
            params.push(fechaInicio, fechaInicio);
        } else if (fechaFin) {
            query += ` AND (t.fecha_entrada <= $${paramIndex++} OR t.fecha_salida <= $${paramIndex++})`;
            params.push(fechaFin, fechaFin);
        }

        query += ` ORDER BY t.fecha_entrada DESC, t.fecha_salida DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const tornos = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: tornos.rowCount,
            tornos: tornos.rows
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al realizar la consulta.'
        } as ApiResponse);
    }
};

export {
    setTorno,
    getTornoCode,
    getTornosHoy,
    getTorno,
    deleteTorno,
    updateTorno,
    consultaTorno
};
