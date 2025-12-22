/*
path: api/internas
*/

const { Router } = require('express');
const router = Router();
const { validarJWT } = require('../middelwares/validar-jwt');
const { validateDateMiddleware } = require('../middelwares/validate-date');
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

router.post('/new_Interna', [validarJWT, validateDateMiddleware(['fechaSalida'])], setInterna);
router.get('/internas_hoy', validarJWT, getInternasHoy);
router.get('/:id', validarJWT, getInterna);
router.post('/code', validarJWT, getInternaCode);

router.put('/porteria', [validarJWT, validateDateMiddleware(['fechaEntrada'])], updatePorteriaInterna);
router.delete('/interna/:id', validarJWT, deleteInterna);
router.put('/buscar_interna', [validarJWT, validateDateMiddleware(['fechaSalida', 'fechaSalida2'])], consultaInterna);
router.put('/:id', [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])], updateInternas);


module.exports = router;