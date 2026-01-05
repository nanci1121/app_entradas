import { registerSocketHandlers } from '../socket';
import { Server, Socket } from 'socket.io';

jest.mock('../../helpers/jwt', () => ({
  comprobarJWT: jest.fn(() => [true, '123']),
}));

jest.mock('../../controladores/socket', () => ({
  usuarioConectado: jest.fn(() => Promise.resolve()),
  usuarioDesconectado: jest.fn(() => Promise.resolve()),
}));

const { comprobarJWT } = require('../../helpers/jwt');
const { usuarioConectado, usuarioDesconectado } = require('../../controladores/socket');

const mockSocket = (headers: Record<string, string | undefined> = {}): Socket => {
  const listeners: Record<string, (...args: any[]) => void> = {};

  return {
    handshake: { headers },
    join: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn((event: string, cb: (...args: any[]) => void) => {
      listeners[event] = cb;
    }),
    emit: jest.fn(),
    getListener: (event: string) => listeners[event],
  } as unknown as Socket & { getListener: (event: string) => (...args: any[]) => void };
};

const mockIO = () => {
  let connectionHandler: ((socket: Socket) => void) | null = null;
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));

  return {
    on: jest.fn((event: string, cb: (socket: Socket) => void) => {
      if (event === 'connection') {
        connectionHandler = cb;
      }
    }),
    to,
    triggerConnection: (socket: Socket) => connectionHandler && connectionHandler(socket),
    emit,
  } as unknown as Server & { triggerConnection: (socket: Socket) => void; emit: jest.Mock; to: jest.Mock };
};

describe('registerSocketHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (comprobarJWT as jest.Mock).mockReset().mockReturnValue([true, '123']);
    (usuarioConectado as jest.Mock).mockReset().mockResolvedValue(undefined);
    (usuarioDesconectado as jest.Mock).mockReset().mockResolvedValue(undefined);
  });

  it('desconecta si el token es inválido o faltante', () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([false, null]);
    const io = mockIO();
    registerSocketHandlers(io as unknown as Server);

    const client = mockSocket({});
    io.triggerConnection(client as unknown as Socket);

    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
    expect(usuarioConectado).not.toHaveBeenCalled();
    expect(comprobarJWT).not.toHaveBeenCalled();
  });

  it('se une a la sala y marca conectado cuando el token es válido', () => {
    (comprobarJWT as jest.Mock).mockReturnValueOnce([true, '123']);
    const io = mockIO();
    registerSocketHandlers(io as unknown as Server);

    const client = mockSocket({ 'x-token': 'token' });

    io.triggerConnection(client as unknown as Socket);

    expect(comprobarJWT).toHaveBeenCalledWith('token');
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('123');
    expect(usuarioConectado).toHaveBeenCalledWith('123');
  });

  it('emite mensaje-personal a la sala destino', () => {
    const io = mockIO();
    registerSocketHandlers(io as unknown as Server);

    const client = mockSocket({ 'x-token': 'token' });
    io.triggerConnection(client as unknown as Socket);

    const listener = (client as any).getListener('mensaje-personal');
    const payload = { para: '321', cuerpo: 'hola' };
    listener(payload);

    expect(io.to).toHaveBeenCalledWith('321');
    expect((io as any).to.mock.results[0].value.emit).toHaveBeenCalledWith('mensaje-personal', payload);
  });

  it('no emite si falta el campo "para" en el payload', () => {
    const io = mockIO();
    registerSocketHandlers(io as unknown as Server);

    const client = mockSocket({ 'x-token': 'token' });
    io.triggerConnection(client as unknown as Socket);

    const listener = (client as any).getListener('mensaje-personal');
    const payload = { cuerpo: 'hola' } as any;
    listener(payload);

    expect(io.to).not.toHaveBeenCalled();
  });

  it('marca desconectado al cerrar la conexión', () => {
    const io = mockIO();
    registerSocketHandlers(io as unknown as Server);

    const client = mockSocket({ 'x-token': 'token' });
    io.triggerConnection(client as unknown as Socket);

    const disconnectListener = (client as any).getListener('disconnect');
    disconnectListener();

    expect(usuarioDesconectado).toHaveBeenCalledWith('123');
  });
});
