const mongoose = require('mongoose');

let mongoConnection = null;

const connectMongoDB = async () => {
  try {
    if (mongoConnection) {
      return mongoConnection;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27018/dids_db?authSource=admin';
    
    mongoConnection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB conectado exitosamente');
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

    return mongoConnection;
    
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error);
    throw error;
  }
};

const disconnectMongoDB = async () => {
  try {
    if (mongoConnection) {
      await mongoose.disconnect();
      mongoConnection = null;
      console.log('✅ MongoDB desconectado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al desconectar MongoDB:', error);
    throw error;
  }
};

const getMongoConnection = () => {
  return mongoConnection;
};

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getMongoConnection
};
