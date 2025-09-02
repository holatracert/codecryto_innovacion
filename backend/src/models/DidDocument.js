const mongoose = require('mongoose');

const verificationMethodSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Ed25519VerificationKey2018', 'Secp256k1VerificationKey2018', 'RsaVerificationKey2018']
  },
  controller: {
    type: String,
    required: true
  },
  publicKeyBase58: {
    type: String,
    required: true
  },
  publicKeyJwk: {
    kty: String,
    crv: String,
    x: String,
    y: String,
    n: String,
    e: String
  }
});

const serviceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  serviceEndpoint: {
    type: String,
    required: true
  }
});

const didDocumentSchema = new mongoose.Schema({
  did: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  document: {
    '@context': {
      type: [String],
      default: ['https://www.w3.org/ns/did/v1']
    },
    id: {
      type: String,
      required: true
    },
    verificationMethod: [verificationMethodSchema],
    authentication: [String],
    assertionMethod: [String],
    keyAgreement: [String],
    capabilityInvocation: [String],
    capabilityDelegation: [String],
    service: [serviceSchema]
  },
  owner_address: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'revoked', 'expired'],
    default: 'pending',
    index: true
  },
  metadata: {
    created_by: String,
    approved_by: String,
    approved_at: Date,
    revoked_by: String,
    revoked_at: Date,
    expires_at: Date
  },
  version: {
    type: Number,
    default: 1
  },
  previous_version: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DidDocument'
  },
  signature: {
    type: String,
    required: true
  },
  public_key_hash: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para optimizar consultas
didDocumentSchema.index({ 'owner_address': 1, 'status': 1 });
didDocumentSchema.index({ 'created_at': -1, 'status': 1 });
didDocumentSchema.index({ 'did': 1, 'version': 1 });

// Método para validar el documento DID
didDocumentSchema.methods.validateDocument = function() {
  // Verificar que el DID tenga el formato correcto
  const didPattern = /^did:[a-z]+:[a-zA-Z0-9.-]+:[a-zA-Z0-9._%-]+$/;
  if (!didPattern.test(this.did)) {
    throw new Error('Formato de DID inválido');
  }

  // Verificar que el ID del documento coincida con el DID
  if (this.document.id !== this.did) {
    throw new Error('El ID del documento debe coincidir con el DID');
  }

  // Verificar que tenga al menos un método de verificación
  if (!this.document.verificationMethod || this.document.verificationMethod.length === 0) {
    throw new Error('El documento debe tener al menos un método de verificación');
  }

  return true;
};

// Método para crear una nueva versión del documento
didDocumentSchema.methods.createNewVersion = function(updates) {
  const newDocument = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    previous_version: this._id,
    version: this.version + 1,
    ...updates,
    created_at: new Date(),
    updated_at: new Date()
  });

  return newDocument;
};

// Método para revocar el documento
didDocumentSchema.methods.revoke = function(revokedBy, reason) {
  this.status = 'revoked';
  this.metadata.revoked_by = revokedBy;
  this.metadata.revoked_at = new Date();
  
  if (reason) {
    this.metadata.revocation_reason = reason;
  }
  
  return this.save();
};

// Método para activar el documento
didDocumentSchema.methods.activate = function(approvedBy) {
  this.status = 'active';
  this.metadata.approved_by = approvedBy;
  this.metadata.approved_at = new Date();
  
  return this.save();
};

// Método estático para buscar por DID
didDocumentSchema.statics.findByDid = function(did) {
  return this.findOne({ did: did }).sort({ version: -1 });
};

// Método estático para buscar documentos activos de un usuario
didDocumentSchema.statics.findActiveByOwner = function(ownerAddress) {
  return this.find({ 
    owner_address: ownerAddress, 
    status: 'active' 
  }).sort({ created_at: -1 });
};

// Método estático para buscar documentos pendientes
didDocumentSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ created_at: -1 });
};

// Middleware pre-save para validar el documento
didDocumentSchema.pre('save', function(next) {
  try {
    this.validateDocument();
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual para obtener el DID sin el método
didDocumentSchema.virtual('didMethod').get(function() {
  return this.did.split(':')[1];
});

// Virtual para obtener el DID authority
didDocumentSchema.virtual('didAuthority').get(function() {
  return this.did.split(':')[2];
});

// Virtual para obtener el DID identifier
didDocumentSchema.virtual('didIdentifier').get(function() {
  return this.did.split(':')[3];
});

const DidDocument = mongoose.model('DidDocument', didDocumentSchema);

module.exports = DidDocument;
