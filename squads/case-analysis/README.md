# Squad: Análise Processual (case-analysis)

## Visão Geral

Squad especializado em análise processual aprofundada, pesquisa jurisprudencial, identificação de vícios e nulidades, definição de estratégias processuais e elaboração de peças judiciais.

## Composição do Squad

### Orquestrador
- **Chefe de Análise Processual** (`case-analysis-chief`) — Coordena o fluxo de análise e distribui tarefas

### Tier 1 — Analistas Principais
- **Leitor Processual** (`leitor-processual`) — Extrai dados estruturados dos autos
- **Analista Processual** (`analista-processual`) — Identifica vícios, nulidades e irregularidades
- **Pesquisador Jurisprudencial** (`pesquisador-jurisprudencial`) — Pesquisa precedentes e jurisprudência
- **Analista Legislativo Processual** (`analista-legislativo-processual`) — Analisa legislação aplicável

### Tier 2 — Especialistas em Produção
- **Estrategista Jurídico** (`estrategista-juridico`) — Define a melhor estratégia processual
- **Minutador de Peças** (`minutador-pecas`) — Elabora minutas de peças processuais
- **Revisor Jurídico** (`revisor-juridico`) — Revisa qualidade e conformidade das peças

## Workflows Disponíveis

1. **Análise Processual Completa** (`wf-analise-processual-completa`) — Fluxo completo desde leitura dos autos até entrega da peça final
2. **Peça de Urgência** (`wf-peca-urgente`) — Fluxo acelerado para medidas de urgência (tutelas, suspensão de mandados)

## Templates de Peças

- Embargos de Declaração
- Tutela Incidental de Urgência
- Agravo de Instrumento

## Como Usar

1. Disponibilize o PDF dos autos no diretório do projeto
2. Acione o orquestrador (`case-analysis-chief`) com o caminho do arquivo
3. O squad executará o workflow adequado automaticamente
4. A peça final será entregue revisada e pronta para protocolo
