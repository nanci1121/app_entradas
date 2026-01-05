import { Server, Socket } from 'socket.io';
import { comprobarJWT } from '../helpers/jwt';
import { logger } from '../helpers/logger';
const { usuarioConectado, usuarioDesconectado } = require('../controladores/socket');

// Registrar handlers de Socket.IO sin dependencia circular con index
export const registerSocketHandlers = (io: Server): void => {
    io.on('connection', (client: Socket): void => {
        const xToken = client.handshake.headers['x-token'] as string | undefined;
        const [valid, id] = xToken ? comprobarJWT(xToken) : [false, null];

        if (!valid || !id) {
            logger.warn({ tokenPresent: Boolean(xToken) }, 'Socket desconectado por token inválido');
            client.disconnect();
            return;
        }

        const roomId = String(id);

        // Marcar usuario como conectado en BD
        usuarioConectado(roomId).catch((err: Error) => logger.error({ err, roomId }, 'Error en usuarioConectado'));

        // Unir a sala propia
        client.join(roomId);
        logger.info({ roomId }, 'Socket conectado y unido a sala personal');

        // Mensajes personales
        client.on('mensaje-personal', (payload) => {
            if (!payload || !payload.para) {
                return;
            }
            io.to(payload.para).emit('mensaje-personal', payload);
        });

        // Desconexión
        client.on('disconnect', () => {
            usuarioDesconectado(roomId).catch((err: Error) => logger.error({ err, roomId }, 'Error en usuarioDesconectado'));
            logger.info({ roomId }, 'Socket desconectado');
        });
    });
};
