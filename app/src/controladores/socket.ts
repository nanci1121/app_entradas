import { Usuario } from '../models/usuario';

// Importar pool de conexión (CommonJS)
const pool = require('../database/conexion');

// Tipos locales
interface UsuarioResponse {
    id: number;
    name: string;
    email: string;
    password: string;
    online: boolean;
}

/**
 * @description Marca un usuario como conectado en la base de datos.
 * @param {number | string} id - El ID del usuario a marcar como conectado.
 * @returns {Promise<Usuario>} Objeto Usuario con estado actualizado
 * @throws Error si no se encuentra el usuario
 */
const usuarioConectado = async (id: number | string): Promise<Usuario> => {
    try {
        // Consulta para obtener el usuario
        const usuari_db = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (usuari_db.rows.length === 0) {
            throw new Error(`No se encontró ningún usuario con el ID ${id}`);
        }

        const usuarioData = usuari_db.rows[0] as UsuarioResponse;

        // Crear objeto Usuario
        const usuario1 = new Usuario(
            usuarioData.id,
            usuarioData.name,
            usuarioData.email,
            usuarioData.password,
            usuarioData.online,
            'user', // type por defecto
            undefined // codigo_empleado opcional
        );

        // Actualizar estado en BD a conectado (online = true)
        await pool.query('UPDATE users SET online = true WHERE id = $1', [usuario1.id]);

        // Retornar usuario actualizado
        usuario1.online = true;
        return usuario1;

    } catch (error) {
        console.error('Error en usuarioConectado:', (error as Error).message);
        throw error;
    }
};

/**
 * @description Marca un usuario como desconectado en la base de datos.
 * @param {number | string} id - El ID del usuario a marcar como desconectado.
 * @returns {Promise<Usuario>} Objeto Usuario con estado actualizado
 * @throws Error si no se encuentra el usuario o hay error en BD
 */
const usuarioDesconectado = async (id: number | string): Promise<Usuario> => {
    try {
        // Consulta para obtener el usuario
        const usuari_db = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (usuari_db.rows.length === 0) {
            throw new Error(`No se encontró ningún usuario con el ID ${id}`);
        }

        const usuarioData = usuari_db.rows[0] as UsuarioResponse;

        // Crear objeto Usuario
        const usuario = new Usuario(
            usuarioData.id,
            usuarioData.name,
            usuarioData.email,
            usuarioData.password,
            usuarioData.online,
            'user', // type por defecto
            undefined // codigo_empleado opcional
        );

        // Actualizar estado en BD a desconectado (online = false)
        await pool.query('UPDATE users SET online = false WHERE id = $1', [usuario.id]);

        // Retornar usuario actualizado
        usuario.online = false;
        return usuario;

    } catch (error) {
        console.error('Error en usuarioDesconectado:', (error as Error).message);
        throw error;
    }
};

export {
    usuarioConectado,
    usuarioDesconectado
};
