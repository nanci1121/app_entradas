const { response } = require("express");
const pool = require("../database/conexion");
const Interna = require('../models/interna');
const Usuario = require('../models/usuario');
const { comprobarJWT } = require('../helpers/jwt');

/**
 * @description Obtiene todas las salidas de empleados del día actual.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de salidas y los datos de las mismas.
 */
const getInternasHoy = async (req, res = response) => {
    try {
        // La consulta para obtener la fecha de hoy se puede simplificar.
        // Usar directamente NOW() en la consulta principal es más eficiente.
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
        });

    } catch (error) {
        // 1. Registramos el error en el servidor para depuración.
        console.log('Error en getInternasHoy:', error.stack);

        // 2. Enviamos una respuesta de error al cliente.
        // Esto es CRUCIAL para que Flutter sepa que la petición falló.
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor. Por favor, contacte al administrador.'
        });
    }
};


/**
 * @description Obtiene una salida de empleado por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la salida en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y los datos de la salida, o un mensaje si no se encuentra.
 */
const getInterna = async (req, res = response) => {
    try {

        const id = parseInt(req.params.id);
        const resultado = await pool.query('SELECT * FROM salidas_empleados WHERE id = $1 ORDER BY fecha_entrada ASC', [id]);
        if (resultado.rowCount == 0) {
            res.json({
                id: id,
                mensaje: 'empleado con id ' + id + ' no se encuentra'
            })

        } else {
            res.json({

                ok: true,
                interna: resultado.rows[0]
            })

        }
    } catch (error) {
        console.log(error.stack);
    }
};

/**
 * @description Obtiene un usuario por su código de empleado.
 * @param {object} req - El objeto de solicitud de Express, con el código de empleado en el body.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con los datos del usuario, o un mensaje si no se encuentra.
 */
const getInternaCode = async (req, res = response) => {
    try {
        const code = req.body.code;
        console.log(code);
        const resultado = await pool.query('SELECT * FROM users WHERE codigo_empleado = $1', [code]);
        if (resultado.rowCount == 0) {
            res.json({
                codigo_empleado: code,
                mensaje: 'empleado con codigo empleado ' + code + ' no se encuentra'
            })

        } else {
            res.json({
                usuario: resultado.rows[0]
            })

        }

    } catch (error) {
        console.log(error.stack);
    }

};


/**
 * @description Crea una nueva salida de empleado. La fecha de salida no puede ser futura.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: codigoEmpleado, nombrePersona, fechaSalida, motivo.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y el ID de la salida creada.
 */
const setInterna = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { codigoEmpleado, nombrePersona, fechaSalida, motivo } = req.body;
        const fechaEntrada = null;
        if (codigoEmpleado == null || nombrePersona == null || fechaSalida == null) {
            res.status(200).json({
                ok: false,
                entrada: 'datos empleado enviados nulos'
            });
        } else {
            await pool.query(
                'INSERT INTO salidas_empleados (codigo_empleado, nombre_persona, fecha_entrada, fecha_salida, motivo, usuario)\
                 VALUES ($1, $2, $3, $4 ,$5 ,$6 )',
                [codigoEmpleado, nombrePersona, fechaEntrada, fechaSalida, motivo, id_usuaio]
            );

            const interna = await pool.query('SELECT * FROM salidas_empleados WHERE codigo_empleado = $1 and fecha_salida = $2 ORDER BY fecha_salida ASC', [codigoEmpleado, fechaSalida]);
            res.status(200).json({
                ok: true,
                interna: interna.rows[0].id

            });
        }


    } catch (error) {
        console.log(error.stack)
    }
};

/**
 * @description Actualiza la fecha de entrada de una salida de empleado (portería). La fecha de entrada no puede ser futura.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: id, fechaEntrada.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {string} Un mensaje de texto confirmando la actualización.
 */
const updatePorteriaInterna = async (req, res = response) => {


    try {

        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { id, fechaEntrada } = req.body;

        const existe_id = await pool.query('SELECT * FROM salidas_empleados WHERE id = $1 ORDER BY fecha_entrada ASC', [id]);

        if (existe_id.rowCount == 1) {
            const response = await pool.query('UPDATE salidas_empleados SET fecha_salida = $1, usuario = $2 WHERE id = $3', [fechaEntrada, id_usuaio, id]);
            res.json('Entrada empleado Updated Successfully');
        }
    } catch (error) {
        console.log(error.stack)
    }
};

/**
 * @description Elimina una salida de empleado por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la salida en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON confirmando la eliminación o un error.
 */
const deleteInterna = async (req, res = response) => {

    const id = parseInt(req.params.id);
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const existeid = await pool.query('SELECT * FROM salidas_empleados WHERE id = $1', [id]);
        if (existeid.rowCount == 0) {
            res.json({
                id: id,
                mensaje: `Persona interna con id  ${id} no se encuentra`
            })
        } else {
            const response = await pool.query('DELETE FROM salidas_empleados where id = $1', [id]);
            res.json(`Salida empleado ${id} eliminada satisfactoriamente`);
        }
    } catch (error) {
        console.log(error.stack)
    }
};



/**
 * @description Obtiene salidas de empleados filtradas por varios criterios con paginación. Las fechas no pueden ser futuras.
 * @param {object} req - El objeto de solicitud de Express, que puede contener en el body: codigoEmpleado, nombrePersona, fechaSalida (obligatorio), fechaSalida2, motivo, limit (defecto 100), offset (defecto 0).
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de salidas y los datos de las salidas filtradas.
 */
const consultaInterna = async (req, res = response) => {
  console.log('consultaInterna called with body:', req.body);

  try {
    let {
      codigo_empleado,
      nombre_persona,
      fecha_entrada,
      fecha_entrada2,
      motivo,
      limit = 100,
      offset = 0,
    } = req.body;

    // Validar que fecha_entrada exista
    if (!fecha_entrada || fecha_entrada.trim() === '') {
      return res.status(400).json({
        ok: false,
        mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.',
      });
    }

    // Si no viene fecha_entrada2, usar la actual
    if (!fecha_entrada2 || fecha_entrada2.trim() === '') {
      const hoy = await pool.query(
        "SELECT TO_CHAR(date_trunc('minute', current_timestamp), 'YYYY-MM-DD HH24:MI') AS fecha"
      );
      fecha_entrada2 = hoy.rows[0].fecha;
    }

    // Construcción dinámica del query
    let query = 'SELECT * FROM salidas_empleados WHERE 1=1';
    const params = [];
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

    console.log('consultaInterna y params:', query, params);

    res.json({
      ok: true,
      cantidad: internas.rowCount ?? 0,
      internas: internas.rows ?? [],
    });
  } catch (error) {
    console.error('Error en consultaInterna:', error.stack);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
    });
  }
};


/**
 * @description Actualiza los datos de una salida de empleado por su ID. Las fechas de entrada y salida no pueden ser futuras.
 * @param {object} req - El objeto de solicitud de Express, con el ID en los params y los datos a actualizar en el body.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {string} Un mensaje de texto confirmando la actualización o un JSON con error si no se encuentra.
 */
const updateInternas = async (req, res = response) => {
  try {
    const id = parseInt(req.params.id);
    const token = req.headers['x-token'];
    const [ , id_usuario ] = comprobarJWT(token);

    let { codigo_empleado, nombre_persona, fecha_entrada, fecha_salida, motivo } = req.body;

    // Normalizar fechas
    fecha_entrada = fecha_entrada || null;
    fecha_salida = fecha_salida || null;

    const existeid = await pool.query(
      'SELECT 1 FROM salidas_empleados WHERE id = $1',
      [id]
    );

    if (existeid.rowCount === 0) {
      return res.status(404).json({ mensaje: `No existe registro con id ${id}` });
    }

    await pool.query(`
      UPDATE salidas_empleados
      SET codigo_empleado = $1,
          nombre_persona = $2,
          fecha_salida = $3,
          motivo = $4,
          fecha_entrada = $5,
          usuario = $6
      WHERE id = $7
    `, [codigo_empleado, nombre_persona, fecha_salida, motivo, fecha_entrada, id_usuario, id]);

    res.json({ mensaje: `Registro ${id} modificado satisfactoriamente` });

  } catch (error) {
    console.error('Error en updateInternas:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


module.exports = {
    setInterna,
    getInternaCode,
    getInternasHoy,
    getInterna,
    updatePorteriaInterna,
    deleteInterna,
    consultaInterna,
    updateInternas
} 
