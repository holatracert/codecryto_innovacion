#!/bin/bash

# ========================================
# 📊 SCRIPT DE MONITOREO EN TIEMPO REAL DIDs
# ========================================
# Este script monitorea el sistema DIDs
# mostrando estado, recursos y logs
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

# Función para mostrar estado del sistema
show_system_status() {
    clear
    print_header "📊 MONITOREO EN TIEMPO REAL - SISTEMA DIDs"
    echo ""
    
    # Estado de memoria
    print_header "💾 ESTADO DE MEMORIA"
    free -h
    echo ""
    
    # Estado de Docker
    print_header "🐳 ESTADO DE SERVICIOS DOCKER"
    sudo docker compose ps
    echo ""
    
    # Consumo de recursos Docker
    print_header "📈 CONSUMO DE RECURSOS DOCKER"
    sudo docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
    
    # Estado de puertos
    print_header "🌐 ESTADO DE PUERTOS"
    echo -e "${CYAN}Puertos del sistema DIDs:${NC}"
    netstat -tlnp | grep -E "(8085|8086|3002|27018|5433|6380|8001)" | while read line; do
        if echo "$line" | grep -q "8085"; then
            echo -e "${GREEN}✅ $line${NC}"
        elif echo "$line" | grep -q "8086"; then
            echo -e "${GREEN}✅ $line${NC}"
        elif echo "$line" | grep -q "3002"; then
            echo -e "${GREEN}✅ $line${NC}"
        else
            echo -e "${BLUE}🔌 $line${NC}"
        fi
    done
    echo ""
    
    # Procesos Flutter
    print_header "📱 PROCESOS FLUTTER"
    if pgrep -f "flutter run" > /dev/null; then
        echo -e "${GREEN}Procesos Flutter activos:${NC}"
        pgrep -f "flutter run" -a | while read line; do
            if echo "$line" | grep -q "8085"; then
                echo -e "${GREEN}  📱 Dispositivo 1: $line${NC}"
            elif echo "$line" | grep -q "8086"; then
                echo -e "${GREEN}  📱 Dispositivo 2: $line${NC}"
            else
                echo -e "${BLUE}  📱 Otro: $line${NC}"
            fi
        done
    else
        echo -e "${RED}❌ No hay procesos Flutter activos${NC}"
    fi
    echo ""
    
    # URLs de acceso
    print_header "🌐 URLs DE ACCESO"
    echo -e "${CYAN}📱 Dispositivo 1:${NC} http://localhost:8085"
    echo -e "${CYAN}📱 Dispositivo 2:${NC} http://localhost:8086"
    echo -e "${CYAN}🔍 Health Check Backend:${NC} http://localhost:3002/health"
    echo -e "${CYAN}🗄️ MongoDB Express:${NC} http://localhost:8083"
    echo -e "${CYAN}🗄️ pgAdmin:${NC} http://localhost:8084"
    echo -e "${CYAN}🔌 Supabase:${NC} http://localhost:8001"
    echo ""
    
    # Comandos útiles
    print_header "🛠️ COMANDOS ÚTILES"
    echo -e "${YELLOW}Para ver logs en tiempo real:${NC}"
    echo "  tail -f device1.log          # Dispositivo 1"
    echo "  tail -f device2.log          # Dispositivo 2"
    echo ""
    echo -e "${YELLOW}Para detener todo:${NC}"
    echo "  ./stop-dids.sh"
    echo ""
    echo -e "${YELLOW}Para reiniciar:${NC}"
    echo "  ./start-complete-dids.sh"
    echo ""
}

# Función para mostrar logs en tiempo real
show_logs() {
    local device=$1
    
    if [ "$device" = "1" ]; then
        print_header "📱 LOGS DISPOSITIVO 1 (PUERTO 8085)"
        if [ -f "device1.log" ]; then
            tail -f device1.log
        else
            print_error "Archivo de log del Dispositivo 1 no encontrado"
        fi
    elif [ "$device" = "2" ]; then
        print_header "📱 LOGS DISPOSITIVO 2 (PUERTO 8086)"
        if [ -f "device2.log" ]; then
            tail -f device2.log
        else
            print_error "Archivo de log del Dispositivo 2 no encontrado"
        fi
    else
        print_error "Dispositivo no válido. Use 1 o 2"
    fi
}

# Función para mostrar estadísticas de Docker
show_docker_stats() {
    print_header "🐳 ESTADÍSTICAS DOCKER EN TIEMPO REAL"
    echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
    echo ""
    sudo docker stats
}

# Función para verificar salud de servicios
check_services_health() {
    print_header "🔍 VERIFICACIÓN DE SALUD DE SERVICIOS"
    
    # Backend API
    echo -e "${CYAN}Verificando Backend API...${NC}"
    if curl -s "http://localhost:3002/health" > /dev/null; then
        echo -e "${GREEN}✅ Backend API: OK${NC}"
    else
        echo -e "${RED}❌ Backend API: ERROR${NC}"
    fi
    
    # Dispositivo 1
    echo -e "${CYAN}Verificando Dispositivo 1...${NC}"
    if curl -s "http://localhost:8085" > /dev/null; then
        echo -e "${GREEN}✅ Dispositivo 1: OK${NC}"
    else
        echo -e "${RED}❌ Dispositivo 1: ERROR${NC}"
    fi
    
    # Dispositivo 2
    echo -e "${CYAN}Verificando Dispositivo 2...${NC}"
    if curl -s "http://localhost:8086" > /dev/null; then
        echo -e "${GREEN}✅ Dispositivo 2: OK${NC}"
    else
        echo -e "${RED}❌ Dispositivo 2: ERROR${NC}"
    fi
    
    echo ""
}

# Función para mostrar menú principal
show_menu() {
    echo ""
    print_header "📋 MENÚ DE MONITOREO"
    echo "1. 📊 Estado general del sistema"
    echo "2. 📱 Logs Dispositivo 1 (puerto 8085)"
    echo "3. 📱 Logs Dispositivo 2 (puerto 8086)"
    echo "4. 🐳 Estadísticas Docker en tiempo real"
    echo "5. 🔍 Verificar salud de servicios"
    echo "6. 🔄 Actualizar estado"
    echo "7. 🚪 Salir"
    echo ""
    read -p "Selecciona una opción (1-7): " choice
}

# Función principal
main() {
    cd /var/www/html/dids
    
    while true; do
        show_menu
        
        case $choice in
            1)
                show_system_status
                read -p "Presiona Enter para continuar..."
                ;;
            2)
                show_logs 1
                ;;
            3)
                show_logs 2
                ;;
            4)
                show_docker_stats
                ;;
            5)
                check_services_health
                read -p "Presiona Enter para continuar..."
                ;;
            6)
                show_system_status
                read -p "Presiona Enter para continuar..."
                ;;
            7)
                print_status "Saliendo del monitor..."
                exit 0
                ;;
            *)
                print_error "Opción no válida"
                sleep 2
                ;;
        esac
    done
}

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto DIDs"
    exit 1
fi

# Ejecutar función principal
main "$@"
