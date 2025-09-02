const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar servicios de base de datos
const { connectMongoDB } = require('./services/mongodb');
const { connectPostgreSQL } = require('./services/postgresql');
const { connectRedis } = require('./services/redis');

// Importar rutas
const didRoutes = require('./routes/did.routes');
const notificationRoutes = require('./routes/notification.routes');
const deviceRoutes = require('./routes/device.routes');
const authRoutes = require('./routes/auth.routes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Importar servicios
const { initializeSupabase } = require('./services/supabase');
const { setupSocketHandlers } = require('./services/socket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas requests desde esta IP'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/dids', authMiddleware, didRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/auth', authRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      postgresql: 'connected',
      redis: 'connected'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Configurar Socket.io
setupSocketHandlers(io);

// Función para inicializar el servidor
async function startServer() {
  try {
    // Conectar bases de datos
    await connectMongoDB();
    await connectPostgreSQL();
    await connectRedis();
    
    // Inicializar Supabase
    await initializeSupabase();
    
    const PORT = process.env.PORT || 3001;
    
    server.listen(PORT, () => {
      console.log(`🚀 Servidor DIDs ejecutándose en puerto ${PORT}`);
      console.log(`📱 API disponible en http://localhost:${PORT}/api`);
      console.log(`🔍 Health check en http://localhost:${PORT}/health`);
      console.log(`⚡ Socket.io configurado para notificaciones en tiempo real`);
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
startServer();
