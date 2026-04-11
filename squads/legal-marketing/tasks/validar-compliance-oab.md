# Validar Compliance OAB

## Objetivo
Validar material de marketing jurídico quanto à conformidade com o Provimento 205/2021 da OAB e o Código de Ética da OAB.

## Agente Responsável
`compliance-oab`

## Inputs
- Material de marketing para validação (texto, imagem, vídeo)
- Tipo de material (artigo, post, e-mail, anúncio)
- Plataforma de publicação

## Passos
1. Ler integralmente o material submetido
2. Verificar ausência de promessa de resultado
3. Verificar ausência de linguagem mercantilista ou sensacionalista
4. Verificar ausência de divulgação de valores (causa, honorários)
5. Verificar ausência de termos superlativos proibidos ("o melhor", "o maior")
6. Verificar se conteúdo é informativo/educativo
7. Verificar conformidade com regras da plataforma-alvo
8. Verificar uso de dados de clientes (autorização expressa necessária)
9. Verificar conformidade visual (trajes, logotipo, identidade)
10. Emitir parecer classificado (aprovado, ajustes, reprovado)
11. Listar ajustes necessários (se aplicável)

## Output Estruturado
```yaml
parecer_compliance:
  material: ""
  tipo: ""
  plataforma: ""
  data_analise: ""
  classificacao: "" # aprovado, ajustes_necessarios, reprovado
  itens_verificados:
    promessa_resultado: "" # conforme, nao_conforme
    linguagem_mercantilista: ""
    valores_divulgados: ""
    termos_superlativos: ""
    conteudo_informativo: ""
    dados_clientes: ""
    conformidade_visual: ""
  ajustes_necessarios:
    - item: ""
      descricao: ""
      sugestao: ""
  fundamentacao:
    - regra: ""
      artigo: ""
      observacao: ""
  parecer_final: ""
```

## Critérios de Qualidade
- Todos os itens do checklist verificados
- Parecer fundamentado em regras específicas da OAB
- Ajustes descritos com clareza e sugestão de correção
- Fundamentação legal indicada para cada não-conformidade
