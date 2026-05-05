# Classificar Demanda Processual

## Objetivo
Receber a demanda do usuário, classificar o tipo de caso, a urgência e definir o workflow adequado para processamento.

## Agente Responsável
`case-analysis-chief`

## Inputs
- Documentos do processo (PDF dos autos)
- Descrição do caso pelo usuário
- Indicação de urgência

## Passos
1. Receber os autos e a descrição do caso
2. Classificar o tipo de demanda (cível, criminal, trabalhista, etc.)
3. Identificar a área específica (busca e apreensão, execução, conhecimento, etc.)
4. Avaliar a urgência (crítica, alta, média, baixa)
5. Verificar se há prazo em curso e qual o prazo remanescente
6. Definir o workflow adequado
7. Distribuir para o `leitor-processual`

## Critérios de Urgência
| Nível | Critério | Workflow |
|-------|----------|----------|
| Crítica | Mandado em cumprimento, prazo em horas | `wf-peca-urgente` |
| Alta | Prazo em 1-3 dias, risco de preclusão | `wf-peca-urgente` |
| Média | Prazo em 5-15 dias | `wf-analise-processual-completa` |
| Baixa | Sem prazo imediato, consulta | Análise pontual |

## Output
- Classificação da demanda (tipo, área, urgência)
- Workflow selecionado
- Distribuição de tarefas acionada
