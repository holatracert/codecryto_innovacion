const { query } = require('./postgresql');
const { setKey, getKey, publishMessage } = require('./redis');

const setupSocketHandlers = (io) => {
  console.log('⚡ Configurando Socket.io handlers...');

  // Middleware de autenticación para sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token de autenticación requerido'));
      }

      // Aquí deberías validar el token JWT
      // Por ahora, asumimos que es válido
      socket.userId = socket.handshake.auth.userId;
      socket.deviceId = socket.handshake.auth.deviceId;
      next();
    } catch (error) {
      next(new Error('Autenticación fallida'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Dispositivo conectado: ${socket.deviceId} (Usuario: ${socket.userId})`);

    // Unirse a sala personal del usuario
    socket.join(`user_${socket.userId}`);
    socket.join(`device_${socket.deviceId}`);

    // Actualizar estado de conexión en PostgreSQL
    try {
      await query(
        'UPDATE users SET last_online = NOW() WHERE id = $1',
        [socket.userId]
      );
    } catch (error) {
      console.error('Error al actualizar estado de conexión:', error);
    }

    // Manejar solicitud de DID
    socket.on('did_request', async (data) => {
      try {
        const { recipientId, did, message } = data;
        
        // Crear notificación en PostgreSQL
        const result = await query(
          `INSERT INTO realtime_notifications 
           (recipient_id, sender_id, did, message, type) 
           VALUES ($1, $2, $3, $4, 'did_request') 
           RETURNING *`,
          [recipientId, socket.userId, did, message]
        );

        const notification = result.rows[0];

        // Enviar notificación al destinatario
        io.to(`user_${recipientId}`).emit('did_request_received', {
          id: notification.id,
          did: notification.did,
          message: notification.message,
          senderId: notification.sender_id,
          createdAt: notification.created_at
        });

        // Publicar en Redis para otros servicios
        await publishMessage('did_notifications', {
          type: 'did_request',
          notification: notification
        });

        console.log(`📤 Solicitud de DID enviada: ${did} -> Usuario ${recipientId}`);
        
      } catch (error) {
        console.error('Error al procesar solicitud de DID:', error);
        socket.emit('error', { message: 'Error al procesar solicitud de DID' });
      }
    });

    // Manejar respuesta a solicitud de DID
    socket.on('did_response', async (data) => {
      try {
        const { notificationId, response, message } = data; // response: 'approved' o 'rejected'
        
        // Actualizar notificación en PostgreSQL
        await query(
          `UPDATE realtime_notifications 
           SET status = $1, read_at = NOW() 
           WHERE id = $2`,
          [response === 'approved' ? 'approved' : 'rejected', notificationId]
        );

        // Obtener información de la notificación
        const result = await query(
          'SELECT * FROM realtime_notifications WHERE id = $1',
          [notificationId]
        );

        if (result.rows.length > 0) {
          const notification = result.rows[0];
          
          // Enviar respuesta al solicitante
          io.to(`user_${notification.sender_id}`).emit('did_response_received', {
            notificationId: notification.id,
            did: notification.did,
            response: response,
            message: message,
            responderId: socket.userId
          });

          // Publicar en Redis
          await publishMessage('did_responses', {
            type: 'did_response',
            notification: notification,
            response: response
          });

          console.log(`📥 Respuesta de DID procesada: ${notification.did} -> ${response}`);
        }
        
      } catch (error) {
        console.error('Error al procesar respuesta de DID:', error);
        socket.emit('error', { message: 'Error al procesar respuesta de DID' });
      }
    });

    // Manejar lectura de notificaciones
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data;
        
        await query(
          'UPDATE realtime_notifications SET read_at = NOW() WHERE id = $1',
          [notificationId]
        );

        socket.emit('notification_marked_read', { notificationId });
        
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    });

    // Manejar suscripción a canales
    socket.on('subscribe_channel', (channel) => {
      socket.join(channel);
      console.log(`📡 Dispositivo ${socket.deviceId} suscrito al canal: ${channel}`);
    });

    // Manejar desuscripción de canales
    socket.on('unsubscribe_channel', (channel) => {
      socket.leave(channel);
      console.log(`📡 Dispositivo ${socket.deviceId} desuscrito del canal: ${channel}`);
    });

    // Manejar ping/pong para mantener conexión
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Manejar desconexión
    socket.on('disconnect', async () => {
      console.log(`🔌 Dispositivo desconectado: ${socket.deviceId}`);
      
      try {
        // Actualizar estado de desconexión
        await query(
          'UPDATE users SET last_offline = NOW() WHERE id = $1',
          [socket.userId]
        );
      } catch (error) {
        console.error('Error al actualizar estado de desconexión:', error);
      }
    });
  });

  // Función para enviar notificación push a un usuario específico
  const sendNotificationToUser = async (userId, notification) => {
    try {
      // Obtener información del usuario
      const result = await query(
        'SELECT device_token FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0 && result.rows[0].device_token) {
        // Enviar notificación push (aquí integrarías con Firebase)
        console.log(`📱 Enviando notificación push a usuario ${userId}`);
        
        // También enviar por Socket.io si está conectado
        io.to(`user_${userId}`).emit('push_notification', notification);
      }
    } catch (error) {
      console.error('Error al enviar notificación push:', error);
    }
  };

  // Función para broadcast a todos los usuarios
  const broadcastToAllUsers = (event, data) => {
    io.emit(event, data);
  };

  // Función para enviar a usuarios específicos
  const sendToUsers = (userIds, event, data) => {
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit(event, data);
    });
  };

  // Exportar funciones para uso en otros servicios
  io.sendNotificationToUser = sendNotificationToUser;
  io.broadcastToAllUsers = broadcastToAllUsers;
  io.sendToUsers = sendToUsers;

  console.log('✅ Socket.io handlers configurados correctamente');
};

module.exports = {
  setupSocketHandlers
};
