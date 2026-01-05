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

// POST - Crear torno
router.post(
    '/setTorno',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    setTorno
);

// GET - Obtener tornos registrados hoy
router.get('/tornos_hoy', validarJWT, getTornosHoy);

// GET - Obtener torno específico por ID
router.get('/:id', validarJWT, getTorno);

// POST - Obtener por código
router.post('/code', validarJWT, getTornoCode);

// DELETE - Eliminar torno
router.delete('/:id', validarJWT, deleteTorno);

// PUT - Actualizar torno
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    updateTorno
);

// POST - Consultar por rango de fechas
router.post(
    '/consulta',
    [validarJWT, validateDateMiddleware(['fechaInicio', 'fechaFin'])],
    consultaTorno
);

export default router;
