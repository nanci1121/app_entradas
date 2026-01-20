import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from '../helpers/logger';

const parseOrigins = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const createCorsOptions = (): CorsOptions => {
  const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);

  if (!allowedOrigins.length) {
    return { origin: true, credentials: true };
  }

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const error = new Error('CORS not allowed');
        (error as any).status = 403;
        callback(error);
      }
    },
    credentials: true
  };
};

export const createRateLimiter = () => {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX || 100);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, mensaje: 'Demasiadas solicitudes, intente más tarde.' });
    }
  });
};

export const applySecurityMiddleware = (app: express.Application): void => {
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      },
    },
    hsts: false, // Desactivar Strict-Transport-Security en desarrollo
  }));
  app.use(cors(createCorsOptions()));
  app.use(pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/ping' },
    customSuccessMessage: (_req, res) => `HTTP ${res.statusCode}`,
    customErrorMessage: (_req, res, error) => `HTTP ${res.statusCode} - ${error.message}`,
    quietReqLogger: true
  }));
  app.use(createRateLimiter());
};
