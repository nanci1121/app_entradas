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

// GET - Obtener vehículos dentro (últimas 12h o sin salida)
router.get('/', validarJWT, getEntradas);

// GET - Obtener entradas para almacén
router.get('/almacen', validarJWT, getEntradasAlmacen);

// GET - Obtener entradas para portería
router.get('/porteria', validarJWT, getEntradasPorteria);

// GET - Buscar entrada por matrícula
router.get('/by-matricula/:matricula', validarJWT, getEntradaByMatricula);

// GET - Obtener entrada específica por ID
router.get('/:id', validarJWT, getEntrada);

// POST - Crear nueva entrada
router.post(
    '/',
    [validarJWT, validateDateMiddleware(['fecha_entrada'])],
    setEntrada
);

// PUT - Actualizar estado de recepción
router.put('/recepcion', validarJWT, updateRecepcionEntrada);

// PUT - Actualizar entrada en portería
router.put(
    '/porteria',
    [validarJWT, validateDateMiddleware(['fecha'])],
    updatePorteriaEntrada
);

// PUT - Consultar por rango de fechas
router.put(
    '/select',
    [validarJWT, validateDateMiddleware(['fecha_entrada1', 'fecha_entrada2'])],
    getEntradasSelect
);

// DELETE - Eliminar entrada
router.delete('/:id', validarJWT, deleteEntrada);

// PUT - Actualizar entrada
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fecha_entrada', 'fecha_salida'])],
    updateEntradas
);

export default router;
