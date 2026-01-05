import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middelwares/validar-campos';
import { validarJWT } from '../middelwares/validar-jwt';

// Importar controladores (CommonJS por ahora)
const {
    todosUsuarios,
    usuarioId,
    login,
    deleteUsuario,
    createUsuario,
    updateUsuario,
    renewToken
} = require('../controladores/usuarios');

const router = Router();

// GET - Obtener todos los usuarios (requiere autenticación)
router.get('/users', validarJWT, todosUsuarios);

// GET - Obtener usuario específico (requiere autenticación)
router.get('/users/:id', validarJWT, usuarioId);

// POST - Login
router.post('/login', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarCampos
], login);

// POST - Crear nuevo usuario
router.post('/login/new', [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarCampos
], createUsuario);

// GET - Renovar token JWT (requiere autenticación)
router.get('/login/renew', validarJWT, renewToken);

// PUT - Actualizar usuario
router.put('/users/:id', [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarCampos
], updateUsuario);

// DELETE - Eliminar usuario (requiere autenticación)
router.delete('/users/:id', validarJWT, deleteUsuario);

export default router;
