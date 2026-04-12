# AIOX Legal — Guia de Deploy na Hostinger VPS

Guia passo a passo para fazer o deploy da plataforma AIOX Legal em uma VPS Hostinger com domínio próprio e SSL.

## Pré-requisitos

### 1. VPS Hostinger
- Plano mínimo: **KVM 2** (2 CPU, 8GB RAM, 100GB SSD)
- Sistema operacional: **Ubuntu 22.04 LTS** ou **Ubuntu 24.04 LTS**
- Acesso root ou sudo

### 2. Domínio
- Domínio registrado (ex: `aiox.legal`, `meuescritorio.com.br`)
- Registro DNS tipo **A** apontando para o IP da VPS
- Opcionalmente registro **AAAA** (IPv6) se VPS tiver IPv6

### 3. Ferramentas locais (opcional)
- Git instalado
- SSH configurado

---

## Passo 1: Configurar DNS

No painel do seu registrador de domínio (Hostinger ou outro), adicione:

```
Tipo: A
Nome: @  (ou o subdomínio desejado, ex: app)
Valor: [IP da VPS Hostinger]
TTL: 3600

Tipo: A
Nome: www
Valor: [IP da VPS Hostinger]
TTL: 3600
```

Aguarde a propagação DNS (5 min a 48h). Teste com:
```bash
dig +short seudominio.com.br
# Deve retornar o IP da VPS
```

---

## Passo 2: Conectar na VPS

```bash
# Via SSH (senha root da Hostinger)
ssh root@SEU_IP_DA_VPS

# Ou se você criou um usuário com sudo
ssh usuario@SEU_IP_DA_VPS
```

---

## Passo 3: Deploy Automatizado

Na VPS, execute:

```bash
# 1. Atualizar sistema
apt update && apt upgrade -y

# 2. Instalar git e dependências básicas
apt install -y git curl

# 3. Clonar o repositório
cd /opt
git clone https://github.com/felippepestana/aiox-dashboard-FelippePestana.git aiox-legal
cd aiox-legal

# 4. Trocar para a branch de desenvolvimento
git checkout claude/analyze-case-files-enZip

# 5. Tornar scripts executáveis
chmod +x scripts/*.sh

# 6. Executar script de deploy com seu domínio
./scripts/deploy.sh seudominio.com.br
```

O script automaticamente:
- Instala Docker, Docker Compose, Nginx, Certbot
- Cria arquivo `.env` com `AUTH_SECRET` gerado
- Builda as imagens Docker (web + monitor)
- Obtém certificado SSL via Let's Encrypt
- Configura Nginx com proxy reverso
- Inicia os containers
- Mostra status final e URL

---

## Passo 4: Verificar Deploy

```bash
# Verificar containers rodando
docker compose ps

# Ver logs do web
docker compose logs -f web

# Testar health check
curl https://seudominio.com.br/api/health

# Acessar o painel
# Browser → https://seudominio.com.br
```

### Credenciais iniciais
- **Email**: `admin@aiox.legal`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão assim que logar pela primeira vez.

---

## Passo 5: Configuração Pós-Deploy

### 5.1 Ajustar variáveis de ambiente (opcional)

```bash
cd /opt/aiox-legal
nano .env
```

Configure as variáveis conforme necessário:
```
DATAJUD_API_KEY=seu-api-key-datajud
PJE_USERNAME=seu-usuario-pje
PJE_PASSWORD=sua-senha-pje
# ... outras variáveis
```

Reinicie os containers:
```bash
docker compose restart
```

### 5.2 Configurar backup automático

```bash
# Tornar script executável
chmod +x /opt/aiox-legal/scripts/backup.sh

# Adicionar ao crontab (backup diário às 3h)
crontab -e
```

Adicione a linha:
```
0 3 * * * /opt/aiox-legal/scripts/backup.sh >> /var/log/aiox-backup.log 2>&1
```

### 5.3 Monitoramento

```bash
# Ver uso de recursos dos containers
docker stats

# Ver logs em tempo real
docker compose logs -f --tail=100

# Reiniciar um serviço específico
docker compose restart web
```

---

## Passo 6: Atualizações

Para atualizar a aplicação com novas versões:

```bash
cd /opt/aiox-legal

# Baixar últimas alterações
git pull origin claude/analyze-case-files-enZip

# Rebuildar e reiniciar
docker compose down
docker compose up -d --build

# Verificar status
docker compose ps
curl https://seudominio.com.br/api/health
```

---

## Troubleshooting

### SSL não funciona
```bash
# Re-executar configuração SSL
./scripts/setup-ssl.sh seudominio.com.br

# Testar renovação manual
certbot renew --dry-run
```

### Container não inicia
```bash
# Ver logs de erro
docker compose logs web

# Rebuildar do zero
docker compose down -v
docker compose up -d --build
```

### Nginx 502 Bad Gateway
```bash
# Verificar se o container está rodando
docker compose ps

# Verificar se a porta 3000 está respondendo localmente
curl http://localhost:3000/api/health

# Restartar nginx
systemctl restart nginx
```

### Banco de dados corrompido
```bash
# Restaurar do backup mais recente
cd /opt/aiox-legal/backups
ls -lh  # Ver backups disponíveis
# Restaurar conforme instruções no backup
```

---

## Segurança Recomendada

### 1. Firewall (UFW)
```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (para redirect)
ufw allow 443/tcp     # HTTPS
ufw enable
```

### 2. Fail2ban
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. SSH Hardening
Edite `/etc/ssh/sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys
```

### 4. Auto-updates
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## URLs da Aplicação

Após o deploy bem-sucedido:

| Recurso | URL |
|---------|-----|
| Portal principal | `https://seudominio.com.br` |
| Login | `https://seudominio.com.br/login` |
| Módulo Jurídico | `https://seudominio.com.br/legal` |
| Upload de documentos | `https://seudominio.com.br/legal/upload` |
| Health check | `https://seudominio.com.br/api/health` |

---

## Arquitetura de Produção

```
Internet
   ↓
[Cloudflare/DNS] (opcional)
   ↓
[Hostinger VPS]
   ↓
[Nginx :80 / :443] — SSL termination
   ↓
[Docker Network]
   ├── [web: Next.js :3000] — AIOX Legal app
   └── [monitor: Bun :4001] — Event monitor + WebSocket
   ↓
[Volumes]
   ├── /data — SQLite databases
   └── /uploads — Client files
```

---

## Custos Estimados Hostinger VPS

| Plano | CPU | RAM | SSD | Preço/mês (2026) |
|-------|-----|-----|-----|------------------|
| KVM 1 | 1 vCPU | 4GB | 50GB | ~R$ 30 |
| **KVM 2** | **2 vCPU** | **8GB** | **100GB** | **~R$ 60** ← Recomendado |
| KVM 4 | 4 vCPU | 16GB | 200GB | ~R$ 120 |
| KVM 8 | 8 vCPU | 32GB | 400GB | ~R$ 240 |

Para uso inicial, o **KVM 2** é suficiente. Upgrade quando a base de usuários crescer.

---

## Suporte

Em caso de problemas:
1. Verifique os logs: `docker compose logs`
2. Consulte o health check: `/api/health`
3. Verifique o branch: `git log --oneline -5`
