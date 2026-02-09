// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { applySecurityMiddleware } from './config/security';
import { globalErrorHandler, notFoundHandler } from './middelwares/error-handler';
import { logger, captureConsole } from './helpers/logger';
import { registerSocketHandlers } from './sockets/socket';

import { validarJWT } from './middelwares/validar-jwt';

// Redirigir console.* a logger
captureConsole();

// APP de express
const app: Application = express();
const port = process.env.PORT || 3000;

// Node Server
const server = http.createServer(app);
export const io = new SocketIOServer(server);

// Registrar manejadores de sockets
registerSocketHandlers(io);

// 📚 Documentación Swagger/OpenAPI (Pública)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "API Entradas - Documentación"
}));

// Ruta para obtener el JSON de OpenAPI (Pública)
app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Seguridad (Helmet, CORS, rate limiting, logging HTTP)
applySecurityMiddleware(app);

// Path publico
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// Lectura y parseo del body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!')
});

// Mis rutas
function getRouter(module: any) {
    return module.default || module;
}
app.use('/api/', getRouter(require('./routes/usuarios')));
app.use('/api/entradas', getRouter(require('./routes/entradas')));
app.use('/api/externas', getRouter(require('./routes/externas')));
app.use('/api/internas', getRouter(require('./routes/internas')));
app.use('/api/tornos', getRouter(require('./routes/tornos')));

// 🟢 Ruta de salud (para ver si el servidor responde)
app.get('/api/ping', (_req: Request, res: Response) => {
    res.status(200).send('pong');
});

// 404 y handler de errores
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Ejecución del servidor
server.listen(port, () => {
    logger.info(`App Entradas listening on port ${port}`);
    logger.info(`Documentación API: http://localhost:${port}/api-docs`);
});
