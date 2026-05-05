# Classificar Temas de Repercussão Geral

## Objetivo
Classificar o caso concreto conforme temas de repercussão geral do STF e recursos repetitivos do STJ, identificando teses fixadas aplicáveis.

## Agente Responsável
`classificador-temas`

## Inputs
- Dados do processo (classe, assunto, fatos, pedidos)
- Fundamentos jurídicos invocados
- Dispositivos legais relevantes

## Passos
1. Analisar fatos e fundamentos do caso
2. Mapear assuntos conforme Tabela Unificada CNJ
3. Pesquisar temas de repercussão geral aplicáveis no STF
4. Verificar status de cada tema (pendente, julgado, tese fixada)
5. Pesquisar temas de recursos repetitivos no STJ
6. Verificar teses fixadas e sua aplicabilidade ao caso
7. Identificar processos sobrestados por afetação
8. Avaliar impacto das teses na estratégia processual
9. Gerar relatório de classificação temática

## Output Estruturado
```yaml
classificacao_tematica:
  assuntos_cnj:
    - codigo: ""
      descricao: ""
  temas_repercussao_geral:
    - numero_tema: 0
      descricao: ""
      status: "" # pendente, julgado, tese_fixada
      tese_fixada: ""
      aplicabilidade: ""
      impacto: ""
  temas_repetitivos_stj:
    - numero_tema: 0
      descricao: ""
      status: ""
      tese_fixada: ""
      aplicabilidade: ""
  sobrestamento:
    aplicavel: false
    fundamento: ""
  recomendacao_estrategica: ""
```

## Critérios de Qualidade
- Todos os temas aplicáveis identificados
- Status dos temas atualizado
- Teses fixadas transcritas integralmente
- Impacto na estratégia avaliado
