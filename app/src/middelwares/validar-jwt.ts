import { Request, Response, NextFunction } from 'express';
import { ReqId } from 'pino-http';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Permitimos string|number para compatibilidad con pino-http (req.id es string por defecto)
interface AuthRequest extends Request {
    id: ReqId; // pino-http añade req.id (string | number | object)
}

export const validarJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Leer token del header
    const token = req.header('x-token') as string | undefined;

    if (!token) {
        res.status(400).json({
            ok: false,
            msg: 'No hay token'
        });
        return;
    }

    try {
        const jwtKey = process.env.JWT_KEY;
        if (!jwtKey) {
            res.status(500).json({
                ok: false,
                msg: 'Configuración de servidor inválida'
            });
            return;
        }

        const decoded = jwt.verify(token, jwtKey) as JWTPayload;
        req.id = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};

export default { validarJWT };
