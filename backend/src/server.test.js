const express = require('express');
const http = require('http');
const cors = require('cors');

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

// Ruta de prueba sin autenticación
app.get('/api/dids', (req, res) => {
  res.json([
    {
      id: 'test-1',
      did: 'did:example:test1',
      owner: 'device1',
      status: 'pending',
      content: {
        type: 'VerifiableCredential',
        issuer: 'Test Device',
        subject: 'Test User'
      },
      createdAt: new Date().toISOString()
    }
  ]);
});

// Ruta de prueba para crear DID
app.post('/api/dids', (req, res) => {
  const newDid = {
    id: `test-${Date.now()}`,
    did: req.body.did || 'did:example:test',
    owner: req.body.owner || 'unknown',
    status: 'pending',
    content: req.body.content || {},
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newDid);
});

// Ruta de prueba para aprobar DID
app.put('/api/dids/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approverId } = req.body;
  
  const updatedDid = {
    id,
    did: 'did:example:test',
    owner: 'device1',
    status: 'approved',
    approvedBy: approverId,
    approvedAt: new Date().toISOString(),
    content: {},
    createdAt: new Date().toISOString()
  };
  
  res.json(updatedDid);
});

// Ruta de prueba para rechazar DID
app.put('/api/dids/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectorId, reason } = req.body;
  
  const updatedDid = {
    id,
    did: 'did:example:test',
    owner: 'device1',
    status: 'rejected',
    rejectedBy: rejectorId,
    rejectionReason: reason,
    rejectedAt: new Date().toISOString(),
    content: {},
    createdAt: new Date().toISOString()
  };
  
  res.json(updatedDid);
});

// Ruta de prueba para OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🧪 Servidor de prueba DIDs ejecutándose en puerto ${PORT}`);
  console.log(`📱 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔍 Health check en http://localhost:${PORT}/health`);
  console.log(`⚠️  Este es un servidor de PRUEBA sin autenticación`);
});
