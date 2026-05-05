# Projetar Fluxo de Caixa

## Objetivo
Elaborar projeção de fluxo de caixa do escritório para os próximos 3 a 6 meses, com cenários otimista, realista e pessimista.

## Agente Responsável
`gestor-fluxo-caixa`

## Inputs
- Saldo de caixa atual
- Receitas previstas (contratos, honorários de êxito pendentes)
- Despesas fixas e variáveis projetadas
- Tributos projetados
- Histórico de recebimentos e inadimplência

## Passos
1. Consolidar saldo de caixa atual (contas bancárias + aplicações)
2. Projetar receitas mensais (honorários fixos, variáveis, êxito)
3. Aplicar taxa de inadimplência histórica sobre receitas projetadas
4. Projetar despesas fixas mensais (aluguel, folha, software)
5. Projetar despesas variáveis (custas, diligências, viagens)
6. Projetar tributos mensais (conforme regime)
7. Calcular fluxo líquido mensal (receitas - despesas)
8. Projetar saldo de caixa acumulado para cada mês
9. Montar cenário otimista (+20% receita, -10% inadimplência)
10. Montar cenário pessimista (-20% receita, +30% inadimplência)
11. Calcular runway (meses até caixa zero no cenário pessimista)
12. Identificar meses com gap de caixa

## Output Estruturado
```yaml
projecao_fluxo_caixa:
  data_projecao: ""
  saldo_atual: 0.0
  periodo_projecao: ""
  cenario_realista:
    meses:
      - mes: ""
        receitas: 0.0
        despesas: 0.0
        tributos: 0.0
        fluxo_liquido: 0.0
        saldo_acumulado: 0.0
  cenario_otimista:
    meses: []
  cenario_pessimista:
    meses: []
  indicadores:
    runway_meses: 0
    burn_rate_mensal: 0.0
    ponto_equilibrio: 0.0
    meses_gap_caixa: []
  recomendacoes: []
```

## Critérios de Qualidade
- Três cenários elaborados (otimista, realista, pessimista)
- Receitas baseadas em contratos reais e histórico
- Despesas categorizadas (fixas, variáveis, tributárias)
- Gaps de caixa identificados com antecedência
- Recomendações acionáveis para gestão de liquidez
