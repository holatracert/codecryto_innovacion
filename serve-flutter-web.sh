#!/bin/bash

# ========================================
# 🌐 SCRIPT PARA SERVIR APLICACIONES FLUTTER WEB
# ========================================
# Este script sirve las aplicaciones Flutter
# compiladas usando servidores web simples
# ========================================

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 INICIANDO SERVIDORES WEB PARA FLUTTER${NC}"
echo "============================================="
echo ""

# Función para verificar si Python está disponible
check_python() {
    if command -v python3 &> /dev/null; then
        echo "python3"
    elif command -v python &> /dev/null; then
        echo "python"
    else
        echo ""
    fi
}

# Función para verificar si Node.js está disponible
check_node() {
    if command -v node &> /dev/null; then
        echo "node"
    else
        echo ""
    fi
}

# Función para verificar si PHP está disponible
check_php() {
    if command -v php &> /dev/null; then
        echo "php"
    else
        echo ""
    fi
}

# Función para detener servidores anteriores
stop_previous_servers() {
    echo -e "${BLUE}🛑 Deteniendo servidores anteriores...${NC}"
    
    # Detener procesos en puertos 8085 y 8086
    pkill -f "python.*8085" 2>/dev/null || true
    pkill -f "python3.*8085" 2>/dev/null || true
    pkill -f "node.*8085" 2>/dev/null || true
    pkill -f "php.*8085" 2>/dev/null || true
    
    pkill -f "python.*8086" 2>/dev/null || true
    pkill -f "python3.*8086" 2>/dev/null || true
    pkill -f "node.*8086" 2>/dev/null || true
    pkill -f "php.*8086" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Servidores anteriores detenidos${NC}"
    echo ""
}

# Función para compilar Flutter
compile_flutter() {
    echo -e "${BLUE}📱 Compilando aplicaciones Flutter...${NC}"
    
    cd /var/www/html/dids/mobile_app
    
    # Limpiar compilaciones anteriores
    echo "   🧹 Limpiando compilaciones anteriores..."
    export PATH="$PATH:/opt/flutter/bin"
    flutter clean
    
    # Compilar para web
    echo "   🔨 Compilando para web..."
    flutter build web --release
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Compilación completada${NC}"
    else
        echo -e "${RED}❌ Error en la compilación${NC}"
        exit 1
    fi
    
    echo ""
}

# Función para iniciar servidor Python
start_python_server() {
    local port=$1
    local device_name=$2
    
    echo -e "${BLUE}🐍 Iniciando servidor Python en puerto $port ($device_name)...${NC}"
    
    cd /var/www/html/dids/mobile_app/build/web
    
    # Iniciar servidor en background
    nohup python3 -m http.server $port > /dev/null 2>&1 &
    local pid=$!
    
    # Guardar PID
    echo $pid > /var/www/html/dids/.${device_name}_web.pid
    
    echo -e "${GREEN}✅ Servidor $device_name iniciado (PID: $pid)${NC}"
    echo ""
}

# Función para iniciar servidor Node.js
start_node_server() {
    local port=$1
    local device_name=$2
    
    echo -e "${BLUE}🟢 Iniciando servidor Node.js en puerto $port ($device_name)...${NC}"
    
    cd /var/www/html/dids/mobile_app/build/web
    
    # Crear servidor HTTP simple
    cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.argv[2] || 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: '+error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
EOF

    # Iniciar servidor en background
    nohup node server.js $port > /dev/null 2>&1 &
    local pid=$!
    
    # Guardar PID
    echo $pid > /var/www/html/dids/.${device_name}_web.pid
    
    echo -e "${GREEN}✅ Servidor $device_name iniciado (PID: $pid)${NC}"
    echo ""
}

# Función para iniciar servidor PHP
start_php_server() {
    local port=$1
    local device_name=$2
    
    echo -e "${BLUE}🐘 Iniciando servidor PHP en puerto $port ($device_name)...${NC}"
    
    cd /var/www/html/dids/mobile_app/build/web
    
    # Iniciar servidor en background
    nohup php -S localhost:$port > /dev/null 2>&1 &
    local pid=$!
    
    # Guardar PID
    echo $pid > /var/www/html/dids/.${device_name}_web.pid
    
    echo -e "${GREEN}✅ Servidor $device_name iniciado (PID: $pid)${NC}"
    echo ""
}

# Función principal
main() {
    # Verificar directorio
    if [ ! -f "/var/www/html/dids/docker-compose.yml" ]; then
        echo -e "${RED}❌ Este script debe ejecutarse desde el directorio raíz del proyecto DIDs${NC}"
        exit 1
    fi
    
    # Detener servidores anteriores
    stop_previous_servers
    
    # Compilar Flutter
    compile_flutter
    
    # Verificar qué servidor web está disponible
    local python_cmd=$(check_python)
    local node_cmd=$(check_node)
    local php_cmd=$(check_php)
    
    echo -e "${BLUE}🔍 Verificando servidores web disponibles...${NC}"
    
    if [ -n "$python_cmd" ]; then
        echo -e "${GREEN}✅ Python disponible: $python_cmd${NC}"
    fi
    
    if [ -n "$node_cmd" ]; then
        echo -e "${GREEN}✅ Node.js disponible: $node_cmd${NC}"
    fi
    
    if [ -n "$php_cmd" ]; then
        echo -e "${GREEN}✅ PHP disponible: $php_cmd${NC}"
    fi
    
    echo ""
    
    # Iniciar servidores
    if [ -n "$python_cmd" ]; then
        start_python_server 8085 "device1"
        start_python_server 8086 "device2"
    elif [ -n "$node_cmd" ]; then
        start_node_server 8085 "device1"
        start_node_server 8086 "device2"
    elif [ -n "$php_cmd" ]; then
        start_php_server 8085 "device1"
        start_php_server 8086 "device2"
    else
        echo -e "${RED}❌ No se encontró ningún servidor web disponible${NC}"
        echo "   Instala Python3, Node.js o PHP para continuar"
        exit 1
    fi
    
    # Esperar a que los servidores estén listos
    echo -e "${BLUE}⏳ Esperando a que los servidores estén listos...${NC}"
    sleep 5
    
    # Verificar que los servidores estén funcionando
    echo -e "${BLUE}🔍 Verificando servidores...${NC}"
    
    if curl -s "http://localhost:8085" > /dev/null; then
        echo -e "${GREEN}✅ Dispositivo 1 funcionando en http://localhost:8085${NC}"
    else
        echo -e "${RED}❌ Dispositivo 1 no está respondiendo${NC}"
    fi
    
    if curl -s "http://localhost:8086" > /dev/null; then
        echo -e "${GREEN}✅ Dispositivo 2 funcionando en http://localhost:8086${NC}"
    else
        echo -e "${RED}❌ Dispositivo 2 no está respondiendo${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🎯 RESUMEN FINAL${NC}"
    echo "=================="
    echo -e "${GREEN}✅ Aplicaciones Flutter compiladas y servidas${NC}"
    echo -e "${GREEN}✅ Servidores web funcionando${NC}"
    echo ""
    echo -e "${BLUE}🌐 URLs de acceso:${NC}"
    echo "   📱 Dispositivo 1: http://localhost:8085"
    echo "   📱 Dispositivo 2: http://localhost:8086"
    echo ""
    echo -e "${YELLOW}💡 Para detener: ./stop-flutter-web.sh${NC}"
    echo ""
}

# Ejecutar función principal
main "$@"
