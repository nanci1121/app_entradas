const { response } = require("express");
const pool = require("../database/conexion");
const Externa = require('../models/externa');
const { comprobarJWT } = require('../helpers/jwt');

/**
 * @description Obtiene todas las entradas de empresas externas del día actual.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas.
 */
const getExternasHoy = async (req, res = response) => {
    try {
        const hoy = await pool.query(
            "select to_char(now(),'yyyy-mm-dd')");
        const dia_hoy = (hoy.rows[0].to_char)
        //todas las Externas del dia de hoy
        const externas = await pool.query(
            "select * from empresas_exteriores where  fecha_entrada::DATE=$1 ORDER BY fecha_entrada ASC", [dia_hoy]);
        res.json({
            ok: true,
            cantidad: externas.rowCount,
            externas: externas.rows
        })
    } catch (error) {
        console.log(error.stack);
    }
};

/**
 * @description Obtiene las entradas de empresas externas que no han sido validadas por recepción.
 * @param {object} req - El objeto de solicitud de Express.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas.
 */
const getExternaPorteria = async (req, res = response) => {

    try {

        //todas las Externas del dia de hoy
        const externasP = await pool.query(
            "select * from empresas_exteriores where  recepcion = false ORDER BY fecha_entrada ASC");
        res.json({
            ok: true,
            cantidad: externasP.rowCount,
            externas: externasP.rows
        })
    } catch (error) {
        console.log(error.stack);
    }
};

/**
 * @description Obtiene una entrada de empresa externa por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la entrada en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y los datos de la entrada, o un mensaje si no se encuentra.
 */
const getExterna = async (req, res = response) => {
    try {

        const id = parseInt(req.params.id);
        const resultado = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1 ORDER BY fecha_entrada ASC', [id]);
        if (resultado.rowCount == 0) {
            res.json({
                id: id,
                mensaje: 'persona externa con id ' + id + ' no se encuentra'
            })

        } else {
            res.json({

                ok: true,
                externa: resultado.rows[0]
            })

        }
    } catch (error) {
        console.log(error.stack);
    }
};

/**
 * @description Crea una nueva entrada de empresa externa.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: nombrePersona, empresaExterior, peticionario, telefonoPersona, firma, fechaEntrada, nota.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación y el ID de la entrada creada.
 */
const setExterna = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const fechaSalida = null;

        // --- CORRECCIÓN 1: Usar el modelo para leer el request ---
        // Esto convierte el JSON con snake_case en un objeto con camelCase
        const nuevaExterna = Externa.fromRequest(req.body);

        // --- CORRECCIÓN 2: Validar usando las propiedades del nuevo objeto ---
        if (nuevaExterna.nombrePersona == null || nuevaExterna.empresaExterior == null || nuevaExterna.peticionario == null || nuevaExterna.telefonoPersona == null || nuevaExterna.firma == null || nuevaExterna.fechaEntrada == null) {
            // Se añade 'return' para detener la ejecución aquí
            return res.status(200).json({
                ok: false,
                entrada: 'datos persona exterior enviados nulos'
            });
        }
        
        // --- MEJORA: Unir INSERT y SELECT en una sola consulta con RETURNING ---
        const insertQuery = `
            INSERT INTO empresas_exteriores (nombre_persona, empresa_exterior, peticionario, telefono_persona, firma, fecha_entrada, fecha_salida, nota, usuario)
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
            fechaSalida,
            nuevaExterna.nota,
            id_usuaio
        ];

        const result = await pool.query(insertQuery, params);

        // Devolvemos el ID que nos ha dado la consulta y usamos el status 201 (Creado)
        res.status(201).json({
            ok: true,
            externa: result.rows[0].id
        });

    } catch (error) {
        console.log(error.stack);
        // Devolvemos un error 500 (Error de Servidor)
        res.status(500).json({
            ok: false,
            mensaje: "Error inesperado al guardar la externa"
        });
    }
};


/**
 * @description Actualiza el estado de recepción de una entrada de empresa externa.
 * @param {object} req - El objeto de solicitud de Express. El body debe contener: id, fechaSalida, recepcion.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación.
 */
const updatePorteriaExterna = async (req, res = response) => {
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const { id, fechaSalida, recepcion } = req.body;

        // Validar que vengan los campos necesarios
        if (!id) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo id es obligatorio'
            });
        }

        if (recepcion === undefined || recepcion === null) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo recepcion es obligatorio'
            });
        }

        // Verificar que la externa existe
        const existe_id = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

        if (existe_id.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `Empresa exterior con id ${id} no se encuentra`
            });
        }

        // Actualizar la externa
        const updateQuery = 'UPDATE empresas_exteriores SET recepcion = $1, fecha_salida = $2, usuario = $3 WHERE id = $4';
        const result = await pool.query(updateQuery, [recepcion, fechaSalida, id_usuaio, id]);

        // Verificar que la actualización se realizó
        if (result.rowCount === 0) {
            return res.status(500).json({
                ok: false,
                mensaje: 'No se pudo actualizar la entrada'
            });
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
        });
    } catch (error) {
        console.log('[ERROR] updatePorteriaExterna:', error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al actualizar la entrada de portería'
        });
    }
};

/**
 * @description Elimina una entrada de empresa externa por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID de la entrada en los parámetros de la ruta.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON confirmando la eliminación o un error.
 */
const deleteExterna = async (req, res = response) => {

    const id = parseInt(req.params.id);
    try {
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];
        const existeid = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);
        if (existeid.rowCount == 0) {
            res.json({
                id: id,
                mensaje: `Persona externa con id  ${id} no se encuentra`
            })
        } else {
            const response = await pool.query('DELETE FROM empresas_exteriores where id = $1', [id]);
            res.json(`Persona externa ${id} eliminado satisfactoriamente`);
        }
    } catch (error) {
        console.log(error.stack)
    }
};

/**
 * @description Obtiene entradas de empresas externas filtradas por varios criterios con paginación.
 * @param {object} req - El objeto de solicitud de Express, que puede contener en el body: nombre_persona, empresa_exterior, telefono_persona, peticionario, fecha_entrada (obligatorio), fecha_entrada2, limit (defecto 100), offset (defecto 0).
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {object} Un objeto JSON con el resultado de la operación, la cantidad de entradas y los datos de las entradas filtradas.
 */


const buscarExterna = async (req, res = response) => {
    console.log('buscarExterna');

    try {
        // ¡Mucho más limpio! Creamos un objeto con los criterios de búsqueda
        console.log('Cuerpo de la solicitud:', req.body);
        const criterios = Externa.fromRequest(req.body);
        console.log('Criterios de búsqueda:', criterios);

        let { limit = 100, offset = 0 } = req.body;

        if (!criterios.fechaEntrada || criterios.fechaEntrada.trim() === '') {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.'
            });
        }
        
        let fechaEntrada2 = criterios.fechaSalida;
        if (!fechaEntrada2 || fechaEntrada2.trim() === '') {
            const hoy = await pool.query("select now()");
            fechaEntrada2 = hoy.rows[0].now;
        }

        let query = `SELECT * FROM empresas_exteriores WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        // Ahora usamos las propiedades del objeto 'criterios'
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
        
        console.log('Query construida:', query);
        console.log('Parámetros:', params);

        const externas = await pool.query(query, params);

        res.json({
            ok: true,
            cantidad: externas.rowCount,
            externas: externas.rows
        });

    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado en la selección de externas.'
        });
    }
};

/**
 * @description Actualiza los datos de una entrada de empresa externa por su ID.
 * @param {object} req - El objeto de solicitud de Express, con el ID en los params y los datos a actualizar en el body.
 * @param {object} res - El objeto de respuesta de Express.
 * @returns {string} Un mensaje de texto confirmando la actualización o un JSON con error si no se encuentra.
 */
const updateExternas = async (req, res = response) => {
    try {
        const id = parseInt(req.params.id);
        const token = req.headers['x-token'];
        const usuario_id = comprobarJWT(token);
        const id_usuaio = usuario_id[1];

        // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
        // Usamos el modelo para convertir el JSON de snake_case a un objeto camelCase.
        const externaToUpdate = Externa.fromRequest(req.body);

        const existeid = await pool.query('SELECT * FROM empresas_exteriores WHERE id = $1', [id]);

        if (existeid.rowCount == 0) {
            // Es mejor usar un código 404 (No Encontrado) y devolver un JSON.
            return res.status(404).json({
                ok: false,
                mensaje: `Empresa exterior con id ${id} no se encuentra`
            });
        }
        
        // Ahora usamos las propiedades del objeto 'externaToUpdate' (en camelCase).
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
            id_usuaio,
            externaToUpdate.recepcion,
            id
        ];

        await pool.query(query, params);

        // Devolvemos una respuesta JSON consistente.
        res.status(200).json({
            ok: true,
            mensaje: `Empresa exterior con id: ${id} modificada satisfactoriamente`
        });

    } catch (error) {
        console.log(error.stack);
        // Usamos un código 500 para errores de servidor.
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al modificar la externa'
        });
    }
};

const getExternaByNombreConductor = async (req, res = response) => {
    try {
        const nombreConductor = req.params.nombreConductor;
        const externas = await pool.query(
            "select * from empresas_exteriores where nombre_persona ILIKE $1 ORDER BY fecha_entrada DESC LIMIT 1", [`%${nombreConductor}%`]);

        if (externas.rowCount === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No se encontraron entradas para el conductor: ${nombreConductor}`
            });
        }

        res.json({
            ok: true,
            externa: externas.rows[0]
        })
    } catch (error) {
        console.log(error.stack);
        res.status(500).json({
            ok: false,
            mensaje: 'Error inesperado al buscar la última entrada.'
        });
    }
};



module.exports = {
    setExterna,
    getExternaPorteria,
    getExternasHoy,
    getExterna,
    updatePorteriaExterna,
    deleteExterna,
    buscarExterna,
    updateExternas,
    getExternaByNombreConductor
} 
