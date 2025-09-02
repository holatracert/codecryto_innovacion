const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = async () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    // Verificar si las credenciales están disponibles
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.log('⚠️ Credenciales de Firebase no configuradas, usando modo simulación');
      firebaseApp = { isSimulation: true };
      return firebaseApp;
    }

    // Inicializar Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail: clientEmail
      })
    });

    console.log('✅ Firebase inicializado exitosamente');
    return firebaseApp;
    
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    // Fallback a modo simulación
    firebaseApp = { isSimulation: true };
    return firebaseApp;
  }
};

const sendPushNotification = async (deviceToken, notification) => {
  try {
    if (firebaseApp?.isSimulation) {
      console.log('📱 [SIMULACIÓN] Notificación push enviada:', {
        to: deviceToken,
        notification: notification
      });
      return { success: true, messageId: 'simulated' };
    }

    const message = {
      token: deviceToken,
      notification: {
        title: notification.title || 'Nueva notificación DID',
        body: notification.body || 'Tienes una nueva solicitud de DID'
      },
      data: {
        type: notification.type || 'did_request',
        did: notification.did || '',
        senderId: notification.senderId || '',
        notificationId: notification.notificationId || ''
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          default_sound: true,
          default_vibrate_timings: true,
          default_light_settings: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('📱 Notificación push enviada exitosamente:', response);
    return { success: true, messageId: response };

  } catch (error) {
    console.error('❌ Error al enviar notificación push:', error);
    return { success: false, error: error.message };
  }
};

const sendMulticastNotification = async (deviceTokens, notification) => {
  try {
    if (firebaseApp?.isSimulation) {
      console.log('📱 [SIMULACIÓN] Notificación multicast enviada:', {
        to: deviceTokens.length + ' dispositivos',
        notification: notification
      });
      return { success: true, successCount: deviceTokens.length };
    }

    const message = {
      notification: {
        title: notification.title || 'Nueva notificación DID',
        body: notification.body || 'Tienes una nueva solicitud de DID'
      },
      data: {
        type: notification.type || 'did_request',
        did: notification.did || '',
        senderId: notification.senderId || '',
        notificationId: notification.notificationId || ''
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high'
        }
      }
    };

    const response = await admin.messaging().sendMulticast({
      tokens: deviceTokens,
      ...message
    });

    console.log('📱 Notificación multicast enviada:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

  } catch (error) {
    console.error('❌ Error al enviar notificación multicast:', error);
    return { success: false, error: error.message };
  }
};

const sendTopicNotification = async (topic, notification) => {
  try {
    if (firebaseApp?.isSimulation) {
      console.log('📱 [SIMULACIÓN] Notificación por tema enviada:', {
        topic: topic,
        notification: notification
      });
      return { success: true, messageId: 'simulated' };
    }

    const message = {
      topic: topic,
      notification: {
        title: notification.title || 'Nueva notificación DID',
        body: notification.body || 'Tienes una nueva solicitud de DID'
      },
      data: {
        type: notification.type || 'did_request',
        did: notification.did || '',
        senderId: notification.senderId || '',
        notificationId: notification.notificationId || ''
      }
    };

    const response = await admin.messaging().send(message);
    console.log('📱 Notificación por tema enviada exitosamente:', response);
    return { success: true, messageId: response };

  } catch (error) {
    console.error('❌ Error al enviar notificación por tema:', error);
    return { success: false, error: error.message };
  }
};

const subscribeToTopic = async (deviceTokens, topic) => {
  try {
    if (firebaseApp?.isSimulation) {
      console.log('📱 [SIMULACIÓN] Dispositivos suscritos al tema:', {
        topic: topic,
        deviceCount: deviceTokens.length
      });
      return { success: true };
    }

    const response = await admin.messaging().subscribeToTopic(deviceTokens, topic);
    console.log('📱 Dispositivos suscritos al tema exitosamente:', response);
    return { success: true, response };

  } catch (error) {
    console.error('❌ Error al suscribir dispositivos al tema:', error);
    return { success: false, error: error.message };
  }
};

const unsubscribeFromTopic = async (deviceTokens, topic) => {
  try {
    if (firebaseApp?.isSimulation) {
      console.log('📱 [SIMULACIÓN] Dispositivos desuscritos del tema:', {
        topic: topic,
        deviceCount: deviceTokens.length
      });
      return { success: true };
    }

    const response = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
    console.log('📱 Dispositivos desuscritos del tema exitosamente:', response);
    return { success: true, response };

  } catch (error) {
    console.error('❌ Error al desuscribir dispositivos del tema:', error);
    return { success: false, error: error.message };
  }
};

const getFirebaseApp = () => {
  return firebaseApp;
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  getFirebaseApp
};
