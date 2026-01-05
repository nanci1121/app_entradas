import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generarJWT } from '../helpers/jwt';
import { Usuario } from '../models/usuario';

// Importar pool de conexión (CommonJS)
const pool = require('../database/conexion');

// Tipos locales
interface ApiResponse<T = any> {
    ok: boolean;
    mensaje?: string;
    msg?: string;
    usuarios?: T[];
    usuario?: T;
    token?: string;
    email?: string;
    id?: number;
}

/**
 * @description Obtiene todos los usuarios de la base de datos.
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con lista de usuarios
 */
const todosUsuarios = async (_req: Request, res: Response): Promise<void> => {
    try {
        const resultados = await pool.query('select * from users order by id');
        res.json({
            ok: true,
            usuarios: resultados.rows
        } as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener usuarios'
        } as ApiResponse);
    }
};

/**
 * @description Obtiene un usuario específico por su ID.
 * @param {Request} req - El objeto de solicitud de Express con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con datos del usuario
 */
const usuarioId = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        console.log('el id del usuario es:', id);

        const resultados = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (resultados.rowCount === 0) {
            res.json({
                id,
                mensaje: `usuario con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        res.json(resultados.rows[0] as ApiResponse);
    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al obtener usuario'
        } as ApiResponse);
    }
};

/**
 * @description Autentica un usuario con email y password, retorna JWT.
 * @param {Request} req - El objeto de solicitud con email y password en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con usuario autenticado y token JWT
 */
const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const resultados = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (resultados.rowCount === 0) {
            res.status(404).json({
                ok: false,
                email,
                msg: `usuario con email ${email} no se encuentra`
            } as ApiResponse);
            return;
        }

        // Validar password con bcrypt
        const validPassword = bcrypt.compareSync(password, resultados.rows[0].password);
        if (!validPassword) {
            res.status(401).json({
                ok: false,
                email,
                msg: 'la contraseña no es válida'
            } as ApiResponse);
            return;
        }

        // Crear usuario y generar token
        const user = new Usuario(
            resultados.rows[0].id,
            resultados.rows[0].name,
            resultados.rows[0].email,
            resultados.rows[0].password,
            resultados.rows[0].online,
            resultados.rows[0].type,
            resultados.rows[0].codigo_empleado
        );

        const token = await generarJWT(resultados.rows[0].id);

        res.status(200).json({
            ok: true,
            usuario: user,
            token
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        } as ApiResponse);
    }
};

/**
 * @description Crea un nuevo usuario con email, nombre y contraseña.
 * @param {Request} req - El objeto de solicitud con datos de usuario en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con usuario creado y token JWT
 */
const createUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, type = 'user', codigo_empleado } = req.body;

        // Verificar si email ya existe
        const existemail = await pool.query('SELECT email FROM users WHERE email = $1', [email]);

        if (existemail.rowCount > 0) {
            res.status(400).json({
                ok: false,
                email,
                msg: `Usuario con email: ${email} ya existe no se puede insertar`
            } as ApiResponse);
            return;
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        const password_enc = bcrypt.hashSync(password, salt);

        // Insertar usuario
        await pool.query(
            'INSERT INTO users (name, email, password, type, codigo_empleado) VALUES ($1, $2, $3, $4, $5)',
            [name, email, password_enc, type, codigo_empleado]
        );

        // Obtener usuario creado
        const id = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        const user = new Usuario(id.rows[0].id, name, email, password_enc, false, type, codigo_empleado);

        // Generar token
        const token = await generarJWT(id.rows[0].id);

        res.status(200).json({
            ok: true,
            usuario: user,
            token
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear usuario'
        } as ApiResponse);
    }
};

/**
 * @description Actualiza datos de un usuario existente.
 * @param {Request} req - El objeto de solicitud con ID en params y datos en body.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando actualización
 */
const updateUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);
        const { name, email, password, type, codigo_empleado } = req.body;

        console.log('este es el codigo de empleado', codigo_empleado);

        // Verificar que usuario existe
        const existeid = await pool.query('SELECT id FROM users WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.json({
                id,
                mensaje: `usuario con id ${id} no existe`
            } as ApiResponse);
            return;
        }

        // Verificar que email no esté en uso por otro usuario
        const existemail = await pool.query('SELECT id FROM users WHERE email = $1 and id <> $2', [email, id]);

        if (existemail.rowCount > 0) {
            res.json({
                id,
                mensaje: `usuario con este email ${email} ya existe con id: ${existemail.rows[0].id}`
            } as ApiResponse);
            return;
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        const password_enc = bcrypt.hashSync(password, salt);

        // Actualizar usuario
        await pool.query(
            'UPDATE users SET name = $1, email = $2, password = $3, type = $4, codigo_empleado = $5 WHERE id = $6',
            [name, email, password_enc, type, codigo_empleado, id]
        );

        res.json({
            ok: true,
            mensaje: 'Usuario actualizado correctamente'
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al actualizar usuario'
        } as ApiResponse);
    }
};

/**
 * @description Elimina un usuario por su ID.
 * @param {Request} req - El objeto de solicitud con ID en params.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON confirmando eliminación
 */
const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const id: number = parseInt(req.params.id, 10);

        // Verificar que usuario existe
        const existeid = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            res.json({
                id,
                mensaje: `usuario con id ${id} no se encuentra`
            } as ApiResponse);
            return;
        }

        // Eliminar usuario
        await pool.query('DELETE FROM users where id = $1', [id]);

        res.json({
            ok: true,
            mensaje: `Usuario ${id} eliminado satisfactoriamente`
        } as ApiResponse);

    } catch (error) {
        console.log((error as Error).stack);
        res.status(500).json({
            ok: false,
            msg: 'Error al eliminar usuario'
        } as ApiResponse);
    }
};

/**
 * @description Renueva el token JWT para un usuario autenticado.
 * @param {Request} req - El objeto de solicitud con usuario ID autenticado.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {void} JSON con usuario y nuevo token JWT
 */
const renewToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = (req as any).id;

        if (!id) {
            res.status(401).json({
                ok: false,
                msg: 'Usuario no autenticado'
            } as ApiResponse);
            return;
        }

        // Generar nuevo token
        const token = await generarJWT(id);

        // Obtener datos del usuario
        const usuarioDb = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (usuarioDb.rowCount === 0) {
            res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            } as ApiResponse);
            return;
        }

        const user = new Usuario(
            usuarioDb.rows[0].id,
            usuarioDb.rows[0].name,
            usuarioDb.rows[0].email,
            usuarioDb.rows[0].password,
            usuarioDb.rows[0].online,
            usuarioDb.rows[0].type,
            usuarioDb.rows[0].codigo_empleado
        );

        res.json({
            ok: true,
            usuario: user,
            token
        } as ApiResponse);

    } catch (error) {
        console.log('error en renewToken:', (error as Error).message);
        res.status(500).json({
            ok: false,
            msg: 'Error al renovar token'
        } as ApiResponse);
    }
};

export {
    renewToken,
    todosUsuarios,
    usuarioId,
    login,
    deleteUsuario,
    createUsuario,
    updateUsuario
};
