const Usuario = require('../models/usuario');
const pool = require("../database/conexion");


const usuarioConectado = async (id) => {
    // Consulta a la base de datos para obtener el usuario con el ID proporcionado
    const usuari_db = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    // Verifica si se encontró un usuario en la base de datos
    if (usuari_db.rows.length > 0) {
        // Si se encontró un usuario, crea un objeto Usuario con los datos obtenidos de la base de datos
        const usuario1 = new Usuario(
            usuari_db.rows[0].id,
            usuari_db.rows[0].name,
            usuari_db.rows[0].email,
            usuari_db.rows[0].password,
            usuari_db.rows[0].online
        );

        // Actualiza el estado del usuario a "offline"
        usuario1.online = false;

        // Actualiza el estado del usuario en la base de datos
        await pool.query(
            'UPDATE users SET online = true WHERE id = $1', [usuario1.id]
        );

        // Retorna el usuario actualizado
        return usuario1;
    } else {
        // Si no se encontró ningún usuario con el ID proporcionado, lanza un error
        throw new Error(`No se encontró ningún usuario con el ID ${id}`);
    }
}

const usuarioDesconectado = async (id) => {

    const usuari_db = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const usuario = new Usuario(usuari_db.rows[0].id,
        usuari_db.rows[0].name,
        usuari_db.rows[0].email,
        usuari_db.rows[0].password,
        usuari_db.rows[0].online);

    usuario.online = true;
    const response = await pool.query(
        'UPDATE users SET online = false WHERE id = $1', [usuario.id]);
    return usuario;
}



module.exports = {
    usuarioConectado,
    usuarioDesconectado

}