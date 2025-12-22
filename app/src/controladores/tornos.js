const { response } = require("express");
const pool = require("../database/conexion");
const Torno = require('../models/torno');
const Usuario = require('../models/usuario');
const { comprobarJWT } = require('../helpers/jwt');

/** * @description Obtiene los registros de torno para una fecha específica con paginación.
 * @param {object} req - Objeto de petición de Express. Se espera `date` (opcional), `limit` (opcional), `offset` (opcional) en `req.query`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok` y `tornos` (array de registros).
 */
const getTornosHoy = async (req, res = response) => {
    try {
        // 1. Leer los parámetros de la URL, incluyendo paginación, con valores por defecto.
        const { date, limit = 50, offset = 0 } = req.query;

        // 2. Usar la fecha proporcionada o la fecha actual.
        const dateString = date || new Date().toISOString().split('T')[0];

        // 3. Definir el rango del día completo en UTC.
        const fechaInicio = new Date(`${dateString}T00:00:00.000Z`);
        const fechaFin = new Date(`${dateString}T23:59:59.999Z`);
        
        // 4. Preparar los parámetros para la consulta SQL.
        const params = [fechaInicio, fechaFin, limit, offset];

        // 5. Construir la consulta SQL AÑADIENDO LIMIT Y OFFSET.
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
             LIMIT $3 OFFSET $4`; // <-- ¡LA MAGIA DE LA PAGINACIÓN!

        // 6. Ejecutar la consulta.
        const tornosResult = await pool.query(query, params);

        // 7. Enviar la respuesta a Flutter.
        res.json({
            ok: true,
            tornos: tornosResult.rows
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({ ok: false, msg: 'Error interno del servidor.' });
    }
};


/**
 * @description Obtiene un registro de torno específico por su ID.
 * @param {object} req - Objeto de petición de Express, se espera `id` en `req.params`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok` y `torno` si se encuentra, o un mensaje de no encontrado.
 */
const getTorno = async (req, res = response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El ID proporcionado no es un número válido.'
            });
        }

        const resultado = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontró ningún registro de torno con el id ${id}.`
            });
        }

        res.json({
            ok: true,
            torno: resultado.rows[0]
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al obtener el registro del torno.'
        });
    }
};

/**
 * @description Obtiene el nombre de un empleado usando su código.
 * @param {object} req - Objeto de petición de Express, se espera `code` en `req.body`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok` y `usuario` (con el `name`) o un mensaje de no encontrado.
 */
const getTornoCode = async (req, res = response) => {
    try {
        const code = req.body.code;

        // CORRECCIÓN: Buscamos en la tabla 'users' para obtener el nombre 'name'.
        const resultado = await pool.query('SELECT name FROM users WHERE codigo_empleado = $1', [code]);

        // Si no se encuentra ninguna fila, significa que el empleado no existe.
        if (resultado.rowCount === 0) {
            // Usamos 'return' para asegurarnos de que el código no continúe.
            return res.status(404).json({
                ok: false,
                msg: `No se encontró un empleado con el código ${code}`
            });
        }

        // CORRECCIÓN: Creamos un objeto 'usuario' con el 'name' obtenido.
        const usuario = {
            name: resultado.rows[0].name
        };

        // Devolvemos el objeto en el formato exacto que Flutter espera.
        res.json({
            ok: true,
            usuario: usuario
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor. Contacte al administrador.'
        });
    }
};

/**
 * @description Crea un nuevo registro de torno (entrada o salida) para un empleado.
 * Requiere autenticación JWT.
 * @param {object} req - Objeto de petición de Express. Se espera `codigoEmpleado`, `fechaEntrada` (opcional), `fechaSalida` (opcional) en `req.body`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok`, `torno_id` del registro creado y un mensaje de éxito.
 */
const setTorno = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const [esValido, idOperador] = comprobarJWT(token);

        if (!esValido) {
            return res.status(401).json({ ok: false, mensaje: 'Token no válido o expirado.' });
        }
        

        // Las fechas ya han sido validadas por el middleware
        const { codigoEmpleado, fechaSalida, fechaEntrada } = req.body;

        if (!codigoEmpleado || (!fechaEntrada && !fechaSalida)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El código de empleado y al menos una fecha (entrada o salida) son obligatorios.'
            });
        }

        // Validar orden lógico de fechas si ambas están presentes
        if (fechaEntrada && fechaSalida && new Date(fechaEntrada).getTime() > new Date(fechaSalida).getTime()) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de entrada no puede ser posterior a la fecha de salida.' });
        }

        // Verificar si el codigoEmpleado existe en la tabla de usuarios
        const empleadoExistente = await pool.query(
            'SELECT id FROM users WHERE codigo_empleado = $1',
            [codigoEmpleado]
        );

        if (empleadoExistente.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `El código de empleado ${codigoEmpleado} no existe.`
            });
        }

        const torno = await pool.query(
            'INSERT INTO salidas_tornos (codigo_empleado, fecha_entrada, fecha_salida, usuario) VALUES ($1, $2, $3, $4) RETURNING id',
            [codigoEmpleado, fechaEntrada || null, fechaSalida || null, idOperador]
        );

        res.status(201).json({
            ok: true,
            torno_id: torno.rows[0].id,
            mensaje: 'Registro de torno creado correctamente'
        });

    } catch (error) {
        console.log(error.stack)
        res.status(500).json({ ok: false, mensaje: 'Error inesperado al crear el registro.' });
    }
};

/**
 * @description Actualiza un registro de torno existente por su ID.
 * Requiere autenticación JWT.
 * @param {object} req - Objeto de petición de Express. Se espera `id` en `req.params` y campos a actualizar (`codigoEmpleado`, `fechaEntrada`, `fechaSalida`) en `req.body`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok` y un mensaje de actualización.
 */
const updateTorno = async (req, res = response) => {
    try {
        const id = parseInt(req.params.id);
        const token = req.headers['x-token'];
        // Renombramos la variable para distinguir el "operador" del "empleado"
        const [esValido, idOperador] = comprobarJWT(token);

        // Verificamos si el token es válido antes de proceder
        if (!esValido) {
            return res.status(401).json({ ok: false, mensaje: 'Token no válido o expirado.' });
        }

        const { codigoEmpleado, fechaEntrada, fechaSalida } = req.body;

        if (!codigoEmpleado && fechaEntrada === undefined && fechaSalida === undefined) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Debe proporcionar al menos un campo para actualizar.'
            });
        }

        const existe_id = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);

        if (existe_id.rowCount == 1) {
            let query = 'UPDATE salidas_tornos SET ';
            const values = [];
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

            // Usamos la nueva variable clara
            query += `usuario = $${paramIndex++} WHERE id = $${paramIndex++}`;
            values.push(idOperador, id);

            await pool.query(query, values);
            res.json({ ok: true, mensaje: `Registro de torno con id ${id} actualizado correctamente.` });
        } else {
            res.status(404).json({ ok: false, mensaje: `No se encontró un registro de torno con el id ${id}.` });
        }
    } catch (error) {
        console.log(error.stack)
        res.status(500).json({ ok: false, mensaje: 'Error inesperado al actualizar el registro.' });
    }
};

/**
 * @description Elimina un registro de torno existente por su ID.
 * @param {object} req - Objeto de petición de Express, se espera `id` en `req.params`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok` y un mensaje de eliminación.
 */
const deleteTorno = async (req, res = response) => {

    const id = parseInt(req.params.id);
    try {
        // El ID del operador no se usaba en esta función, se ha limpiado el código.
        const existeid = await pool.query('SELECT * FROM salidas_tornos WHERE id = $1', [id]);
        if (existeid.rowCount == 0) {
            res.status(404).json({
                ok: false,
                mensaje: `No se encontró un registro de torno con el id ${id}.`
            })
        } else {
            await pool.query('DELETE FROM salidas_tornos where id = $1', [id]);
            res.json({ ok: true, mensaje: `Registro de torno con id ${id} eliminado satisfactoriamente.` });
        }
    } catch (error) {
        console.log(error.stack)
        res.status(500).json({ ok: false, mensaje: 'Error inesperado al eliminar el registro.' });
    }
};

/**
 * @description Realiza una consulta de registros de torno con filtros opcionales y paginación.
 * @param {object} req - Objeto de petición de Express. Se espera `codigoEmpleado` (opcional), `fechaInicio` (opcional), `fechaFin` (opcional), `limit` (opcional), `offset` (opcional) en `req.body`.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {object} JSON con `ok`, `cantidad` de registros y `tornos` (array de registros).
 */
const consultaTorno = async (req, res = response) => {
    try {
        let { codigoEmpleado, fechaInicio, fechaFin, limit = 100, offset = 0 } = req.body;
        const params = [];

        let query = `
            SELECT t.*, u.name as nombre_persona 
            FROM salidas_tornos t
            JOIN users u ON t.codigo_empleado = u.codigo_empleado
            WHERE 1=1`;

        let paramIndex = 1;

        if (fechaInicio && fechaFin && new Date(fechaInicio).getTime() > new Date(fechaFin).getTime()) {
            return res.status(400).json({ ok: false, mensaje: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
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

        // ✅ CORRECCIÓN AQUÍ
        query += ` ORDER BY t.fecha_entrada DESC, t.fecha_salida DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        const tornos = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: tornos.rowCount,
            tornos: tornos.rows
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({ ok: false, mensaje: 'Error inesperado al realizar la consulta.' });
    }
};


module.exports = {
    setTorno,
    getTornoCode,
    getTornosHoy,
    getTorno,
    deleteTorno,
    updateTorno,
    consultaTorno
}