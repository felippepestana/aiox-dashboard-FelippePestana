# Gerar Relatório de Inteligência

## Objetivo
Consolidar todas as análises do squad em um relatório de inteligência jurídica unificado, com conclusões e recomendações estratégicas.

## Agente Responsável
`legal-intelligence-chief`

## Inputs
- Relatório de precedentes (do `pesquisador-precedentes`)
- Classificação temática (do `classificador-temas`)
- Análise de similaridade (do `analista-similaridade`)
- Perfil de magistrado (do `analista-magistrado`, se disponível)
- Cálculos jurídicos (do `calculista-juridico`, se disponível)

## Passos
1. Coletar entregas de todos os analistas
2. Verificar completude e consistência das análises
3. Cruzar resultados (precedentes x similaridade x perfil do magistrado)
4. Identificar pontos fortes e fracos da tese
5. Avaliar probabilidade de êxito considerando todos os fatores
6. Formular recomendações estratégicas fundamentadas
7. Estruturar relatório consolidado
8. Incluir score geral de inteligência

## Output Estruturado
```yaml
relatorio_inteligencia:
  caso: ""
  data_geracao: ""
  score_inteligencia: 0.0
  sumario_executivo: ""
  precedentes:
    total_identificados: 0
    favoraveis: 0
    desfavoraveis: 0
    divergencia_identificada: false
  classificacao_tematica:
    temas_aplicaveis: []
    teses_favoraveis: []
  similaridade:
    melhor_precedente: ""
    score_similaridade: 0.0
  magistrado:
    perfil_resumido: ""
    probabilidade_deferimento: 0.0
  avaliacao:
    probabilidade_exito: "" # alta, media, baixa
    pontos_fortes: []
    pontos_fracos: []
    riscos: []
  recomendacoes: []
```

## Critérios de Qualidade
- Todas as análises disponíveis incorporadas
- Cruzamento de dados entre fontes
- Probabilidade de êxito fundamentada
- Recomendações estratégicas acionáveis
