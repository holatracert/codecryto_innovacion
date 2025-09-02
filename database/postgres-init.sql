-- Script de inicialización para PostgreSQL
-- Crear base de datos y tablas para notificaciones en tiempo real

-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios/dispositivos
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    owner_address VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    device_token VARCHAR(500), -- Token FCM para notificaciones push
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones en tiempo real
CREATE TABLE IF NOT EXISTS realtime_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID REFERENCES users(id),
    did VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'did_request', 'did_approved', 'did_rejected'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'read', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de suscripciones en tiempo real
CREATE TABLE IF NOT EXISTS realtime_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    channel VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_owner_address ON users(owner_address);
CREATE INDEX idx_notifications_recipient_id ON realtime_notifications(recipient_id);
CREATE INDEX idx_notifications_status ON realtime_notifications(status);
CREATE INDEX idx_notifications_created_at ON realtime_notifications(created_at);
CREATE INDEX idx_subscriptions_user_id ON realtime_subscriptions(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar timestamp
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO users (device_id, owner_address, public_key) VALUES
    ('device_alice_001', '0x1234567890abcdef', 'example-public-key-alice'),
    ('device_bob_001', '0xfedcba0987654321', 'example-public-key-bob')
ON CONFLICT (device_id) DO NOTHING;

-- Crear función para notificaciones en tiempo real
CREATE OR REPLACE FUNCTION notify_realtime()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'realtime_channel',
        json_build_object(
            'table', TG_TABLE_NAME,
            'type', TG_OP,
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para notificaciones en tiempo real
CREATE TRIGGER notify_realtime_notifications
    AFTER INSERT OR UPDATE ON realtime_notifications
    FOR EACH ROW EXECUTE FUNCTION notify_realtime();

-- Comentarios de las tablas
COMMENT ON TABLE users IS 'Tabla de usuarios/dispositivos del sistema';
COMMENT ON TABLE realtime_notifications IS 'Tabla de notificaciones en tiempo real';
COMMENT ON TABLE realtime_subscriptions IS 'Tabla de suscripciones para notificaciones en tiempo real';
COMMENT ON TABLE activity_logs IS 'Tabla de logs de actividad del sistema';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL inicializado correctamente para el sistema de DIDs';
END $$;
