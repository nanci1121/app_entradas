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

// POST - Crear nueva entrada interna
router.post(
    '/new_Interna',
    [validarJWT, validateDateMiddleware(['fechaSalida'])],
    setInterna
);

// GET - Obtener internas registradas hoy
router.get('/internas_hoy', validarJWT, getInternasHoy);

// GET - Obtener interna específica por ID
router.get('/:id', validarJWT, getInterna);

// POST - Obtener por código
router.post('/code', validarJWT, getInternaCode);

// PUT - Actualizar en portería
router.put(
    '/porteria',
    [validarJWT, validateDateMiddleware(['fechaEntrada'])],
    updatePorteriaInterna
);

// DELETE - Eliminar interna
router.delete('/interna/:id', validarJWT, deleteInterna);

// PUT - Consultar por rango de fechas
router.put(
    '/buscar_interna',
    [validarJWT, validateDateMiddleware(['fechaSalida', 'fechaSalida2'])],
    consultaInterna
);

// PUT - Actualizar interna
router.put(
    '/:id',
    [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])],
    updateInternas
);

export default router;
