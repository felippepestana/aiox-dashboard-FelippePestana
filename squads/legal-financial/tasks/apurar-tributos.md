# Apurar Tributos

## Objetivo
Apurar tributos devidos pelo escritório no período, gerar guias de recolhimento e garantir compliance com obrigações acessórias.

## Agente Responsável
`analista-tributario`

## Inputs
- Faturamento do período (notas fiscais emitidas)
- Regime tributário do escritório
- Retenções na fonte realizadas por clientes
- Despesas dedutíveis (se Lucro Real)

## Passos
1. Consolidar faturamento bruto do período
2. Identificar retenções na fonte (IRRF, PIS/COFINS/CSLL retidos)
3. Apurar IRPJ conforme regime tributário
4. Apurar CSLL conforme regime tributário
5. Apurar PIS e COFINS
6. Apurar ISS conforme alíquota municipal
7. Calcular INSS sobre pró-labore dos sócios
8. Gerar guias de recolhimento (DARF, DAS, guia ISS)
9. Verificar obrigações acessórias pendentes no período
10. Calcular carga tributária efetiva

## Output Estruturado
```yaml
apuracao_tributaria:
  periodo: ""
  regime: "" # simples, lucro_presumido, lucro_real
  faturamento_bruto: 0.0
  tributos:
    irpj:
      base_calculo: 0.0
      aliquota_efetiva: 0.0
      valor_devido: 0.0
      retencoes: 0.0
      valor_recolher: 0.0
    csll:
      base_calculo: 0.0
      aliquota_efetiva: 0.0
      valor_devido: 0.0
      retencoes: 0.0
      valor_recolher: 0.0
    pis:
      valor_recolher: 0.0
    cofins:
      valor_recolher: 0.0
    iss:
      aliquota: 0.0
      valor_recolher: 0.0
    inss_socios:
      valor_recolher: 0.0
  total_tributos: 0.0
  carga_tributaria_efetiva: 0.0
  guias_geradas: []
  obrigacoes_acessorias:
    - nome: ""
      prazo: ""
      status: ""
```

## Critérios de Qualidade
- Apuração conferida com base no faturamento real
- Retenções na fonte compensadas corretamente
- Guias geradas dentro do prazo
- Obrigações acessórias controladas
