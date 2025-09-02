const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;
let supabaseAdminClient = null;

const initializeSupabase = async () => {
  try {
    if (supabaseClient && supabaseAdminClient) {
      return { supabaseClient, supabaseAdminClient };
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8001';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key';

    // Cliente anónimo para operaciones del usuario
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Cliente admin para operaciones del servidor
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase inicializado exitosamente');
    return { supabaseClient, supabaseAdminClient };
    
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
    throw error;
  }
};

// Función para autenticar usuario
const authenticateUser = async (email, password) => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error en autenticación:', error);
    return { success: false, error: error.message };
  }
};

// Función para registrar usuario
const registerUser = async (email, password, userData) => {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: error.message };
  }
};

// Función para enviar notificación push usando Supabase
const sendPushNotification = async (userId, notification) => {
  try {
    // Usar la funcionalidad de notificaciones push de Supabase
    const { data, error } = await supabaseAdminClient
      .from('push_notifications')
      .insert({
        user_id: userId,
        title: notification.title || 'Nueva notificación DID',
        body: notification.body || 'Tienes una nueva solicitud de DID',
        data: {
          type: notification.type || 'did_request',
          did: notification.did || '',
          senderId: notification.senderId || '',
          notificationId: notification.notificationId || ''
        },
        priority: 'high'
      });

    if (error) throw error;

    console.log('📱 Notificación push enviada exitosamente a usuario:', userId);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error al enviar notificación push:', error);
    return { success: false, error: error.message };
  }
};

// Función para suscribirse a cambios en tiempo real
const subscribeToRealtime = (table, event, callback) => {
  try {
    const subscription = supabaseClient
      .channel(table)
      .on('postgres_changes', 
        { event: event, schema: 'public', table: table }, 
        callback
      )
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('Error al suscribirse a cambios en tiempo real:', error);
    return null;
  }
};

// Función para obtener datos de usuario
const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return { success: false, error: error.message };
  }
};

// Función para actualizar perfil de usuario
const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    return { success: false, error: error.message };
  }
};

// Función para obtener notificaciones de un usuario
const getUserNotifications = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return { success: false, error: error.message };
  }
};

// Función para marcar notificación como leída
const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return { success: false, error: error.message };
  }
};

// Función para crear suscripción en tiempo real
const createRealtimeSubscription = async (userId, channel) => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('realtime_subscriptions')
      .insert({
        user_id: userId,
        channel: channel,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al crear suscripción en tiempo real:', error);
    return { success: false, error: error.message };
  }
};

// Función para obtener estadísticas de usuario
const getUserStats = async (userId) => {
  try {
    const { data, error } = await supabaseAdminClient
      .rpc('get_user_stats', { user_id: userId });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuario:', error);
    return { success: false, error: error.message };
  }
};

const getSupabaseClient = () => {
  return supabaseClient;
};

const getSupabaseAdminClient = () => {
  return supabaseAdminClient;
};

module.exports = {
  initializeSupabase,
  authenticateUser,
  registerUser,
  sendPushNotification,
  subscribeToRealtime,
  getUserProfile,
  updateUserProfile,
  getUserNotifications,
  markNotificationAsRead,
  createRealtimeSubscription,
  getUserStats,
  getSupabaseClient,
  getSupabaseAdminClient
};
