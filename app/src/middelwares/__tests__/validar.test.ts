import { validarJWT } from '../../middelwares/validar-jwt';
import { validarCampos } from '../../middelwares/validar-campos';
import { Request, Response, NextFunction } from 'express';
import { generarJWT } from '../../helpers/jwt';
import { validationResult } from 'express-validator';

// Mock express-validator to control validation results
jest.mock('express-validator', () => ({
    validationResult: jest.fn()
}));

// Mock de Request y Response
const mockRequest = (overrides = {}) => ({
    header: jest.fn(),
    ...overrides,
} as unknown as Request);

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('Middleware: validarJWT', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería retornar 400 si no hay token', () => {
        const req = mockRequest({ header: jest.fn().mockReturnValue(undefined) });
        const res = mockResponse();

        validarJWT(req as any, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            msg: 'No hay token'
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('debería aceptar un token válido y llamar a next()', async () => {
        const userId = 123;
        const token = await generarJWT(userId);
        
        const req = mockRequest({ header: jest.fn().mockReturnValue(token) });
        const res = mockResponse();

        validarJWT(req as any, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect((req as any).id).toBe(userId);
    });

    it('debería retornar 401 si el token es inválido', () => {
        const req = mockRequest({ header: jest.fn().mockReturnValue('token.invalido.aqui') });
        const res = mockResponse();

        validarJWT(req as any, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            msg: 'Token no válido'
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('debería retornar 401 si el token está expirado o corrupto', () => {
        const req = mockRequest({ header: jest.fn().mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid') });
        const res = mockResponse();

        validarJWT(req as any, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('Middleware: validarCampos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería llamar a next() si no hay errores de validación', () => {
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: () => true,
            mapped: () => ({})
        });

        const req = mockRequest();
        const res = mockResponse();

        validarCampos(req as any, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
