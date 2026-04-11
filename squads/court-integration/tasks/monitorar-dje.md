# Monitorar DJE

## Objetivo
Realizar varredura diária no Diário de Justiça Eletrônico, identificando publicações relevantes para os processos e partes monitoradas.

## Agente Responsável
`monitor-publicacoes`

## Inputs
- Lista de processos monitorados (números CNJ)
- Lista de partes monitoradas (nomes, CPF/CNPJ)
- Lista de advogados monitorados (nome, OAB)
- Tribunais-alvo para varredura

## Passos
1. Acessar o DJE de cada tribunal configurado
2. Realizar busca por cada parâmetro de monitoramento (processo, parte, advogado)
3. Extrair texto das publicações identificadas
4. Classificar publicações por tipo (intimação, sentença, despacho, edital)
5. Identificar prazos processuais decorrentes da publicação
6. Calcular dies a quo e dies ad quem (dias úteis, art. 219, CPC)
7. Gerar alerta para prazos críticos (menos de 5 dias úteis)
8. Registrar publicações no histórico

## Output Estruturado
```yaml
monitoramento:
  data_varredura: ""
  tribunais_consultados: []
  publicacoes_encontradas:
    - processo: ""
      tribunal: ""
      tipo_publicacao: ""
      data_publicacao: ""
      teor_resumido: ""
      prazo:
        tipo: ""
        dies_a_quo: ""
        dies_ad_quem: ""
        dias_uteis_restantes: ""
      urgencia: ""
  alertas_gerados: []
```

## Critérios de Qualidade
- Todos os tribunais configurados devem ser varridos
- Publicações classificadas corretamente por tipo
- Prazos calculados em dias úteis conforme CPC
- Alertas gerados para prazos inferiores a 5 dias úteis
