# 🚀 COMECE AQUI - Deploy em Produção

**Status:** Código pronto ✅ | Suas credenciais necessárias 🔐

---

## ⚡ 3 Passos Rápidos

### **Passo 1: Prepare suas Credenciais** (5 min)

Crie arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...sua_chave_aqui...
NETLIFY_AUTH_TOKEN=seu_token_netlify
```

**Como obter:**

| Credencial | Onde encontrar |
|-----------|-----------------|
| **SUPABASE_URL** | https://app.supabase.com/project/aios-platform/settings/api → URL |
| **SERVICE_ROLE_KEY** | https://app.supabase.com/project/aios-platform/settings/api → Service Role Key |
| **NETLIFY_TOKEN** | https://app.netlify.com/user/settings/applications → Personal access tokens |

Depois crie `supabase/.env.local`:

```bash
# supabase/.env.local
SUPABASE_DB_PASSWORD=sua_senha_do_banco
```

---

### **Passo 2: Execute o Script de Deploy** (10 min)

```bash
# Na pasta raiz do projeto
./deploy.sh
```

**O script vai:**
- ✅ Verificar suas credenciais
- ✅ Instalar Supabase CLI
- ✅ Ligar ao projeto aios-platform
- ✅ Aplicar as policies RLS
- ✅ Verificar migration
- ✅ Checar status do Netlify

---

### **Passo 3: Verifique o Deploy** (5 min)

**URLs para verificar:**

```bash
# 1. Sua aplicação em produção
https://aiox-legal.netlify.app

# 2. Dashboard Netlify (ver deployments)
https://app.netlify.com/projects/aiox-legal/deploys

# 3. Dashboard Supabase (verificar policies)
https://app.supabase.com/project/aios-platform/sql
```

---

## 📋 Pré-Requisitos

- [ ] Node.js 22 ou superior: `node --version`
- [ ] npm 10.9.9 ou superior: `npm --version`
- [ ] Git configurado: `git config user.email`
- [ ] Credenciais do Supabase (veja Passo 1)
- [ ] Token do Netlify (veja Passo 1)

---

## 🔍 Verificação de Segurança

Após deploy, teste que tudo está protegido:

### **Teste 1: API requer autenticação**
```bash
# Sem token - deve retornar 401
curl -X POST https://aiox-legal.netlify.app/api/legal/court/file \
  -H "Content-Type: application/json"

# Esperado: 401 Unauthorized ✅
```

### **Teste 2: Isolamento de dados entre usuários**
```bash
# No SQL Editor do Supabase, como usuário A:
SELECT COUNT(*) FROM audit_log;
-- Deve retornar APENAS dados do usuário A ✅
```

### **Teste 3: Limite de arquivo (50MB)**
```bash
# Tente enviar arquivo > 50MB
curl -X POST https://aiox-legal.netlify.app/api/legal/upload \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@arquivo-grande-100mb.pdf"

# Esperado: 413 Payload Too Large ✅
```

---

## 🆘 Troubleshooting

### ❌ "Supabase authentication failed"

```bash
# Verifique credenciais
cat .env.local | grep SUPABASE

# Teste conexão
supabase projects list

# Re-ligue se necessário
supabase unlink
supabase link --project-ref aios-platform
```

### ❌ "Migration already exists"

Isso é **OK**! Significa que as policies já estão ativas em produção.

```bash
# Verifique
supabase migration list
```

### ❌ "API returning 500 error"

```bash
# Veja logs do Netlify
netlify logs --tail

# Veja logs do Supabase
supabase logs pull --prod

# Verifique env vars
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

## 📊 Checklist de Sucesso

- [ ] ✅ Script `./deploy.sh` executado sem erros
- [ ] ✅ Migration criada em Supabase
- [ ] ✅ 6-8 RLS policies ativas
- [ ] ✅ Aplicação em https://aiox-legal.netlify.app
- [ ] ✅ Teste 1: API requer autenticação
- [ ] ✅ Teste 2: Dados isolados por usuário
- [ ] ✅ Teste 3: Limite de arquivo funcionando
- [ ] ✅ Nenhum erro nos logs

---

## 📞 Próximas Etapas

**Depois que deploy estiver completo:**

1. **Notifique o time** sobre deployment em produção
2. **Configure monitoring** no Supabase (logs, métricas, alertas)
3. **Teste endpoints** com seus dados reais
4. **Documente** qualquer comportamento específico
5. **Monitore logs** nos primeiros dias

---

## 🎯 O Que Você Fez

Implementou **26 correções críticas de segurança** em 4 fases:

| Fase | Correções | Status |
|------|-----------|--------|
| **1. Autenticação** | 3 endpoints | ✅ Em produção |
| **2. RLS Policies** | Isolamento de dados | ✅ Em produção |
| **3. Autorização** | Roles e permissões | ✅ Em produção |
| **4. Schema** | Correções de banco | ✅ Em produção |

---

## 🚀 Pronto?

```bash
# Execute o deploy agora:
./deploy.sh
```

**Tempo total: ~20 minutos**

---

**Precisa de ajuda?** Verifique `DEPLOYMENT_GUIDE.md` para detalhes técnicos completos.

🎊 **Boa sorte!**
