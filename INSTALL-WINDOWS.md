# AIOX Legal Performance — Guia de Instalação Local (Windows 11)

## Seu Equipamento
- **Notebook**: Dell Alienware M15
- **Processador**: Intel Core i7 13ª Geração
- **RAM**: 32 GB
- **GPU**: 8 GB VRAM
- **Disco dedicado**: 512 GB (expansível para 1 TB)
- **SO**: Windows 11

> Este equipamento é mais do que suficiente para rodar toda a plataforma localmente com excelente performance.

---

## PARTE 1 — Instalação (20 minutos)

### Passo 1: Instalar Node.js (3 min)

1. Abra o navegador e acesse: **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada — 20.x ou superior)
3. Execute o instalador `.msi` baixado
4. Clique **Next → Next → Next → Install → Finish**
5. **Verificação**: Abra o **Prompt de Comando** (tecle `Win + R`, digite `cmd`, Enter) e execute:
   ```
   node --version
   npm --version
   ```
   Deve mostrar algo como `v20.x.x` e `10.x.x`

### Passo 2: Instalar Git (2 min)

1. Acesse: **https://git-scm.com/download/win**
2. O download inicia automaticamente
3. Execute o instalador
4. Clique **Next** em todas as telas (manter padrões)
5. **Verificação** (no cmd):
   ```
   git --version
   ```

### Passo 3: Clonar o Projeto no Disco Dedicado (2 min)

Abra o **Prompt de Comando** e execute:

```cmd
:: Navegar para o disco dedicado (ajuste a letra D: conforme sua partição)
D:

:: Criar pasta do projeto
mkdir AIOX-Legal
cd AIOX-Legal

:: Clonar o repositório
git clone https://github.com/felippepestana/aiox-dashboard-FelippePestana.git .

:: Trocar para a branch com toda a plataforma
git checkout claude/analyze-case-files-enZip
```

### Passo 4: Instalar Dependências (3 min)

```cmd
npm install
```

Aguarde até terminar (pode levar 2-3 minutos).

### Passo 5: Criar Arquivo de Configuração (1 min)

No **Prompt de Comando**, execute:

```cmd
:: Criar o arquivo .env
echo NODE_ENV=development > .env
echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env
echo AUTH_SECRET=apex-legal-performance-local-2026 >> .env
```

### Passo 6: Iniciar a Plataforma (1 min)

```cmd
npm run dev
```

Aguarde até aparecer a mensagem:
```
✓ Ready in Xs
▲ Local: http://localhost:3000
```

### Passo 7: Acessar no Navegador

Abra o **Google Chrome** e acesse:

```
http://localhost:3000
```

**Credenciais de login:**
- Email: `admin@aiox.legal`
- Senha: `admin123`

---

## PARTE 2 — Navegação da Plataforma

Após o login, você verá o **Portal AIOX** com opção de acessar o **Módulo Jurídico**.

### Mapa de Funcionalidades

| Seção da Sidebar | Página | O que faz |
|-----------------|--------|-----------|
| **Operacional** | Painel Jurídico | Dashboard com estatísticas, prazos, ações rápidas |
| | Processos | Cadastrar e gerenciar processos judiciais |
| | Clientes | Cadastro de clientes PF/PJ |
| | Prazos | Calendário e lista de prazos com alertas |
| | Peças | Gerenciar petições e peças processuais |
| | Publicações | Monitoramento de DJE (Diário de Justiça) |
| **Financeiro** | Dashboard Financeiro | Receita, despesas, lucro |
| | Honorários | Controle de parcelas e inadimplência |
| | Faturamento | Criação e gestão de faturas |
| | Impostos | IRPJ, CSLL, ISS, PIS/COFINS |
| **Estratégia** | Painel Estratégico | SELEM (5 pilares) com radar chart |
| | Legal Canvas | Canvas de negócio jurídico editável |
| | KPIs | Indicadores de performance |
| **Marketing** | Marketing Jurídico | Dashboard com compliance OAB |
| | Pipeline de Leads | Kanban de prospecção |
| | Conteúdo | Calendário editorial jurídico |
| **Produtividade** | Gerar Petição | Wizard IA em 3 passos para criar petições |
| | Jurimetria | Análise de probabilidade de êxito |
| | Fluxogramas | Guia visual de procedimentos |
| | Chat Jurídico | Chat com IA para consultas |
| | Calculadora | Prazos, correção monetária, verbas trabalhistas |
| | Marketplace | Banco de peças compartilhadas |
| **Assistente IA** | Entrevista | Assistente em tempo real para entrevistas |
| | Upload Docs | Upload de PDFs para análise |
| | Busca de Ativos | Pesquisa patrimonial (estilo SISBAJUD) |
| **Inteligência** | Precedentes | Pesquisa de jurisprudência STF/STJ |
| | Magistrados | Perfil e padrão de voto de juízes |
| **Avançado** | Análise de Docs | IA para análise de documentos |
| | Business Intel. | Dashboard de BI com métricas |
| | WhatsApp | Integração WhatsApp (preview) |

---

## PARTE 3 — Uso Diário

### Iniciar a plataforma (todos os dias)

Abra o **Prompt de Comando** e execute:

```cmd
D:
cd AIOX-Legal
npm run dev
```

Depois abra `http://localhost:3000` no navegador.

### Parar a plataforma

No Prompt de Comando, pressione `Ctrl + C`.

### Criar um atalho na Área de Trabalho

1. Clique com botão direito na Área de Trabalho → **Novo → Atalho**
2. Em "Local do item", cole:
   ```
   cmd /k "D: && cd AIOX-Legal && npm run dev"
   ```
3. Clique **Avançar**
4. Nome: **AIOX Legal**
5. Clique **Concluir**
6. Clique com botão direito no atalho → **Propriedades** → **Alterar Ícone** (opcional)

Agora basta dar duplo clique no atalho para iniciar a plataforma.

### Atualizar para novas versões

Quando houver atualizações, execute no Prompt de Comando:

```cmd
D:
cd AIOX-Legal
git pull origin claude/analyze-case-files-enZip
npm install
npm run dev
```

---

## PARTE 4 — Resolução de Problemas

### "node não é reconhecido como comando"
→ Reinstale o Node.js e marque a opção "Add to PATH" durante a instalação.

### "git não é reconhecido como comando"
→ Reinstale o Git e marque "Add to PATH".

### Erro "EACCES" ou permissão negada
→ Abra o Prompt de Comando como **Administrador** (clique direito → Executar como administrador).

### Porta 3000 já em uso
→ Feche outros programas que usam a porta, ou inicie em outra porta:
```cmd
set PORT=3001 && npm run dev
```
Acesse `http://localhost:3001`.

### Tela branca no navegador
→ Limpe o cache: `Ctrl + Shift + Delete` no Chrome → Limpar dados → Recarregue.

### Build muito lento
→ Seu i7 13ª gen com 32GB é mais que suficiente. Se estiver lento, feche outros programas pesados.

---

## PARTE 5 — Segurança

### Alterar senha de login

A senha padrão `admin123` é apenas para desenvolvimento. Para alterar:

1. Abra o arquivo `D:\AIOX-Legal\src\lib\auth.ts`
2. Procure a linha com `admin123`
3. Substitua por uma senha forte
4. Salve e reinicie a plataforma

### Dados locais

Todos os dados ficam no seu computador:
- **Processos, clientes, prazos**: armazenados no localStorage do navegador
- **Uploads**: salvos na pasta `D:\AIOX-Legal\uploads\`
- **Nenhum dado é enviado para a internet** (a plataforma roda 100% local)

---

## Especificações Técnicas

| Requisito | Seu PC | Necessário | Status |
|-----------|--------|-----------|--------|
| Processador | i7 13ª Gen | i5 ou superior | ✅ Excede |
| RAM | 32 GB | 8 GB mínimo | ✅ 4x acima |
| Disco | 512 GB dedicado | 2 GB para o projeto | ✅ 256x acima |
| GPU | 8 GB VRAM | Não necessária | ✅ Disponível para IA futura |
| Node.js | Instalar | v18+ | Instalar |
| Git | Instalar | v2+ | Instalar |
| Navegador | Chrome/Edge | Qualquer moderno | ✅ |

O projeto ocupa ~500 MB com todas as dependências instaladas. Seu disco de 512 GB tem espaço de sobra.
