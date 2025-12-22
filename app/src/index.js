const express = require('express')
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');


//APP de express
const app = express()
const port = process.env.PORT;

//Node Server
const server = require('http').createServer(app);
module.exports. io = require('socket.io')(server);

require('./sockets/socket');


//Path publico
const publicPath =path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

//Lectura y parseo del body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Seguridad y buenas prácticas
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use(limiter);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

//mis rutas
// app.use('/api',require('./routes/routes'));
app.use('/api/',require('./routes/usuarios'));
app.use('/api/entradas',require('./routes/entradas'));
app.use('/api/externas',require('./routes/externas'));
app.use('/api/internas',require('./routes/internas'));
app.use('/api/tornos',require('./routes/tornos'));

// 🟢 Ruta de salud (para ver si el servidor responde)
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

//ejecucion del servidor
server.listen(port, () => {
  console.log(`App Entradas listening on port ${port}`)
})

// Apagado elegante (graceful shutdown)
const ioInstance = module.exports.io;
const shutdown = (signal) => {
  console.log(`Recibido ${signal}. Cerrando servidor con gracia...`);
  // Cerrar nuevas conexiones
  server.close((err) => {
    if (err) {
      console.error('Error cerrando servidor HTTP:', err);
    }
    // Cerrar Socket.IO
    try {
      if (ioInstance && typeof ioInstance.close === 'function') {
        ioInstance.close();
      }
    } catch (e) {
      console.error('Error cerrando Socket.IO:', e);
    }
    process.exit(0);
  });
  // Fallback por si close se atasca
  setTimeout(() => {
    console.warn('Forzando salida tras timeout de cierre.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
