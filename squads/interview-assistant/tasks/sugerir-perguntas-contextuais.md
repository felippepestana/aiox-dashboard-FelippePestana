# Sugerir Perguntas Contextuais

## Objetivo
Analisar o transcript em tempo real e sugerir perguntas relevantes ao advogado, identificando lacunas de informação e oportunidades de aprofundamento.

## Agente Responsável
`sugestor-perguntas`

## Inputs
- Transcript parcial (entradas até o momento)
- Área jurídica da entrevista
- Banco de perguntas por área

## Passos
1. Receber novas entradas do transcript em tempo real
2. Concatenar texto completo do transcript até o momento
3. Comparar informações coletadas com checklist da área jurídica
4. Identificar informações essenciais ainda não abordadas
5. Para cada lacuna encontrada, gerar sugestão tipo "warning"
6. Analisar últimas 5 entradas para contexto recente
7. Selecionar perguntas de acompanhamento mais relevantes
8. Detectar termos que acionam sugestões de precedentes
9. Detectar termos que acionam dicas estratégicas
10. Priorizar sugestões por relevância e remover duplicatas

## Output Estruturado
```yaml
suggestions:
  - id: ""
    type: "question|precedent|strategy|warning"
    content: ""
    relevance: 0.0
    category: ""
    timestamp: ""
```

## Critérios de Qualidade
- Máximo 8 sugestões simultâneas no painel
- Sugestões priorizadas por relevância (0-1)
- Sem duplicatas de conteúdo semelhante
- Latência máxima de 3 segundos após nova entrada
- Cobertura mínima de 70% do checklist da área ao final
