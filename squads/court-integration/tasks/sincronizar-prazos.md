# Sincronizar Prazos

## Objetivo
Consolidar e sincronizar todos os prazos processuais identificados por diferentes agentes do squad, gerando uma visão unificada de prazos pendentes com priorização por urgência.

## Agente Responsável
`court-integration-chief`

## Inputs
- Prazos identificados pelo `monitor-publicacoes` (via DJE)
- Prazos identificados pelo `rastreador-movimentacao` (via APIs)
- Calendário de feriados nacionais e estaduais
- Configuração de suspensão de prazos (recesso forense, etc.)

## Passos
1. Coletar prazos identificados por todos os agentes
2. Unificar prazos duplicados (mesmo prazo detectado por fontes diferentes)
3. Verificar feriados nacionais e estaduais da comarca
4. Recalcular dies ad quem considerando dias úteis e suspensões
5. Classificar prazos por urgência (vencendo hoje, esta semana, próxima semana)
6. Verificar conflitos de agenda (múltiplos prazos no mesmo dia)
7. Gerar relatório consolidado de prazos
8. Emitir alertas para prazos críticos

## Output Estruturado
```yaml
sincronizacao_prazos:
  data_sincronizacao: ""
  total_prazos_ativos: 0
  prazos:
    - processo: ""
      tipo_prazo: ""
      origem: "" # dje, api_pje, api_datajud
      dies_a_quo: ""
      dies_ad_quem: ""
      dias_uteis_restantes: 0
      urgencia: "" # critica, alta, media, baixa
      status: "" # pendente, em_andamento, cumprido, perdido
  alertas_urgentes:
    - processo: ""
      prazo: ""
      dias_restantes: 0
      mensagem: ""
  conflitos_agenda:
    - data: ""
      prazos_coincidentes: []
```

## Critérios de Qualidade
- Prazos deduplicados corretamente
- Feriados e suspensões considerados no cálculo
- Classificação de urgência consistente
- Conflitos de agenda identificados
- Alertas emitidos para prazos com menos de 3 dias úteis
