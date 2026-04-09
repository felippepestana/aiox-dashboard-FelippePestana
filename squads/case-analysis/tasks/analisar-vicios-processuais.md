# Analisar Vícios Processuais

## Objetivo
Analisar todos os aspectos processuais dos autos, identificando vícios, nulidades, irregularidades e violações ao devido processo legal que possam fundamentar a defesa.

## Agente Responsável
`analista-processual`

## Inputs
- Dados estruturados extraídos pelo `leitor-processual`
- Teor das decisões judiciais proferidas
- Informações sobre mandados expedidos

## Passos
1. Verificar pressupostos processuais (competência, capacidade, legitimidade)
2. Analisar regularidade da citação e intimações
3. Examinar fundamentação das decisões judiciais (art. 489, §1º, CPC)
4. Verificar observância do contraditório prévio (arts. 9º e 10, CPC)
5. Analisar proporcionalidade das medidas deferidas
6. Verificar se houve decisão antes da expedição de mandados
7. Checar existência de saneamento do feito
8. Identificar possíveis cerceamentos de defesa
9. Classificar cada vício encontrado (nulidade absoluta/relativa)
10. Indicar dispositivos legais violados

## Matriz de Vícios
| Vício | Gravidade | Dispositivo | Consequência |
|-------|-----------|-------------|--------------|
| Ausência de fundamentação | Absoluta | Art. 489, §1º, CPC | Nulidade da decisão |
| Decisão surpresa | Absoluta | Art. 10, CPC | Nulidade da decisão |
| Falta de intimação prévia | Absoluta | Art. 9º, CPC | Nulidade do ato |
| Mandado sem decisão | Absoluta | Art. 93, IX, CF | Nulidade do mandado |
| Incompetência absoluta | Absoluta | Art. 64, CPC | Nulidade dos atos decisórios |
| Cerceamento de defesa | Absoluta | Art. 5º, LV, CF | Nulidade do processo |
| Falta de saneamento | Relativa | Art. 357, CPC | Pode ser arguida |

## Output
Parecer de vícios processuais contendo:
- Lista de vícios identificados com classificação
- Dispositivos legais violados (com transcrição)
- Impacto de cada vício no processo
- Recomendação de medida cabível para cada vício
- Priorização por gravidade e viabilidade
