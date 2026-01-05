import { parseAndValidateDate, validateDateMiddleware } from '../validate-date';
import { Request, Response, NextFunction } from 'express';

describe('parseAndValidateDate', () => {
  it('retorna null si string vacío', () => {
    expect(parseAndValidateDate('')).toBeNull();
  });

  it('rechaza formato inválido', () => {
    expect(parseAndValidateDate('05/01/2025')).toBeNull();
    expect(parseAndValidateDate('2025-13-01')).toBeNull();
  });

  it('rechaza fechas futuras', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(parseAndValidateDate(future)).toBeNull();
  });

  it('acepta fecha válida pasada', () => {
    const date = '2024-12-31 10:00:00';
    const parsed = parseAndValidateDate(date);
    expect(parsed).toBeInstanceOf(Date);
  });
});

describe('validateDateMiddleware', () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  it('deja pasar cuando no hay campos', () => {
    const mw = validateDateMiddleware(['fecha']);
    const next = jest.fn();
    mw({ body: {} } as Request, mockRes(), next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('responde 400 cuando formato inválido', () => {
    const mw = validateDateMiddleware(['fecha']);
    const res = mockRes();
    const next = jest.fn();

    mw({ body: { fecha: '01/05/2025' } } as Request, res, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      mensaje: "El campo 'fecha' tiene un formato de fecha inválido, no sigue el formato YYYY-MM-DD, o es una fecha futura.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next cuando fecha válida', () => {
    const mw = validateDateMiddleware(['fecha']);
    const res = mockRes();
    const next = jest.fn();

    mw({ body: { fecha: '2024-12-31 10:00:00' } } as Request, res, next as NextFunction);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
