# Squad: Integração Tribunais (court-integration)

## Visão Geral

Squad especializado em integração com sistemas judiciais brasileiros, incluindo PJE, DataJud, e-SAJ, e-Proc, PROJUDI e DJE. Automatiza monitoramento de publicações, consultas processuais, peticionamento eletrônico e rastreamento de movimentações.

## Composição do Squad

### Orquestrador
- **Chefe de Integração** (`court-integration-chief`) — Coordena integrações com tribunais e monitoramento

### Tier 1 — Consultores de Tribunal
- **Monitor de Publicações** (`monitor-publicacoes`) — Monitoramento de DJE e publicações oficiais
- **Consultor PJE** (`consultor-pje`) — Especialista em API PJE/MNI
- **Consultor DataJud** (`consultor-datajud`) — Especialista em API DataJud do CNJ

### Tier 2 — Especialistas em Operações
- **Protocolo de Peticionamento** (`protocolo-peticionamento`) — Filing de petições eletrônicas
- **Rastreador de Movimentações** (`rastreador-movimentacao`) — Tracking de movimentações processuais

## Workflows Disponíveis

1. **Monitoramento Diário** (`wf-monitoramento-diario`) — Fluxo diário de varredura de publicações, prazos e movimentações
2. **Peticionamento** (`wf-peticionamento`) — Fluxo completo de protocolo de petições eletrônicas
3. **Sincronização de Processos** (`wf-sincronizacao-processos`) — Sincronização de dados processuais entre sistemas

## Dados de Referência

- Tribunais e APIs (`tribunais-apis`) — Endpoints e configurações de APIs judiciais
- Códigos de Movimentação CNJ (`codigos-movimentacao-cnj`) — Tabela unificada de movimentações
- Comarcas e Varas (`comarcas-varas`) — Mapeamento de comarcas e varas judiciais

## Como Usar

1. Configure as credenciais de acesso às APIs dos tribunais
2. Acione o orquestrador (`court-integration-chief`) com o número do processo ou parâmetros de monitoramento
3. O squad executará o workflow adequado automaticamente
4. Resultados serão entregues em formato estruturado para consumo por outros squads
