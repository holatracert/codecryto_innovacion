// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error no manejado:', err);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: validationErrors
    });
  }

  // Error de duplicado de Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `El campo ${field} ya existe`,
      field: field,
      value: err.keyValue[field]
    });
  }

  // Error de cast de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
      field: err.path,
      value: err.value
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Error de límite de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Archivo demasiado grande'
    });
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido'
    });
  }

  // Error de base de datos
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Error de base de datos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
  }

  // Error de PostgreSQL
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      message: 'Error de datos inválidos',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
  }

  if (err.code && err.code.startsWith('42')) {
    return res.status(400).json({
      success: false,
      message: 'Error de sintaxis',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
  }

  // Error de Redis
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    return res.status(503).json({
      success: false,
      message: 'Servicio de cache no disponible'
    });
  }

  // Error de timeout
  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      message: 'Timeout de la operación'
    });
  }

  // Error de red
  if (err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Servicio no disponible'
    });
  }

  // Error de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes, intenta más tarde'
    });
  }

  // Error personalizado con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Middleware para manejar errores de async/await
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores personalizados
const createError = (message, statusCode = 500, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

// Función para manejar errores de validación
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return {
      success: false,
      message: 'Error de validación',
      errors: errors
    };
  }
  return null;
};

// Función para manejar errores de base de datos
const handleDatabaseError = (error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      success: false,
      message: `El campo ${field} ya existe`,
      field: field,
      value: error.keyValue[field]
    };
  }
  return null;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  handleValidationError,
  handleDatabaseError
};
