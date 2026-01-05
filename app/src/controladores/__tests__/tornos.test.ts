import {
  getTorno,
  getTornosHoy,
  setTorno,
  getTornoCode,
  updateTorno,
  deleteTorno,
  consultaTorno,
} from '../tornos';
import { Request, Response } from 'express';

jest.mock('../../database/conexion', () => ({
  query: jest.fn(),
}));

jest.mock('../../helpers/jwt', () => ({
  comprobarJWT: jest.fn(() => [true, 1]),
}));

const pool = require('../../database/conexion');
const { comprobarJWT } = require('../../helpers/jwt');

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (overrides: Partial<Request> = {}) => ({
  query: {},
  params: {},
  ...overrides,
} as unknown as Request);

describe('Controlador Tornos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprobarJWT as jest.Mock).mockReturnValue([true, 1]);
  });

  it('getTorno devuelve 400 si id no es número', async () => {
    const res = mockResponse();
    await getTorno(mockRequest({ params: { id: 'abc' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      mensaje: 'El ID proporcionado no es un número válido.',
    });
  });

  it('getTorno devuelve 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();
    await getTorno(mockRequest({ params: { id: '10' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      mensaje: 'No se encontró ningún registro de torno con el id 10.',
    });
  });

  it('getTorno devuelve registro cuando existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2 }] });
    const res = mockResponse();
    await getTorno(mockRequest({ params: { id: '2' } }), res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      torno: { id: 2 },
    });
  });

  it('getTornosHoy retorna lista filtrada', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    const res = mockResponse();

    await getTornosHoy(mockRequest({ query: { date: '2025-01-05', limit: '10', offset: '0' } }), res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      tornos: [{ id: 1 }],
    });
  });

  it('setTorno responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await setTorno(mockRequest({ headers: {}, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no válido o expirado.' });
  });

  it('setTorno valida campos obligatorios', async () => {
    const res = mockResponse();

    await setTorno(mockRequest({ headers: { 'x-token': 'token' }, body: { codigoEmpleado: '' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'El código de empleado y al menos una fecha (entrada o salida) son obligatorios.' });
  });

  it('setTorno valida orden de fechas', async () => {
    const res = mockResponse();

    await setTorno(
      mockRequest({
        headers: { 'x-token': 'token' },
        body: { codigoEmpleado: '1', fechaEntrada: '2025-01-06', fechaSalida: '2025-01-05' },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'La fecha de entrada no puede ser posterior a la fecha de salida.' });
  });

  it('setTorno responde 404 si empleado no existe', async () => {
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await setTorno(
      mockRequest({
        headers: { 'x-token': 'token' },
        body: { codigoEmpleado: '1', fechaSalida: '2025-01-05' },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'El código de empleado 1 no existe.' });
  });

  it('setTorno crea cuando datos válidos', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 9 }] });

    await setTorno(
      mockRequest({
        headers: { 'x-token': 'token' },
        body: { codigoEmpleado: '1', fechaEntrada: '2025-01-05', fechaSalida: '2025-01-06' },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ok: true, torno_id: 9, mensaje: 'Registro de torno creado correctamente' });
  });

  it('getTornoCode retorna 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await getTornoCode(mockRequest({ body: { code: 'X' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'No se encontró un empleado con el código X' });
  });

  it('getTornoCode devuelve usuario si existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ name: 'Ana' }] });
    const res = mockResponse();

    await getTornoCode(mockRequest({ body: { code: 'X' } }), res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, usuario: { name: 'Ana' } });
  });

  it('updateTorno responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await updateTorno(mockRequest({ params: { id: '3' }, headers: {}, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no válido o expirado.' });
  });

  it('updateTorno valida que haya campos a actualizar', async () => {
    const res = mockResponse();

    await updateTorno(mockRequest({ params: { id: '3' }, headers: { 'x-token': 'token' }, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Debe proporcionar al menos un campo para actualizar.' });
  });

  it('updateTorno responde 404 si id no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await updateTorno(
      mockRequest({ params: { id: '3' }, headers: { 'x-token': 'token' }, body: { codigoEmpleado: '1' } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró un registro de torno con el id 3.' });
  });

  it('updateTorno actualiza cuando existe', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] })
      .mockResolvedValueOnce({});

    await updateTorno(
      mockRequest({ params: { id: '3' }, headers: { 'x-token': 'token' }, body: { codigoEmpleado: '1', fechaEntrada: '2025-01-05' } }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Registro de torno con id 3 actualizado correctamente.' });
  });

  it('deleteTorno responde 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await deleteTorno(mockRequest({ params: { id: '4' } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró un registro de torno con el id 4.' });
  });

  it('deleteTorno elimina cuando existe', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 4 }] })
      .mockResolvedValueOnce({});

    await deleteTorno(mockRequest({ params: { id: '4' } }), res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Registro de torno con id 4 eliminado satisfactoriamente.' });
  });

  it('consultaTorno valida rango de fechas', async () => {
    const res = mockResponse();

    await consultaTorno(
      mockRequest({ body: { fechaInicio: '2025-01-06', fechaFin: '2025-01-05' } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
  });

  it('consultaTorno devuelve lista filtrada', async () => {
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    await consultaTorno(
      mockRequest({ body: { fechaInicio: '2025-01-05', fechaFin: '2025-01-06', codigoEmpleado: '1', limit: 10, offset: 0 } }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true, cantidad: 1, tornos: [{ id: 1 }] });
  });
});
