# Template: Perfil de Magistrado

## Cabeçalho

```
PERFIL DECISÓRIO DE MAGISTRADO
Nome: {{NOME_MAGISTRADO}}
Tribunal: {{TRIBUNAL}}
Vara/Câmara: {{VARA_CAMARA}}
Período de Análise: {{PERIODO}}
Total de Decisões Analisadas: {{TOTAL_DECISOES}}
Data de Geração: {{DATA_GERACAO}}
```

## Resumo do Perfil

```
Orientação: {{CONSERVADOR / MODERADO / PROGRESSISTA}}
Estilo: {{FORMALISTA / SUBSTANCIALISTA / EQUILIBRADO}}
Celeridade: {{RAPIDO / MEDIO / LENTO}}
Fundamentação: {{PROFUNDA / MODERADA / CONCISA}}
```

## Métricas Quantitativas

```
| Métrica                              | Valor    |
|--------------------------------------|----------|
| Taxa de deferimento de tutelas       | {{XX}}%  |
| Taxa de procedência                  | {{XX}}%  |
| Taxa de parcial procedência          | {{XX}}%  |
| Tempo médio até sentença             | {{XX}} dias |
| Taxa de reforma em 2ª instância      | {{XX}}%  |
```

## Padrões de Decisão por Tema

```
{{#TEMAS}}
Tema: {{TEMA}}
Posicionamento: {{POSICIONAMENTO}}
Taxa Favorável: {{TAXA}}%
Fundamentação Típica: {{FUNDAMENTACAO}}
Observações: {{OBSERVACOES}}
{{/TEMAS}}
```

## Fundamentações Recorrentes

```
{{#FUNDAMENTACOES}}
- {{DISPOSITIVO}} — Frequência: {{FREQUENCIA}} vezes
  Contexto de uso: {{CONTEXTO}}
{{/FUNDAMENTACOES}}
```

## Recomendações Estratégicas

```
{{#RECOMENDACOES}}
{{NUMERO}}. {{RECOMENDACAO}}
   Fundamento: {{FUNDAMENTO}}
{{/RECOMENDACOES}}
```

## Instruções de Preenchimento
- Métricas baseadas em amostra mínima de 50 decisões
- Temas ordenados por relevância para o caso concreto
- Recomendações priorizadas por impacto na estratégia
