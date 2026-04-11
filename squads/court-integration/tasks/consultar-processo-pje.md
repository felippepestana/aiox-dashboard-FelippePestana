# Consultar Processo no PJE

## Objetivo
Consultar dados completos de um processo no sistema PJE via API MNI, extraindo informações estruturadas de partes, movimentações e peças.

## Agente Responsável
`consultor-pje`

## Inputs
- Número do processo (formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO)
- Tribunal de origem
- Certificado digital para autenticação

## Passos
1. Identificar endpoint MNI do tribunal de origem
2. Autenticar com certificado digital via SOAP/SSL
3. Chamar serviço `consultarProcesso` com número CNJ
4. Extrair dados básicos (classe, assunto, vara, comarca)
5. Extrair dados das partes (polo ativo, polo passivo, advogados)
6. Chamar serviço `consultarMovimentacoes` para obter histórico
7. Mapear movimentações aos códigos da Tabela Unificada CNJ
8. Identificar peças processuais disponíveis para download
9. Tratar erros de conexão com retry (máximo 3 tentativas)
10. Estruturar dados no formato padronizado do squad

## Output Estruturado
```yaml
processo_pje:
  numero_cnj: ""
  tribunal: ""
  vara: ""
  comarca: ""
  classe: ""
  assunto: ""
  status: ""
  partes:
    polo_ativo:
      - nome: ""
        cpf_cnpj: ""
        advogado: ""
        oab: ""
    polo_passivo:
      - nome: ""
        cpf_cnpj: ""
        advogado: ""
        oab: ""
  movimentacoes:
    - data: ""
      codigo_cnj: ""
      descricao: ""
      complemento: ""
  pecas_disponiveis:
    - id: ""
      tipo: ""
      data: ""
      tamanho: ""
  metadata:
    data_consulta: ""
    api_versao: ""
    tempo_resposta_ms: ""
```

## Critérios de Qualidade
- Dados extraídos completamente ou campos marcados como "indisponível"
- Movimentações com código CNJ padronizado
- Tratamento de erros documentado
- Tempo de resposta registrado
