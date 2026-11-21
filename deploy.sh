#!/usr/bin/env bash
# Deploy em produção — aplica as migrations (RLS) no Supabase remoto
# e verifica de fato os endpoints publicados no Netlify.
#
# Uso (na raiz do repositório):
#   ./deploy.sh            # aplica migrations + testes
#   ./deploy.sh --dry-run  # só mostra o que seria aplicado

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
fail() { echo -e "${RED}❌ $*${NC}"; }
step() { echo; echo -e "${BLUE}━━ $* ━━${NC}"; }

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------------------
step "1. Credenciais"
# ---------------------------------------------------------------------------
[[ -f .env.local ]]          || { fail ".env.local não encontrado (veja COMECE_AQUI.md)"; exit 1; }
[[ -f supabase/.env.local ]] || { fail "supabase/.env.local não encontrado (veja COMECE_AQUI.md)"; exit 1; }

set -a
# shellcheck disable=SC1091
source .env.local
# shellcheck disable=SC1091
source supabase/.env.local
set +a

missing=0
for v in SUPABASE_PROJECT_REF SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD NEXT_PUBLIC_SUPABASE_URL; do
  if [[ -z "${!v:-}" ]]; then fail "Variável $v não definida"; missing=1; fi
done
[[ $missing -eq 0 ]] || exit 1

# O project ref é um ID de 20 letras minúsculas (aparece na URL do painel),
# NÃO o nome do projeto.
if [[ ! "$SUPABASE_PROJECT_REF" =~ ^[a-z]{20}$ ]]; then
  fail "SUPABASE_PROJECT_REF inválido: '$SUPABASE_PROJECT_REF'"
  echo "   Use o ID de 20 letras da URL: https://supabase.com/dashboard/project/<ID>"
  exit 1
fi

expected_url="https://${SUPABASE_PROJECT_REF}.supabase.co"
if [[ "${NEXT_PUBLIC_SUPABASE_URL%/}" != "$expected_url" ]]; then
  warn "NEXT_PUBLIC_SUPABASE_URL ($NEXT_PUBLIC_SUPABASE_URL) não corresponde ao ref ($expected_url)"
fi

APP_URL="${APP_URL:-https://aiox-legal.netlify.app}"
ok "Credenciais carregadas (projeto $SUPABASE_PROJECT_REF, app $APP_URL)"

# ---------------------------------------------------------------------------
step "2. Supabase CLI"
# ---------------------------------------------------------------------------
# A instalação global via 'npm install -g supabase' não é suportada; usamos npx.
if command -v supabase >/dev/null 2>&1; then
  SB=(supabase)
else
  SB=(npx --yes supabase@latest)
fi
"${SB[@]}" --version
ok "CLI disponível"

# ---------------------------------------------------------------------------
step "3. Vincular ao projeto remoto"
# ---------------------------------------------------------------------------
# Deve ser executado na raiz (onde fica a pasta supabase/), não dentro dela.
linked_ref="$(cat supabase/.temp/project-ref 2>/dev/null || true)"
if [[ "$linked_ref" == "$SUPABASE_PROJECT_REF" ]]; then
  ok "Já vinculado a $SUPABASE_PROJECT_REF"
else
  "${SB[@]}" link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
  ok "Vinculado a $SUPABASE_PROJECT_REF"
fi

# ---------------------------------------------------------------------------
step "4. Migrations (RLS) no banco REMOTO"
# ---------------------------------------------------------------------------
echo "Situação atual (local x remoto):"
"${SB[@]}" migration list --password "$SUPABASE_DB_PASSWORD"

if [[ $DRY_RUN -eq 1 ]]; then
  "${SB[@]}" db push --dry-run --password "$SUPABASE_DB_PASSWORD"
  warn "Dry-run: nada foi aplicado."
  exit 0
fi

# 'migration up' aplica só no banco LOCAL; para produção é 'db push'.
"${SB[@]}" db push --password "$SUPABASE_DB_PASSWORD"
ok "Migrations aplicadas no remoto"

echo "Situação após o push:"
"${SB[@]}" migration list --password "$SUPABASE_DB_PASSWORD"

# ---------------------------------------------------------------------------
step "5. Testes de verificação (executados de verdade)"
# ---------------------------------------------------------------------------
failures=0
check() { # nome, status_esperado, comando curl...
  local name="$1" expected="$2"; shift 2
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$@" || echo 000)"
  if [[ "$code" == "$expected" ]]; then ok "$name → HTTP $code"
  else fail "$name → HTTP $code (esperado $expected)"; failures=$((failures+1)); fi
}

check "App responde"                     200 "$APP_URL/"
check "court/file sem token exige login" 401 -X POST "$APP_URL/api/legal/court/file" -H 'Content-Type: application/json' -d '{}'
check "upload sem token exige login"     401 -X POST "$APP_URL/api/legal/upload"

if [[ -n "${TEST_USER_TOKEN:-}" ]]; then
  big="$(mktemp)"; trap 'rm -f "$big"' EXIT
  head -c $((51*1024*1024)) /dev/zero > "$big"
  check "upload > 50MB é recusado" 413 -X POST "$APP_URL/api/legal/upload" \
    -H "Authorization: Bearer $TEST_USER_TOKEN" -F "file=@${big};type=application/pdf"
else
  warn "TEST_USER_TOKEN não definido — teste de limite de 50MB pulado"
fi

echo
echo "Confira as policies no SQL Editor do Supabase:"
echo "  SELECT tablename, policyname, cmd FROM pg_policies"
echo "  WHERE schemaname = 'public' ORDER BY tablename, policyname;"
echo "  https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new"

# ---------------------------------------------------------------------------
step "Resultado"
# ---------------------------------------------------------------------------
if [[ $failures -eq 0 ]]; then
  ok "Deploy das migrations concluído e todos os testes passaram."
else
  fail "$failures teste(s) falharam — revise antes de considerar o deploy concluído."
  exit 1
fi
