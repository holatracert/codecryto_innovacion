const Joi = require('joi');

// Esquema de validación para creación de DID
const didCreationSchema = Joi.object({
  did: Joi.string()
    .pattern(/^did:[a-z]+:[a-zA-Z0-9.-]+:[a-zA-Z0-9._%-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'El DID debe tener el formato correcto: did:method:authority:identifier',
      'any.required': 'El DID es requerido'
    }),
  
  document: Joi.object({
    '@context': Joi.array().items(Joi.string()).default(['https://www.w3.org/ns/did/v1']),
    id: Joi.string().required(),
    verificationMethod: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().valid('Ed25519VerificationKey2018', 'Secp256k1VerificationKey2018', 'RsaVerificationKey2018').required(),
        controller: Joi.string().required(),
        publicKeyBase58: Joi.string().required(),
        publicKeyJwk: Joi.object({
          kty: Joi.string(),
          crv: Joi.string(),
          x: Joi.string(),
          y: Joi.string(),
          n: Joi.string(),
          e: Joi.string()
        }).optional()
      })
    ).min(1).required(),
    authentication: Joi.array().items(Joi.string()).optional(),
    assertionMethod: Joi.array().items(Joi.string()).optional(),
    keyAgreement: Joi.array().items(Joi.string()).optional(),
    capabilityInvocation: Joi.array().items(Joi.string()).optional(),
    capabilityDelegation: Joi.array().items(Joi.string()).optional(),
    service: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(),
        serviceEndpoint: Joi.string().required()
      })
    ).optional()
  }).required(),
  
  owner_address: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'La dirección del propietario debe ser una dirección Ethereum válida',
      'any.required': 'La dirección del propietario es requerida'
    }),
  
  signature: Joi.string().required(),
  public_key_hash: Joi.string().required(),
  
  recipients: Joi.array().items(Joi.string().uuid()).optional()
});

// Esquema de validación para actualización de DID
const didUpdateSchema = Joi.object({
  document: Joi.object({
    '@context': Joi.array().items(Joi.string()).optional(),
    id: Joi.string().optional(),
    verificationMethod: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().valid('Ed25519VerificationKey2018', 'Secp256k1VerificationKey2018', 'RsaVerificationKey2018').required(),
        controller: Joi.string().required(),
        publicKeyBase58: Joi.string().required(),
        publicKeyJwk: Joi.object({
          kty: Joi.string(),
          crv: Joi.string(),
          x: Joi.string(),
          y: Joi.string(),
          n: Joi.string(),
          e: Joi.string()
        }).optional()
      })
    ).min(1).optional(),
    authentication: Joi.array().items(Joi.string()).optional(),
    assertionMethod: Joi.array().items(Joi.string()).optional(),
    keyAgreement: Joi.array().items(Joi.string()).optional(),
    capabilityInvocation: Joi.array().items(Joi.string()).optional(),
    capabilityDelegation: Joi.array().items(Joi.string()).optional(),
    service: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(),
        serviceEndpoint: Joi.string().required()
      })
    ).optional()
  }).optional(),
  
  signature: Joi.string().optional(),
  public_key_hash: Joi.string().optional()
});

// Esquema de validación para aprobación de DID
const didApprovalSchema = Joi.object({
  approved_by: Joi.string().uuid().optional(),
  reason: Joi.string().max(500).optional()
});

// Esquema de validación para rechazo de DID
const didRejectionSchema = Joi.object({
  reason: Joi.string().max(500).required().messages({
    'any.required': 'La razón del rechazo es requerida',
    'string.max': 'La razón del rechazo no puede exceder 500 caracteres'
  })
});

// Middleware de validación para creación de DID
const validateDidCreation = (req, res, next) => {
  const { error, value } = didCreationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorMessages
    });
  }
  
  // Validar que el ID del documento coincida con el DID
  if (value.document.id !== value.did) {
    return res.status(400).json({
      success: false,
      message: 'El ID del documento debe coincidir con el DID'
    });
  }
  
  req.validatedData = value;
  next();
};

// Middleware de validación para actualización de DID
const validateDidUpdate = (req, res, next) => {
  const { error, value } = didUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorMessages
    });
  }
  
  req.validatedData = value;
  next();
};

// Middleware de validación para aprobación de DID
const validateDidApproval = (req, res, next) => {
  const { error, value } = didApprovalSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorMessages
    });
  }
  
  req.validatedData = value;
  next();
};

// Middleware de validación para rechazo de DID
const validateDidRejection = (req, res, next) => {
  const { error, value } = didRejectionSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorMessages
    });
  }
  
  req.validatedData = value;
  next();
};

// Middleware de validación para parámetros de consulta
const validateQueryParams = (req, res, next) => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'active', 'revoked', 'expired').optional(),
    owner_address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
    q: Joi.string().max(100).optional(),
    method: Joi.string().max(50).optional(),
    authority: Joi.string().max(100).optional()
  });

  const { error } = querySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación en parámetros de consulta',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  validateDidCreation,
  validateDidUpdate,
  validateDidApproval,
  validateDidRejection,
  validateQueryParams
};
