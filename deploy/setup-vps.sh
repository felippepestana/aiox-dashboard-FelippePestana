#!/bin/bash
#====================================================================
# SBARZI ODONTOLOGIA - Setup VPS Hostinger
# Execute como root no VPS: bash setup-vps.sh
#====================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✔]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

echo ""
echo "======================================================"
echo "  SBARZI ODONTOLOGIA - Setup VPS Hostinger"
echo "======================================================"
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
  error "Execute como root: sudo bash setup-vps.sh"
fi

# Perguntar domínio
read -p "Digite o domínio (ex: app.sbarzi.com.br): " DOMAIN
if [ -z "$DOMAIN" ]; then
  error "Domínio é obrigatório!"
fi

read -p "Digite o email para SSL (ex: contato@sbarzi.com.br): " EMAIL
if [ -z "$EMAIL" ]; then
  error "Email é obrigatório!"
fi

read -p "URL do repositório Git (ex: https://github.com/user/repo.git): " REPO_URL
if [ -z "$REPO_URL" ]; then
  error "URL do repositório é obrigatória!"
fi

APP_DIR="/var/www/sbarzi-dashboard"
APP_USER="sbarzi"
NODE_VERSION="20"

echo ""
info "Domínio: $DOMAIN"
info "Email: $EMAIL"
info "Diretório: $APP_DIR"
echo ""
read -p "Confirma? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ]; then
  echo "Cancelado."
  exit 0
fi

# ==========================================
# 1. Atualizar sistema
# ==========================================
log "Atualizando sistema..."
apt update -y && apt upgrade -y

# ==========================================
# 2. Instalar dependências essenciais
# ==========================================
log "Instalando dependências..."
apt install -y curl git build-essential ufw software-properties-common

# ==========================================
# 3. Criar usuário para a aplicação
# ==========================================
if id "$APP_USER" &>/dev/null; then
  warn "Usuário $APP_USER já existe"
else
  log "Criando usuário $APP_USER..."
  adduser --disabled-password --gecos "" $APP_USER
  usermod -aG sudo $APP_USER
fi

# ==========================================
# 4. Instalar Node.js via NodeSource
# ==========================================
if command -v node &>/dev/null; then
  CURRENT_NODE=$(node -v)
  warn "Node.js já instalado: $CURRENT_NODE"
else
  log "Instalando Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt install -y nodejs
  log "Node.js $(node -v) instalado"
fi

# ==========================================
# 5. Instalar PM2
# ==========================================
if command -v pm2 &>/dev/null; then
  warn "PM2 já instalado"
else
  log "Instalando PM2..."
  npm install -g pm2
  log "PM2 instalado"
fi

# ==========================================
# 6. Instalar Nginx
# ==========================================
if command -v nginx &>/dev/null; then
  warn "Nginx já instalado"
else
  log "Instalando Nginx..."
  apt install -y nginx
  log "Nginx instalado"
fi

# ==========================================
# 7. Configurar Firewall (UFW)
# ==========================================
log "Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
log "Firewall configurado"

# ==========================================
# 8. Clonar repositório
# ==========================================
if [ -d "$APP_DIR" ]; then
  warn "Diretório $APP_DIR já existe. Atualizando..."
  cd $APP_DIR
  sudo -u $APP_USER git pull origin main || true
else
  log "Clonando repositório..."
  mkdir -p /var/www
  git clone "$REPO_URL" $APP_DIR
  chown -R $APP_USER:$APP_USER $APP_DIR
fi

cd $APP_DIR

# ==========================================
# 9. Instalar dependências do projeto
# ==========================================
log "Instalando dependências do projeto..."
sudo -u $APP_USER npm install

# ==========================================
# 10. Criar arquivo .env.local
# ==========================================
if [ ! -f "$APP_DIR/.env.local" ]; then
  log "Criando .env.local..."
  cat > $APP_DIR/.env.local << ENVEOF
# Sbarzi Dashboard - Variáveis de Ambiente
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN

# Adicione suas chaves de API aqui:
# NEXT_PUBLIC_API_KEY=
# DATABASE_URL=
ENVEOF
  chown $APP_USER:$APP_USER $APP_DIR/.env.local
  warn "Edite o .env.local com suas variáveis: nano $APP_DIR/.env.local"
fi

# ==========================================
# 11. Build da aplicação
# ==========================================
log "Fazendo build da aplicação..."
sudo -u $APP_USER npm run build

# ==========================================
# 12. Configurar PM2
# ==========================================
log "Configurando PM2..."
cat > $APP_DIR/ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'sbarzi-dashboard',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/sbarzi-dashboard',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/www/sbarzi-dashboard/logs/error.log',
    out_file: '/var/www/sbarzi-dashboard/logs/output.log',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
};
PMEOF
chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js

# Criar diretório de logs
mkdir -p $APP_DIR/logs
chown $APP_USER:$APP_USER $APP_DIR/logs

# Iniciar aplicação
log "Iniciando aplicação com PM2..."
sudo -u $APP_USER pm2 start $APP_DIR/ecosystem.config.js
sudo -u $APP_USER pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
log "PM2 configurado para auto-start"

# ==========================================
# 13. Configurar Nginx
# ==========================================
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect to HTTPS (será ativado pelo Certbot)
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
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
    }

    # Cache de arquivos estáticos
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Limitar tamanho de upload
    client_max_body_size 10M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
NGINXEOF

# Ativar site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t || error "Configuração Nginx inválida!"
systemctl restart nginx
log "Nginx configurado"

# ==========================================
# 14. SSL com Let's Encrypt
# ==========================================
log "Instalando Certbot para SSL..."
apt install -y certbot python3-certbot-nginx

info "Obtendo certificado SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL || {
  warn "SSL falhou! Verifique se o domínio aponta para este servidor."
  warn "Execute manualmente depois: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}

# Renovação automática
systemctl enable certbot.timer
log "SSL configurado com renovação automática"

# ==========================================
# 15. Criar script de atualização
# ==========================================
log "Criando script de atualização..."
cat > /home/$APP_USER/update-dashboard.sh << 'UPDEOF'
#!/bin/bash
set -e
echo "Atualizando Sbarzi Dashboard..."

APP_DIR="/var/www/sbarzi-dashboard"
cd $APP_DIR

echo "[1/4] Baixando atualizações..."
git pull origin main

echo "[2/4] Instalando dependências..."
npm install

echo "[3/4] Fazendo build..."
npm run build

echo "[4/4] Reiniciando aplicação..."
pm2 restart sbarzi-dashboard

echo "Atualização concluída!"
pm2 status
UPDEOF
chown $APP_USER:$APP_USER /home/$APP_USER/update-dashboard.sh
chmod +x /home/$APP_USER/update-dashboard.sh

# ==========================================
# RESULTADO FINAL
# ==========================================
echo ""
echo "======================================================"
echo -e "  ${GREEN}SETUP CONCLUÍDO COM SUCESSO!${NC}"
echo "======================================================"
echo ""
echo "  Aplicação rodando em: https://$DOMAIN"
echo ""
echo "  Comandos úteis:"
echo "  - Ver status:     pm2 status"
echo "  - Ver logs:       pm2 logs sbarzi-dashboard"
echo "  - Reiniciar:      pm2 restart sbarzi-dashboard"
echo "  - Atualizar:      bash /home/$APP_USER/update-dashboard.sh"
echo "  - Nginx logs:     tail -f /var/log/nginx/error.log"
echo ""
echo "  Lembre-se de editar: $APP_DIR/.env.local"
echo "======================================================"
