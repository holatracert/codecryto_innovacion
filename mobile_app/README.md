# 📱 DIDs Mobile - Sistema de Decentralized Identifiers

## 🎯 Descripción

Aplicación móvil Flutter que simula dos dispositivos móviles interactuando con un sistema de Decentralized Identifiers (DIDs). La interfaz está diseñada con el estilo visual de WhatsApp para una experiencia familiar y intuitiva.

## ✨ Características

- **🎨 Interfaz WhatsApp-like**: Colores, tipografía y diseño similar a WhatsApp
- **📱 Simulación de dos dispositivos**: Ejecuta dos instancias independientes
- **🔐 Gestión de DIDs**: Crear, aprobar y rechazar identificadores descentralizados
- **⚡ Tiempo real**: Notificaciones y actualizaciones en tiempo real
- **📊 Estadísticas**: Dashboard con contadores de DIDs por estado
- **🌐 Web**: Ejecutable en navegador web para fácil testing

## 🚀 Instalación y Configuración

### Prerrequisitos

- Flutter SDK 3.24.5 o superior
- Dart 3.5.4 o superior
- Navegador web moderno

### Instalación

1. **Clonar el proyecto**:
   ```bash
   cd mobile_app
   ```

2. **Instalar dependencias**:
   ```bash
   export PATH="$PATH:/opt/flutter/bin"
   flutter pub get
   ```

3. **Verificar instalación**:
   ```bash
   flutter doctor
   ```

## 🎮 Cómo Usar

### Opción 1: Ejecutar dos dispositivos automáticamente

```bash
./run_two_devices.sh
```

Este script:
- Crea dos instancias independientes de la aplicación
- Abre cada una en una terminal separada
- Configura puertos diferentes (8085 y 8086)
- Simula dos dispositivos móviles reales

### Opción 2: Ejecutar manualmente

```bash
# Terminal 1 - Dispositivo 1
export PATH="$PATH:/opt/flutter/bin"
flutter run -d web-server --web-port 8085

# Terminal 2 - Dispositivo 2
export PATH="$PATH:/opt/flutter/bin"
flutter run -d web-server --web-port 8086
```

## 📱 Funcionalidades de la Aplicación

### 1. **Pantalla de Configuración**
- Selección de nombre del dispositivo
- Generación automática de ID único
- Interfaz intuitiva y moderna

### 2. **Chat Principal (Estilo WhatsApp)**
- **Header**: Nombre del dispositivo y estado del sistema
- **Estadísticas**: Contadores de DIDs por estado
- **Lista de DIDs**: Tarjetas con información detallada
- **Botón flotante**: Crear nuevos DIDs

### 3. **Gestión de DIDs**
- **Crear DID**: Genera nuevos identificadores descentralizados
- **Aprobar DID**: Acepta DIDs de otros dispositivos
- **Rechazar DID**: Rechaza DIDs con razón específica
- **Visualización**: Estados claros con colores distintivos

### 4. **Estados de DIDs**
- 🟠 **Pendiente**: Esperando aprobación/rechazo
- 🟢 **Aprobado**: DID validado por otro dispositivo
- 🔴 **Rechazado**: DID rechazado con razón

## 🔧 Configuración de la API

La aplicación se conecta al backend en `http://localhost:3002`. Asegúrate de que:

1. **Backend esté ejecutándose**:
   ```bash
   sudo docker compose ps
   ```

2. **API esté respondiendo**:
   ```bash
   curl http://localhost:3002/health
   ```

3. **Servicios estén activos**:
   - MongoDB (puerto 27018)
   - PostgreSQL (puerto 5433)
   - Redis (puerto 6380)
   - Backend API (puerto 3002)

## 🎯 Casos de Uso

### Escenario 1: Creación y Aprobación
1. **Dispositivo 1**: Crea un nuevo DID
2. **Dispositivo 2**: Recibe notificación del DID pendiente
3. **Dispositivo 2**: Aprueba o rechaza el DID
4. **Dispositivo 1**: Recibe confirmación del estado

### Escenario 2: Colaboración entre Dispositivos
1. **Dispositivo 1**: Crea múltiples DIDs
2. **Dispositivo 2**: Revisa y gestiona todos los DIDs pendientes
3. **Ambos dispositivos**: Ven estadísticas actualizadas en tiempo real

## 🎨 Personalización

### Colores WhatsApp
- **Primario**: `#075E54` (Verde oscuro)
- **Secundario**: `#128C7E` (Verde medio)
- **Acento**: `#25D366` (Verde claro)
- **Fondo**: `#ECE5DD` (Gris claro)

### Fuentes
- **Familia**: Roboto
- **Pesos**: Regular (400), Bold (700)

## 🐛 Solución de Problemas

### Error: "Flutter no encontrado"
```bash
export PATH="$PATH:/opt/flutter/bin"
flutter --version
```

### Error: "Puerto ocupado"
```bash
# Cambiar puertos en el script
flutter run -d web-server --web-port 8087
```

### Error: "Dependencias no encontradas"
```bash
flutter clean
flutter pub get
```

### Error: "API no responde"
```bash
# Verificar backend
sudo docker compose ps
curl http://localhost:3002/health
```

## 📊 Monitoreo

### Logs de la Aplicación
- **Dispositivo 1**: Terminal con título "DIDs - Dispositivo 1"
- **Dispositivo 2**: Terminal con título "DIDs - Dispositivo 2"

### Métricas del Sistema
- **Consumo de memoria**: Monitorear con `docker stats`
- **Rendimiento**: Usar DevTools de Flutter
- **Errores**: Revisar consola del navegador

## 🔮 Próximas Funcionalidades

- [ ] **Notificaciones push**: Integración con Supabase
- [ ] **Autenticación**: Sistema de login seguro
- [ ] **QR Codes**: Generación y escaneo de DIDs
- [ ] **Historial**: Log de todas las acciones
- [ ] **Exportación**: Backup de DIDs en formato JSON
- [ ] **Temas**: Modo oscuro/claro

## 📚 Recursos Adicionales

- **Flutter**: https://flutter.dev
- **DIDs**: https://www.w3.org/TR/did-core/
- **WhatsApp Design**: https://design.whatsapp.com
- **Material Design**: https://material.io/design

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**🎉 ¡Disfruta probando el sistema DIDs con dos dispositivos móviles!**
