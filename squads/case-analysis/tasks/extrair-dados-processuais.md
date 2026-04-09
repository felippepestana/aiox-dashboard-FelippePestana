# Extrair Dados Processuais

## Objetivo
Ler integralmente os autos processuais e extrair todos os dados estruturados necessários para análise pelos demais agentes.

## Agente Responsável
`leitor-processual`

## Inputs
- PDF dos autos processuais
- Classificação da demanda (do `case-analysis-chief`)

## Passos
1. Ler o PDF integralmente, página por página
2. Identificar e catalogar cada peça processual presente nos autos
3. Extrair dados de identificação do processo (número CNJ, vara, comarca)
4. Extrair dados das partes (autor, réu, advogados, OAB)
5. Extrair o teor dos pedidos (inicial e reconvenção)
6. Extrair decisões interlocutórias e seu conteúdo
7. Identificar mandados expedidos (tipo, objeto, status)
8. Mapear cronologia processual (distribuição, citação, intimações, audiências)
9. Calcular prazos em curso
10. Sinalizar peças faltantes ou documentos ilegíveis

## Output Estruturado
```yaml
processo:
  numero_cnj: ""
  vara: ""
  comarca: ""
  classe: ""
  assunto: ""

partes:
  autor:
    nome: ""
    cpf_cnpj: ""
    advogado: ""
    oab: ""
  reu:
    nome: ""
    cpf_cnpj: ""
    advogado: ""
    oab: ""

pecas_processuais:
  - tipo: ""
    data: ""
    folhas: ""
    resumo: ""

decisoes:
  - data: ""
    tipo: ""
    teor_resumido: ""
    folhas: ""

mandados:
  - tipo: ""
    objeto: ""
    data_expedicao: ""
    status: ""

prazos:
  - tipo: ""
    dies_a_quo: ""
    dies_ad_quem: ""
    status: ""

cronologia:
  - data: ""
    evento: ""
```

## Critérios de Qualidade
- Todos os campos preenchidos ou marcados como "não identificado"
- Referência a folhas/páginas dos autos
- Cronologia em ordem cronológica
- Prazos calculados corretamente (dias úteis para CPC)
