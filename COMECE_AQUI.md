# 🚀 COMECE AQUI — Deploy em Produção

**Status:** código das correções de segurança pronto na branch. As migrations de RLS
ainda precisam ser aplicadas no Supabase de produção, e o resultado precisa ser verificado.

---

## 1. Credenciais (5 min)

Crie `.env.local` na raiz do projeto (já está no `.gitignore`? confirme antes de salvar segredos):

```bash
# .env.local
SUPABASE_PROJECT_REF=abcdefghijklmnopqrst        # ID de 20 letras, NÃO o nome do projeto
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
SUPABASE_ACCESS_TOKEN=sbp_...                    # token pessoal da CLI
APP_URL=https://aiox-legal.netlify.app
# opcional, para o teste de limite de 50MB:
# TEST_USER_TOKEN=eyJ...                         # JWT de um usuário de teste
```

Crie `supabase/.env.local`:

```bash
SUPABASE_DB_PASSWORD=sua_senha_do_banco
```

| Item | Onde obter |
|------|------------|
| **SUPABASE_PROJECT_REF** | URL do painel: `https://supabase.com/dashboard/project/<ID>` |
| **NEXT_PUBLIC_SUPABASE_URL** | Painel → Project Settings → API → Project URL |
| **SUPABASE_ACCESS_TOKEN** | https://supabase.com/dashboard/account/tokens |
| **SUPABASE_DB_PASSWORD** | Senha definida na criação do projeto (Project Settings → Database para redefinir) |

> A `SUPABASE_SERVICE_ROLE_KEY` **não** é necessária para o script. Ela pertence às
> variáveis de ambiente do Netlify (Site settings → Environment variables), nunca ao repositório.

---

## 2. Simular e aplicar (10 min)

```bash
./deploy.sh --dry-run   # mostra quais migrations seriam aplicadas, sem alterar nada
./deploy.sh             # aplica no banco remoto e roda os testes
```

O script:
- valida as credenciais e o formato do project ref;
- usa a Supabase CLI via `npx` se ela não estiver instalada;
- vincula o projeto (`supabase link`) a partir da raiz;
- aplica as migrations no **remoto** com `supabase db push`
  (o antigo `supabase migration up` só afetava o banco local);
- **executa** os testes HTTP e termina com erro se algum falhar.

---

## 3. Testes executados pelo script

| Teste | Esperado |
|-------|----------|
| `GET /` | 200 |
| `POST /api/legal/court/file` sem token | 401 |
| `POST /api/legal/upload` sem token | 401 |
| Upload > 50MB com `TEST_USER_TOKEN` | 413 |

Isolamento entre usuários (manual): o SQL Editor usa um papel privilegiado que **ignora RLS**,
então o teste precisa ser feito pela API com dois usuários diferentes — cada um deve
enxergar apenas os próprios registros de `audit_log` / `petition_versions`.

Para listar as policies ativas:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🆘 Problemas comuns

**"SUPABASE_PROJECT_REF inválido"** → você usou o nome do projeto; copie o ID da URL do painel.

**Falha no `link` / autenticação** → confira `SUPABASE_ACCESS_TOKEN` e a senha do banco.

**`db push` diz que está tudo atualizado** → as migrations já estavam aplicadas; confira com
`npx supabase migration list`.

**Testes retornam 500** → veja os logs das functions no painel do Netlify e
os logs da API no painel do Supabase; confira as env vars do site no Netlify.

---

## ✅ Checklist

- [ ] `./deploy.sh --dry-run` mostra as migrations esperadas
- [ ] `./deploy.sh` termina com "todos os testes passaram"
- [ ] Policies listadas no `pg_policies`
- [ ] Isolamento entre dois usuários verificado pela API
- [ ] Sem erros nos logs nas primeiras horas

Detalhes técnicos: `DEPLOYMENT_GUIDE.md`.
