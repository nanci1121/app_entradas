import { Request, Response, NextFunction } from 'express';
import { logger } from '../helpers/logger';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
};

export const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const status = (err as any)?.status || ((err as Error)?.message === 'CORS not allowed' ? 403 : 500);

  logger.error({ err }, 'Unhandled error');

  if (res.headersSent) {
    return;
  }

  const mensaje = status === 403 ? 'CORS no permitido para este origen.' : 'Error inesperado. Intente más tarde.';
  res.status(status).json({ ok: false, mensaje });
};
