# Pesquisar Precedentes em Tempo Real

## Objetivo
Monitorar o transcript da entrevista para detectar termos jurídicos e buscar automaticamente precedentes relevantes na base de jurisprudência.

## Agente Responsável
`pesquisador-contexto`

## Inputs
- Transcript entries em tempo real
- Área jurídica da sessão
- Dicionário de keywords por área
- Acesso à base de precedentes (precedent-search)

## Passos
1. Receber nova entrada do transcript
2. Ignorar entradas do tipo "system"
3. Extrair keywords jurídicas da entrada usando dicionário por área
4. Filtrar keywords já processadas (cache de keywords)
5. Para cada keyword nova, agendar busca com debounce (2s)
6. Executar busca na base de precedentes com a keyword
7. Filtrar resultados por relevância (mínimo score > 0)
8. Criar match com: trigger, keyword, precedentes, entry ID
9. Emitir match para o orquestrador
10. Adicionar keyword ao cache de processadas

## Output Estruturado
```yaml
matches:
  - id: ""
    trigger: ""
    keyword: ""
    precedents:
      - tribunal: ""
        numero: ""
        ementa: ""
        relevance_score: 0
    timestamp: ""
    transcript_entry_id: ""
```

## Configurações
- Debounce: 2000ms
- Max resultados por keyword: 3
- Min comprimento keyword: 4 caracteres
- Cache de keywords processadas ativo

## Critérios de Qualidade
- Sem consultas redundantes (keyword cache eficaz)
- Relevância média dos precedentes acima de 0.5
- Debounce respeitado (sem flood de consultas)
- Cobertura de 80%+ das keywords relevantes mencionadas
