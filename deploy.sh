#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# deploy.sh — Script de despliegue XCIEN en VPS Linux
# Uso: bash deploy.sh [--dominio tu.dominio.com] [--ssl]
# ══════════════════════════════════════════════════════════════════
set -e

# ── Colores ────────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

DOMINIO=""
INSTALAR_SSL=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dominio) DOMINIO="$2"; shift ;;
        --ssl)     INSTALAR_SSL=true ;;
        *) warn "Opción desconocida: $1" ;;
    esac
    shift
done

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   🚀 XCIEN 2026 — Deploy a VPS         ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# ── 1. Verificar requisitos ────────────────────────────────────────
info "Verificando requisitos del sistema..."
command -v docker  &>/dev/null || err "Docker no instalado. Ejecuta: curl -fsSL https://get.docker.com | sh"
command -v docker compose &>/dev/null || err "Docker Compose no instalado."
log "Docker y Docker Compose disponibles"

# ── 2. Verificar .env ──────────────────────────────────────────────
if [ ! -f ".env" ]; then
    warn ".env no encontrado. Copiando .env.example..."
    cp .env.example .env
    err "Edita el archivo .env con tus valores reales y vuelve a ejecutar deploy.sh"
fi
log ".env encontrado"

# ── 3. Configurar dominio en nginx ─────────────────────────────────
if [ -n "$DOMINIO" ]; then
    info "Configurando dominio: $DOMINIO"
    sed -i "s/TU_DOMINIO.COM/$DOMINIO/g" nginx/nginx.conf
    log "Dominio configurado en nginx.conf"
fi

# ── 4. SSL con Let's Encrypt ────────────────────────────────────────
if [ "$INSTALAR_SSL" = true ] && [ -n "$DOMINIO" ]; then
    info "Instalando Certbot para SSL..."
    command -v certbot &>/dev/null || (apt-get update -q && apt-get install -y certbot)
    
    # Parar nginx si corre para liberar el puerto 80
    docker compose stop nginx 2>/dev/null || true
    
    certbot certonly --standalone -d "$DOMINIO" --non-interactive --agree-tos \
        --email "admin@$DOMINIO" || warn "SSL falló. Continuando sin SSL..."
    
    if [ -f "/etc/letsencrypt/live/$DOMINIO/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMINIO/fullchain.pem" nginx/ssl/fullchain.pem
        cp "/etc/letsencrypt/live/$DOMINIO/privkey.pem"   nginx/ssl/privkey.pem
        log "Certificado SSL instalado"
    fi
else
    # Modo sin SSL: generar certificado auto-firmado para que nginx arranque
    info "Generando certificado auto-firmado (para HTTP/pruebas)..."
    mkdir -p nginx/ssl
    if [ ! -f "nginx/ssl/fullchain.pem" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/privkey.pem \
            -out nginx/ssl/fullchain.pem \
            -subj "/C=MX/ST=NL/L=Monterrey/O=XCIEN/CN=${DOMINIO:-localhost}" \
            2>/dev/null
        log "Certificado auto-firmado generado"
    fi
fi

# ── 5. Build y arranque ────────────────────────────────────────────
info "Construyendo imágenes Docker (puede tardar 2-5 min la primera vez)..."
docker compose build --no-cache
log "Imágenes construidas"

info "Iniciando servicios..."
docker compose up -d
log "Servicios iniciados"

# ── 6. Esperar a que el backend esté listo ─────────────────────────
info "Esperando que el backend arranque..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health &>/dev/null; then
        log "Backend respondiendo en puerto 8000"
        break
    fi
    sleep 2
    echo -n "."
done

# ── 7. Verificación final ──────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ XCIEN DESPLEGADO EXITOSAMENTE      ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

if [ -n "$DOMINIO" ]; then
    echo -e "  🌐 Portal:    ${BLUE}https://$DOMINIO${NC}"
    echo -e "  🔌 API:       ${BLUE}https://$DOMINIO/api/health${NC}"
else
    echo -e "  🌐 Portal:    ${BLUE}http://$(curl -s ifconfig.me 2>/dev/null || echo 'TU_IP')${NC}"
    echo -e "  🔌 API local: ${BLUE}http://localhost:8000/api/health${NC}"
fi

echo ""
echo -e "  📋 Ver logs:      ${YELLOW}docker compose logs -f backend${NC}"
echo -e "  🔄 Reiniciar:     ${YELLOW}docker compose restart${NC}"
echo -e "  🛑 Detener:       ${YELLOW}docker compose down${NC}"
echo -e "  🔁 Actualizar:    ${YELLOW}git pull && bash deploy.sh${NC}"
echo ""

# ── 8. Renovación automática SSL ───────────────────────────────────
if [ "$INSTALAR_SSL" = true ] && [ -n "$DOMINIO" ]; then
    info "Configurando renovación automática de SSL..."
    CRON_CMD="0 3 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/$DOMINIO/fullchain.pem $(pwd)/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMINIO/privkey.pem $(pwd)/nginx/ssl/ && docker compose restart nginx"
    (crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_CMD") | crontab -
    log "Renovación SSL programada (domingos a las 3am)"
fi
