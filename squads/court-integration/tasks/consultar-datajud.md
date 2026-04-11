# Consultar DataJud

## Objetivo
Consultar a base de dados DataJud do CNJ para obter dados processuais consolidados, estatísticas e informações de movimentação de processos judiciais.

## Agente Responsável
`consultor-datajud`

## Inputs
- Parâmetros de consulta (número do processo, tribunal, classe, assunto, período)
- API Key do DataJud
- Tipo de consulta (processo específico, pesquisa filtrada, estatística)

## Passos
1. Validar parâmetros de consulta e API Key
2. Montar query conforme endpoint DataJud adequado
3. Executar chamada REST/JSON à API DataJud
4. Tratar paginação de resultados (se pesquisa filtrada)
5. Extrair dados processuais e movimentações
6. Calcular estatísticas de tempo de tramitação (se solicitado)
7. Mapear dados à estrutura padronizada do squad
8. Respeitar rate limiting do CNJ (aguardar entre chamadas)
9. Registrar metadata da consulta (timestamp, tempo de resposta)

## Output Estruturado
```yaml
consulta_datajud:
  tipo_consulta: ""
  parametros:
    tribunal: ""
    classe: ""
    assunto: ""
    periodo: ""
  resultados:
    total_encontrado: 0
    processos:
      - numero_cnj: ""
        tribunal: ""
        classe: ""
        assunto: ""
        data_ajuizamento: ""
        ultima_movimentacao: ""
        status: ""
  estatisticas:
    tempo_medio_tramitacao_dias: 0
    total_por_status: {}
  metadata:
    data_consulta: ""
    api_versao: ""
    paginas_consultadas: 0
```

## Critérios de Qualidade
- Rate limiting respeitado (sem bloqueio de API)
- Paginação completa para pesquisas filtradas
- Estatísticas calculadas corretamente
- Dados mapeados ao formato padronizado
