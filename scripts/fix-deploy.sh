#!/bin/bash
# ============================================================
# AIOX Legal - VPS Fix Script
# Run this on the VPS to fix deployment issues
# Usage: bash fix-deploy.sh legalperformance.app
# ============================================================

DOMAIN="${1:-legalperformance.app}"
APP_DIR="/opt/aiox-legal"

echo "============================================"
echo "  AIOX Legal - Fix Script"
echo "  Domain: $DOMAIN"
echo "============================================"

cd "$APP_DIR" || { echo "ERROR: $APP_DIR not found"; exit 1; }

# ── Fix 1: Create .env file ─────────────────────────────────
echo "[FIX 1] Creating .env file..."

AUTH_SECRET=$(openssl rand -base64 32)

cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN
AUTH_SECRET=$AUTH_SECRET
DATAJUD_API_KEY=
PJE_USERNAME=
PJE_PASSWORD=
PJE_CERTIFICATE=
ESAJ_USERNAME=
ESAJ_PASSWORD=
EPROC_USERNAME=
EPROC_PASSWORD=
EPROC_CERTIFICATE=
SINAPSES_API_URL=
SINAPSES_API_KEY=
SINAPSES_INSTITUTION_ID=
MONITOR_PORT=4001
MONITOR_DB_PATH=/data/events.db
LEGAL_DB_PATH=/data/legal.db
EOF

echo "[OK] .env created with AUTH_SECRET generated"

# ── Fix 2: Start Nginx properly ─────────────────────────────
echo "[FIX 2] Starting Nginx..."

systemctl enable nginx
systemctl start nginx || true

# Create temp HTTP-only config for SSL challenge
cat > /etc/nginx/sites-available/aiox-legal <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/aiox-legal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx
echo "[OK] Nginx started with HTTP config"

# ── Fix 3: Create required directories ──────────────────────
echo "[FIX 3] Creating directories..."
mkdir -p "$APP_DIR/uploads"
mkdir -p /var/www/certbot
echo "[OK] Directories created"

# ── Fix 4: Build and start Docker containers ────────────────
echo "[FIX 4] Building Docker images (this takes 3-5 minutes)..."
cd "$APP_DIR"
docker compose down 2>/dev/null || true
docker compose build --no-cache
echo "[OK] Docker images built"

echo "[FIX 5] Starting containers..."
docker compose up -d
echo "[OK] Containers started"

# Wait for app to be ready
echo "[INFO] Waiting 15 seconds for app to start..."
sleep 15

# ── Fix 5: Setup SSL ────────────────────────────────────────
echo "[FIX 6] Setting up SSL certificate..."

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "admin@$DOMAIN" \
        --no-eff-email || {
        echo "[WARN] SSL failed. App accessible at http://$DOMAIN (without HTTPS)"
        echo "[INFO] You can retry SSL later with: certbot certonly --nginx -d $DOMAIN"
    }
fi

# If SSL succeeded, update Nginx with HTTPS
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    cat > /etc/nginx/sites-available/aiox-legal <<NGINX_SSL
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /stream {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
NGINX_SSL

    nginx -t && systemctl reload nginx
    echo "[OK] Nginx configured with SSL (HTTPS)"
else
    echo "[OK] Running with HTTP only (SSL can be added later)"
fi

# ── Fix 6: Auto-renewal cron ────────────────────────────────
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    echo "[OK] SSL auto-renewal cron added"
fi

# ── Verification ────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Deployment Status"
echo "============================================"
echo ""
docker compose ps
echo ""

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "[OK] Next.js app is running"
else
    echo "[WARN] Next.js may still be starting. Check: docker compose logs web"
fi

echo ""
echo "============================================"
echo "  DEPLOY COMPLETE"
echo "============================================"
echo ""
echo "  URL: https://$DOMAIN"
echo "  Login: admin@aiox.legal / admin123"
echo ""
echo "  Commands:"
echo "    docker compose logs -f web    # View logs"
echo "    docker compose restart        # Restart"
echo "    docker compose ps             # Status"
echo "============================================"
