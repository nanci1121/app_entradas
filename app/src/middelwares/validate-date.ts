import { Request, Response, NextFunction } from 'express';

export const parseAndValidateDate = (dateString: string): Date | null => {
    if (!dateString) {
        return null;
    }

    // Regex to strictly validate YYYY-MM-DD format, allowing for an optional time part.
    // This avoids environment-specific parsing of month names (like "octubre").
    const isoRegex = /^\d{4}-\d{2}-\d{2}([\sT]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?)?$/;

    if (!isoRegex.test(dateString)) {
        return null;
    }

    const date = new Date(dateString);

    // Double-check for invalid dates that might somehow pass the regex (e.g., invalid day/month numbers)
    if (isNaN(date.getTime())) {
        return null;
    }

    // Validate: Not in the future
    const now = new Date();
    if (date.getTime() > now.getTime()) {
        return null;
    }

    return date;
};

export const validateDateMiddleware = (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        for (const field of fields) {
            if (req.body[field]) {
                const parsedDate = parseAndValidateDate(req.body[field]);
                if (!parsedDate) {
                    res.status(400).json({
                        ok: false,
                        mensaje: `El campo '${field}' tiene un formato de fecha inválido, no sigue el formato YYYY-MM-DD, o es una fecha futura.`
                    });
                    return;
                }
            }
        }
        next();
    };
};

export default { parseAndValidateDate, validateDateMiddleware };
