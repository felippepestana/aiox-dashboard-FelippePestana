# Perfilar Magistrado

## Objetivo
Gerar perfil decisório completo de um magistrado, mapeando padrões de decisão, fundamentações recorrentes e tendências de voto.

## Agente Responsável
`analista-magistrado`

## Inputs
- Nome do magistrado
- Tribunal e vara de atuação
- Tema de interesse (opcional)
- Período de análise

## Passos
1. Pesquisar decisões do magistrado no período indicado
2. Categorizar decisões por tipo (interlocutória, sentença, acórdão)
3. Mapear temas mais frequentes nas decisões
4. Calcular taxa de deferimento por tipo de pedido
5. Identificar fundamentações jurídicas recorrentes
6. Calcular tempo médio entre distribuição e decisão
7. Pesquisar taxa de reforma em segunda instância
8. Identificar posicionamentos sobre temas controversos
9. Classificar perfil (conservador/progressista, formalista/substancialista)
10. Gerar perfil completo com recomendações estratégicas

## Output Estruturado
```yaml
perfil_magistrado:
  nome: ""
  tribunal: ""
  vara: ""
  periodo_analise: ""
  total_decisoes_analisadas: 0
  metricas:
    taxa_deferimento_tutela: 0.0
    taxa_procedencia: 0.0
    taxa_parcial_procedencia: 0.0
    tempo_medio_sentenca_dias: 0
    taxa_reforma_segunda_instancia: 0.0
  perfil:
    orientacao: "" # conservador, moderado, progressista
    estilo: "" # formalista, substancialista, equilibrado
    celeridade: "" # rapido, medio, lento
    fundamentacao: "" # profunda, moderada, concisa
  temas_frequentes:
    - tema: ""
      posicionamento: ""
      taxa_favoravel: 0.0
  fundamentacoes_recorrentes:
    - dispositivo: ""
      frequencia: 0
  recomendacoes_estrategicas: []
```

## Critérios de Qualidade
- Mínimo 50 decisões analisadas
- Métricas calculadas com base estatística
- Perfil fundamentado em dados concretos
- Recomendações estratégicas acionáveis
