const { response } = require("express");
const pool = require("../database/conexion");
const Entrada = require('../models/entrada');
const { comprobarJWT } = require('../helpers/jwt');


/**
 * @description Esta consulta combina dos condiciones con un OR:
        * 1. Vehículos que entraron recientemente (en las últimas 12 horas).
        * 2. Vehículos que entraron en cualquier momento y todavía no han salido.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas.
 */

const getEntradas = async (req, res = response) => {
    console.log('--- [DEBUG] Iniciando getEntradas (Lógica de "Vehículos Dentro") ---');
    try {
        // Esta consulta combina dos condiciones con un OR:
        // 1. Vehículos que entraron recientemente (en las últimas 12 horas).
        // 2. Vehículos que entraron en cualquier momento y todavía no han salido.
        const query = `
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

        console.log('--- [DEBUG] Ejecutando consulta de "vehículos dentro".');
        const entradas = await pool.query(query);
        
        console.log('--- [DEBUG] Finalizando getEntradas --- entradas encontradas:', entradas.rowCount);
        res.json({
            ok: true,
            cantidad: entradas.rowCount,
            entradas: entradas.rows
        })

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener las entradas'
        });
    }
};



/**
 * @description Obtiene entradas de vehículos filtradas por varios criterios con paginación.
 * @param {object} req - El objeto de solicitud de Express, que puede contener en el body: nombre_conductor, empresa, matricula, clase_carga, fecha_entrada1 (obligatorio), fecha_entrada2, limit (defecto 100), offset (defecto 0).
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas filtradas.
 */
const getEntradasSelect = async (req, res = response) => {
    //console.log('--- [DEBUG] Iniciando getEntradasSelect ---');
    try {
        let { nombre_conductor, empresa, matricula, clase_carga, fecha_entrada1, fecha_entrada2, limit = 100, offset = 0 } = req.body;

        // El campo fecha_entrada1 es obligatorio para realizar la búsqueda.
        if (!fecha_entrada1 || fecha_entrada1.trim() === '') {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo fecha_entrada1 es obligatorio para la búsqueda.'
            });
        }

        // Si fecha_entrada2 no se proporciona, se usará la fecha y hora actual.
        if (!fecha_entrada2 || fecha_entrada2.trim() === '') {
            const hoy = await pool.query("select now()");
            fecha_entrada2 = hoy.rows[0].now;
        }

        let query = `SELECT * FROM entradas_vehiculos WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

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

        // fecha_entrada1 y fecha_entrada2 son obligatorios o tienen un valor por defecto,
        // por lo que esta condición siempre se aplicará.
        query += ` AND fecha_entrada BETWEEN $${paramIndex++} AND $${paramIndex++}`;
        params.push(fecha_entrada1, fecha_entrada2);

        query += ` ORDER BY fecha_entrada DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const entradas0 = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: entradas0.rowCount,
            entradas: entradas0.rows
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado en la selección de entradas.'
        });
    }
};

/**
 * @description Obtiene las entradas de vehículos que no han sido validadas por recepción (almacén).
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas.
 */
const getEntradasAlmacen = async (req, res = response) => {
    //todas las entradas de vehiculos que no esten validadas por recepcion almacen
    const entradasA = await pool.query(
        "select * from entradas_vehiculos where recepcion = false ORDER BY fecha_entrada ASC");
    res.json({
        ok: true,
        cantidad: entradasA.rowCount,
        entradas: entradasA.rows
    })
};

/**
 * @description Obtiene las entradas de vehículos que han sido validadas por recepción pero no por vigilancia (portería).
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas.
 */
const getEntradasPorteria = async (req, res = response) => {
    //todas las entradas de vehiculos que no esten validadas por recepcion almacen
    const entradasP = await pool.query(
        "select * from entradas_vehiculos where recepcion = true and vigilancia = false");
    res.json({
        ok: true,
        cantidad: entradasP.rowCount,
        entradas: entradasP.rows
    })
};

/**
 * @description Obtiene una entrada de vehículo por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la entrada en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y los datos de la entrada, o un mensaje si no se encuentra.
 */
const getEntrada = async (req, res = response) => {
    try {
        const id = parseInt(req.params.id);
        const resultado = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1 ORDER BY fecha_entrada ASC', [id]);
        if (resultado.rowCount == 0) {
            res.json({
                id: id,
                mensaje: 'entrada con id ' + id + ' no se encuentra'
            })

        } else {
            res.json({

                ok: true,
                entrada: resultado.rows[0]
            })

        }
    } catch (error) {
        console.log(error.stack);
    }
};

/**
 * @description Crea una nueva entrada de vehículo.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: nombre_conductor, firma, empresa, matricula, clase_carga, fecha_entrada. El header debe contener el x-token.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y los datos de la entrada creada.
 */
const setEntrada = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const id = comprobarJWT(token);
        const id_usuaio = id[1];
        const { nombre_conductor, firma, empresa, matricula, clase_carga, fecha_entrada } = req.body;

        console.log('--- [DEBUG] setEntrada - Datos recibidos:', req.body);

        if (nombre_conductor == null || firma == null || empresa == null || matricula == null || clase_carga == null, fecha_entrada == null) {
            res.status(200).json({
                ok: false,
                entrada: 'datos enviados nulos'
            });
        } else {
            await pool.query(
                'INSERT INTO entradas_vehiculos (nombre_conductor,  empresa, matricula, clase_carga, fecha_entrada, firma, usuario) VALUES ($1 ,$2 ,$3 ,$4 ,$5 ,$6 ,$7)',
                [nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, firma, id_usuaio]
            );
            //obtenemos el entrada recien grabada.
            const entrada = await pool.query('SELECT id, nombre_conductor, empresa, matricula, clase_carga, fecha_entrada,firma FROM entradas_vehiculos WHERE firma = $1 and fecha_entrada = $2 ORDER BY fecha_entrada ASC', [firma, fecha_entrada]);

            const entrada1 = new Entrada(
                entrada.rows[0].id,
                entrada.rows[0].nombre_conductor,
                entrada.rows[0].empresa,
                entrada.rows[0].matricula,
                entrada.rows[0].clase_carga,
                entrada.rows[0].fecha_entrada,
                entrada.rows[0].firma
            );

            res.status(200).json({
                ok: true,
                entrada: entrada1

            });
        }


    } catch (error) {
        console.log(error.stack)
    }
};

/**
 * @description Actualiza el estado de recepción de una entrada de vehículo.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: id, recepcion. El header debe contener el x-token.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON confirmando la actualización o un error.
 */
const updateRecepcionEntrada = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { id, recepcion } = req.body;

        if (id === undefined || recepcion === undefined) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos id y recepcion son obligatorios.'
            });
        }

        const existe_id = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            });
        }

        await pool.query('UPDATE entradas_vehiculos SET recepcion = $1, usuario = $2 WHERE id = $3', [recepcion, id_usuaio, id]);

        res.json({
            ok: true,
            mensaje: 'El estado de recepción de la entrada ha sido actualizado correctamente.'
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada.'
        });
    }
};

/**
 * @description Actualiza el estado de vigilancia (salida) de una entrada de vehículo.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: id, vigilancia, fecha. El header debe contener el x-token.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON confirmando la actualización o un error.
 */
const updatePorteriaEntrada = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { id, vigilancia, fecha } = req.body;

        if (id === undefined || vigilancia === undefined || fecha === undefined) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos id, vigilancia y fecha son obligatorios.'
            });
        }

        const existe_id = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            });
        }

        await pool.query('UPDATE entradas_vehiculos SET vigilancia = $1, fecha_salida = $2, usuario = $3 WHERE id = $4', [vigilancia, fecha, id_usuaio, id]);

        res.json({
            ok: true,
            mensaje: 'El estado de portería de la entrada ha sido actualizado correctamente.'
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada de portería.'
        });
    }
};

/**
 * @description Elimina una entrada de vehículo por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la entrada en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON confirmando la eliminación o un error.
 */
const deleteEntrada = async (req, res = response) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El ID proporcionado no es un número válido.'
            });
        }

        // First, check if the entry exists
        const existeid = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);

        if (existeid.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontró ninguna entrada con el id ${id}.`
            });
        }

        const entradaEliminada = existeid.rows[0];

        // If it exists, delete it
        await pool.query('DELETE FROM entradas_vehiculos WHERE id = $1', [id]);

        res.json({
            ok: true,
            mensaje: 'La entrada ha sido eliminada correctamente.',
            entrada: entradaEliminada
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al eliminar la entrada.'
        });
    }
};

/**
 * @description Actualiza los datos de una entrada de vehículo por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID en los params y los datos a actualizar en el body. El header debe contener el x-token.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {string} Un mensaje de texto confirmando la actualización o un JSON con error si no se encuentra.
 */
const updateEntradas = async (req, res = response) => {

    try {
        const id = parseInt(req.params.id);
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, fecha_salida } = req.body;

        const existeid = await pool.query('SELECT * FROM entradas_vehiculos WHERE id = $1', [id]);
        if (existeid.rowCount == 0) {
            res.json({
                id: id,
                mensaje: `Entrada con id  ${id} no se encuentra`
            })
        } else {
            const response = await pool.query('UPDATE entradas_vehiculos SET nombre_conductor = $1, empresa = $2, matricula = $3, clase_carga = $4, fecha_entrada = $5, fecha_salida = $6 , usuario = $7 WHERE id = $8', [nombre_conductor, empresa, matricula, clase_carga, fecha_entrada, fecha_salida, id_usuaio, id]);
            res.json(`Entrada ${id} modificada satisfactoriamente`);
        }

    } catch (error) {
        console.log(error.stack)
    }

}

/**
 * @description Obtiene la última entrada de un vehículo por su matrícula.
 * @param {object} req - El objeto de solicitud de Express, con la matrícula en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y los datos de la entrada, o un mensaje de error si no se encuentra.
 */
const getEntradaByMatricula = async (req, res = response) => {
    try {
        const { matricula } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM entradas_vehiculos WHERE matricula = $1 ORDER BY fecha_entrada DESC LIMIT 1',
            [matricula.toUpperCase()]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontró entrada para la matrícula ${matricula}`
            });
        }

        const entrada = resultado.rows[0];

        res.json({
            ok: true,
            entrada
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado, contacte al administrador.'
        });
    }
};

module.exports = {
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
}