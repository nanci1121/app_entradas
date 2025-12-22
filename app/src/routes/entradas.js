/*

path: api/entradas
*/

const { Router } = require('express');
const router = Router();
const { validarJWT } = require('../middelwares/validar-jwt');
const { validateDateMiddleware } = require('../middelwares/validate-date');
const { getEntradas, getEntrada, deleteEntrada, updateEntradas, setEntrada, updateRecepcionEntrada, getEntradasAlmacen, getEntradasPorteria, updatePorteriaEntrada, getEntradasSelect, getEntradaByMatricula } = require('../controladores/entradas');

router.get('/', validarJWT, getEntradas);
router.get('/almacen', validarJWT, getEntradasAlmacen);
router.get('/porteria', validarJWT, getEntradasPorteria);
router.get('/by-matricula/:matricula', validarJWT, getEntradaByMatricula);
router.get('/:id', validarJWT, getEntrada);
router.post('/', [validarJWT, validateDateMiddleware(['fecha_entrada'])], setEntrada);
router.put('/recepcion', validarJWT, updateRecepcionEntrada);
router.put('/porteria', [validarJWT, validateDateMiddleware(['fecha'])], updatePorteriaEntrada);
router.put('/select', [validarJWT, validateDateMiddleware(['fecha_entrada1', 'fecha_entrada2'])], getEntradasSelect);
router.delete('/:id', validarJWT, deleteEntrada);
router.put('/:id', [validarJWT, validateDateMiddleware(['fecha_entrada', 'fecha_salida'])], updateEntradas);

module.exports = router;