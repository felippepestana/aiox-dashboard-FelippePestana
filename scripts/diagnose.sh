#!/bin/bash
# ============================================================
# AIOX Legal - VPS Diagnostic Script
# Run this ON THE VPS to diagnose issues
# Usage: bash scripts/diagnose.sh legalperformance.app
# ============================================================

DOMAIN="${1:-legalperformance.app}"

echo "============================================"
echo "  AIOX Legal - Diagnóstico VPS"
echo "  Domínio: $DOMAIN"
echo "============================================"
echo ""

# 1. IP da VPS
echo "=== 1. IP DESTA MÁQUINA ==="
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')
echo "  IP público desta VPS: $VPS_IP"
echo "  Hostname: $(hostname)"
echo ""

# 2. DNS do domínio
echo "=== 2. DNS DO DOMÍNIO ==="
DNS_IP=$(dig +short "$DOMAIN" 2>/dev/null || nslookup "$DOMAIN" 2>/dev/null | grep 'Address:' | tail -1 | awk '{print $2}')
echo "  $DOMAIN aponta para: $DNS_IP"

if [ "$VPS_IP" = "$DNS_IP" ]; then
    echo "  ✅ DNS CORRETO — domínio aponta para esta VPS"
else
    echo "  ❌ DNS INCORRETO — domínio aponta para $DNS_IP mas esta VPS é $VPS_IP"
    echo ""
    echo "  AÇÃO NECESSÁRIA:"
    echo "  No painel Hostinger (hPanel → Domínios → $DOMAIN → DNS):"
    echo "    Tipo: A | Nome: @ | Valor: $VPS_IP | TTL: 3600"
    echo "    Tipo: A | Nome: www | Valor: $VPS_IP | TTL: 3600"
fi
echo ""

# 3. Docker
echo "=== 3. DOCKER ==="
if command -v docker &>/dev/null; then
    echo "  Docker: $(docker --version)"
    echo "  Containers:"
    docker ps --format "  {{.Names}} | {{.Status}} | {{.Ports}}" 2>/dev/null || echo "  (nenhum container rodando)"
else
    echo "  ❌ Docker NÃO instalado"
fi
echo ""

# 4. Nginx
echo "=== 4. NGINX ==="
if command -v nginx &>/dev/null; then
    echo "  Nginx: $(nginx -v 2>&1)"
    echo "  Status: $(systemctl is-active nginx)"
    echo "  Config test: $(nginx -t 2>&1 | tail -1)"
else
    echo "  ❌ Nginx NÃO instalado"
fi
echo ""

# 5. Portas
echo "=== 5. PORTAS ==="
echo "  Porta 80 (HTTP):"
ss -tlnp | grep ':80 ' | head -1 || echo "    NÃO está escutando"
echo "  Porta 443 (HTTPS):"
ss -tlnp | grep ':443 ' | head -1 || echo "    NÃO está escutando"
echo "  Porta 3000 (Next.js):"
ss -tlnp | grep ':3000 ' | head -1 || echo "    NÃO está escutando"
echo "  Porta 4001 (Monitor):"
ss -tlnp | grep ':4001 ' | head -1 || echo "    NÃO está escutando"
echo ""

# 6. .env
echo "=== 6. ARQUIVOS ==="
APP_DIR="/opt/aiox-legal"
if [ -d "$APP_DIR" ]; then
    echo "  App dir: ✅ $APP_DIR existe"
    echo "  .env: $([ -f "$APP_DIR/.env" ] && echo '✅ existe' || echo '❌ NÃO existe')"
    echo "  Dockerfile: $([ -f "$APP_DIR/Dockerfile" ] && echo '✅ existe' || echo '❌ NÃO existe')"
    echo "  docker-compose.yml: $([ -f "$APP_DIR/docker-compose.yml" ] && echo '✅ existe' || echo '❌ NÃO existe')"
    echo "  Git branch: $(cd "$APP_DIR" && git branch --show-current 2>/dev/null || echo 'N/A')"
    echo "  Git commits: $(cd "$APP_DIR" && git log --oneline | wc -l 2>/dev/null || echo 'N/A')"
else
    echo "  ❌ App dir NÃO existe em $APP_DIR"
fi
echo ""

# 7. SSL
echo "=== 7. SSL ==="
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "  ✅ Certificado SSL existe para $DOMAIN"
    echo "  Expira: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null)"
else
    echo "  ❌ Certificado SSL NÃO existe para $DOMAIN"
fi
echo ""

# 8. Teste de acesso
echo "=== 8. TESTE DE ACESSO ==="
echo "  HTTP localhost:3000:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
echo "    Status: $HTTP_STATUS"

echo "  HTTP $DOMAIN:"
HTTP_EXT=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" 2>/dev/null)
echo "    Status: $HTTP_EXT"

echo "  HTTPS $DOMAIN:"
HTTPS_EXT=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null)
echo "    Status: $HTTPS_EXT"
echo ""

# 9. Resumo
echo "============================================"
echo "  RESUMO DO DIAGNÓSTICO"
echo "============================================"
echo ""
echo "  IP público VPS: $VPS_IP"
echo "  DNS $DOMAIN: $DNS_IP"
echo "  DNS correto: $([ "$VPS_IP" = "$DNS_IP" ] && echo '✅ SIM' || echo '❌ NÃO')"
echo "  Docker: $(command -v docker &>/dev/null && echo '✅' || echo '❌')"
echo "  Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'inativo')"
echo "  App rodando: $([ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ] && echo '✅' || echo '❌')"
echo "  SSL: $([ -d "/etc/letsencrypt/live/$DOMAIN" ] && echo '✅' || echo '❌')"
echo ""
echo "  Para corrigir problemas, execute:"
echo "    bash scripts/fix-deploy.sh $DOMAIN"
echo "============================================"
