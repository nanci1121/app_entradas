/*
path: api/externas
*/

const { Router } = require('express');
const router = Router();
const { validarJWT } = require('../middelwares/validar-jwt');
const { validateDateMiddleware } = require('../middelwares/validate-date');
const { setExterna, getExternasHoy, getExterna, updatePorteriaExterna, deleteExterna, buscarExterna ,getExternaPorteria,updateExternas, getExternaByNombreConductor} = require('../controladores/externas');

router.post('/new_externa', validarJWT, setExterna);
router.get('/externas_hoy', validarJWT, getExternasHoy);
router.get('/porteria', validarJWT, getExternaPorteria);
router.get('/:id', validarJWT, getExterna);
router.put('/porteria', validarJWT, updatePorteriaExterna);
router.delete('/externa/:id', validarJWT, deleteExterna);
router.put('/buscar_externa', [validarJWT, validateDateMiddleware(['fechaEntrada', 'fechaEntrada2'])], buscarExterna);
router.put('/:id', validarJWT, updateExternas);
router.get('/by-nombreConductor/:nombreConductor', validarJWT, getExternaByNombreConductor);


module.exports = router;