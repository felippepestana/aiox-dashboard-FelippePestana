# Squad: Assistente de Entrevista (interview-assistant)

## Visão Geral

Squad especializado em assistência em tempo real durante entrevistas com clientes. Oferece transcrição ao vivo, sugestão de perguntas contextuais, pesquisa automática de precedentes e geração de estratégia jurídica pós-entrevista.

## Composição do Squad

### Orquestrador
- **Chefe de Entrevista** (`interview-chief`) — Coordena o fluxo da entrevista e consolida resultados

### Tier 1 — Assistentes em Tempo Real
- **Transcritor** (`transcritor-entrevista`) — Transcrição em tempo real com identificação de interlocutores
- **Sugestor de Perguntas** (`sugestor-perguntas`) — Sugestão de perguntas contextuais por área jurídica
- **Pesquisador de Contexto** (`pesquisador-contexto`) — Pesquisa de precedentes acionada por palavras-chave

### Tier 2 — Pós-Entrevista
- **Gerador de Estratégia** (`gerador-estrategia`) — Análise do transcript e geração de estratégia processual
- **Minutador Inicial** (`minutador-inicial`) — Rascunho de petição inicial a partir dos dados coletados

## Workflows Disponíveis

1. **Entrevista Completa** (`wf-entrevista-completa`) — Fluxo completo de entrevista com transcrição, sugestões em tempo real e geração de estratégia + peça
2. **Consulta Rápida** (`wf-consulta-rapida`) — Fluxo simplificado para consultas breves sem geração de peça

## Templates

- Relatório de Entrevista (`relatorio-entrevista-tmpl`)
- Estratégia Inicial (`estrategia-inicial-tmpl`)

## Como Usar

1. Inicie uma nova sessão de entrevista na interface do assistente
2. Selecione a área jurídica e identifique o cliente
3. O squad opera automaticamente durante a gravação
4. Ao finalizar, a estratégia e esboço de peça são gerados automaticamente
