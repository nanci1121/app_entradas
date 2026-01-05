import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

interface ErrorResponse {
    ok: boolean;
    errors?: any;
}

export const validarCampos = (req: Request, res: Response, next: NextFunction): void => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        res.status(400).json({
            ok: false,
            errors: errores.mapped()
        } as ErrorResponse);
        return;
    }
    next();
};

export default { validarCampos };
