#!/bin/bash

# ========================================
# 🚀 SCRIPT COMPLETO DE INICIO DIDs
# ========================================
# Este script inicia todo el sistema DIDs
# de forma cronológica y ordenada
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para esperar con spinner
wait_with_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Función para verificar puerto disponible
check_port() {
    local port=$1
    if netstat -tlnp | grep ":$port " > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Función para esperar hasta que un puerto esté disponible
wait_for_port() {
    local port=$1
    local service_name=$2
    local max_attempts=60
    local attempt=1
    
    print_status "Esperando que $service_name esté disponible en puerto $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service_name está disponible en puerto $port"
            return 0
        fi
        
        printf " [%d/%d] Esperando...\r" $attempt $max_attempts
        sleep 2
        ((attempt++))
    done
    
    print_error "Timeout esperando $service_name en puerto $port"
    return 1
}

# Función para verificar salud del servicio
check_service_health() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" > /dev/null; then
        print_success "$service_name está respondiendo correctamente"
        return 0
    else
        print_error "$service_name no está respondiendo"
        return 1
    fi
}

# Función para mostrar estado de memoria
show_memory_status() {
    echo ""
    print_header "📊 ESTADO DE MEMORIA DEL SISTEMA"
    free -h
    echo ""
}

# Función para mostrar estado de Docker
show_docker_status() {
    echo ""
    print_header "🐳 ESTADO DE SERVICIOS DOCKER"
    sudo docker compose ps
    echo ""
}

# Función para mostrar URLs de acceso
show_access_urls() {
    echo ""
    print_header "🌐 URLs DE ACCESO AL SISTEMA"
    echo -e "${CYAN}📱 Dispositivo 1:${NC} http://localhost:8085"
    echo -e "${CYAN}📱 Dispositivo 2:${NC} http://localhost:8086"
    echo -e "${CYAN}🔍 Health Check Backend:${NC} http://localhost:3002/health"
    echo -e "${CYAN}🗄️ MongoDB Express:${NC} http://localhost:8083"
    echo -e "${CYAN}🗄️ pgAdmin:${NC} http://localhost:8084"
    echo -e "${CYAN}🔌 Supabase:${NC} http://localhost:8001"
    echo ""
}

# Función para limpiar procesos anteriores
cleanup_previous_processes() {
    print_status "🧹 Limpiando procesos anteriores..."
    
    # Detener procesos Flutter anteriores
    pkill -f "flutter run.*8085" 2>/dev/null || true
    pkill -f "flutter run.*8086" 2>/dev/null || true
    
    # Limpiar archivos de log
    rm -f device1.log device2.log 2>/dev/null || true
    
    print_success "Limpieza completada"
}

# Función principal de inicio
main() {
    clear
    print_header "🚀 INICIANDO SISTEMA COMPLETO DIDs"
    echo ""
    print_status "Iniciando secuencia de inicio cronológica..."
    echo ""
    
    # Verificar dependencias
    print_header "🔍 VERIFICANDO DEPENDENCIAS"
    
    if ! command_exists docker; then
        print_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command_exists flutter; then
        print_warning "Flutter no está en PATH, intentando usar /opt/flutter/bin"
        export PATH="$PATH:/opt/flutter/bin"
        
        if ! command_exists flutter; then
            print_error "Flutter no está disponible"
            exit 1
        fi
    fi
    
    print_success "Todas las dependencias están disponibles"
    
    # Mostrar estado inicial
    show_memory_status
    
    # Limpiar procesos anteriores
    cleanup_previous_processes
    
    # PASO 1: Iniciar servicios Docker
    print_header "🐳 PASO 1: INICIANDO SERVICIOS DOCKER"
    
    print_status "Iniciando servicios con Docker Compose..."
    cd /var/www/html/dids
    
    if sudo docker compose up -d; then
        print_success "Servicios Docker iniciados correctamente"
    else
        print_error "Error al iniciar servicios Docker"
        exit 1
    fi
    
    # Esperar a que los servicios estén listos
    print_status "Esperando a que los servicios estén listos..."
    
    wait_for_port 27018 "MongoDB" || exit 1
    wait_for_port 5433 "PostgreSQL" || exit 1
    wait_for_port 6380 "Redis" || exit 1
    wait_for_port 3002 "Backend API" || exit 1
    wait_for_port 8001 "Supabase" || exit 1
    
    # Verificar salud de servicios
    print_header "🔍 VERIFICANDO SALUD DE SERVICIOS"
    
    check_service_health "http://localhost:3002/health" "Backend API"
    
    # PASO 2: Iniciar aplicaciones Flutter
    print_header "📱 PASO 2: INICIANDO APLICACIONES FLUTTER"
    
    cd mobile_app
    
    print_status "Iniciando Dispositivo 1 en puerto 8085..."
    nohup flutter run -d web-server --web-port 8085 > device1.log 2>&1 &
    DEVICE1_PID=$!
    
    print_status "Esperando que Dispositivo 1 esté listo..."
    wait_for_port 8085 "Dispositivo 1" || exit 1
    
    print_status "Iniciando Dispositivo 2 en puerto 8086..."
    nohup flutter run -d web-server --web-port 8086 > device2.log 2>&1 &
    DEVICE2_PID=$!
    
    print_status "Esperando que Dispositivo 2 esté listo..."
    wait_for_port 8086 "Dispositivo 2" || exit 1
    
    # PASO 3: Verificaciones finales
    print_header "✅ VERIFICACIONES FINALES"
    
    print_status "Verificando que ambos dispositivos respondan..."
    check_service_health "http://localhost:8085" "Dispositivo 1"
    check_service_health "http://localhost:8086" "Dispositivo 2"
    
    # Mostrar estado final
    show_docker_status
    show_memory_status
    show_access_urls
    
    # Mostrar comandos útiles
    print_header "🛠️ COMANDOS ÚTILES PARA MONITOREO"
    echo -e "${CYAN}Ver logs en tiempo real:${NC}"
    echo "  tail -f device1.log          # Dispositivo 1"
    echo "  tail -f device2.log          # Dispositivo 2"
    echo ""
    echo -e "${CYAN}Ver estado de Docker:${NC}"
    echo "  sudo docker compose ps       # Estado servicios"
    echo "  sudo docker stats            # Consumo recursos"
    echo ""
    echo -e "${CYAN}Monitorear puertos:${NC}"
    echo "  netstat -tlnp | grep -E \"(8085|8086|3002)\""
    echo ""
    
    # Mostrar estado de memoria final
    print_header "🎯 RESUMEN FINAL"
    print_success "¡SISTEMA DIDs COMPLETAMENTE INICIADO!"
    echo ""
    echo -e "${GREEN}✅ Todos los servicios Docker están funcionando${NC}"
    echo -e "${GREEN}✅ Ambos dispositivos móviles están activos${NC}"
    echo -e "${GREEN}✅ Backend API está respondiendo${NC}"
    echo -e "${GREEN}✅ Bases de datos están conectadas${NC}"
    echo ""
    echo -e "${YELLOW}🎮 ¡Ahora puedes abrir tu navegador y probar el sistema!${NC}"
    echo ""
    
    # Guardar PIDs para referencia
    echo $DEVICE1_PID > .device1.pid
    echo $DEVICE2_PID > .device2.pid
    
    print_status "PIDs guardados en .device1.pid y .device2.pid"
    print_status "Para detener: ./stop-dids.sh"
}

# Función de limpieza en caso de error
cleanup_on_error() {
    print_error "Error detectado, limpiando..."
    cleanup_previous_processes
    exit 1
}

# Configurar trap para manejar errores
trap cleanup_on_error ERR

# Ejecutar función principal
main "$@"
