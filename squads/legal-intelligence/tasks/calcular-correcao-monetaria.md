# Calcular Correção Monetária

## Objetivo
Realizar cálculos de correção monetária e juros de mora sobre valores jurídicos, utilizando os índices adequados conforme a natureza da dívida e jurisprudência aplicável.

## Agente Responsável
`calculista-juridico`

## Inputs
- Valor original (principal)
- Data de início (dies a quo da correção)
- Data final (data de cálculo)
- Tipo de dívida (cível, tributária, trabalhista, fazenda pública)
- Índice de correção aplicável (ou auto-determinação)
- Taxa de juros aplicável

## Passos
1. Identificar índice de correção adequado conforme tipo de dívida
2. Identificar taxa de juros conforme natureza da obrigação
3. Consultar tabela de índices mensais para o período
4. Calcular fator de correção monetária acumulado
5. Aplicar correção monetária ao valor principal
6. Calcular juros de mora sobre o valor corrigido
7. Calcular valor total atualizado (principal + correção + juros)
8. Gerar memória de cálculo detalhada
9. Indicar fundamentação legal para cada índice utilizado

## Output Estruturado
```yaml
calculo_correcao:
  valor_original: 0.0
  data_inicio: ""
  data_calculo: ""
  indice_correcao:
    nome: ""
    fundamentacao: ""
  juros:
    taxa: ""
    tipo: "" # simples, composto
    fundamentacao: ""
  resultado:
    correcao_monetaria: 0.0
    juros_mora: 0.0
    valor_total_atualizado: 0.0
    fator_correcao_acumulado: 0.0
  memoria_calculo:
    - mes: ""
      indice: 0.0
      valor_corrigido: 0.0
      juros_mes: 0.0
      total_mes: 0.0
```

## Critérios de Qualidade
- Índice de correção fundamentado em jurisprudência
- Valores calculados com precisão de 2 casas decimais
- Memória de cálculo mês a mês
- Fundamentação legal indicada
