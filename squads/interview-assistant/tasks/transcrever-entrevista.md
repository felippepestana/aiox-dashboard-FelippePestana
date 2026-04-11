# Transcrever Entrevista

## Objetivo
Transcrever em tempo real a entrevista entre advogado e cliente, com identificação de interlocutor e scoring de confiança.

## Agente Responsável
`transcritor-entrevista`

## Inputs
- Configuração da sessão (idioma, área jurídica)
- Stream de áudio do microfone
- Configuração de speaker detection

## Passos
1. Inicializar Web Speech API com configuração pt-BR
2. Se Web Speech API indisponível, ativar fallback Whisper
3. Iniciar captura de áudio e transcrição contínua
4. Para cada trecho reconhecido:
   a. Avaliar se é resultado final ou interim
   b. Classificar interlocutor (advogado/cliente) por heurística
   c. Atribuir score de confiança
   d. Criar entrada estruturada no transcript
   e. Emitir evento para demais agentes
5. Ao pausar, manter estado para retomada
6. Ao finalizar, gerar transcript completo exportável

## Output Estruturado
```yaml
transcript:
  total_entries: 0
  duration_seconds: 0
  speakers:
    lawyer: 0
    client: 0
  entries:
    - id: ""
      speaker: "lawyer|client|system"
      text: ""
      timestamp: ""
      confidence: 0.0
  average_confidence: 0.0
  low_confidence_entries: []
```

## Critérios de Qualidade
- Confiança média acima de 85%
- Identificação de interlocutor correta em 90%+ dos trechos
- Latência máxima de 2 segundos entre fala e transcrição
- Sem perda de trechos durante pausas/retomadas
