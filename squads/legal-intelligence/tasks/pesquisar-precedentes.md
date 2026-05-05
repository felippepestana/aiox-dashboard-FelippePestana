# Pesquisar Precedentes

## Objetivo
Realizar pesquisa abrangente de jurisprudência e precedentes em tribunais brasileiros, identificando decisões relevantes para o caso concreto.

## Agente Responsável
`pesquisador-precedentes`

## Inputs
- Tema de pesquisa (palavras-chave, dispositivos legais)
- Tribunais-alvo (STF, STJ, TJs, TRFs)
- Período de pesquisa
- Contexto do caso (fatos relevantes, pedidos)

## Passos
1. Definir termos de pesquisa otimizados para cada base
2. Pesquisar no STF (súmulas vinculantes, repercussão geral, acórdãos)
3. Pesquisar no STJ (súmulas, repetitivos, acórdãos de turma)
4. Pesquisar nos tribunais estaduais/federais indicados
5. Filtrar resultados por relevância e atualidade
6. Selecionar precedentes mais relevantes (mínimo 10)
7. Extrair ementas completas com dados de citação
8. Classificar por vinculância e aplicabilidade
9. Identificar convergência ou divergência jurisprudencial
10. Gerar relatório consolidado

## Output Estruturado
```yaml
pesquisa_precedentes:
  tema: ""
  termos_pesquisa: []
  total_resultados: 0
  precedentes_selecionados:
    - tribunal: ""
      orgao_julgador: ""
      tipo: "" # sumula_vinculante, repetitivo, acordao
      numero: ""
      relator: ""
      data_julgamento: ""
      ementa: ""
      relevancia_score: 0
      aplicabilidade: ""
  divergencias:
    - descricao: ""
      tribunais_favoraveis: []
      tribunais_contrarios: []
  conclusao: ""
```

## Critérios de Qualidade
- Mínimo 10 precedentes selecionados
- Ementas completas com dados de citação
- Classificação de vinculância correta
- Divergências jurisprudenciais identificadas
