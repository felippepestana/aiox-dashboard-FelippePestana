# Gerar Estratégia Pós-Entrevista

## Objetivo
Analisar o transcript completo da entrevista para extrair fatos-chave, identificar teses jurídicas, catalogar provas e gerar uma recomendação de estratégia processual.

## Agente Responsável
`gerador-estrategia`

## Inputs
- Transcript completo da entrevista
- Área jurídica
- Sugestões aceitas/rejeitadas durante a entrevista
- Precedentes encontrados durante a entrevista

## Passos
1. Receber transcript completo e metadados
2. **Extração de Fatos**:
   a. Identificar datas mencionadas (regex)
   b. Identificar valores monetários (regex)
   c. Identificar documentos/CPF/CNPJ (regex)
   d. Extrair declarações factuais do cliente (entradas > 50 chars)
   e. Classificar cada fato por importância
3. **Análise de Teses**:
   a. Carregar teses possíveis da área jurídica
   b. Avaliar quais teses são sustentadas pelo transcript
   c. Classificar força de cada tese (forte/moderada/fraca)
   d. Identificar base legal de cada tese
4. **Catalogação de Provas**:
   a. Detectar menções a documentos, testemunhos, perícias
   b. Classificar status de cada prova (disponível/obter/faltante)
   c. Classificar importância (essencial/suporte/opcional)
5. **Geração de Recomendações**:
   a. Verificar provas essenciais faltantes → ação imediata
   b. Avaliar necessidade de tutela de urgência
   c. Considerar possibilidade de composição
   d. Recomendar pesquisa jurisprudencial complementar
6. **Avaliação de Risco**:
   a. Comparar teses fortes vs. fracas
   b. Avaliar disponibilidade de provas
   c. Classificar risco geral (baixo/moderado/alto)
7. Consolidar em StrategyDraft estruturado

## Output Estruturado
```yaml
strategy_draft:
  id: ""
  area: ""
  summary: ""
  key_facts: []
  claims: []
  evidence: []
  recommendations: []
  petition_outline: {}
  risk_assessment: ""
  estimated_duration: ""
  estimated_value: ""
  next_steps: []
  generated_at: ""
```

## Critérios de Qualidade
- Mínimo 3 fatos-chave identificados
- Todas as teses com base legal referenciada
- Provas essenciais faltantes sinalizadas
- Recomendações ordenadas por prioridade
- Avaliação de risco coerente com teses e provas
