#!/bin/bash

echo "🚀 Configurando emulador de Android para el proyecto DIDs..."

# Verificar si Android Studio está instalado
if ! command -v studio &> /dev/null; then
    echo "❌ Android Studio no está instalado. Instalando..."
    
    # Agregar repositorio de Android Studio
    sudo add-apt-repository ppa:maarten-fonville/android-studio -y
    sudo apt update
    
    # Instalar Android Studio
    sudo apt install android-studio -y
    
    echo "✅ Android Studio instalado. Por favor, abre Android Studio y completa la configuración inicial."
    echo "📱 Luego ejecuta este script nuevamente."
    exit 1
fi

echo "✅ Android Studio detectado"

# Verificar si Flutter está instalado
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter no está instalado. Instalando..."
    
    # Descargar Flutter
    cd ~
    git clone https://github.com/flutter/flutter.git -b stable
    export PATH="$PATH:$HOME/flutter/bin"
    
    # Agregar Flutter al PATH permanentemente
    echo 'export PATH="$PATH:$HOME/flutter/bin"' >> ~/.bashrc
    echo 'export PATH="$PATH:$HOME/flutter/bin"' >> ~/.zshrc
    
    echo "✅ Flutter instalado. Por favor, reinicia tu terminal y ejecuta este script nuevamente."
    exit 1
fi

echo "✅ Flutter detectado"

# Verificar si el emulador está funcionando
if ! command -v emulator &> /dev/null; then
    echo "❌ Emulador de Android no disponible. Configurando variables de entorno..."
    
    # Configurar variables de entorno de Android SDK
    export ANDROID_HOME=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/emulator
    export PATH=$PATH:$ANDROID_HOME/tools
    export PATH=$PATH:$ANDROID_HOME/tools/bin
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    
    # Agregar al bashrc y zshrc
    echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.bashrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
    
    echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
    
    echo "✅ Variables de entorno configuradas. Por favor, reinicia tu terminal y ejecuta este script nuevamente."
    exit 1
fi

echo "✅ Emulador de Android disponible"

# Listar dispositivos disponibles
echo "📱 Dispositivos Android disponibles:"
avdmanager list avd

# Crear dispositivo virtual si no existe ninguno
if [ -z "$(avdmanager list avd | grep -v 'No AVDs')" ]; then
    echo "❌ No hay dispositivos virtuales. Creando uno..."
    
    # Crear dispositivo virtual
    avdmanager create avd \
        -n "DIDs_Device" \
        -k "system-images;android-33;google_apis;x86_64" \
        -d "pixel_6" \
        -f
    
    echo "✅ Dispositivo virtual 'DIDs_Device' creado"
else
    echo "✅ Dispositivos virtuales encontrados"
fi

# Verificar dependencias de Flutter
echo "🔍 Verificando dependencias de Flutter..."
flutter doctor

# Instalar dependencias del proyecto
echo "📦 Instalando dependencias del proyecto..."
cd /var/www/html/dids/mobile-app
flutter pub get

echo "🎉 Configuración del emulador de Android completada!"
echo ""
echo "📱 Para ejecutar la aplicación:"
echo "1. Inicia el emulador: emulator -avd DIDs_Device"
echo "2. En otra terminal, ejecuta: flutter run"
echo ""
echo "🚀 Para ejecutar todo el proyecto:"
echo "1. docker-compose up -d"
echo "2. cd mobile-app && flutter run"
