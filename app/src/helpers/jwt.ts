import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export const generarJWT = (id: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload: JWTPayload = { id };

        const jwtKey = process.env.JWT_KEY;
        if (!jwtKey) {
            return reject('JWT_KEY no está configurada');
        }

        jwt.sign(payload, jwtKey, {
            expiresIn: '24h'
        }, (err, token) => {
            if (err) {
                reject('No se pudo generar el JWT');
            } else if (token) {
                resolve(token);
            } else {
                reject('Token no generado');
            }
        });
    });
};

export const comprobarJWT = (token: string): [boolean, number | null] => {
    try {
        const jwtKey = process.env.JWT_KEY;
        if (!jwtKey) {
            return [false, null];
        }

        const decoded = jwt.verify(token, jwtKey) as JWTPayload;
        return [true, decoded.id];
    } catch (error) {
        return [false, null];
    }
};
