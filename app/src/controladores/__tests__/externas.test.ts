import {
  getExternasHoy,
  getExterna,
  getExternaPorteria,
  setExterna,
  updatePorteriaExterna,
  deleteExterna,
  updateExternas,
  buscarExterna,
  getExternaByNombreConductor
} from '../externas';
import { Request, Response } from 'express';

jest.mock('../../database/conexion', () => ({
  query: jest.fn(),
}));

jest.mock('../../helpers/jwt', () => ({
  comprobarJWT: jest.fn(() => [true, 1]),
}));

jest.mock('../../models/externa', () => ({
  Externa: {
    fromRequest: (data: any) => ({ ...data }),
  },
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
  headers: {},
  ...overrides,
} as unknown as Request);

describe('Controlador Externas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprobarJWT as jest.Mock).mockReturnValue([true, 1]);
  });

  it('getExternasHoy responde con filas del día', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ to_char: '2025-01-05' }] })
      .mockResolvedValueOnce({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });

    const res = mockResponse();
    await getExternasHoy(mockRequest(), res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      cantidad: 2,
      externas: [{ id: 1 }, { id: 2 }],
    });
  });

  it('getExterna retorna mensaje cuando no existe', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    const res = mockResponse();
    await getExterna(mockRequest({ params: { id: '99' } }), res);

    expect(res.json).toHaveBeenCalledWith({
      id: 99,
      mensaje: 'persona externa con id 99 no se encuentra',
    });
  });

  it('getExternaPorteria devuelve lista', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    const res = mockResponse();

    await getExternaPorteria(mockRequest(), res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      cantidad: 1,
      externas: [{ id: 1 }],
    });
  });

  it('setExterna responde 401 si no hay token', async () => {
    const req = mockRequest({ headers: {}, body: {} });
    const res = mockResponse();

    await setExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('setExterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ headers: { 'x-token': 'bad' }, body: {} });
    const res = mockResponse();

    await setExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('setExterna valida campos obligatorios', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { nombrePersona: '' } });
    const res = mockResponse();

    await setExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Datos de persona exterior incompletos' });
  });

  it('setExterna crea cuando datos válidos', async () => {
    const req = mockRequest({
      headers: { 'x-token': 'token' },
      body: {
        nombrePersona: 'Ana',
        empresaExterior: 'ACME',
        peticionario: 'Bob',
        telefonoPersona: '123',
        firma: 'firma',
        fechaEntrada: '2025-01-05',
        nota: 'N'
      }
    });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7 }] });

    await setExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ok: true, externa: 7 });
  });

  it('updatePorteriaExterna responde 401 si no hay token', async () => {
    const req = mockRequest({ headers: {}, body: {} });
    const res = mockResponse();

    await updatePorteriaExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('updatePorteriaExterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ headers: { 'x-token': 'bad' }, body: {} });
    const res = mockResponse();

    await updatePorteriaExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('updatePorteriaExterna responde 404 si no existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 5 } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await updatePorteriaExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontró externa con id 5' });
  });

  it('updatePorteriaExterna actualiza cuando existe', async () => {
    const req = mockRequest({ headers: { 'x-token': 'token' }, body: { id: 5, fechaSalida: '2025-01-05', recepcion: true } });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 5 }] })
      .mockResolvedValueOnce({});

    await updatePorteriaExterna(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Entrada portería actualizada correctamente' });
  });

  it('deleteExterna responde 401 si no hay token', async () => {
    const req = mockRequest({ params: { id: '3' }, headers: {} });
    const res = mockResponse();

    await deleteExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('deleteExterna responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ params: { id: '3' }, headers: { 'x-token': 'bad' } });
    const res = mockResponse();

    await deleteExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('deleteExterna responde mensaje si id no existe', async () => {
    const req = mockRequest({ params: { id: '8' }, headers: { 'x-token': 'token' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await deleteExterna(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: 8, mensaje: 'Persona externa con id 8 no se encuentra' });
  });

  it('deleteExterna elimina cuando existe', async () => {
    const req = mockRequest({ params: { id: '8' }, headers: { 'x-token': 'token' } });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 8 }] })
      .mockResolvedValueOnce({});

    await deleteExterna(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Persona externa 8 eliminada satisfactoriamente' });
  });

  it('updateExternas responde 401 si no hay token', async () => {
    const req = mockRequest({ params: { id: '2' }, headers: {}, body: {} });
    const res = mockResponse();

    await updateExternas(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token no proporcionado' });
  });

  it('updateExternas responde 401 si token inválido', async () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const req = mockRequest({ params: { id: '2' }, headers: { 'x-token': 'bad' }, body: {} });
    const res = mockResponse();

    await updateExternas(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Token inválido' });
  });

  it('updateExternas responde 404 si no existe', async () => {
    const req = mockRequest({ params: { id: '2' }, headers: { 'x-token': 'token' }, body: {} });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await updateExternas(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'Empresa exterior con id 2 no se encuentra' });
  });

  it('updateExternas actualiza cuando existe', async () => {
    const req = mockRequest({
      params: { id: '2' },
      headers: { 'x-token': 'token' },
      body: {
        nombrePersona: 'Ana',
        empresaExterior: 'ACME',
        peticionario: 'Bob',
        telefonoPersona: '123',
        fechaEntrada: '2025-01-05',
        nota: 'N',
        fechaSalida: null,
        recepcion: true,
      },
    });
    const res = mockResponse();
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2 }] })
      .mockResolvedValueOnce({});

    await updateExternas(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, mensaje: 'Empresa exterior con id: 2 modificada satisfactoriamente' });
  });

  it('buscarExterna valida fecha_entrada obligatoria', async () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();

    await buscarExterna(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'El campo fecha_entrada es obligatorio para la búsqueda.' });
  });

  it('buscarExterna devuelve lista filtrada', async () => {
    const req = mockRequest({ body: { fechaEntrada: '2025-01-05', fechaSalida: '2025-01-06' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

    await buscarExterna(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, cantidad: 1, externas: [{ id: 1 }] });
  });

  it('getExternaByNombreConductor retorna 404 si no hay coincidencia', async () => {
    const req = mockRequest({ params: { nombreConductor: 'Ana' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await getExternaByNombreConductor(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, mensaje: 'No se encontraron entradas para el conductor: Ana' });
  });

  it('getExternaByNombreConductor devuelve última entrada', async () => {
    const req = mockRequest({ params: { nombreConductor: 'Ana' } });
    const res = mockResponse();
    pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 3 }] });

    await getExternaByNombreConductor(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, externa: { id: 3 } });
  });
});
