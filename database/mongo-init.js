// Script de inicialización para MongoDB
// Crear base de datos y colecciones para el sistema de DIDs

db = db.getSiblingDB('dids_db');

// Crear colección de documentos DID
db.createCollection('did_documents');

// Crear índices para optimizar consultas
db.did_documents.createIndex({ "did": 1 }, { unique: true });
db.did_documents.createIndex({ "created_at": -1 });
db.did_documents.createIndex({ "status": 1 });
db.did_documents.createIndex({ "owner_address": 1 });

// Crear colección de transacciones
db.createCollection('transactions');
db.transactions.createIndex({ "did": 1 });
db.transactions.createIndex({ "timestamp": -1 });
db.transactions.createIndex({ "status": 1 });

// Crear colección de notificaciones
db.createCollection('notifications');
db.notifications.createIndex({ "recipient_address": 1 });
db.notifications.createIndex({ "created_at": -1 });
db.notifications.createIndex({ "read": 1 });

// Crear colección de dispositivos
db.createCollection('devices');
db.devices.createIndex({ "device_id": 1 }, { unique: true });
db.devices.createIndex({ "owner_address": 1 });

// Insertar documento DID de ejemplo
db.did_documents.insertOne({
  did: "did:web:codecrypto.com:alice",
  document: {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:web:codecrypto.com:alice",
    "verificationMethod": [{
      "id": "did:web:codecrypto.com:alice#key-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:web:codecrypto.com:alice",
      "publicKeyBase58": "example-public-key-base58"
    }],
    "authentication": ["did:web:codecrypto.com:alice#key-1"]
  },
  owner_address: "0x1234567890abcdef",
  status: "active",
  created_at: new Date(),
  updated_at: new Date()
});

print("MongoDB inicializado correctamente para el sistema de DIDs");
