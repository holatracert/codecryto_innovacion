const { Pool } = require('pg');

let postgresPool = null;

const connectPostgreSQL = async () => {
  try {
    if (postgresPool) {
      return postgresPool;
    }

    const postgresUri = process.env.POSTGRES_URI || 'postgresql://admin:password123@localhost:5433/dids_realtime';
    
    postgresPool = new Pool({
      connectionString: postgresUri,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Probar conexión
    const client = await postgresPool.connect();
    console.log('✅ PostgreSQL conectado exitosamente');
    client.release();

    // Manejar eventos de error
    postgresPool.on('error', (err) => {
      console.error('❌ Error en pool de PostgreSQL:', err);
    });

    return postgresPool;
    
  } catch (error) {
    console.error('❌ Error al conectar PostgreSQL:', error);
    throw error;
  }
};

const disconnectPostgreSQL = async () => {
  try {
    if (postgresPool) {
      await postgresPool.end();
      postgresPool = null;
      console.log('✅ PostgreSQL desconectado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error al desconectar PostgreSQL:', error);
    throw error;
  }
};

const getPostgresPool = () => {
  return postgresPool;
};

const query = async (text, params) => {
  try {
    const client = await postgresPool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error en query PostgreSQL:', error);
    throw error;
  }
};

module.exports = {
  connectPostgreSQL,
  disconnectPostgreSQL,
  getPostgresPool,
  query
};
