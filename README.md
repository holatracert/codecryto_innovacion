# Sistema de DIDs - Proyecto de Registro y Resolución

## Descripción
Sistema completo de Decentralized Identifiers (DIDs) con dispositivos móviles, base de datos MongoDB, notificaciones push y API resolver.

## Arquitectura

### Componentes Principales
- **Frontend Flutter**: App móvil con interfaz tipo WhatsApp
- **Backend Node.js**: API REST y sistema de notificaciones
- **MongoDB**: Base de datos principal para documentos DID
- **PostgreSQL**: Base de datos para notificaciones en tiempo real
- **Redis**: Cache y colas de mensajes
- **Docker**: Contenedores para desarrollo

### Flujo de Datos
1. Dispositivo 1 crea DID → MongoDB + Notificación push
2. Dispositivo 2 recibe notificación → Aprobación/Rechazo
3. API Resolver consulta registros → Documentos DID
4. Sistema de notificaciones en tiempo real

## Estructura del Proyecto
```
dids/
├── mobile-app/          # App Flutter
├── backend/             # API Node.js
├── database/            # Scripts de base de datos
├── docker/              # Configuración Docker
└── docs/               # Documentación
```

## Requisitos
- Docker y Docker Compose
- Flutter SDK
- Android Studio (para emulador)
- Node.js 18+

## Instalación

### 1. Clonar y configurar
```bash
git clone <repo>
cd dids
```

### 2. Levantar infraestructura
```bash
docker-compose up -d
```

### 3. Configurar app móvil
```bash
cd mobile-app
flutter pub get
flutter run
```

### 4. Configurar backend
```bash
cd backend
npm install
npm run dev
```

**Nota:** Los servicios están configurados en puertos alternativos para evitar conflictos:
- MongoDB: 27018
- PostgreSQL: 5433
- Redis: 6380
- Backend API: 3001
- Supabase: 8001
- MongoDB Express: 8083
- pgAdmin: 8084

## Uso
1. Abrir app en emulador Android
2. Crear DID desde dispositivo 1
3. Dispositivo 2 recibe notificación
4. Aprobar/rechazar DID
5. Consultar registros en grilla

## Tecnologías
- **Frontend**: Flutter, Dart
- **Backend**: Node.js, Express
- **Bases de datos**: MongoDB, PostgreSQL
- **Tiempo real**: Socket.io, Redis, Supabase Realtime

## Fuentes
https://en.wikipedia.org/wiki/Decentralized_identifier
https://en.wikipedia.org/wiki/AT_Protocol
https://en.wikipedia.org/wiki/Digital_identity
https://en.wikipedia.org/wiki/Self-sovereign_identity
https://en.wikipedia.org/wiki/Decentralized_web
https://en.wikipedia.org/wiki/EIDAS
https://en.wikipedia.org/wiki/China_RealDID
- **Notificaciones**: Supabase Push Notifications
- **Contenedores**: Docker, Docker Compose

## Fuentes 

https://en.wikipedia.org/wiki/Decentralized_identifier https://en.wikipedia.org/wiki/AT_Protocol https://en.wikipedia.org/wiki/Digital_identity https://en.wikipedia.org/wiki/Self-sovereign_identity https://en.wikipedia.org/wiki/Decentralized_web https://en.wikipedia.org/wiki/EIDAS https://en.wikipedia.org/wiki/China_RealDID