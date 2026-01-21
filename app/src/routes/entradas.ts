import { Router } from 'express';
import { validarJWT } from '../middelwares/validar-jwt';
import { validateDateMiddleware } from '../middelwares/validate-date';

// Importar controladores (CommonJS por ahora)
const {
    getEntradas,
    getEntrada,
    deleteEntrada,
    updateEntradas,
    setEntrada,
    updateRecepcionEntrada,
    getEntradasAlmacen,
    getEntradasPorteria,
    updatePorteriaEntrada,
    getEntradasSelect,
    getEntradaByMatricula
} = require('../controladores/entradas');

const router = Router();

/**
 * @swagger
 * /api/entradas:
 *   get:
 *     summary: Obtener vehículos dentro (últimas 12h o sin salida)
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Lista de entradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EntradaVehiculo'
 */
router.get('/', validarJWT, getEntradas);

/**
 * @swagger
 * /api/entradas/almacen:
 *   get:
 *     summary: Obtener entradas para almacén
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Entradas para almacén
 */
router.get('/almacen', validarJWT, getEntradasAlmacen);

/**
 * @swagger
 * /api/entradas/porteria:
 *   get:
 *     summary: Obtener entradas para portería
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     responses:
 *       200:
 *         description: Entradas para portería
 */
router.get('/porteria', validarJWT, getEntradasPorteria);

/**
 * @swagger
 * /api/entradas/by-matricula/{matricula}:
 *   get:
 *     summary: Buscar entrada por matrícula
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: matricula
 *         required: true
 *         schema:
 *           type: string
 *         description: Matrícula del vehículo
 *     responses:
 *       200:
 *         description: Entrada encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/by-matricula/:matricula', validarJWT, getEntradaByMatricula);

/**
 * @swagger
 * /api/entradas/{id}:
 *   get:
 *     summary: Obtener entrada específica por ID
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la entrada
 *     responses:
 *       200:
 *         description: Entrada encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/:id', validarJWT, getEntrada);

/**
 * @swagger
 * /api/entradas:
 *   post:
 *     summary: Crear nueva entrada de vehículo
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empresa
 *               - matricula
 *               - fecha_entrada
 *             properties:
 *               empresa:
 *                 type: string
 *               nombre_conductor:
 *                 type: string
 *               matricula:
 *                 type: string
 *               clase_carga:
 *                 type: string
 *               firma:
 *                 type: string
 *                 description: Firma del conductor en formato base64
 *               fecha_entrada:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Entrada creada
 *       400:
 *         description: Datos inválidos
 */
router.post(
    '/',
    [validarJWT, validateDateMiddleware(['fecha_entrada'])],
    setEntrada
);

/**
 * @swagger
 * /api/entradas/recepcion:
 *   put:
 *     summary: Actualizar estado de recepción
 *     tags: [Entradas]
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
router.put('/recepcion', validarJWT, updateRecepcionEntrada);

/**
 * @swagger
 * /api/entradas/porteria:
 *   put:
 *     summary: Actualizar entrada en portería
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - vigilancia
 *               - fecha
 *             properties:
 *               id:
 *                 type: integer
 *               vigilancia:
 *                 type: boolean
 *                 description: Estado de vigilancia (true para marcar salida)
 *               fecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Entrada actualizada
 */
router.put(
    '/porteria',
    [validarJWT, validateDateMiddleware(['fecha'])],
    updatePorteriaEntrada
);

/**
 * @swagger
 * /api/entradas/select:
 *   put:
 *     summary: Consultar entradas por rango de fechas
 *     tags: [Entradas]
 *     security:
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_entrada1
 *               - fecha_entrada2
 *             properties:
 *               fecha_entrada1:
 *                 type: string
 *                 format: date-time
 *               fecha_entrada2:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lista filtrada de entradas
 */
router.put(
    '/select',
    [validarJWT, validateDateMiddleware(['fecha_entrada1', 'fecha_entrada2'])],
    getEntradasSelect
);

/**
 * @swagger
 * /api/entradas/{id}:
 *   delete:
 *     summary: Eliminar entrada
 *     tags: [Entradas]
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
 *         description: Entrada eliminada
 *       404:
 *         description: No encontrada
 */
router.delete('/:id', validarJWT, deleteEntrada);

/**
 * @swagger
 * /api/entradas/{id}:
 *   put:
 *     summary: Actualizar entrada completa
 *     tags: [Entradas]
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
 *               empresa:
 *                 type: string
 *               nombre_conductor:
 *                 type: string
 *               matricula:
 *                 type: string
 *               clase_carga:
 *                 type: string
 *               firma:
 *                 type: string
 *                 description: Firma del conductor en formato base64
 *               fecha_entrada:
 *                 type: string
 *                 format: date-time
 *               fecha_salida:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Entrada actualizada
 *       404:
 *         description: No encontrada
 */
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fecha_entrada', 'fecha_salida'])],
    updateEntradas
);

export default router;
