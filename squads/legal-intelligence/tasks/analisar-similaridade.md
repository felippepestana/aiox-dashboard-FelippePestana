# Analisar Similaridade entre Casos

## Objetivo
Calcular o grau de similaridade entre o caso concreto e precedentes identificados, utilizando scoring PEDRO para avaliar aplicabilidade.

## Agente Responsável
`analista-similaridade`

## Inputs
- Dados do caso concreto (fatos, fundamentos, pedidos)
- Lista de precedentes para comparação
- Critérios de peso por dimensão (fática, jurídica, pretensão, processual)

## Passos
1. Extrair elementos comparáveis do caso concreto
2. Para cada precedente, extrair elementos comparáveis
3. Calcular similaridade fática (30% do score)
4. Calcular similaridade jurídica (40% do score)
5. Calcular similaridade de pretensão (20% do score)
6. Calcular similaridade processual (10% do score)
7. Calcular score global ponderado
8. Identificar distinguishing (distinções relevantes)
9. Classificar precedentes por score de similaridade
10. Gerar matriz de similaridade

## Output Estruturado
```yaml
analise_similaridade:
  caso_referencia: ""
  precedentes_analisados:
    - precedente: ""
      scores:
        fatica: 0.0
        juridica: 0.0
        pretensao: 0.0
        processual: 0.0
        global: 0.0
      classificacao: "" # altamente_similar, muito_similar, moderado, pouco_similar, dissimilar
      distinguishing:
        - aspecto: ""
          descricao: ""
      aplicabilidade: ""
  ranking:
    - posicao: 1
      precedente: ""
      score_global: 0.0
  recomendacao: ""
```

## Critérios de Qualidade
- Scores calculados para todas as dimensões
- Distinguishing identificados para cada precedente
- Ranking ordenado por score global
- Recomendação de aplicabilidade fundamentada
