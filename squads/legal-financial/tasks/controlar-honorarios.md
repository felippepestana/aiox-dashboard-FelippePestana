# Controlar Honorários

## Objetivo
Registrar, acompanhar e reportar honorários advocatícios do escritório, incluindo contratuais, sucumbenciais e de êxito.

## Agente Responsável
`controlador-honorarios`

## Inputs
- Contratos de honorários vigentes
- Notas fiscais emitidas no período
- Movimentações financeiras (recebimentos e pendências)
- Processos com honorários sucumbenciais fixados

## Passos
1. Consolidar contratos de honorários vigentes por cliente
2. Verificar faturamento previsto vs. realizado no período
3. Emitir notas fiscais pendentes
4. Atualizar aging de recebíveis (0-30, 31-60, 61-90, >90 dias)
5. Identificar clientes inadimplentes e ações de cobrança
6. Registrar honorários sucumbenciais fixados em sentença
7. Acompanhar alvarás de levantamento pendentes
8. Calcular rateio de honorários entre sócios/associados
9. Gerar relatório de faturamento consolidado

## Output Estruturado
```yaml
controle_honorarios:
  periodo: ""
  faturamento:
    previsto: 0.0
    realizado: 0.0
    taxa_realizacao: 0.0
  por_tipo:
    contratuais_fixos: 0.0
    contratuais_variaveis: 0.0
    exito: 0.0
    sucumbenciais: 0.0
  aging:
    a_vencer: 0.0
    ate_30_dias: 0.0
    de_31_a_60: 0.0
    de_61_a_90: 0.0
    acima_90: 0.0
  inadimplencia:
    taxa: 0.0
    clientes: []
  notas_emitidas: 0
  alvaras_pendentes: []
```

## Critérios de Qualidade
- Todos os contratos vigentes registrados
- Aging atualizado com dados reais de recebimento
- Inadimplência identificada com ações propostas
- Rateio calculado conforme regras do contrato social
