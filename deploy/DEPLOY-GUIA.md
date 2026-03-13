# Guia de Deploy - Sbarzi Odontologia na Hostinger VPS

## Pré-requisitos

- VPS Hostinger com **Ubuntu 22.04 ou 24.04** (plano KVM 1 ou superior, mínimo 2GB RAM)
- Domínio apontando para o IP do VPS
- Acesso SSH (root)

---

## Passo a Passo

### 1. Contratar VPS na Hostinger

1. Acesse [hostinger.com.br](https://www.hostinger.com.br/servidor-vps)
2. Escolha o plano **KVM 1** (ou superior)
   - 2 vCPU, 2GB RAM, 50GB SSD é suficiente
3. Na instalação, selecione **Ubuntu 22.04** como sistema operacional
4. Anote o **IP do servidor** e a **senha root**

### 2. Apontar domínio para o VPS

No painel de DNS (Hostinger ou seu registrador):

```
Tipo: A
Nome: @ (ou o subdomínio, ex: app)
Valor: IP_DO_SEU_VPS
TTL: 3600
```

Se quiser `www` também:
```
Tipo: A
Nome: www
Valor: IP_DO_SEU_VPS
TTL: 3600
```

> Aguarde até 24h para propagação DNS (geralmente leva minutos)

### 3. Acessar o VPS via SSH

No terminal do seu computador:

```bash
ssh root@IP_DO_SEU_VPS
```

### 4. Enviar e executar o script de setup

**Opção A - Copiar via SCP (do seu computador):**
```bash
scp deploy/setup-vps.sh root@IP_DO_SEU_VPS:/root/
```

**Opção B - Baixar direto no VPS (se o repo for público):**
```bash
curl -O https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy/setup-vps.sh
```

**Opção C - Colar manualmente:**
```bash
nano /root/setup-vps.sh
# Cole o conteúdo do arquivo e salve com Ctrl+X, Y, Enter
```

### 5. Executar o setup

```bash
chmod +x /root/setup-vps.sh
bash /root/setup-vps.sh
```

O script vai pedir:
- **Domínio** (ex: `app.sbarzi.com.br`)
- **Email** para SSL (ex: `contato@sbarzi.com.br`)
- **URL do repositório** Git

O script faz tudo automaticamente:
- Instala Node.js 20, PM2, Nginx
- Clona o repositório
- Faz `npm install` e `npm run build`
- Configura Nginx como proxy reverso
- Instala SSL (HTTPS) com Let's Encrypt
- Configura PM2 para auto-restart

### 6. Verificar

Acesse `https://seu-dominio.com.br` no navegador!

---

## Comandos úteis (executar como usuário `sbarzi`)

```bash
# Trocar para o usuário da aplicação
su - sbarzi

# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs sbarzi-dashboard

# Reiniciar aplicação
pm2 restart sbarzi-dashboard

# Atualizar após novos commits
bash ~/update-dashboard.sh
```

---

## Atualização do Site

Após fazer push de novas alterações para o repositório:

```bash
ssh root@IP_DO_VPS
su - sbarzi
bash ~/update-dashboard.sh
```

Ou como root:
```bash
ssh root@IP_DO_VPS
sudo -u sbarzi bash /home/sbarzi/update-dashboard.sh
```

---

## Troubleshooting

### App não carrega
```bash
pm2 logs sbarzi-dashboard --lines 50
```

### Erro de porta
```bash
# Verificar se a porta 3000 está em uso
ss -tlnp | grep 3000
```

### Nginx erro
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Renovar SSL manualmente
```bash
certbot renew --dry-run
```

### Sem memória
```bash
# Adicionar swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## Especificações Recomendadas

| Plano Hostinger | vCPU | RAM  | SSD  | Adequado para           |
|-----------------|------|------|------|-------------------------|
| KVM 1           | 1    | 4GB  | 50GB | Desenvolvimento/Teste   |
| KVM 2           | 2    | 8GB  | 100GB| Produção (recomendado)  |
| KVM 4           | 4    | 16GB | 200GB| Alta demanda            |
