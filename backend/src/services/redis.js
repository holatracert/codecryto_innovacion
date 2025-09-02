const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (redisClient) {
      return redisClient;
    }

    const redisUri = process.env.REDIS_URI || 'redis://localhost:6380';
    
    redisClient = redis.createClient({
      url: redisUri,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Demasiados intentos de reconexión a Redis');
            return new Error('Demasiados intentos de reconexión');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Manejar eventos
    redisClient.on('connect', () => {
      console.log('✅ Redis conectado exitosamente');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis listo para recibir comandos');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Error de Redis:', err);
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Reconectando a Redis...');
    });

    redisClient.on('end', () => {
      console.log('⚠️ Conexión a Redis cerrada');
    });

    await redisClient.connect();
    return redisClient;
    
  } catch (error) {
    console.error('❌ Error al conectar Redis:', error);
    throw error;
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('✅ Redis desconectado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al desconectar Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  return redisClient;
};

// Funciones helper para Redis
const setKey = async (key, value, expireSeconds = null) => {
  try {
    if (expireSeconds) {
      await redisClient.setEx(key, expireSeconds, JSON.stringify(value));
    } else {
      await redisClient.set(key, JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.error('❌ Error al establecer clave en Redis:', error);
    return false;
  }
};

const getKey = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Error al obtener clave de Redis:', error);
    return null;
  }
};

const deleteKey = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar clave de Redis:', error);
    return false;
  }
};

const publishMessage = async (channel, message) => {
  try {
    await redisClient.publish(channel, JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('❌ Error al publicar mensaje en Redis:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  setKey,
  getKey,
  deleteKey,
  publishMessage
};
