import { Router } from 'express';
import { validarJWT } from '../middelwares/validar-jwt';
import { validateDateMiddleware } from '../middelwares/validate-date';

// Importar controladores (CommonJS por ahora)
const {
    setTorno,
    getTornosHoy,
    getTorno,
    deleteTorno,
    updateTorno,
    getTornoCode,
    consultaTorno
} = require('../controladores/tornos');

const router = Router();

/**
 * @swagger
 * /api/tornos/setTorno:
 *   post:
 *     summary: Crear registro de torno (entrada/salida de empleado por torniquete)
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo_empleado
 *             properties:
 *               codigo_empleado:
 *                 type: string
 *               fechaEntrada:
 *                 type: string
 *                 format: date-time
 *               fechaSalida:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Registro de torno creado
 */
router.post(
    '/setTorno',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    setTorno
);

/**
 * @swagger
 * /api/tornos/tornos_hoy:
 *   get:
 *     summary: Obtener registros de tornos de hoy
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Lista de tornos de hoy
 */
router.get('/tornos_hoy', validarJWT, getTornosHoy);

/**
 * @swagger
 * /api/tornos/{id}:
 *   get:
 *     summary: Obtener torno específico por ID
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Torno encontrado
 */
router.get('/:id', validarJWT, getTorno);

/**
 * @swagger
 * /api/tornos/code:
 *   post:
 *     summary: Obtener torno por código de empleado
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_empleado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Torno encontrado
 */
router.post('/code', validarJWT, getTornoCode);

/**
 * @swagger
 * /api/tornos/{id}:
 *   delete:
 *     summary: Eliminar registro de torno
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Torno eliminado
 */
router.delete('/:id', validarJWT, deleteTorno);

/**
 * @swagger
 * /api/tornos/{id}:
 *   put:
 *     summary: Actualizar registro de torno
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fechaEntrada:
 *                 type: string
 *                 format: date-time
 *               fechaSalida:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Torno actualizado
 */
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    updateTorno
);

/**
 * @swagger
 * /api/tornos/consulta:
 *   post:
 *     summary: Consultar tornos por rango de fechas
 *     tags: [Tornos]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fechaInicio
 *               - fechaFin
 *             properties:
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lista filtrada de tornos
 */
router.post(
    '/consulta',
    [validarJWT, validateDateMiddleware(['fechaInicio', 'fechaFin'])],
    consultaTorno
);

export default router;
