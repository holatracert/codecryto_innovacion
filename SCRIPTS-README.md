# 🚀 Scripts de Gestión del Sistema DIDs

Este directorio contiene scripts automatizados para gestionar todo el sistema DIDs de forma cronológica y ordenada.

## 📋 **Scripts Disponibles**

### 1. 🚀 **`start-complete-dids.sh`** - Inicio Completo del Sistema
**Descripción**: Script principal que inicia todo el sistema DIDs de forma cronológica.

**Funcionalidades**:
- ✅ Verifica dependencias (Docker, Flutter)
- 🐳 Inicia servicios Docker (MongoDB, PostgreSQL, Redis, Backend, Supabase)
- 📱 Inicia aplicaciones Flutter (2 dispositivos móviles)
- 🔍 Verifica salud de todos los servicios
- 📊 Muestra estado de memoria y recursos
- 🌐 Proporciona URLs de acceso

**Uso**:
```bash
./start-complete-dids.sh
```

**Secuencia de Inicio**:
1. **Verificación de dependencias**
2. **Limpieza de procesos anteriores**
3. **Inicio de servicios Docker**
4. **Espera de disponibilidad de puertos**
5. **Verificación de salud de servicios**
6. **Inicio de aplicaciones Flutter**
7. **Verificaciones finales**

---

### 2. 🛑 **`stop-dids.sh`** - Detención Completa del Sistema
**Descripción**: Script para detener todo el sistema DIDs de forma ordenada y limpia.

**Funcionalidades**:
- 🛑 Detiene aplicaciones Flutter
- 🐳 Detiene servicios Docker
- 🧹 Limpia archivos temporales
- 🔍 Verifica estado final del sistema

**Uso**:
```bash
./stop-dids.sh
```

**Secuencia de Detención**:
1. **Confirmación del usuario**
2. **Detención de aplicaciones Flutter**
3. **Detención de servicios Docker**
4. **Limpieza de archivos temporales**
5. **Verificación del estado final**

---

### 3. 📊 **`monitor-dids.sh`** - Monitoreo en Tiempo Real
**Descripción**: Script interactivo para monitorear el sistema DIDs en tiempo real.

**Funcionalidades**:
- 📊 Estado general del sistema
- 📱 Logs en tiempo real de ambos dispositivos
- 🐳 Estadísticas Docker en tiempo real
- 🔍 Verificación de salud de servicios
- 🌐 Estado de puertos y URLs

**Uso**:
```bash
./monitor-dids.sh
```

**Opciones del Menú**:
1. **Estado general del sistema**
2. **Logs Dispositivo 1 (puerto 8085)**
3. **Logs Dispositivo 2 (puerto 8086)**
4. **Estadísticas Docker en tiempo real**
5. **Verificar salud de servicios**
6. **Actualizar estado**
7. **Salir**

---

## 🎯 **Flujo de Trabajo Recomendado**

### **Inicio del Sistema**:
```bash
# 1. Navegar al directorio del proyecto
cd /var/www/html/dids

# 2. Iniciar todo el sistema
./start-complete-dids.sh

# 3. Esperar a que termine (puede tomar 2-3 minutos)
```

### **Monitoreo del Sistema**:
```bash
# Opción 1: Monitoreo interactivo
./monitor-dids.sh

# Opción 2: Ver logs específicos
tail -f device1.log          # Dispositivo 1
tail -f device2.log          # Dispositivo 2

# Opción 3: Ver estado de Docker
sudo docker compose ps
sudo docker stats
```

### **Detención del Sistema**:
```bash
# Detener todo el sistema
./stop-dids.sh

# Confirmar con 'y' cuando se solicite
```

---

## 🔧 **Comandos Útiles Adicionales**

### **Verificar Estado de Puertos**:
```bash
# Ver todos los puertos del sistema DIDs
netstat -tlnp | grep -E "(8085|8086|3002|27018|5433|6380|8001)"

# Ver puertos específicos
netstat -tlnp | grep 8085  # Dispositivo 1
netstat -tlnp | grep 8086  # Dispositivo 2
netstat -tlnp | grep 3002  # Backend API
```

### **Ver Logs de Docker**:
```bash
# Ver logs de todos los servicios
sudo docker compose logs

# Ver logs de un servicio específico
sudo docker compose logs mongodb
sudo docker compose logs backend
sudo docker compose logs supabase
```

### **Reiniciar Servicios Específicos**:
```bash
# Reiniciar solo el backend
sudo docker compose restart backend

# Reiniciar solo las bases de datos
sudo docker compose restart mongodb postgresql redis
```

---

## 📊 **Monitoreo de Recursos**

### **Estado de Memoria**:
```bash
# Ver uso de memoria del sistema
free -h

# Ver uso de memoria de Docker
sudo docker stats --no-stream
```

### **Estado de Procesos**:
```bash
# Ver procesos Flutter activos
pgrep -f "flutter run" -a

# Ver todos los procesos del usuario
ps aux | grep app
```

---

## 🚨 **Solución de Problemas**

### **Si un servicio no inicia**:
```bash
# 1. Ver logs del servicio
sudo docker compose logs [nombre-servicio]

# 2. Reiniciar el servicio
sudo docker compose restart [nombre-servicio]

# 3. Verificar estado
sudo docker compose ps
```

### **Si las aplicaciones Flutter no responden**:
```bash
# 1. Verificar procesos
pgrep -f "flutter run" -a

# 2. Ver logs
tail -f device1.log
tail -f device2.log

# 3. Reiniciar aplicaciones
./stop-dids.sh
./start-complete-dids.sh
```

### **Si hay conflictos de puertos**:
```bash
# 1. Ver qué está usando el puerto
sudo lsof -i :[puerto]

# 2. Detener el proceso conflictivo
sudo kill [PID]

# 3. Reiniciar el sistema
./stop-dids.sh
./start-complete-dids.sh
```

---

## 📱 **Acceso a las Aplicaciones**

Una vez que el sistema esté funcionando, puedes acceder a:

- **📱 Dispositivo 1**: http://localhost:8085
- **📱 Dispositivo 2**: http://localhost:8086
- **🔍 Health Check Backend**: http://localhost:3002/health
- **🗄️ MongoDB Express**: http://localhost:8083
- **🗄️ pgAdmin**: http://localhost:8084
- **🔌 Supabase**: http://localhost:8001

---

## 💡 **Consejos de Uso**

1. **🔄 Siempre usa `./stop-dids.sh` antes de `./start-complete-dids.sh`**
2. **📊 Usa `./monitor-dids.sh` para ver el estado en tiempo real**
3. **⏳ Ten paciencia durante el inicio (2-3 minutos)**
4. **🔍 Verifica los logs si algo no funciona**
5. **💾 Monitorea el uso de memoria regularmente**

---

## 🎯 **Resumen de Comandos Principales**

| Acción | Comando |
|--------|---------|
| **🚀 Iniciar todo** | `./start-complete-dids.sh` |
| **🛑 Detener todo** | `./stop-dids.sh` |
| **📊 Monitorear** | `./monitor-dids.sh` |
| **🔍 Ver logs** | `tail -f device1.log` / `tail -f device2.log` |
| **🐳 Estado Docker** | `sudo docker compose ps` |
| **📈 Stats Docker** | `sudo docker stats` |

---

**¡Con estos scripts tienes control total sobre tu sistema DIDs! 🎉**
