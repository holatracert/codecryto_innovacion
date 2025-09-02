#!/bin/bash

# ========================================
# 🧪 SCRIPT DE PRUEBA DEL SISTEMA DIDs
# ========================================
# Este script verifica que todo el sistema
# esté funcionando correctamente
# ========================================

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 INICIANDO PRUEBAS DEL SISTEMA DIDs${NC}"
echo "=========================================="
echo ""

# Función para probar un servicio
test_service() {
    local name=$1
    local url=$2
    local description=$3
    
    echo -e "${BLUE}🔍 Probando $name...${NC}"
    echo "   URL: $url"
    echo "   Descripción: $description"
    
    if curl -s "$url" > /dev/null; then
        echo -e "   ${GREEN}✅ $name está funcionando${NC}"
        return 0
    else
        echo -e "   ${RED}❌ $name NO está funcionando${NC}"
        return 1
    fi
    echo ""
}

# Función para probar puerto
test_port() {
    local name=$1
    local port=$2
    
    echo -e "${BLUE}🔍 Probando puerto $port ($name)...${NC}"
    
    if netstat -tlnp | grep ":$port " > /dev/null; then
        echo -e "   ${GREEN}✅ Puerto $port está abierto${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Puerto $port NO está abierto${NC}"
        return 1
    fi
    echo ""
}

# Función para probar contenido HTML
test_content() {
    local name=$1
    local url=$2
    local expected_content=$3
    
    echo -e "${BLUE}🔍 Probando contenido de $name...${NC}"
    echo "   Buscando: '$expected_content'"
    
    local content=$(curl -s "$url")
    if echo "$content" | grep -q "$expected_content"; then
        echo -e "   ${GREEN}✅ Contenido encontrado en $name${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️  Contenido no encontrado en $name${NC}"
        echo "   Esto puede indicar que Flutter no se cargó completamente"
        return 1
    fi
    echo ""
}

# Contador de pruebas
total_tests=0
passed_tests=0

echo -e "${BLUE}📊 PASO 1: VERIFICANDO SERVICIOS DOCKER${NC}"
echo "----------------------------------------"

# Probar servicios Docker
if test_service "Backend API" "http://localhost:3002/health" "API principal del sistema"; then
    ((passed_tests++))
fi
((total_tests++))

if test_service "MongoDB Express" "http://localhost:8083" "Interfaz web de MongoDB"; then
    ((passed_tests++))
fi
((total_tests++))

if test_service "pgAdmin" "http://localhost:8084" "Interfaz web de PostgreSQL"; then
    ((passed_tests++))
fi
((total_tests++))

if test_service "Supabase" "http://localhost:8001" "Servicio Supabase"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""
echo -e "${BLUE}📱 PASO 2: VERIFICANDO APLICACIONES FLUTTER${NC}"
echo "----------------------------------------"

# Probar puertos de Flutter
if test_port "Dispositivo 1" "8085"; then
    ((passed_tests++))
fi
((total_tests++))

if test_port "Dispositivo 2" "8086"; then
    ((passed_tests++))
fi
((total_tests++))

# Probar aplicaciones Flutter
if test_service "Dispositivo 1" "http://localhost:8085" "Aplicación Flutter puerto 8085"; then
    ((passed_tests++))
fi
((total_tests++))

if test_service "Dispositivo 2" "http://localhost:8086" "Aplicación Flutter puerto 8086"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""
echo -e "${BLUE}🔍 PASO 3: VERIFICANDO CONTENIDO HTML${NC}"
echo "----------------------------------------"

# Probar contenido HTML
if test_content "Dispositivo 1" "http://localhost:8085" "Sistema DIDs"; then
    ((passed_tests++))
fi
((total_tests++))

if test_content "Dispositivo 2" "http://localhost:8086" "Sistema DIDs"; then
    ((passed_tests++))
fi
((total_tests++))

echo ""
echo -e "${BLUE}📊 PASO 4: VERIFICANDO ESTADO DEL SISTEMA${NC}"
echo "----------------------------------------"

# Mostrar estado de memoria
echo -e "${BLUE}💾 Estado de memoria:${NC}"
free -h | head -2

# Mostrar estado de Docker
echo -e "${BLUE}🐳 Estado de Docker:${NC}"
sudo docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" | head -8

echo ""
echo -e "${BLUE}🎯 RESUMEN DE PRUEBAS${NC}"
echo "========================"
echo -e "Total de pruebas: ${YELLOW}$total_tests${NC}"
echo -e "Pruebas exitosas: ${GREEN}$passed_tests${NC}"
echo -e "Pruebas fallidas: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡TODAS LAS PRUEBAS PASARON!${NC}"
    echo -e "${GREEN}✅ El sistema DIDs está funcionando perfectamente${NC}"
    echo ""
    echo -e "${BLUE}🌐 URLs de acceso:${NC}"
    echo "   📱 Dispositivo 1: http://localhost:8085"
    echo "   📱 Dispositivo 2: http://localhost:8086"
    echo "   🔍 Health Check: http://localhost:3002/health"
    echo ""
    echo -e "${YELLOW}💡 Si las aplicaciones no cargan completamente en el navegador:${NC}"
    echo "   1. Espera 1-2 minutos para que Flutter se compile"
    echo "   2. Recarga la página (F5)"
    echo "   3. Verifica la consola del navegador (F12)"
    echo "   4. Usa Chrome o Edge para mejor compatibilidad"
else
    echo ""
    echo -e "${RED}❌ ALGUNAS PRUEBAS FALLARON${NC}"
    echo -e "${YELLOW}💡 Recomendaciones:${NC}"
    echo "   1. Verifica que Docker esté funcionando: sudo docker compose ps"
    echo "   2. Reinicia el sistema: ./stop-dids.sh && ./start-complete-dids.sh"
    echo "   3. Verifica logs: tail -f device1.log device2.log"
    echo "   4. Monitorea en tiempo real: ./monitor-dids.sh"
fi

echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "   ./monitor-dids.sh          # Monitoreo en tiempo real"
echo "   ./stop-dids.sh             # Detener todo"
echo "   ./start-complete-dids.sh   # Reiniciar todo"
echo "   tail -f device*.log        # Ver logs en tiempo real"
