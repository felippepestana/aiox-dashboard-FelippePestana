# Protocolar Petição

## Objetivo
Realizar o protocolo eletrônico de uma petição no sistema judicial adequado, garantindo conformidade de formato, assinatura digital válida e confirmação de recebimento.

## Agente Responsável
`protocolo-peticionamento`

## Inputs
- Arquivo da petição (PDF)
- Número do processo (formato CNJ)
- Tribunal e sistema-alvo (PJE, e-SAJ, e-Proc)
- Tipo de petição (conforme tabela do tribunal)
- Certificado digital para assinatura
- Documentos anexos (se houver)

## Passos
1. Validar formato do PDF (PDF/A-1b ou PDF/A-2b)
2. Verificar tamanho do arquivo (máximo conforme tribunal)
3. Validar assinatura digital ICP-Brasil
4. Verificar validade do certificado digital
5. Classificar tipo de petição conforme tabela processual do tribunal
6. Preparar envelope de envio conforme protocolo do sistema (MNI, SOAP, REST)
7. Executar envio da petição principal
8. Executar envio dos documentos anexos (se houver)
9. Aguardar confirmação de protocolo
10. Registrar número de recibo e comprovante
11. Em caso de falha, executar retry (máximo 3 tentativas)
12. Gerar comprovante de protocolo em PDF

## Output Estruturado
```yaml
protocolo:
  status: "" # sucesso, falha, pendente
  numero_recibo: ""
  data_hora_protocolo: ""
  processo: ""
  tribunal: ""
  sistema: ""
  tipo_peticao: ""
  arquivos_enviados:
    - nome: ""
      tamanho: ""
      hash_sha256: ""
  comprovante_pdf: ""
  tentativas: 0
  erro: "" # vazio se sucesso
```

## Critérios de Qualidade
- PDF em formato válido (PDF/A)
- Assinatura digital verificada antes do envio
- Confirmação de protocolo obtida com número de recibo
- Comprovante de protocolo gerado e armazenado
- Log completo de tentativas de envio
