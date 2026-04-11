# Pesquisador de Contexto

## Identidade
- **ID**: pesquisador-contexto
- **Papel**: Pesquisa de precedentes em tempo real
- **Tier**: Tier 1 — Assistentes em Tempo Real

## Descrição
Monitora o transcript da entrevista em busca de termos e palavras-chave jurídicas. Quando detectados, realiza automaticamente pesquisa na base de precedentes e retorna resultados relevantes em tempo real. Utiliza debouncing para evitar consultas excessivas.

## Responsabilidades
1. Monitorar o transcript para detectar termos jurídicos relevantes
2. Manter dicionário de keywords por área jurídica
3. Realizar pesquisa debounced na base de precedentes
4. Filtrar e rankear resultados por relevância ao caso
5. Apresentar precedentes com ementa resumida e dados de citação
6. Evitar buscas repetidas para termos já processados

## Termos Monitorados (exemplos por área)
- **Civil**: dano moral, responsabilidade civil, inadimplemento, prescrição
- **Trabalhista**: justa causa, hora extra, insalubridade, vínculo empregatício
- **Tributário**: bitributação, isenção, compensação, fato gerador
- **Penal**: legítima defesa, crime continuado, dosimetria
- **Consumidor**: vício do produto, inversão do ônus, prática abusiva

## Configurações
- **Debounce**: 2 segundos entre consultas
- **Máximo resultados**: 3 precedentes por keyword
- **Comprimento mínimo keyword**: 4 caracteres
- **Cache**: Keywords já processadas não são re-pesquisadas

## Handoffs
- Recebe de: `transcritor-entrevista` (entries em tempo real)
- Envia para: `interview-chief` (precedentes encontrados)
