#!/bin/bash
#====================================================================
# SBARZI ODONTOLOGIA - Deploy Rápido para Apresentação
#
# Execute no VPS via SSH:
#   ssh root@31.97.29.196 'bash -s' < deploy/quick-deploy.sh
#
# Ou copie para o VPS e execute:
#   scp deploy/quick-deploy.sh root@31.97.29.196:/root/
#   ssh root@31.97.29.196 'bash /root/quick-deploy.sh'
#====================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

APP_DIR="/var/www/sbarzi-dashboard"
APP_USER="sbarzi"
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================================"
echo "  SBARZI ODONTOLOGIA - Deploy Rápido"
echo "  Servidor: $SERVER_IP"
echo "======================================================"
echo ""

# 1. Sistema
log "Atualizando sistema..."
apt update -y -qq
apt install -y -qq curl git build-essential nginx > /dev/null 2>&1

# 2. Node.js
if ! command -v node &>/dev/null; then
  log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt install -y -qq nodejs > /dev/null 2>&1
fi
log "Node.js $(node -v)"

# 3. PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 > /dev/null 2>&1
fi
log "PM2 instalado"

# 4. Usuário
if ! id "$APP_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" $APP_USER > /dev/null 2>&1
fi

# 5. Clonar/Atualizar repositório
REPO_URL="${REPO_URL:-https://github.com/FelippePestana/aiox-dashboard-FelippePestana.git}"
BRANCH="${BRANCH:-claude/dental-ai-platform-blMDu}"

if [ -d "$APP_DIR" ]; then
  warn "Diretório existe, atualizando..."
  cd $APP_DIR
  git fetch origin $BRANCH
  git checkout $BRANCH
  git pull origin $BRANCH
else
  log "Clonando repositório (branch: $BRANCH)..."
  git clone -b $BRANCH "$REPO_URL" $APP_DIR
fi
chown -R $APP_USER:$APP_USER $APP_DIR
cd $APP_DIR

# 6. Instalar dependências e build
log "Instalando dependências (pode levar alguns minutos)..."
sudo -u $APP_USER npm install --production=false 2>&1 | tail -1

log "Fazendo build da aplicação..."
sudo -u $APP_USER npm run build 2>&1 | tail -3

# 7. PM2
mkdir -p $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR

cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sbarzi-dashboard',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/sbarzi-dashboard',
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '500M',
    error_file: '/var/www/sbarzi-dashboard/logs/error.log',
    out_file: '/var/www/sbarzi-dashboard/logs/output.log',
    merge_logs: true
  }]
};
EOF
chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js

pm2 delete sbarzi-dashboard 2>/dev/null || true
sudo -u $APP_USER pm2 start $APP_DIR/ecosystem.config.js
sudo -u $APP_USER pm2 save
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER > /dev/null 2>&1
log "PM2 configurado"

# 8. Nginx (acesso direto por IP, sem domínio)
cat > /etc/nginx/sites-available/sbarzi << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    client_max_body_size 10M;
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/sbarzi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx
log "Nginx configurado"

# 9. Firewall
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
log "Firewall configurado"

# Resultado
echo ""
echo "======================================================"
echo -e "  ${GREEN}DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "======================================================"
echo ""
echo -e "  ${GREEN}➜ Acesse: http://$SERVER_IP/dental${NC}"
echo ""
echo "  Comandos úteis:"
echo "  - Status:     pm2 status"
echo "  - Logs:       pm2 logs sbarzi-dashboard"
echo "  - Reiniciar:  pm2 restart sbarzi-dashboard"
echo ""
echo "  Para adicionar domínio e SSL depois:"
echo "  bash /root/setup-vps.sh"
echo "======================================================"
