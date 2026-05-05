# Qualificar Lead

## Objetivo
Avaliar e classificar leads recebidos pelo pipeline, atribuindo scoring e definindo próxima ação no funil de conversão.

## Agente Responsável
`gestor-leads`

## Inputs
- Dados do lead (nome, contato, origem, área de interesse)
- Interações anteriores (conteúdos acessados, formulários preenchidos)
- Informações sobre o caso (se fornecidas)

## Passos
1. Registrar lead no pipeline com dados de origem
2. Avaliar perfil do lead (área do direito, localização, porte)
3. Avaliar engajamento (interações com conteúdo, urgência)
4. Calcular scoring de perfil (0-50 pontos)
5. Calcular scoring de engajamento (0-50 pontos)
6. Classificar no funil (lead, MQL, SQL, oportunidade)
7. Verificar compatibilidade com áreas de atuação do escritório
8. Definir próxima ação (nurturing, contato SDR, agendamento)
9. Atribuir ao agente ou advogado responsável

## Output Estruturado
```yaml
qualificacao_lead:
  lead:
    nome: ""
    contato: ""
    origem: "" # organico, pago, referral, direto
    area_interesse: ""
  scoring:
    perfil: 0
    engajamento: 0
    total: 0
  classificacao: "" # lead, mql, sql, oportunidade
  compatibilidade: "" # alta, media, baixa
  proxima_acao: ""
  responsavel: ""
  prazo_acao: ""
```

## Critérios de Qualidade
- Scoring calculado com base em critérios objetivos
- Classificação consistente com score atribuído
- Próxima ação definida e com prazo
- Leads incompatíveis identificados e descartados educadamente
