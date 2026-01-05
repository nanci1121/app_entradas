import {
  getInternaCode,
  getInternasHoy,
  getInterna,
  setInterna,
  updatePorteriaInterna,
  deleteInterna,
  consultaInterna,
  updateInternas,
} from '../internas';
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
  body: {},
  params: {},
  ...overrides,
} as unknown as Request);

describe('Controlador Internas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprobarJWT as jest.Mock).mockReturnValue([true, 1]);
  });

  it('getInternasHoy responde con filas del día', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    const res = mockResponse();

    await getInternasHoy(mockRequest(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      cantidad: 1,
      internas: [{ id: 1 }],
    });
  });

  it('getInternaCode devuelve 400 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();
    const req = mockRequest({ body: { code: 'ABC' } });

    await getInternaCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      codigo_empleado: 'ABC',
      mensaje: 'empleado con codigo empleado ABC no se encuentra',
    });
  });

  it('getInterna devuelve mensaje si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();
    const req = mockRequest({ params: { id: '5' } });

    await getInterna(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: 5,
      mensaje: 'empleado con id 5 no se encuentra',
    });
  });

  it('setInterna responde 401 si no hay token', async () => {
    const res = mockResponse();

    await setInterna(mockRequest({ headers: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token no proporcionado' });
  });

  it('setInterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await setInterna(mockRequest({ headers: { 'x-token': 'bad' } }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token inválido' });
  });

  it('setInterna valida campos obligatorios', async () => {
    const res = mockResponse();

    await setInterna(mockRequest({ headers: { 'x-token': 'token' }, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, entrada: 'datos empleado enviados nulos' });
  });

  it('setInterna crea cuando datos válidos', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 10 }] });

    await setInterna(
      mockRequest({
        headers: { 'x-token': 'token' },
        body: { codigoEmpleado: '123', nombrePersona: 'Ana', fechaSalida: '2025-01-05', motivo: 'X' },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, interna: 10 });
  });

  it('updatePorteriaInterna responde 401 si no hay token', async () => {
    const res = mockResponse();

    await updatePorteriaInterna(mockRequest({ headers: {}, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token no proporcionado' });
  });

  it('updatePorteriaInterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await updatePorteriaInterna(mockRequest({ headers: { 'x-token': 'bad' }, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token inválido' });
  });

  it('updatePorteriaInterna responde 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await updatePorteriaInterna(
      mockRequest({ headers: { 'x-token': 'token' }, body: { id: 9, fechaEntrada: '2025-01-05' } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'No se encontró interna con id 9' });
  });

  it('updatePorteriaInterna actualiza cuando existe', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 9 }] })
      .mockResolvedValueOnce({});

    await updatePorteriaInterna(
      mockRequest({ headers: { 'x-token': 'token' }, body: { id: 9, fechaEntrada: '2025-01-05' } }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Entrada empleado actualizada correctamente' });
  });

  it('deleteInterna responde 401 si no hay token', async () => {
    const res = mockResponse();

    await deleteInterna(mockRequest({ params: { id: '5' }, headers: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token no proporcionado' });
  });

  it('deleteInterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await deleteInterna(mockRequest({ params: { id: '5' }, headers: { 'x-token': 'bad' } }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token inválido' });
  });

  it('deleteInterna responde mensaje si id no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await deleteInterna(mockRequest({ params: { id: '5' }, headers: { 'x-token': 'token' } }), res);

    expect(res.json).toHaveBeenCalledWith({ id: 5, mensaje: 'Persona interna con id 5 no se encuentra' });
  });

  it('deleteInterna elimina cuando existe', async () => {
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5 }] })
      .mockResolvedValueOnce({});

    await deleteInterna(mockRequest({ params: { id: '5' }, headers: { 'x-token': 'token' } }), res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Salida empleado 5 eliminada satisfactoriamente' });
  });

  it('updateInternas responde 401 si no hay token', async () => {
    const res = mockResponse();

    await updateInternas(mockRequest({ params: { id: '6' }, headers: {}, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token no proporcionado' });
  });

  it('updateInternas responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const res = mockResponse();

    await updateInternas(mockRequest({ params: { id: '6' }, headers: { 'x-token': 'bad' }, body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Token inválido' });
  });

  it('updateInternas responde 404 si no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();

    await updateInternas(
      mockRequest({ params: { id: '6' }, headers: { 'x-token': 'token' }, body: {} }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No existe registro con id 6' });
  });

  it('updateInternas actualiza cuando existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 6 }] })
      .mockResolvedValueOnce({});
    const res = mockResponse();

    await updateInternas(
      mockRequest({
        params: { id: '6' },
        headers: { 'x-token': 'token' },
        body: {
          codigo_empleado: '123',
          nombre_persona: 'Ana',
          fecha_entrada: '2025-01-05',
          fecha_salida: '2025-01-06',
          motivo: 'X',
        },
      }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Registro 6 modificado satisfactoriamente' });
  });

  it('consultaInterna valida fecha_entrada obligatoria', async () => {
    const res = mockResponse();

    await consultaInterna(mockRequest({ body: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.' });
  });

  it('consultaInterna devuelve lista filtrada', async () => {
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    await consultaInterna(
      mockRequest({ body: { fecha_entrada: '2025-01-05', fecha_entrada2: '2025-01-06', limit: 10, offset: 0 } }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true, cantidad: 1, internas: [{ id: 1 }] });
  });
});
