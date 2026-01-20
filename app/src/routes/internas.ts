import { Router } from 'express';
import { validarJWT } from '../middelwares/validar-jwt';
import { validateDateMiddleware } from '../middelwares/validate-date';

// Importar controladores (CommonJS por ahora)
const {
    setInterna,
    getInternasHoy,
    getInterna,
    updatePorteriaInterna,
    deleteInterna,
    consultaInterna,
    updateInternas,
    getInternaCode
} = require('../controladores/internas');

const router = Router();

/**
 * @swagger
 * /api/internas/new_Interna:
 *   post:
 *     summary: Crear nueva salida de empleado (interna)
 *     tags: [Internas]
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
 *               - nombre_persona
 *               - fechaSalida
 *             properties:
 *               codigo_empleado:
 *                 type: string
 *               nombre_persona:
 *                 type: string
 *               motivo:
 *                 type: string
 *               fechaSalida:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Interna creada
 */
router.post(
    '/new_Interna',
    [validarJWT, validateDateMiddleware(['fechaSalida'])],
    setInterna
);

/**
 * @swagger
 * /api/internas/internas_hoy:
 *   get:
 *     summary: Obtener salidas internas registradas hoy
 *     tags: [Internas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Lista de internas de hoy
 */
router.get('/internas_hoy', validarJWT, getInternasHoy);

/**
 * @swagger
 * /api/internas/{id}:
 *   get:
 *     summary: Obtener interna específica por ID
 *     tags: [Internas]
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
 *         description: Interna encontrada
 */
router.get('/:id', validarJWT, getInterna);

/**
 * @swagger
 * /api/internas/code:
 *   post:
 *     summary: Obtener interna por código de empleado
 *     tags: [Internas]
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
 *         description: Interna encontrada
 */
router.post('/code', validarJWT, getInternaCode);

/**
 * @swagger
 * /api/internas/porteria:
 *   put:
 *     summary: Actualizar entrada de retorno en portería
 *     tags: [Internas]
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
 *               fechaEntrada:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Interna actualizada
 */
router.put(
    '/porteria',
    [validarJWT, validateDateMiddleware(['fechaEntrada'])],
    updatePorteriaInterna
);

/**
 * @swagger
 * /api/internas/interna/{id}:
 *   delete:
 *     summary: Eliminar interna
 *     tags: [Internas]
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
 *         description: Interna eliminada
 */
router.delete('/interna/:id', validarJWT, deleteInterna);

/**
 * @swagger
 * /api/internas/buscar_interna:
 *   put:
 *     summary: Buscar internas por rango de fechas
 *     tags: [Internas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fechaSalida
 *               - fechaSalida2
 *             properties:
 *               fechaSalida:
 *                 type: string
 *                 format: date-time
 *               fechaSalida2:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lista filtrada
 */
router.put(
    '/buscar_interna',
    [validarJWT, validateDateMiddleware(['fechaSalida', 'fechaSalida2'])],
    consultaInterna
);

/**
 * @swagger
 * /api/internas/{id}:
 *   put:
 *     summary: Actualizar interna completa
 *     tags: [Internas]
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
 *         description: Interna actualizada
 */
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    updateInternas
);

export default router;
