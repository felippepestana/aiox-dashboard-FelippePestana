# Squad: Inteligência Jurídica (legal-intelligence)

## Visão Geral

Squad de inteligência jurídica especializado em pesquisa de precedentes, classificação de temas de repercussão geral, análise de similaridade entre casos, mapeamento de padrões de decisão de magistrados e cálculos jurídicos especializados.

## Composição do Squad

### Orquestrador
- **Chefe de Inteligência Jurídica** (`legal-intelligence-chief`) — Coordena pesquisas de inteligência jurídica

### Tier 1 — Analistas de Inteligência
- **Pesquisador de Precedentes** (`pesquisador-precedentes`) — Pesquisa STF/STJ e tribunais estaduais
- **Classificador de Temas** (`classificador-temas`) — Classificação VICTOR de repercussão geral
- **Analista de Similaridade** (`analista-similaridade`) — Scoring PEDRO de similaridade entre casos

### Tier 2 — Especialistas
- **Analista de Magistrados** (`analista-magistrado`) — Análise de padrão de voto e decisões
- **Calculista Jurídico** (`calculista-juridico`) — Cálculos jurídicos especializados (correção monetária, juros, verbas trabalhistas)

## Workflows Disponíveis

1. **Pesquisa de Inteligência Completa** (`wf-pesquisa-inteligencia`) — Fluxo completo de pesquisa de precedentes, classificação e análise de similaridade
2. **Análise de Magistrado** (`wf-analise-magistrado`) — Fluxo de profiling de magistrado com análise de padrões de decisão

## Templates

- Relatório de Precedentes (`relatorio-precedentes-tmpl`) — Template para relatório consolidado de precedentes
- Perfil de Magistrado (`perfil-magistrado-tmpl`) — Template para análise de perfil de magistrado

## Dados de Referência

- Temas de Repercussão Geral (`temas-repercussao-geral`)
- Súmulas Vinculantes (`sumulas-vinculantes`)
- Teses de Repetitivos STJ (`teses-repetitivos-stj`)
- Índices de Correção (`indices-correcao`)

## Como Usar

1. Acione o orquestrador (`legal-intelligence-chief`) com os parâmetros da pesquisa
2. Defina o escopo: tema, tribunal, período, magistrado
3. O squad executará o workflow adequado automaticamente
4. Resultados serão entregues em relatórios estruturados com scoring de relevância
