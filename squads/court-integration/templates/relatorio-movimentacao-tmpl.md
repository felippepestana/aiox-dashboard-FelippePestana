# Template: Relatório de Movimentações Processuais

## Cabeçalho

```
RELATÓRIO DE MOVIMENTAÇÕES PROCESSUAIS
Data de Geração: {{DATA_GERACAO}}
Período Analisado: {{DATA_INICIO}} a {{DATA_FIM}}
Total de Processos Monitorados: {{TOTAL_PROCESSOS}}
Total de Movimentações Identificadas: {{TOTAL_MOVIMENTACOES}}
```

## Resumo Executivo

```
Movimentações Críticas: {{TOTAL_CRITICAS}}
Movimentações de Alta Relevância: {{TOTAL_ALTA}}
Prazos Vencendo em 5 dias úteis: {{PRAZOS_URGENTES}}
Processos Parados (>60 dias): {{PROCESSOS_PARADOS}}
```

## Alertas Urgentes

```
{{#ALERTAS}}
⚠ Processo: {{NUMERO_PROCESSO}}
  Tribunal: {{TRIBUNAL}}
  Evento: {{DESCRICAO_MOVIMENTACAO}}
  Data: {{DATA_MOVIMENTACAO}}
  Prazo: {{DIES_AD_QUEM}} ({{DIAS_RESTANTES}} dias úteis)
  Ação Requerida: {{ACAO_REQUERIDA}}
{{/ALERTAS}}
```

## Movimentações por Processo

```
{{#PROCESSOS}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Processo: {{NUMERO_CNJ}}
Tribunal: {{TRIBUNAL}} — {{VARA}}
Partes: {{AUTOR}} x {{REU}}

Movimentações no Período:
{{#MOVIMENTACOES}}
  {{DATA}} | {{CODIGO_CNJ}} | {{DESCRICAO}}
  Relevância: {{RELEVANCIA}}
  {{#PRAZO}}Prazo: {{DIES_AD_QUEM}} ({{DIAS_UTEIS_RESTANTES}} dias úteis){{/PRAZO}}
{{/MOVIMENTACOES}}
{{/PROCESSOS}}
```

## Prazos Consolidados

```
| Processo | Tipo de Prazo | Vencimento | Dias Úteis | Urgência |
|----------|---------------|------------|------------|----------|
{{#PRAZOS}}
| {{PROCESSO}} | {{TIPO}} | {{DIES_AD_QUEM}} | {{DIAS_RESTANTES}} | {{URGENCIA}} |
{{/PRAZOS}}
```

## Instruções de Preenchimento
- Substituir variáveis entre `{{}}` pelos dados reais
- Alertas devem ser ordenados por urgência (crítica primeiro)
- Movimentações em ordem cronológica decrescente (mais recente primeiro)
- Prazos ordenados por vencimento (mais próximo primeiro)
