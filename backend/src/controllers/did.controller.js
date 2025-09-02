const DidDocument = require('../models/DidDocument');
const { sendPushNotification } = require('../services/supabase');
const crypto = require('crypto');

// Crear nuevo DID
const createDid = async (req, res) => {
  try {
    const { did, document, owner_address, signature, public_key_hash, deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = req.user ? req.user.id : deviceId || 'anonymous';

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
      signature,
      public_key_hash,
      metadata: {
        created_by: userId
      }
    });

    // Validar documento antes de guardar
    newDidDocument.validateDocument();

    // Guardar en MongoDB
    const savedDocument = await newDidDocument.save();

    // Enviar notificación push si hay destinatarios
    if (req.body.recipients && req.body.recipients.length > 0) {
      for (const recipientId of req.body.recipients) {
        await sendPushNotification(recipientId, {
          title: 'Nueva solicitud de DID',
          body: `Se ha creado un nuevo DID: ${did}`,
          type: 'did_created',
          did: did,
          senderId: userId,
          notificationId: savedDocument._id.toString()
        });
      }
    }

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
};

// Obtener DID por ID
const getDidById = async (req, res) => {
  try {
    const { id } = req.params;

    const didDocument = await DidDocument.findById(id);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    res.json({
      success: true,
      data: didDocument
    });

  } catch (error) {
    console.error('❌ Error al obtener DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener DID por DID string
const getDidByDid = async (req, res) => {
  try {
    const { did } = req.params;

    const didDocument = await DidDocument.findByDid(did);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    res.json({
      success: true,
      data: didDocument
    });

  } catch (error) {
    console.error('❌ Error al obtener DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los DIDs con paginación
const getAllDids = async (req, res) => {
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
};

// Obtener DIDs de un usuario específico
const getDidsByOwner = async (req, res) => {
  try {
    const { owner_address } = req.params;
    const status = req.query.status;

    const filters = { owner_address };
    if (status) filters.status = status;

    const dids = await DidDocument.find(filters)
      .sort({ created_at: -1 })
      .select('did status created_at updated_at');

    res.json({
      success: true,
      data: dids
    });

  } catch (error) {
    console.error('❌ Error al obtener DIDs del propietario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Aprobar DID
const approveDid = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = req.user ? req.user.id : deviceId || 'anonymous';

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
    await didDocument.activate(approved_by || userId);

    // Enviar notificación al creador
    if (didDocument.metadata.created_by) {
      await sendPushNotification(didDocument.metadata.created_by, {
        title: 'DID Aprobado',
        body: `Tu DID ${didDocument.did} ha sido aprobado`,
        type: 'did_approved',
        did: didDocument.did,
        notificationId: didDocument._id.toString()
      });
    }

    console.log(`✅ DID aprobado: ${didDocument.did}`);

    res.json({
      success: true,
      message: 'DID aprobado exitosamente',
      data: {
        id: didDocument._id,
        did: didDocument.did,
        status: didDocument.status,
        approved_at: didDocument.metadata.approved_at
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
};

// Rechazar DID
const rejectDid = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, deviceId, deviceName } = req.body;
    
    // Para desarrollo, usar deviceId si no hay usuario autenticado
    const userId = req.user ? req.user.id : deviceId || 'anonymous';

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

    // Enviar notificación al creador
    if (didDocument.metadata.created_by) {
      await sendPushNotification(didDocument.metadata.created_by, {
        title: 'DID Rechazado',
        body: `Tu DID ${didDocument.did} ha sido rechazado${reason ? `: ${reason}` : ''}`,
        type: 'did_rejected',
        did: didDocument.did,
        notificationId: didDocument._id.toString()
      });
    }

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
};

// Actualizar DID
const updateDid = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    const didDocument = await DidDocument.findById(id);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    // Verificar permisos (solo el propietario puede actualizar)
    if (didDocument.owner_address !== req.user.owner_address) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este DID'
      });
    }

    // Crear nueva versión del documento
    const newVersion = didDocument.createNewVersion(updates);
    newVersion.metadata.updated_by = userId;

    // Guardar nueva versión
    const savedVersion = await newVersion.save();

    console.log(`🔄 DID actualizado: ${didDocument.did} -> v${savedVersion.version}`);

    res.json({
      success: true,
      message: 'DID actualizado exitosamente',
      data: {
        id: savedVersion._id,
        did: savedVersion.did,
        version: savedVersion.version,
        status: savedVersion.status,
        updated_at: savedVersion.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar DID (soft delete)
const deleteDid = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const didDocument = await DidDocument.findById(id);
    if (!didDocument) {
      return res.status(404).json({
        success: false,
        message: 'DID no encontrado'
      });
    }

    // Verificar permisos
    if (didDocument.owner_address !== req.user.owner_address) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este DID'
      });
    }

    // Soft delete - cambiar estado a eliminado
    didDocument.status = 'deleted';
    didDocument.metadata.deleted_by = userId;
    didDocument.metadata.deleted_at = new Date();
    await didDocument.save();

    console.log(`🗑️ DID marcado como eliminado: ${didDocument.did}`);

    res.json({
      success: true,
      message: 'DID eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar DID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Buscar DIDs
const searchDids = async (req, res) => {
  try {
    const { q, method, authority } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Construir filtros de búsqueda
    const filters = {};
    
    if (q) {
      filters.$or = [
        { did: { $regex: q, $options: 'i' } },
        { 'document.id': { $regex: q, $options: 'i' } }
      ];
    }

    if (method) {
      filters.did = { $regex: `^did:${method}:`, $options: 'i' };
    }

    if (authority) {
      filters.did = { $regex: `^did:[a-z]+:${authority}:`, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [dids, total] = await Promise.all([
      DidDocument.find(filters)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('did owner_address status created_at'),
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
          items_per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('❌ Error al buscar DIDs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de DIDs
const getDidStats = async (req, res) => {
  try {
    const stats = await DidDocument.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await DidDocument.countDocuments();
    const active = await DidDocument.countDocuments({ status: 'active' });
    const pending = await DidDocument.countDocuments({ status: 'pending' });
    const revoked = await DidDocument.countDocuments({ status: 'revoked' });

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        revoked,
        breakdown: stats
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  createDid,
  getDidById,
  getDidByDid,
  getAllDids,
  getDidsByOwner,
  approveDid,
  rejectDid,
  updateDid,
  deleteDid,
  searchDids,
  getDidStats
};
