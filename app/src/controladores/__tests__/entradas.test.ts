import { getEntradas, getEntradasSelect, getEntrada, setEntrada, updateRecepcionEntrada, updatePorteriaEntrada, updateEntradas, deleteEntrada, getEntradaByMatricula } from '../entradas';
import { Request, Response } from 'express';

jest.mock('../../database/conexion', () => ({
  query: jest.fn(),
}));

jest.mock('../../helpers/jwt', () => ({
  comprobarJWT: jest.fn(() => [true, 1]),
}));

jest.mock('../../models/entrada', () => {
  // Mock como constructor compatible con `new Entrada(...)`
  return jest.fn().mockImplementation((
    id,
    nombreConductor,
    empresa,
    matricula,
    claseCarga,
    fechaEntrada,
    firma,
    fechaSalida,
    recepcio,
    vigilancia,
    usuario
  ) => ({
    id,
    nombreConductor,
    empresa,
    matricula,
    claseCarga,
    fechaEntrada,
    firma,
    fechaSalida,
    recepcio,
    vigilancia,
    usuario,
  }));
});

const pool = require('../../database/conexion');
const { comprobarJWT } = require('../../helpers/jwt');

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockRequest = (overrides: Partial<Request> = {}) => {
  return {
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
};

describe('Controlador Entradas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getEntradas devuelve ok true con lista', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    pool.query.mockResolvedValueOnce({ rowCount: rows.length, rows });

    const req = mockRequest();
    const res = mockResponse();

    await getEntradas(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      cantidad: rows.length,
      entradas: rows,
    });
  });

  it('getEntradasSelect requiere fecha_entrada1', async () => {
    const req = mockRequest({ body: { fecha_entrada1: '' } });
    const res = mockResponse();

    await getEntradasSelect(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      mensaje: 'El campo fecha_entrada1 es obligatorio para la búsqueda.',
    });
  });

  it('getEntrada responde mensaje cuando no existe', async () => {
    const req = mockRequest({ params: { id: '10' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await getEntrada(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: 10,
      mensaje: 'entrada con id 10 no se encuentra',
    });
  });

  it('setEntrada retorna 401 si no hay token', async () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();

    await setEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('setEntrada retorna 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ headers: { 'x-token': 'bad' }, body: {} });
    const res = mockResponse();

    await setEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('setEntrada retorna 400 si faltan campos obligatorios', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { nombre_conductor: 'A' } });
    const res = mockResponse();

    await setEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Datos enviados nulos o incompletos' });
  });

  it('setEntrada crea entrada cuando datos válidos', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([true, 99]);
    const req = mockRequest({
      headers: { 'x-token': 'token' },
      body: {
        nombre_conductor: 'Juan',
        firma: 'firma123',
        empresa: 'ACME',
        matricula: 'ABC123',
        clase_carga: 'General',
        fecha_entrada: '2025-01-05 10:00:00',
      },
    });
    const res = mockResponse();

    pool.query
      .mockResolvedValueOnce({}) // INSERT
      .mockResolvedValueOnce({
        rows: [{
          id: 7,
          nombre_conductor: 'Juan',
          empresa: 'ACME',
          matricula: 'ABC123',
          clase_carga: 'General',
          fecha_entrada: '2025-01-05 10:00:00',
          firma: 'firma123',
        }],
      });

    await setEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      entrada: expect.objectContaining({ id: 7, nombreConductor: 'Juan', empresa: 'ACME' }),
    });
  });

  it('updateRecepcionEntrada retorna 400 si faltan campos', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 1 } });
    const res = mockResponse();

    await updateRecepcionEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Los campos id y recepcion son obligatorios.' });
  });

  it('updateRecepcionEntrada retorna 404 si id no existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 2, recepcion: true } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await updateRecepcionEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró ninguna entrada con el id 2.' });
  });

  it('updateRecepcionEntrada actualiza cuando existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 3, recepcion: true } });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] }) // existe
      .mockResolvedValueOnce({}); // update

    await updateRecepcionEntrada(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      mensaje: 'El estado de recepción de la entrada ha sido actualizado correctamente.'
    });
  });

  it('updatePorteriaEntrada valida campos obligatorios', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 1, vigilancia: true } });
    const res = mockResponse();

    await updatePorteriaEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Los campos id, vigilancia y fecha son obligatorios.' });
  });

  it('updatePorteriaEntrada retorna 404 si id no existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 5, vigilancia: true, fecha: '2025-01-05' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await updatePorteriaEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró ninguna entrada con el id 5.' });
  });

  it('updatePorteriaEntrada actualiza cuando existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 6, vigilancia: true, fecha: '2025-01-05' } });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 6 }] }) // existe
      .mockResolvedValueOnce({}); // update

    await updatePorteriaEntrada(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      mensaje: 'El estado de portería de la entrada ha sido actualizado correctamente.'
    });
  });

  it('updateEntradas retorna 401 si no hay token', async () => {
    const req = mockRequest({ params: { id: '1' }, headers: {}, body: {} });
    const res = mockResponse();

    await updateEntradas(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('updateEntradas retorna 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ params: { id: '1' }, headers: { 'x-token': 'bad' }, body: {} });
    const res = mockResponse();

    await updateEntradas(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('updateEntradas responde mensaje si id no existe', async () => {
    const req = mockRequest({ params: { id: '9' }, headers: { 'x-token': 'token' }, body: {} });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await updateEntradas(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: 9, mensaje: 'Entrada con id 9 no se encuentra' });
  });

  it('updateEntradas actualiza cuando existe', async () => {
    const req = mockRequest({
      params: { id: '4' },
      headers: { 'x-token': 'token' },
      body: {
        nombre_conductor: 'Pepe',
        empresa: 'ACME',
        matricula: 'ACM123',
        clase_carga: 'Gen',
        fecha_entrada: '2025-01-05',
        fecha_salida: '2025-01-06'
      }
    });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 4 }] }) // existe
      .mockResolvedValueOnce({}); // update

    await updateEntradas(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Entrada 4 modificada satisfactoriamente' });
  });

  it('deleteEntrada retorna 400 si id inválido', async () => {
    const req = mockRequest({ params: { id: 'abc' } });
    const res = mockResponse();

    await deleteEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'El ID proporcionado no es un número válido.' });
  });

  it('deleteEntrada retorna 404 si no existe', async () => {
    const req = mockRequest({ params: { id: '11' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await deleteEntrada(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró ninguna entrada con el id 11.' });
  });

  it('deleteEntrada elimina cuando existe', async () => {
    const entrada = { id: 12, nombre_conductor: 'X' };
    const req = mockRequest({ params: { id: '12' } });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [entrada] }) // existe
      .mockResolvedValueOnce({}); // delete

    await deleteEntrada(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      mensaje: 'La entrada ha sido eliminada correctamente.',
      entrada,
    });
  });

  it('getEntradaByMatricula retorna 404 si no existe', async () => {
    const req = mockRequest({ params: { matricula: 'XYZ' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await getEntradaByMatricula(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró entrada para la matrícula XYZ' });
  });

  it('getEntradaByMatricula devuelve entrada cuando existe', async () => {
    const req = mockRequest({ params: { matricula: 'XYZ' } });
    const res = mockResponse();
    const row = { id: 1, matricula: 'XYZ' };
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [row] });

    await getEntradaByMatricula(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, entrada: row });
  });
});
