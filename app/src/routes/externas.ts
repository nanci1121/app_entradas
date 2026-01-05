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

// POST - Crear nueva entrada externa
router.post('/new_externa', validarJWT, setExterna);

// GET - Obtener externas registradas hoy
router.get('/externas_hoy', validarJWT, getExternasHoy);

// GET - Obtener externas en portería
router.get('/porteria', validarJWT, getExternaPorteria);

// GET - Obtener externa específica por ID
router.get('/:id', validarJWT, getExterna);

// PUT - Actualizar estado en portería
router.put('/porteria', validarJWT, updatePorteriaExterna);

// DELETE - Eliminar externa
router.delete('/externa/:id', validarJWT, deleteExterna);

// PUT - Buscar por rango de fechas
router.put(
    '/buscar_externa',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaEntrada2'])],
    buscarExterna
);

// PUT - Actualizar externa
router.put('/:id', validarJWT, updateExternas);

// GET - Buscar por nombre de conductor
router.get('/by-nombreConductor/:nombreConductor', validarJWT, getExternaByNombreConductor);

export default router;
