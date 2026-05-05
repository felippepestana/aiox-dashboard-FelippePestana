# Executar Cadência SDR

## Objetivo
Executar cadência de contato com lead qualificado, realizando primeiro contato, follow-ups e agendamento de consulta com advogado especialista.

## Agente Responsável
`analista-sdr`

## Inputs
- Dados do lead qualificado (nome, contato, área de interesse)
- Scoring e classificação do lead
- Área do direito e advogado responsável
- Conteúdos disponíveis para nurturing

## Passos
1. Preparar mensagem de primeiro contato personalizada
2. Enviar primeiro contato (e-mail + WhatsApp se autorizado)
3. Registrar tentativa de contato no CRM
4. Aguardar resposta (prazo de 48h)
5. Se resposta positiva: agendar consulta com advogado
6. Se sem resposta: executar follow-up 1 (dia 3)
7. Se sem resposta: executar follow-up 2 (dia 7)
8. Se sem resposta: executar follow-up 3 (dia 14)
9. Se sem resposta após 3 follow-ups: mover para nurturing contínuo
10. Coletar informações preliminares do caso (quando possível)
11. Registrar todas as interações e resultado final

## Output Estruturado
```yaml
cadencia_sdr:
  lead: ""
  data_inicio: ""
  canal_principal: "" # email, whatsapp, telefone
  interacoes:
    - data: ""
      canal: ""
      tipo: "" # primeiro_contato, followup_1, followup_2, followup_3
      resultado: "" # respondeu, sem_resposta, agendou, recusou
      observacoes: ""
  resultado_final: "" # consulta_agendada, nurturing, descartado
  consulta:
    agendada: false
    data_hora: ""
    advogado: ""
    informacoes_preliminares: ""
  metricas:
    tempo_resposta_horas: 0
    total_interacoes: 0
    canal_mais_efetivo: ""
```

## Critérios de Qualidade
- Mensagens personalizadas (não genéricas)
- Cadência respeitada (intervalos corretos)
- Todas as interações registradas no CRM
- Normas da OAB respeitadas em toda comunicação
- Lead direcionado ao advogado da área correta
