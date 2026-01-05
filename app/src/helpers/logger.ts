import pino from 'pino';

// Centralizado para logs estructurados; nivel configurable por LOG_LEVEL o NODE_ENV
const level = process.env.LOG_LEVEL
  || (process.env.NODE_ENV === 'production' ? 'info'
  : process.env.NODE_ENV === 'test' ? 'silent' : 'debug');

export const logger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

// Redirige console.* al logger para capturar trazas existentes
export const captureConsole = (): void => {
  const map: Record<'log' | 'info' | 'warn' | 'error', 'info' | 'warn' | 'error'> = {
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error'
  };

  (Object.keys(map) as Array<keyof typeof map>).forEach((method) => {
    const levelName = map[method];
    const original = console[method] as (...args: unknown[]) => void;

    console[method] = (...args: unknown[]) => {
      (logger as any)[levelName](...args);
      if (process.env.FORCE_CONSOLE_FALLBACK === 'true') {
        original(...args);
      }
    };
  });
};
