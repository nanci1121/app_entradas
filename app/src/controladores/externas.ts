import { Request, Response } from 'express';
import { comprobarJWT } from '../helpers/jwt';
import { Externa } from '../models/externa';

// Importar pool de conexión (CommonJS)
const pool = require('../database/conexion');

// Tipos locales
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    cantidad?: number;
    externas?: T[];
    externa?: T;
    id?: number;
}

/**
 * @description Obtiene todas las entradas de empresas externas del día actual.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con lista de externas del día
 */
const getExternasHoy = async (_req: Request, res: Response): Promise<void> => {
    try {
        const hoy = await pool.query("select to_char(now(),'yyyy-mm-dd')");
        const dia_hoy = hoy.rows[0].to_char;

        const externas = await pool.query(
            'select * from empresas_exteriores where fecha_entrada::DATE = $1 ORDER BY fecha_entrada ASC',
            [dia_hoy]
        );

        res.json({
            ok: true,
            cantidad: externas.rowCount,
            externas: externas.rows
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener externas del día'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene las entradas de empresas externas que no han sido validadas por recepción.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con externas en portería
 */
const getExternaPorteria = async (_req: Request, res: Response): Promise<void> => {
    try {
        const externasP = await pool.query(
            'select * from empresas_exteriores where recepcion = false ORDER BY fecha_entrada ASC'
        );

        res.json({
            ok: true,
            cantidad: externasP.rowCount,
            externas: externasP.rows
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener externas de portería'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene una entrada de empresa externa por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con externa encontrada
 */
const getExterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        const resultado = await pool.query(
            'SELECT * FROM empresas_exteriores WHERE id = $1 ORDER BY fecha_entrada ASC',
            [id]
        );

        if (resultado.rowCount === 0) {
            res.json({
                id,
                mensaje: `persona externa con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        res.json({
            ok: true,
            externa: resultado.rows[0]
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener externa'
        } as ApiResponse);
    }
};

/**
 * @description Crea una nueva entrada de empresa externa.
 * @param {Request} req - El objeto de solicitud con datos en body y x-token en headers.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con ID de externa creada
 */
const setExterna = async (req: Request, res: Response): Promise<void> => {
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

        const nuevaExterna = Externa.fromRequest(req.body);

        if (
            !nuevaExterna.nombrePersona ||
            !nuevaExterna.empresaExterior ||
            !nuevaExterna.peticionario ||
            !nuevaExterna.telefonoPersona ||
            !nuevaExterna.firma ||
            !nuevaExterna.fechaEntrada
        ) {
            res.status(400).json({
                ok: false,
                mensaje: 'Datos de persona exterior incompletos'
            } as ApiResponse);
            return;
        }

        const insertQuery = `
            INSERT INTO empresas_exteriores 
            (nombre_persona, empresa_exterior, peticionario, telefono_persona, firma, fecha_entrada, fecha_salida, nota, usuario)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id;
        `;

        const params = [
            nuevaExterna.nombrePersona,
            nuevaExterna.empresaExterior,
            nuevaExterna.peticionario,
            nuevaExterna.telefonoPersona,
            nuevaExterna.firma,
            nuevaExterna.fechaEntrada,
            null,
            nuevaExterna.nota,
            usuarioId
        ];

        const result = await pool.query(insertQuery, params);

        res.status(201).json({
            ok: true,
            externa: result.rows[0].id
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al guardar la externa'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza el estado de recepción de una entrada de empresa externa.
 * @param {Request} req - El objeto de solicitud con id, fechaSalida, recepcion en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updatePorteriaExterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers['x-token'] as string | undefined;
        const [valid, usuarioId] = comprobarJWT(token || '');
        const { id, fechaSalida, recepcion } = req.body;

        // Validar que vengan los campos necesarios
        if (!id) {
            res.status(400).json({
                ok: false,
                mensaje: 'El campo id es obligatorio'
            } as ApiResponse);
            return;
        }

        if (recepcion === undefined || recepcion === null) {
            res.status(400).json({
                ok: false,
                mensaje: 'El campo recepcion es obligatorio'
            } as ApiResponse);
            return;
        }

        // Verificar que la externa existe
        const existe_id = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `Empresa exterior con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        // Actualizar la externa
        const updateQuery = 'UPDATE empresas_exteriores SET recepcion = $1, fecha_salida = $2, usuario = $3 WHERE id = $4';
        const result = await pool.query(updateQuery, [recepcion, fechaSalida, usuarioId, id]);

        // Verificar que la actualización se realizó
        if (result.rowCount === 0) {
            res.status(500).json({
                ok: false,
                mensaje: 'No se pudo actualizar la entrada'
            } as ApiResponse);
            return;
        }

        // Obtener el registro actualizado para verificar
        const registroActualizado = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);
        
        console.log('[DEBUG] Externa actualizada:', {
            id,
            recepcion,
            fechaSalida,
            fechaSalidaGuardada: registroActualizado.rows[0].fecha_salida
        });

        res.status(200).json({
            ok: true,
            mensaje: 'Entrada de portería actualizada satisfactoriamente',
            externa: registroActualizado.rows[0]
        } as ApiResponse);
    } catch (error) {
        console.log('[ERROR] updatePorteriaExterna:', (error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada de portería'
        } as ApiResponse);
    }
};

/**
 * @description Elimina una entrada de empresa externa por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando eliminación
 */
const deleteExterna = async (req: Request, res: Response): Promise<void> => {
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

        const existeid = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.json({
                id,
                mensaje: `Persona externa con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        await pool.query('DELETE FROM empresas_exteriores where id = $1', [id]);

        res.json({
            ok: true,
            mensaje: `Persona externa ${id} eliminada satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar externa'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene entradas de empresas externas filtradas por criterios con paginación.
 * @param {Request} req - El objeto de solicitud con filtros en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con externas filtradas
 */
const buscarExterna = async (req: Request, res: Response): Promise<void> => {
    try {
        const criterios = Externa.fromRequest(req.body);
        let { limit = 100, offset = 0 } = req.body;

        if (!criterios.fechaEntrada || criterios.fechaEntrada.toString().trim() === '') {
            res.status(400).json({
                ok: false,
                mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.'
            } as ApiResponse);
            return;
        }

        let fechaEntrada2 = criterios.fechaSalida;
        if (!fechaEntrada2 || fechaEntrada2.toString().trim() === '') {
            const hoy = await pool.query('select now()');
            fechaEntrada2 = hoy.rows[0].now;
        }

        let query = 'SELECT * FROM empresas_exteriores WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (criterios.nombrePersona && criterios.nombrePersona.trim() !== '') {
            query += ` AND nombre_persona ILIKE $${paramIndex++}`;
            params.push(`%${criterios.nombrePersona.trim()}%`);
        }

        if (criterios.empresaExterior && criterios.empresaExterior.trim() !== '') {
            query += ` AND empresa_exterior ILIKE $${paramIndex++}`;
            params.push(`%${criterios.empresaExterior.trim()}%`);
        }

        if (criterios.peticionario && criterios.peticionario.trim() !== '') {
            query += ` AND peticionario ILIKE $${paramIndex++}`;
            params.push(`%${criterios.peticionario.trim()}%`);
        }

        if (criterios.telefonoPersona && criterios.telefonoPersona.trim() !== '') {
            query += ` AND telefono_persona ILIKE $${paramIndex++}`;
            params.push(`%${criterios.telefonoPersona.trim()}%`);
        }

        query += ` AND fecha_entrada BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(criterios.fechaEntrada, fechaEntrada2);

        query += ` ORDER BY fecha_entrada DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const externas = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: externas.rowCount,
            externas: externas.rows
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado en la selección de externas.'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza los datos de una entrada de empresa externa por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params y datos en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updateExternas = async (req: Request, res: Response): Promise<void> => {
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

        const externaToUpdate = Externa.fromRequest(req.body);

        const existeid = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `Empresa exterior con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        const query = `
            UPDATE empresas_exteriores 
            SET nombre_persona = $1, empresa_exterior = $2, peticionario = $3, 
                telefono_persona = $4, fecha_entrada = $5, nota = $6, fecha_salida = $7, 
                usuario = $8, recepcion = $9 
            WHERE id = $10
        `;

        const params = [
            externaToUpdate.nombrePersona,
            externaToUpdate.empresaExterior,
            externaToUpdate.peticionario,
            externaToUpdate.telefonoPersona,
            externaToUpdate.fechaEntrada,
            externaToUpdate.nota,
            externaToUpdate.fechaSalida,
            usuarioId,
            externaToUpdate.recepcion,
            id
        ];

        await pool.query(query, params);

        res.status(200).json({
            ok: true,
            mensaje: `Empresa exterior con id: ${id} modificada satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al modificar la externa'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene la última entrada de una empresa externa por nombre de conductor.
 * @param {Request} req - El objeto de solicitud con nombreConductor en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con externa encontrada
 */
const getExternaByNombreConductor = async (req: Request, res: Response): Promise<void> => {
    try {
        const nombreConductor: string = req.params.nombreConductor;

        const externas = await pool.query(
            'select * from empresas_exteriores where nombre_persona ILIKE $1 ORDER BY fecha_entrada DESC LIMIT 1',
            [`%${nombreConductor}%`]
        );

        if (externas.rowCount === 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontraron entradas para el conductor: ${nombreConductor}`
            } as ApiResponse);
            return;
        }

        res.json({
            ok: true,
            externa: externas.rows[0]
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al buscar la última entrada.'
        } as ApiResponse);
    }
};

export {
    setExterna,
    getExternaPorteria,
    getExternasHoy,
    getExterna,
    updatePorteriaExterna,
    deleteExterna,
    buscarExterna,
    updateExternas,
    getExternaByNombreConductor
};
