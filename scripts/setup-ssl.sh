#!/bin/bash
# ============================================================
# AIOX Legal - SSL Setup Script
# Usage: sudo ./scripts/setup-ssl.sh <domain>
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 app.aiox-legal.com"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root."
    exit 1
fi

# ============================================================
# Step 1: Install Certbot
# ============================================================

if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt-get update -qq
    apt-get install -y -qq certbot python3-certbot-nginx
    log_ok "Certbot installed."
else
    log_ok "Certbot already installed."
fi

# ============================================================
# Step 2: Create webroot directory for ACME challenges
# ============================================================

mkdir -p /var/www/certbot
log_ok "Webroot directory created."

# ============================================================
# Step 3: Ensure Nginx is running with HTTP config
# ============================================================

# Create a temporary HTTP-only config if SSL cert doesn't exist yet
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    log_info "Creating temporary HTTP-only Nginx config for ACME challenge..."

    cat > /etc/nginx/sites-available/aiox-legal-temp <<NGINX_TEMP
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ACME challenge server';
        add_header Content-Type text/plain;
    }
}
NGINX_TEMP

    ln -sf /etc/nginx/sites-available/aiox-legal-temp /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
fi

# ============================================================
# Step 4: Obtain SSL certificate
# ============================================================

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    log_info "Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "admin@$DOMAIN" \
        --no-eff-email
    log_ok "SSL certificate obtained."

    # Remove temporary config
    rm -f /etc/nginx/sites-available/aiox-legal-temp
    rm -f /etc/nginx/sites-enabled/aiox-legal-temp
else
    log_ok "SSL certificate already exists for $DOMAIN."
fi

# ============================================================
# Step 5: Configure Nginx with SSL
# ============================================================

APP_DIR="/opt/aiox-legal"

if [ -f "$APP_DIR/nginx/nginx.conf" ]; then
    log_info "Deploying Nginx SSL configuration..."
    cp "$APP_DIR/nginx/nginx.conf" /etc/nginx/sites-available/aiox-legal
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/aiox-legal
    ln -sf /etc/nginx/sites-available/aiox-legal /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    nginx -t && systemctl reload nginx
    log_ok "Nginx configured with SSL."
else
    log_error "Nginx config template not found at $APP_DIR/nginx/nginx.conf"
    log_info "Make sure the application is deployed to $APP_DIR first."
    exit 1
fi

# ============================================================
# Step 6: Setup auto-renewal cron job
# ============================================================

log_info "Setting up SSL auto-renewal..."

if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    log_ok "Auto-renewal cron job added (runs daily at 3 AM)."
else
    log_ok "Auto-renewal cron job already exists."
fi

# ============================================================
# Step 7: Verify
# ============================================================

log_info "Verifying SSL setup..."

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    log_ok "SSL certificate is valid. Expires: $EXPIRY"
else
    log_error "SSL certificate file not found."
    exit 1
fi

echo ""
echo "============================================"
echo "  SSL Setup Complete for $DOMAIN"
echo "============================================"
echo ""
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo "  Expiry:      $EXPIRY"
echo "  Auto-renew:  Enabled (daily at 3 AM)"
echo ""
echo "  Test renewal: sudo certbot renew --dry-run"
echo ""
echo "============================================"
