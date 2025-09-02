const express = require('express');
const http = require('http');
const cors = require('cors');
const { connectMongoDB } = require('./services/mongodb');
const DidDocument = require('./models/DidDocument');

const app = express();
const server = http.createServer(app);

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
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API de DIDs sin autenticación para desarrollo
app.get('/api/dids', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const owner_address = req.query.owner_address;

    // Construir filtros
    const filters = {};
    if (status) filters.status = status;
    if (owner_address) filters.owner_address = owner_address;

    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [dids, total] = await Promise.all([
      DidDocument.find(filters)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('did owner_address status created_at updated_at'),
      DidDocument.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        dids,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener DIDs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Crear DID
app.post('/api/dids', async (req, res) => {
  try {
    const { did, document, owner_address, deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = deviceId || 'anonymous';

    // Validar datos requeridos
    if (!did || !document || !owner_address) {
      return res.status(400).json({
        success: false,
        message: 'did, document y owner_address son requeridos'
      });
    }

    // Verificar que el DID no exista
    const existingDid = await DidDocument.findByDid(did);
    if (existingDid) {
      return res.status(409).json({
        success: false,
        message: 'El DID ya existe'
      });
    }

    // Crear nuevo documento DID
    const newDidDocument = new DidDocument({
      did,
      document,
      owner_address,
      signature: req.body.signature || 'dev-signature',
      public_key_hash: req.body.public_key_hash || 'dev-key-hash',
      metadata: {
        created_by: userId
      }
    });

    // Guardar en MongoDB
    const savedDocument = await newDidDocument.save();

    console.log(`✅ DID creado exitosamente: ${did}`);

    res.status(201).json({
      success: true,
      message: 'DID creado exitosamente',
      data: {
        id: savedDocument._id,
        did: savedDocument.did,
        status: savedDocument.status,
        created_at: savedDocument.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error al crear DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Aprobar DID
app.post('/api/dids/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = deviceId || 'anonymous';

    const didDocument = await DidDocument.findById(id);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    if (didDocument.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aprobar DIDs pendientes'
      });
    }

    // Activar el DID
    await didDocument.activate(userId);

    console.log(`✅ DID aprobado: ${didDocument.did}`);

    res.json({
      success: true,
      message: 'DID aprobado exitosamente',
      data: {
        id: didDocument._id,
        did: didDocument.did,
        status: didDocument.status,
        approved_at: didDocument.metadata.activated_at
      }
    });

  } catch (error) {
    console.error('❌ Error al aprobar DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Rechazar DID
app.post('/api/dids/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = deviceId || 'anonymous';

    const didDocument = await DidDocument.findById(id);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    if (didDocument.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden rechazar DIDs pendientes'
      });
    }

    // Rechazar el DID
    await didDocument.revoke(userId, reason);

    console.log(`❌ DID rechazado: ${didDocument.did}`);

    res.json({
      success: true,
      message: 'DID rechazado exitosamente',
      data: {
        id: didDocument._id,
        did: didDocument.did,
        status: didDocument.status,
        rejected_at: didDocument.metadata.revoked_at,
        reason: didDocument.metadata.revocation_reason
      }
    });

  } catch (error) {
    console.error('❌ Error al rechazar DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Ruta de prueba para OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3003;

// Función para inicializar el servidor
async function startServer() {
  try {
    // Conectar MongoDB
    await connectMongoDB();
    
    server.listen(PORT, () => {
      console.log(`🧪 Servidor de prueba DIDs ejecutándose en puerto ${PORT}`);
      console.log(`📱 API disponible en http://localhost:${PORT}/api`);
      console.log(`🔍 Health check en http://localhost:${PORT}/health`);
      console.log(`⚠️  Este es un servidor de PRUEBA sin autenticación`);
      console.log(`✅ Conectado a MongoDB`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
