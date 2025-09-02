const jwt = require('jsonwebtoken');
const { getUserProfile } = require('../services/supabase');

// Middleware de autenticación JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' del token
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
      
      // Obtener información del usuario desde Supabase
      const userResult = await getUserProfile(decoded.sub || decoded.userId);
      
      if (!userResult.success) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Agregar información del usuario al request
      req.user = {
        id: userResult.data.id,
        email: userResult.data.email,
        owner_address: userResult.data.owner_address,
        device_id: userResult.data.device_id,
        role: userResult.data.role || 'user'
      };

      next();
      
    } catch (jwtError) {
      console.error('Error al verificar JWT:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Error de autenticación'
      });
    }
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware de autorización por roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

// Middleware para verificar propiedad del DID
const checkDidOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const DidDocument = require('../models/DidDocument');
    
    const didDocument = await DidDocument.findById(id);
    
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del DID
    if (didDocument.owner_address !== req.user.owner_address) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción en este DID'
      });
    }

    req.didDocument = didDocument;
    next();
    
  } catch (error) {
    console.error('Error al verificar propiedad del DID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos de administrador
const requireAdmin = authorizeRole(['admin', 'super_admin']);

// Middleware para verificar permisos de moderador o superior
const requireModerator = authorizeRole(['moderator', 'admin', 'super_admin']);

// Middleware para verificar permisos de usuario autenticado
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }
  next();
};

// Middleware para verificar que el usuario tenga dirección de propietario
const requireOwnerAddress = (req, res, next) => {
  if (!req.user.owner_address) {
    return res.status(400).json({
      success: false,
      message: 'El usuario debe tener una dirección de propietario configurada'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  authorizeRole,
  checkDidOwnership,
  requireAdmin,
  requireModerator,
  requireAuth,
  requireOwnerAddress
};
