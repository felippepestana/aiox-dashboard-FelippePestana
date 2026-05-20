# OpenRouter — Guia de Configuração Otimizada para AIOX Legal

## 1. O que é o OpenRouter

O OpenRouter é um **proxy unificado** que dá acesso a 200+ LLMs (Claude, GPT, Llama, Mistral, Gemini) por uma única API. Você paga apenas pelo uso — sem mensalidade.

## 2. Sua Key Atual

Já está configurada no `.env` do projeto:
```
OPENROUTER_API_KEY=sk-or-v1-48af...
```

**Nunca compartilhe essa key.** Ela já foi registrada no `.env` (que não vai para o git).

## 3. Como o Roteamento Funciona no Projeto

O arquivo `src/lib/ai-router.ts` implementa um agente roteador que:

```
Tarefa recebida → Classifica complexidade → Escolhe LLM mais barata capaz
```

### Tabela de Roteamento Atual

| Tarefa | Complexidade | Modelo | Custo/1K tokens |
|--------|-------------|--------|----------------|
| Chat (pergunta rápida) | Simples | Claude Haiku | $0.001 |
| Cálculo de prazo | Simples | Claude Haiku | $0.001 |
| Resumo de documento | Simples | Claude Haiku | $0.001 |
| Pesquisa de precedentes | Média | Claude Sonnet | $0.003 |
| Revisão de cláusulas | Média | Claude Sonnet | $0.003 |
| Análise de documento | Média | Claude Sonnet | $0.003 |
| Geração de petição | Complexa | Claude Opus | $0.015 |
| Estratégia processual | Complexa | Claude Opus | $0.015 |

### Estimativa de Custo Mensal

| Uso | Interações/mês | Custo estimado |
|-----|---------------|---------------|
| Advogado solo (leve) | ~100 | R$ 5-15 |
| Advogado solo (intenso) | ~500 | R$ 25-75 |
| Escritório pequeno (5 adv) | ~2.000 | R$ 100-300 |
| Escritório médio (20 adv) | ~10.000 | R$ 500-1.500 |

## 4. Configuração Recomendada no Painel OpenRouter

### 4.1. Acesse https://openrouter.ai/settings

**Limites de Gasto:**
- Defina um **limite mensal** para evitar surpresas:
  - Advogado solo: $20/mês
  - Escritório: $100-500/mês
- OpenRouter envia alerta quando atingir 80% do limite

### 4.2. Modelos Permitidos

No painel, você pode restringir quais modelos sua key pode acessar. Recomendo habilitar apenas:

```
✅ anthropic/claude-3.5-haiku    (tarefas simples)
✅ anthropic/claude-sonnet-4     (tarefas médias)
✅ anthropic/claude-opus-4       (tarefas complexas)
✅ google/gemini-2.0-flash       (fallback barato)
❌ openai/gpt-4o                 (desabilitar — Claude é melhor para jurídico PT-BR)
❌ meta-llama/*                  (desabilitar — qualidade insuficiente para jurídico)
```

### 4.3. Rate Limits

A key gratuita do OpenRouter tem limite de:
- 200 requests/minuto
- 200.000 tokens/minuto

Para uso jurídico normal, isso é mais que suficiente. Se atingir o limite, o sistema automaticamente espera e retenta.

## 5. Monitoramento de Uso

### 5.1. No Painel OpenRouter
- https://openrouter.ai/activity — ver todas as chamadas
- Filtre por modelo, data, custo
- Exporte relatório CSV

### 5.2. No AIOX Legal
Cada resposta da IA retorna:
```json
{
  "content": "resposta...",
  "model": "Claude Haiku",
  "complexity": "simple",
  "tokensUsed": 450,
  "estimatedCost": 0.00045,
  "durationMs": 1200
}
```

Isso permite rastrear custo por funcionalidade, por usuário, por processo.

## 6. Otimizações de Custo

### 6.1. Cache de Respostas
Perguntas frequentes (ex: "qual prazo da contestação?") podem ser cacheadas para evitar chamadas repetidas à API. O sistema já tem keyword-matching como fallback — se a IA estiver indisponível, responde com dados locais.

### 6.2. Truncamento Inteligente
Documentos grandes (>50K caracteres) são truncados antes de enviar à API. O ai-router.ts já faz isso no `analyzePDF`.

### 6.3. Temperature Baixa
Para uso jurídico, usamos `temperature: 0.2-0.3` — respostas mais determinísticas e precisas. Menos criatividade = menos alucinação.

### 6.4. System Prompt Otimizado
O prompt do sistema é fixo e otimizado para direito brasileiro, economizando tokens que seriam gastos com instruções repetidas.

## 7. Fallback e Resiliência

O sistema implementa:
1. Se OpenRouter falhar → responde com dados locais (keyword-matching)
2. Se modelo principal falhar → tenta modelo mais barato
3. Se API key expirar → mostra mensagem clara ao usuário

## 8. Segurança

- Key armazenada apenas em `.env` (servidor)
- Frontend NUNCA vê a key — todas as chamadas passam por API routes
- Chamadas são server-side only (Next.js API routes)
- Rate limiting por IP pode ser adicionado no middleware

## 9. Próximos Passos (quando implementarmos)

| Melhoria | Impacto | Prioridade |
|----------|---------|-----------|
| Cache Redis para respostas frequentes | -30% custo | Alta |
| Streaming de respostas (SSE) | UX melhor | Média |
| Fallback para Gemini Flash | Custo menor | Média |
| Fine-tuning com dados jurídicos BR | Qualidade melhor | Futura |
| RAG com base de legislação local | Respostas precisas | Futura |
