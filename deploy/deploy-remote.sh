#!/bin/bash
#====================================================================
# SBARZI ODONTOLOGIA - Deploy Remoto para VPS Hostinger
# Execute do seu computador local:
#   bash deploy/deploy-remote.sh
#====================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "======================================================"
echo "  SBARZI ODONTOLOGIA - Deploy Remoto"
echo "======================================================"
echo ""

VPS_IP="${VPS_IP:-31.97.29.196}"
VPS_USER="${VPS_USER:-root}"
REPO_URL="${REPO_URL:-}"

read -p "IP do VPS [$VPS_IP]: " input_ip
VPS_IP="${input_ip:-$VPS_IP}"

read -p "Usuário SSH [$VPS_USER]: " input_user
VPS_USER="${input_user:-$VPS_USER}"

read -p "Domínio (ex: app.sbarzi.com.br): " DOMAIN
if [ -z "$DOMAIN" ]; then
  echo -e "${RED}Domínio é obrigatório!${NC}"
  exit 1
fi

read -p "Email para SSL (ex: contato@sbarzi.com.br): " EMAIL
if [ -z "$EMAIL" ]; then
  echo -e "${RED}Email é obrigatório!${NC}"
  exit 1
fi

if [ -z "$REPO_URL" ]; then
  REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
  read -p "URL do repositório Git [$REPO_URL]: " input_repo
  REPO_URL="${input_repo:-$REPO_URL}"
fi

if [ -z "$REPO_URL" ]; then
  echo -e "${RED}URL do repositório é obrigatória!${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}[i]${NC} VPS: ${VPS_USER}@${VPS_IP}"
echo -e "${BLUE}[i]${NC} Domínio: ${DOMAIN}"
echo -e "${BLUE}[i]${NC} Email: ${EMAIL}"
echo -e "${BLUE}[i]${NC} Repo: ${REPO_URL}"
echo ""
read -p "Confirma deploy? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ]; then
  echo "Cancelado."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${GREEN}[1/3]${NC} Enviando script de setup para o VPS..."
scp "${SCRIPT_DIR}/setup-vps.sh" "${VPS_USER}@${VPS_IP}:/root/setup-vps.sh"

echo -e "${GREEN}[2/3]${NC} Executando setup no VPS..."
ssh -t "${VPS_USER}@${VPS_IP}" "chmod +x /root/setup-vps.sh && DOMAIN='${DOMAIN}' EMAIL='${EMAIL}' REPO_URL='${REPO_URL}' bash /root/setup-vps.sh"

echo ""
echo -e "${GREEN}[3/3]${NC} Deploy concluído!"
echo ""
echo "======================================================"
echo -e "  ${GREEN}APLICAÇÃO DISPONÍVEL EM:${NC}"
echo "  https://${DOMAIN}"
echo "======================================================"
echo ""
echo "  Para atualizar depois:"
echo "  ssh ${VPS_USER}@${VPS_IP} 'sudo -u sbarzi bash /home/sbarzi/update-dashboard.sh'"
echo ""
