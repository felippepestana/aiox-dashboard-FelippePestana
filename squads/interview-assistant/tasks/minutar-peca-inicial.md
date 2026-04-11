# Minutar Peça Inicial

## Objetivo
Produzir um esboço estruturado de petição inicial com base na estratégia gerada e nos dados coletados durante a entrevista.

## Agente Responsável
`minutador-inicial`

## Inputs
- StrategyDraft do `gerador-estrategia`
- Transcript completo
- Precedentes encontrados durante a entrevista
- Área jurídica

## Passos
1. Receber estratégia e dados da entrevista
2. **Seleção do Tipo de Peça**:
   a. Mapear área jurídica para tipo de petição padrão
   b. Considerar recomendações da estratégia (tutela, mandado, etc.)
3. **Qualificação das Partes**:
   a. Extrair dados do cliente do transcript
   b. Identificar réu/parte adversa mencionada
   c. Sinalizar campos faltantes para preenchimento
4. **Seção de Fatos**:
   a. Organizar fatos-chave em ordem cronológica
   b. Converter linguagem coloquial para linguagem jurídica
   c. Referenciar provas disponíveis
5. **Seção de Direito**:
   a. Para cada tese, desenvolver fundamentação com base legal
   b. Incluir artigos de lei específicos
   c. Conectar fatos à fundamentação
6. **Seção de Jurisprudência**:
   a. Incluir precedentes encontrados durante a entrevista
   b. Formatar citações com dados completos
7. **Seção de Pedidos**:
   a. Formular pedido principal com base na tese mais forte
   b. Formular pedidos subsidiários
   c. Incluir pedido de tutela de urgência se aplicável
   d. Incluir pedidos acessórios (honorários, custas, etc.)
8. Consolidar esboço com estimativa de páginas

## Output Estruturado
```yaml
petition_outline:
  title: ""
  type: ""
  sections:
    - title: ""
      content: ""
      order: 1
  suggested_precedents: []
  estimated_pages: 0
  missing_data:
    - field: ""
      section: ""
```

## Critérios de Qualidade
- Todas as 7 seções presentes
- Pedidos coerentes com teses identificadas
- Base legal referenciada em cada fundamento
- Dados faltantes sinalizados para preenchimento
- Linguagem jurídica adequada ao tipo de peça
