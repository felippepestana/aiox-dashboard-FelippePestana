# Gerar Fechamento Mensal

## Objetivo
Consolidar todas as informações financeiras do escritório no fechamento mensal, gerando relatório gerencial completo para os sócios.

## Agente Responsável
`legal-financial-chief`

## Inputs
- Relatório de honorários (do `controlador-honorarios`)
- Apuração tributária (do `analista-tributario`)
- Projeção de fluxo de caixa (do `gestor-fluxo-caixa`)
- Avaliação de provisões (do `planejador-provisoes`)

## Passos
1. Coletar entregas de todos os agentes financeiros
2. Validar consistência entre relatórios
3. Consolidar DRE (Demonstração de Resultado) do mês
4. Calcular indicadores financeiros-chave
5. Comparar realizado vs. orçado
6. Comparar com mesmo período do ano anterior (se disponível)
7. Identificar desvios significativos e explicar causas
8. Atualizar dashboard de indicadores
9. Gerar relatório gerencial para sócios
10. Definir alertas e recomendações para próximo período

## Output Estruturado
```yaml
fechamento_mensal:
  periodo: ""
  dre:
    receita_bruta: 0.0
    deducoes: 0.0
    receita_liquida: 0.0
    custos_diretos: 0.0
    margem_bruta: 0.0
    despesas_operacionais: 0.0
    resultado_operacional: 0.0
    tributos: 0.0
    resultado_liquido: 0.0
    margem_liquida: 0.0
  indicadores:
    receita_por_advogado: 0.0
    custo_por_caso: 0.0
    taxa_inadimplencia: 0.0
    liquidez_corrente: 0.0
    runway_meses: 0
  comparativo:
    vs_orcado:
      receita_desvio: 0.0
      despesa_desvio: 0.0
    vs_mesmo_periodo_anterior:
      receita_variacao: 0.0
      despesa_variacao: 0.0
  provisoes:
    total_provisionado: 0.0
    ajuste_periodo: 0.0
  alertas: []
  recomendacoes: []
```

## Critérios de Qualidade
- DRE completo e consistente
- Indicadores calculados corretamente
- Comparativos com período anterior
- Alertas claros para desvios significativos
- Recomendações acionáveis para gestão
