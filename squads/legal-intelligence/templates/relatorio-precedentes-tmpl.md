# Template: Relatório de Precedentes

## Cabeçalho

```
RELATÓRIO DE PESQUISA DE PRECEDENTES
Tema: {{TEMA_PESQUISA}}
Data de Geração: {{DATA_GERACAO}}
Período de Pesquisa: {{PERIODO}}
Tribunais Pesquisados: {{TRIBUNAIS}}
Total de Resultados: {{TOTAL_RESULTADOS}}
Precedentes Selecionados: {{TOTAL_SELECIONADOS}}
```

## Resumo Executivo

```
{{RESUMO_EXECUTIVO}}

Jurisprudência predominante: {{FAVORAVEL / DESFAVORAVEL / DIVIDIDA}}
Precedentes vinculantes aplicáveis: {{SIM / NAO}}
Divergência jurisprudencial identificada: {{SIM / NAO}}
```

## Precedentes Vinculantes

```
{{#VINCULANTES}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tipo: {{TIPO}} (Súmula Vinculante / Repercussão Geral / Repetitivo)
Número: {{NUMERO}}
Tribunal: {{TRIBUNAL}}
Tese Fixada: {{TESE}}
Aplicabilidade ao Caso: {{APLICABILIDADE}}
{{/VINCULANTES}}
```

## Precedentes Persuasivos

```
{{#PERSUASIVOS}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tribunal: {{TRIBUNAL}}
Órgão Julgador: {{ORGAO}}
Tipo: {{TIPO}} (Acórdão / Decisão Monocrática)
Número: {{NUMERO}}
Relator: {{RELATOR}}
Data de Julgamento: {{DATA_JULGAMENTO}}
Relevância: {{SCORE}}/100

EMENTA:
{{EMENTA}}

Aplicabilidade: {{ANALISE_APLICABILIDADE}}
{{/PERSUASIVOS}}
```

## Divergências Jurisprudenciais

```
{{#DIVERGENCIAS}}
Tema: {{TEMA_DIVERGENCIA}}
Posição A: {{POSICAO_A}} (Tribunais: {{TRIBUNAIS_A}})
Posição B: {{POSICAO_B}} (Tribunais: {{TRIBUNAIS_B}})
Tendência: {{TENDENCIA}}
{{/DIVERGENCIAS}}
```

## Conclusão e Recomendação

```
{{CONCLUSAO}}
```

## Instruções de Preenchimento
- Precedentes ordenados por relevância (vinculantes primeiro)
- Ementas completas (não resumidas)
- Dados de citação com formato: Tribunal, Órgão, Tipo Número, Relator, Data
- Divergências documentadas com tribunais de cada posição
