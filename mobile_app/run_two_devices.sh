#!/bin/bash

echo "🚀 Iniciando dos dispositivos móviles para el sistema DIDs..."

# Verificar que Flutter esté en el PATH
export PATH="$PATH:/opt/flutter/bin"

# Crear directorios temporales para cada dispositivo
DEVICE1_DIR="/tmp/dids_device1"
DEVICE2_DIR="/tmp/dids_device2"

# Limpiar directorios anteriores
rm -rf "$DEVICE1_DIR" "$DEVICE2_DIR"

# Copiar la aplicación a cada directorio
cp -r . "$DEVICE1_DIR"
cp -r . "$DEVICE2_DIR"

echo "📱 Dispositivo 1: Configurando..."
cd "$DEVICE1_DIR"
flutter clean
flutter pub get

echo "📱 Dispositivo 2: Configurando..."
cd "$DEVICE2_DIR"
flutter clean
flutter pub get

echo ""
echo "🎯 Ahora ejecutaremos dos instancias de la aplicación:"
echo "   - Dispositivo 1: Puerto 8085"
echo "   - Dispositivo 2: Puerto 8086"
echo ""
echo "💡 Para probar la funcionalidad:"
echo "   1. En el Dispositivo 1, crea un DID"
echo "   2. En el Dispositivo 2, aprueba o rechaza el DID"
echo "   3. Observa las notificaciones en tiempo real"
echo ""

# Ejecutar dispositivo 1 en una terminal
echo "🚀 Iniciando Dispositivo 1..."
cd "$DEVICE1_DIR"
gnome-terminal --title="DIDs - Dispositivo 1" -- bash -c "flutter run -d web-server --web-port 8085; exec bash" &

# Esperar un momento
sleep 3

# Ejecutar dispositivo 2 en otra terminal
echo "🚀 Iniciando Dispositivo 2..."
cd "$DEVICE2_DIR"
gnome-terminal --title="DIDs - Dispositivo 2" -- bash -c "flutter run -d web-server --web-port 8086; exec bash" &

echo ""
echo "✅ Ambos dispositivos están ejecutándose:"
echo "   🌐 Dispositivo 1: http://localhost:8085"
echo "   🌐 Dispositivo 2: http://localhost:8086"
echo ""
echo "🎮 ¡Ahora puedes simular la interacción entre dos dispositivos!"
echo "   Presiona Ctrl+C para detener este script"
echo ""

# Mantener el script ejecutándose
wait
