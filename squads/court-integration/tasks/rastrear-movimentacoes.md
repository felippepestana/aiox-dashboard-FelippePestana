# Rastrear Movimentações

## Objetivo
Rastrear e classificar novas movimentações processuais em todos os processos da carteira ativa, gerando alertas para eventos críticos e calculando prazos.

## Agente Responsável
`rastreador-movimentacao`

## Inputs
- Lista de processos da carteira ativa
- Data da última verificação por processo
- Códigos de movimentação de referência (Tabela Unificada CNJ)

## Passos
1. Carregar lista de processos e data da última verificação
2. Para cada processo, consultar movimentações recentes via API
3. Filtrar movimentações posteriores à última verificação
4. Classificar cada movimentação por código CNJ
5. Atribuir nível de relevância (crítica, alta, média, baixa)
6. Identificar eventos que geram prazo processual
7. Calcular prazos em dias úteis (art. 219, CPC)
8. Gerar alertas para movimentações críticas e de alta relevância
9. Detectar processos parados (sem movimentação há mais de 60 dias)
10. Atualizar data da última verificação

## Output Estruturado
```yaml
rastreamento:
  data_execucao: ""
  processos_verificados: 0
  novas_movimentacoes:
    - processo: ""
      data: ""
      codigo_cnj: ""
      descricao: ""
      relevancia: ""
      gera_prazo: false
      prazo:
        dies_a_quo: ""
        dies_ad_quem: ""
  alertas:
    - processo: ""
      tipo: ""
      mensagem: ""
      urgencia: ""
  processos_parados:
    - processo: ""
      ultima_movimentacao: ""
      dias_parado: 0
```

## Critérios de Qualidade
- Todos os processos da carteira verificados
- Movimentações classificadas com código CNJ correto
- Prazos calculados em dias úteis
- Alertas gerados para eventos críticos
- Processos parados identificados
