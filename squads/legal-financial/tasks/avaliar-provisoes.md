# Avaliar Provisões e Contingências

## Objetivo
Avaliar riscos processuais e classificar contingências do escritório e de seus clientes, calculando provisões conforme CPC 25/IAS 37.

## Agente Responsável
`planejador-provisoes`

## Inputs
- Lista de processos passivos (escritório como réu ou contingência de clientes)
- Andamento processual atualizado
- Valores envolvidos em cada processo
- Jurisprudência sobre os temas dos processos

## Passos
1. Listar todos os processos passivos e contingências
2. Para cada processo, analisar fase processual e perspectiva
3. Avaliar jurisprudência dominante sobre o tema
4. Consultar histórico do magistrado (se disponível)
5. Classificar probabilidade de perda (provável, possível, remota)
6. Para contingências prováveis, calcular melhor estimativa de desembolso
7. Atualizar valores com correção monetária
8. Comparar provisões atuais com avaliação atualizada
9. Recomendar constituição ou reversão de provisões
10. Gerar relatório para notas explicativas do balanço

## Output Estruturado
```yaml
avaliacao_provisoes:
  data_avaliacao: ""
  total_contingencias: 0
  classificacao:
    provavel:
      quantidade: 0
      valor_total: 0.0
      processos:
        - numero: ""
          descricao: ""
          valor_envolvido: 0.0
          provisao_recomendada: 0.0
          fundamentacao: ""
    possivel:
      quantidade: 0
      valor_total: 0.0
      processos: []
    remota:
      quantidade: 0
      valor_total: 0.0
      processos: []
  provisao_total_recomendada: 0.0
  provisao_atual: 0.0
  ajuste_necessario: 0.0
  tipo_ajuste: "" # constituicao, reversao, manutencao
```

## Critérios de Qualidade
- Todos os processos passivos avaliados
- Classificação fundamentada em jurisprudência e fase processual
- Valores atualizados com correção monetária
- Provisões conforme CPC 25 (provável = provisionar)
- Relatório adequado para notas explicativas
