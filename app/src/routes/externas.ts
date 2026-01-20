import { Router } from 'express';
import { validarJWT } from '../middelwares/validar-jwt';
import { validateDateMiddleware } from '../middelwares/validate-date';

// Importar controladores (CommonJS por ahora)
const {
    setExterna,
    getExternasHoy,
    getExterna,
    updatePorteriaExterna,
    deleteExterna,
    buscarExterna,
    getExternaPorteria,
    updateExternas,
    getExternaByNombreConductor
} = require('../controladores/externas');

const router = Router();

/**
 * @swagger
 * /api/externas/new_externa:
 *   post:
 *     summary: Crear nueva entrada de empresa externa
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_persona
 *               - empresa_exterior
 *             properties:
 *               nombre_persona:
 *                 type: string
 *               empresa_exterior:
 *                 type: string
 *               peticionario:
 *                 type: string
 *               telefono_persona:
 *                 type: string
 *               nota:
 *                 type: string
 *     responses:
 *       201:
 *         description: Externa creada
 */
router.post('/new_externa', validarJWT, setExterna);

/**
 * @swagger
 * /api/externas/externas_hoy:
 *   get:
 *     summary: Obtener externas registradas hoy
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Lista de externas de hoy
 */
router.get('/externas_hoy', validarJWT, getExternasHoy);

/**
 * @swagger
 * /api/externas/porteria:
 *   get:
 *     summary: Obtener externas en portería
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Externas en portería
 */
router.get('/porteria', validarJWT, getExternaPorteria);

/**
 * @swagger
 * /api/externas/{id}:
 *   get:
 *     summary: Obtener externa específica por ID
 *     tags: [Externas]
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
 *         description: Externa encontrada
 */
router.get('/:id', validarJWT, getExterna);

/**
 * @swagger
 * /api/externas/porteria:
 *   put:
 *     summary: Actualizar estado en portería
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               recepcion:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/porteria', validarJWT, updatePorteriaExterna);

/**
 * @swagger
 * /api/externas/externa/{id}:
 *   delete:
 *     summary: Eliminar externa
 *     tags: [Externas]
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
 *         description: Externa eliminada
 */
router.delete('/externa/:id', validarJWT, deleteExterna);

/**
 * @swagger
 * /api/externas/buscar_externa:
 *   put:
 *     summary: Buscar externas por rango de fechas
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fechaEntrada
 *               - fechaEntrada2
 *             properties:
 *               fechaEntrada:
 *                 type: string
 *                 format: date-time
 *               fechaEntrada2:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lista filtrada
 */
router.put(
    '/buscar_externa',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaEntrada2'])],
    buscarExterna
);

/**
 * @swagger
 * /api/externas/{id}:
 *   put:
 *     summary: Actualizar externa
 *     tags: [Externas]
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
 *               nombre_persona:
 *                 type: string
 *               empresa_exterior:
 *                 type: string
 *     responses:
 *       200:
 *         description: Externa actualizada
 */
router.put('/:id', validarJWT, updateExternas);

/**
 * @swagger
 * /api/externas/by-nombreConductor/{nombreConductor}:
 *   get:
 *     summary: Buscar externa por nombre de conductor
 *     tags: [Externas]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: nombreConductor
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Externa encontrada
 */
router.get('/by-nombreConductor/:nombreConductor', validarJWT, getExternaByNombreConductor);

export default router;
