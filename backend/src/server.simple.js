const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Importar conexiones a bases de datos
const { connectMongoDB } = require('./services/mongodb');
const { connectPostgreSQL } = require('./services/postgresql');
const { connectRedis } = require('./services/redis');

// Importar rutas existentes
const didRoutes = require('./routes/did.routes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');

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

// Configuración de CORS específica para Flutter Web
const corsOptions = {
  origin: [
    'http://localhost:8085',
    'http://localhost:8086',
    'http://127.0.0.1:8085',
    'http://127.0.0.1:8086'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas existentes
app.use('/api/dids', didRoutes);

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

// Ruta de autenticación simple para desarrollo
app.post('/api/auth/login', (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId || !deviceName) {
      return res.status(400).json({
        success: false,
        message: 'deviceId y deviceName son requeridos'
      });
    }

    // Crear un token simple para desarrollo
    const token = Buffer.from(`${deviceId}:${deviceName}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      token: token,
      user: {
        id: deviceId,
        device_id: deviceId,
        device_name: deviceName,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
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
    
    const PORT = process.env.PORT || 3000;
    
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

// Iniciar servidor
startServer();
