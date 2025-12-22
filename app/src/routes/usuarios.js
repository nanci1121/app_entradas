/*

path: api/

*/

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { validarCampos } = require('../middelwares/validar-campos')
const { validarJWT } = require('../middelwares/validar-jwt');

const { todosUsuarios,
    usuarioId,
    login,
    deleteUsuario,
    createUsuario,
    updateUsuario,
    renewToken } = require("../controladores/usuarios");

router.get('/users', validarJWT, todosUsuarios);
router.get('/users/:id', validarJWT, usuarioId);
router.post('/login',
    [
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'El password es obligatorio').not().isEmpty(), validarCampos
    ], login);
router.post('/login/new',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'El password es obligatorio').not().isEmpty(), validarCampos
    ], createUsuario);
router.get('/login/renew', validarJWT, renewToken); /* [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(), validarCampos
], validarJWT,  */
router.put('/users/:id', [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(), validarCampos
], updateUsuario);
router.delete('/users/:id', validarJWT, deleteUsuario);



module.exports = router;