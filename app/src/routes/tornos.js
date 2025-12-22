/*
path: api/tornos
*/

const { Router } = require('express');
const router = Router();
const { validarJWT } = require('../middelwares/validar-jwt');
const { validateDateMiddleware } = require('../middelwares/validate-date');
const {
    setTorno,
    getTornosHoy,
    getTorno,
    deleteTorno,
    updateTorno,
    getTornoCode,
    consultaTorno
} = require('../controladores/tornos');

router.post('/setTorno', [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])], setTorno);
router.get('/tornos_hoy', validarJWT, getTornosHoy);
router.get('/:id', validarJWT, getTorno);
router.post('/code', validarJWT, getTornoCode);
router.delete('/:id', validarJWT, deleteTorno);
router.put('/:id', [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaSalida'])], updateTorno);
router.post('/consulta', [validarJWT, validateDateMiddleware(['fechaInicio', 'fechaFin'])], consultaTorno);


module.exports = router;