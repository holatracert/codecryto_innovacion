#!/bin/bash

echo "🚀 Iniciando proyecto DIDs..."

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Por favor, reinicia tu terminal y ejecuta este script nuevamente."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado"
fi

echo "✅ Docker y Docker Compose detectados"

# Verificar si el directorio mobile-app existe
if [ ! -d "mobile-app" ]; then
    echo "❌ Directorio mobile-app no encontrado. Creando estructura básica..."
    mkdir -p mobile-app
    cd mobile-app
    
    # Crear proyecto Flutter básico
    flutter create . --org com.dids.app --project-name dids_mobile
    
    # Agregar dependencias necesarias
    flutter pub add http
    flutter pub add socket_io_client
    flutter pub add provider
    flutter pub add shared_preferences
    flutter pub add crypto
    flutter pub add qr_flutter
    flutter pub add image_picker
    flutter pub add permission_handler
    
    cd ..
    echo "✅ Proyecto Flutter creado"
fi

# Verificar si el directorio backend existe
if [ ! -d "backend" ]; then
    echo "❌ Directorio backend no encontrado. Creando estructura básica..."
    mkdir -p backend
    echo "✅ Directorio backend creado"
fi

# Levantar infraestructura con Docker
echo "🐳 Levantando infraestructura con Docker..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

# Verificar conexión a MongoDB
echo "📊 Verificando conexión a MongoDB..."
if docker exec dids_mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB funcionando correctamente"
else
    echo "❌ Error en MongoDB"
fi

# Verificar conexión a PostgreSQL
echo "🐘 Verificando conexión a PostgreSQL..."
if docker exec dids_postgresql pg_isready -U admin > /dev/null 2>&1; then
    echo "✅ PostgreSQL funcionando correctamente"
else
    echo "❌ Error en PostgreSQL"
fi

# Verificar conexión a Redis
echo "🔴 Verificando conexión a Redis..."
if docker exec dids_redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis funcionando correctamente"
else
    echo "❌ Error en Supabase"
fi

# Verificar conexión a Supabase
echo "⚡ Verificando conexión a Supabase..."
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅ Supabase funcionando correctamente"
else
    echo "❌ Error en Supabase"
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Instalar dependencias de la app móvil
echo "📱 Instalando dependencias de la app móvil..."
cd mobile-app
flutter pub get
cd ..

echo ""
echo "🎉 Proyecto DIDs iniciado correctamente!"
echo ""
echo "📊 Servicios disponibles:"
echo "   - MongoDB: localhost:27018"
echo "   - MongoDB Express: http://localhost:8083"
echo "   - PostgreSQL: localhost:5433"
echo "   - pgAdmin: http://localhost:8084"
echo "   - Redis: localhost:6380"
echo "   - Supabase: http://localhost:8001"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "📱 Para ejecutar la app móvil:"
echo "   1. cd mobile-app"
echo "   2. flutter run"
echo ""
echo "🔧 Para ver logs de los servicios:"
echo "   docker-compose logs -f [servicio]"
echo ""
echo "🛑 Para detener todos los servicios:"
echo "   docker-compose down"
