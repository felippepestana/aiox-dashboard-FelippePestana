# Squad: Gestão Financeira Jurídica (legal-financial)

## Visão Geral

Squad de gestão financeira para escritórios de advocacia, com controle de honorários contratuais e sucumbenciais, compliance tributário (IRPJ, CSLL, ISS, PIS, COFINS), gestão de fluxo de caixa e planejamento de provisões e contingências.

## Composição do Squad

### Orquestrador
- **Chefe Financeiro Jurídico** (`legal-financial-chief`) — Coordena gestão financeira do escritório

### Tier 1 — Gestores Financeiros
- **Controlador de Honorários** (`controlador-honorarios`) — Gestão de honorários e faturamento
- **Analista Tributário** (`analista-tributario`) — Compliance tributário (IRPJ, CSLL, ISS)
- **Gestor de Fluxo de Caixa** (`gestor-fluxo-caixa`) — Cash flow e projeções financeiras

### Tier 2 — Especialistas
- **Planejador de Provisões** (`planejador-provisoes`) — Provisões e contingências jurídicas

## Workflows Disponíveis

1. **Fechamento Mensal** (`wf-fechamento-mensal`) — Fluxo completo de fechamento financeiro mensal do escritório

## Dados de Referência

- Tabela de Impostos para Advocacia (`tabela-impostos-advocacia`)
- Índices de Correção Monetária (`indices-correcao-monetaria`)

## Como Usar

1. Acione o orquestrador (`legal-financial-chief`) com o período e tipo de análise desejada
2. O squad executará o workflow de fechamento mensal ou análise pontual
3. Relatórios financeiros serão entregues com indicadores e alertas
4. Provisões e contingências serão classificadas por probabilidade (provável, possível, remota)
