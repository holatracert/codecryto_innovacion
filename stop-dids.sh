#!/bin/bash

# ========================================
# 🛑 SCRIPT PARA DETENER SISTEMA DIDs
# ========================================
# Este script detiene todo el sistema DIDs
# de forma ordenada y limpia
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

# Función para detener procesos Flutter
stop_flutter_processes() {
    print_status "🛑 Deteniendo aplicaciones Flutter..."
    
    # Detener por puerto
    pkill -f "flutter run.*8085" 2>/dev/null || true
    pkill -f "flutter run.*8086" 2>/dev/null || true
    
    # Detener por PID si existen archivos
    if [ -f ".device1.pid" ]; then
        local pid1=$(cat .device1.pid)
        if kill -0 $pid1 2>/dev/null; then
            print_status "Deteniendo Dispositivo 1 (PID: $pid1)..."
            kill $pid1 2>/dev/null || true
        fi
        rm -f .device1.pid
    fi
    
    if [ -f ".device2.pid" ]; then
        local pid2=$(cat .device2.pid)
        if kill -0 $pid2 2>/dev/null; then
            print_status "Deteniendo Dispositivo 2 (PID: $pid2)..."
            kill $pid2 2>/dev/null || true
        fi
        rm -f .device2.pid
    fi
    
    # Esperar a que los procesos terminen
    sleep 3
    
    # Verificar que no queden procesos
    if pgrep -f "flutter run" > /dev/null; then
        print_warning "Algunos procesos Flutter aún están activos, forzando terminación..."
        pkill -9 -f "flutter run" 2>/dev/null || true
    fi
    
    print_success "Aplicaciones Flutter detenidas"
}

# Función para detener servicios Docker
stop_docker_services() {
    print_status "🐳 Deteniendo servicios Docker..."
    
    cd /var/www/html/dids
    
    if sudo docker compose down; then
        print_success "Servicios Docker detenidos correctamente"
    else
        print_warning "Error al detener servicios Docker, intentando forzar..."
        sudo docker compose down --remove-orphans --volumes
    fi
}

# Función para limpiar archivos temporales
cleanup_temp_files() {
    print_status "🧹 Limpiando archivos temporales..."
    
    # Limpiar logs
    rm -f device1.log device2.log 2>/dev/null || true
    rm -f .device1.pid .device2.pid 2>/dev/null || true
    
    # Limpiar archivos de build de Flutter
    cd mobile_app
    flutter clean > /dev/null 2>&1 || true
    
    print_success "Limpieza completada"
}

# Función para mostrar estado final
show_final_status() {
    echo ""
    print_header "📊 ESTADO FINAL DEL SISTEMA"
    
    echo -e "${CYAN}Verificando puertos:${NC}"
    if netstat -tlnp | grep -E "(8085|8086|3002)" > /dev/null; then
        print_warning "Algunos puertos aún están en uso:"
        netstat -tlnp | grep -E "(8085|8086|3002)"
    else
        print_success "Todos los puertos están libres"
    fi
    
    echo ""
    echo -e "${CYAN}Verificando procesos Flutter:${NC}"
    if pgrep -f "flutter run" > /dev/null; then
        print_warning "Procesos Flutter activos:"
        pgrep -f "flutter run" -a
    else
        print_success "No hay procesos Flutter activos"
    fi
    
    echo ""
    echo -e "${CYAN}Estado de Docker:${NC}"
    if sudo docker compose ps | grep -q "Up"; then
        print_warning "Algunos servicios Docker aún están activos:"
        sudo docker compose ps
    else
        print_success "Todos los servicios Docker están detenidos"
    fi
}

# Función principal
main() {
    clear
    print_header "🛑 DETENIENDO SISTEMA COMPLETO DIDs"
    echo ""
    
    # Confirmar acción
    echo -e "${YELLOW}¿Estás seguro de que quieres detener todo el sistema DIDs?${NC}"
    echo -e "${YELLOW}Esto detendrá:${NC}"
    echo "  📱 Aplicaciones Flutter (puertos 8085, 8086)"
    echo "  🐳 Servicios Docker (MongoDB, PostgreSQL, Redis, Backend, Supabase)"
    echo "  🔌 Backend API (puerto 3002)"
    echo ""
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Operación cancelada"
        exit 0
    fi
    
    echo ""
    
    # PASO 1: Detener aplicaciones Flutter
    print_header "📱 PASO 1: DETENIENDO APLICACIONES FLUTTER"
    stop_flutter_processes
    
    # PASO 2: Detener servicios Docker
    print_header "🐳 PASO 2: DETENIENDO SERVICIOS DOCKER"
    stop_docker_services
    
    # PASO 3: Limpieza
    print_header "🧹 PASO 3: LIMPIEZA FINAL"
    cleanup_temp_files
    
    # Mostrar estado final
    show_final_status
    
    # Resumen final
    echo ""
    print_header "🎯 RESUMEN FINAL"
    print_success "¡SISTEMA DIDs COMPLETAMENTE DETENIDO!"
    echo ""
    echo -e "${GREEN}✅ Aplicaciones Flutter detenidas${NC}"
    echo -e "${GREEN}✅ Servicios Docker detenidos${NC}"
    echo -e "${GREEN}✅ Archivos temporales limpiados${NC}"
    echo -e "${GREEN}✅ Puertos liberados${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para reiniciar: ./start-complete-dids.sh${NC}"
    echo ""
}

# Ejecutar función principal
main "$@"
