#!/bin/bash
# ============================================================
# AIOX Legal - VPS Deployment Script
# Usage: ./scripts/deploy.sh [domain]
# ============================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="${1:-}"
APP_DIR="/opt/aiox-legal"
REPO_URL="${REPO_URL:-}"

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# Preflight checks
# ============================================================

if [ -z "$DOMAIN" ]; then
    echo ""
    echo "AIOX Legal - VPS Deployment Script"
    echo "==================================="
    echo ""
    echo "Usage: $0 <domain>"
    echo ""
    echo "Example: $0 app.aiox-legal.com"
    echo ""
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root. Use: sudo $0 $DOMAIN"
    exit 1
fi

echo ""
echo "============================================"
echo "  AIOX Legal - Deployment to Hostinger VPS"
echo "============================================"
echo "  Domain: $DOMAIN"
echo "  App Dir: $APP_DIR"
echo "============================================"
echo ""

# ============================================================
# Step 1: System updates and prerequisites
# ============================================================

log_info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
log_ok "System updated."

# ============================================================
# Step 2: Install Docker if not present
# ============================================================

if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log_ok "Docker installed."
else
    log_ok "Docker already installed: $(docker --version)"
fi

# ============================================================
# Step 3: Install Docker Compose if not present
# ============================================================

if ! docker compose version &> /dev/null; then
    log_info "Installing Docker Compose plugin..."
    apt-get install -y -qq docker-compose-plugin
    log_ok "Docker Compose installed."
else
    log_ok "Docker Compose already installed: $(docker compose version)"
fi

# ============================================================
# Step 4: Install Nginx if not present
# ============================================================

if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    apt-get install -y -qq nginx
    systemctl enable nginx
    log_ok "Nginx installed."
else
    log_ok "Nginx already installed: $(nginx -v 2>&1)"
fi

# ============================================================
# Step 5: Install Certbot if not present
# ============================================================

if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt-get install -y -qq certbot python3-certbot-nginx
    log_ok "Certbot installed."
else
    log_ok "Certbot already installed: $(certbot --version 2>&1)"
fi

# ============================================================
# Step 6: Clone or pull repository
# ============================================================

if [ -d "$APP_DIR" ]; then
    log_info "Updating existing repository..."
    cd "$APP_DIR"
    git pull --ff-only
    log_ok "Repository updated."
else
    if [ -z "$REPO_URL" ]; then
        log_warn "REPO_URL not set. Copying from current directory..."
        mkdir -p "$APP_DIR"
        cp -r "$(dirname "$(dirname "$(readlink -f "$0")")")"/* "$APP_DIR/"
        cp -r "$(dirname "$(dirname "$(readlink -f "$0")")")"/.env.example "$APP_DIR/" 2>/dev/null || true
        cp -r "$(dirname "$(dirname "$(readlink -f "$0")")")"/.dockerignore "$APP_DIR/" 2>/dev/null || true
    else
        log_info "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
    fi
    log_ok "Repository ready at $APP_DIR."
fi

cd "$APP_DIR"

# ============================================================
# Step 7: Setup environment file
# ============================================================

if [ ! -f "$APP_DIR/.env" ]; then
    log_info "Creating .env from .env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"

    # Generate a random AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32)
    sed -i "s|AUTH_SECRET=change-this-to-random-string|AUTH_SECRET=$AUTH_SECRET|g" "$APP_DIR/.env"

    # Set the domain
    sed -i "s|NEXT_PUBLIC_APP_URL=https://yourdomain.com|NEXT_PUBLIC_APP_URL=https://$DOMAIN|g" "$APP_DIR/.env"

    log_ok ".env created. Review and update: $APP_DIR/.env"
else
    log_ok ".env already exists."
fi

# ============================================================
# Step 8: Create data directories
# ============================================================

mkdir -p "$APP_DIR/uploads"
mkdir -p /var/www/certbot
log_ok "Data directories created."

# ============================================================
# Step 9: Build Docker images
# ============================================================

log_info "Building Docker images (this may take a few minutes)..."
docker compose build --no-cache
log_ok "Docker images built."

# ============================================================
# Step 10: Setup SSL with Let's Encrypt
# ============================================================

log_info "Setting up SSL for $DOMAIN..."

# First, configure Nginx without SSL to allow ACME challenge
cat > /etc/nginx/sites-available/aiox-legal <<NGINX_TEMP
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
NGINX_TEMP

ln -sf /etc/nginx/sites-available/aiox-legal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Obtain SSL certificate
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    log_info "Obtaining SSL certificate..."
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "admin@$DOMAIN" \
        --no-eff-email
    log_ok "SSL certificate obtained."
else
    log_ok "SSL certificate already exists."
fi

# ============================================================
# Step 11: Configure Nginx with SSL
# ============================================================

log_info "Configuring Nginx reverse proxy..."

# Copy the template and replace domain placeholder
cp "$APP_DIR/nginx/nginx.conf" /etc/nginx/sites-available/aiox-legal
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/aiox-legal

# Test and reload Nginx
nginx -t
systemctl reload nginx
log_ok "Nginx configured with SSL."

# ============================================================
# Step 12: Setup SSL auto-renewal
# ============================================================

log_info "Setting up SSL auto-renewal..."
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    log_ok "SSL auto-renewal cron job added."
else
    log_ok "SSL auto-renewal already configured."
fi

# ============================================================
# Step 13: Start containers
# ============================================================

log_info "Starting Docker containers..."
docker compose up -d
log_ok "Containers started."

# Wait for health checks
log_info "Waiting for services to become healthy..."
sleep 10

# ============================================================
# Step 14: Verify deployment
# ============================================================

echo ""
echo "============================================"
echo "  Deployment Status"
echo "============================================"
echo ""

docker compose ps

echo ""

# Check if services are responding
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    log_ok "Next.js app is running on port 3000"
else
    log_warn "Next.js app may still be starting up..."
fi

if curl -sf http://localhost:4001/health > /dev/null 2>&1; then
    log_ok "Monitor server is running on port 4001"
else
    log_warn "Monitor server may still be starting up..."
fi

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  URL:      https://$DOMAIN"
echo "  Monitor:  https://$DOMAIN/api/monitor/"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f        # View logs"
echo "    docker compose restart        # Restart services"
echo "    docker compose down           # Stop services"
echo "    ./scripts/backup.sh           # Run backup"
echo ""
echo "============================================"
