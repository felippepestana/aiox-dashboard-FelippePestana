# APEX Legal Performance — Prompts para v0.dev

## Como usar

1. Abra [v0.app](https://v0.app) e importe o repositório `felippepestana/aiox-dashboard-felippepestana`
2. **Antes de qualquer prompt**, cole o **Contexto Base** abaixo na primeira mensagem do chat
3. Depois, use qualquer prompt desta lista — copie e cole diretamente

---

## Contexto Base (cole SEMPRE como primeira mensagem)

```
Este é o APEX Legal Performance — dashboard jurídico brasileiro premium.

STACK: Next.js 16, React 19, TailwindCSS 4, shadcn/ui (new-york style), lucide-react icons.

TEMA: Dark-first. Navy profundo + Silver Chrome + Gold accent.
- Backgrounds: #060d1a (deepest), #0a1628 (base), #0d1f3c (card), #121f36 (card hover)
- Silver primary: #C0C0C0, muted: #A0AEC0, dim: #718096, disabled: #4A5568
- Gold accent: #D4AF37, light: #E8D070
- Borders: rgba(192,192,192,0.10) padrão, rgba(192,192,192,0.20) hover
- Status: success #4ADE80, warning #FBBF24, danger #F87171, info #60A5FA
- Radius: sharp (2-8px), nunca arredondado demais
- Shadows: sm(0 1px 4px rgba(0,0,0,0.25)), md(0 4px 12px rgba(0,0,0,0.35)), lg(0 8px 32px rgba(0,0,0,0.50))
- Easing: cubic-bezier(0.22, 1, 0.36, 1) para transições premium
- Tipografia: text-white para títulos, #A0AEC0 para subtítulos, #718096 para labels, uppercase tracking-wider para categorias

COMPONENTES EXISTENTES (importar de @/components/legal/shared):
- PageHeader: title, subtitle?, breadcrumbs?, actions?
- StatCardGrid: cards[] com label, value, icon, trend, trendLabel, color
- DataTable<T>: columns[], data[], searchable, paginated, onRowClick, sort automático
- FilterBar: filters[] (select/dateRange/search), onFilterChange, onClear
- EmptyState: icon, title, description, action?
- LoadingState: type ('table'|'cards'|'page')
- Breadcrumbs: auto-detect de rota ou items manual

PADRÃO DE CARD:
rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-5
hover:border-[rgba(192,192,192,0.20)] hover:bg-[#121f36]

PADRÃO DE BADGE:
px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider
Fundo: rgba(COR, 0.12), borda: rgba(COR, 0.35), texto: COR

PADRÃO DE BOTÃO PRIMÁRIO (gold):
bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)] text-[#D4AF37]
hover:bg-[rgba(212,175,55,0.20)] transition-colors

PADRÃO DE INPUT:
bg-[#0a1628] border border-[rgba(192,192,192,0.12)] text-white
placeholder:text-[#4A5568] focus:border-[rgba(192,192,192,0.35)]

Todos os textos em PT-BR. Use "use client" nos componentes interativos.
```

---

## Prompts Prontos por Categoria

### 1. COMPONENTES DE DADOS

#### 1.1 — Timeline de Movimentações Processuais
```
Crie um componente CaseTimeline para exibir movimentações de um processo jurídico em formato timeline vertical.

Props: movements: { date: string, type: 'decisao' | 'despacho' | 'peticao' | 'audiencia' | 'publicacao', title: string, description: string, tribunal: string, author?: string }[]

Design:
- Linha vertical pontilhada (silver dim) à esquerda
- Cada nó: círculo 8px na cor do tipo (decisao=#D4AF37, despacho=#60A5FA, peticao=#C0C0C0, audiencia=#FBBF24, publicacao=#4ADE80)
- Card ao lado: fundo #0d1f3c, border rgba(192,192,192,0.10), rounded-lg
- Badge do tipo no topo do card (padrão de badge APEX)
- Data em text-xs text-[#718096] uppercase
- Título em text-sm font-medium text-white
- Descrição em text-xs text-[#A0AEC0]
- Tribunal em text-[10px] text-[#4A5568]
- Hover no card: bg-[#121f36], border-[rgba(192,192,192,0.20)]
- Animação de entrada: fade-in + slide-up escalonado
- Responsivo: em mobile a timeline fica flush à esquerda
```

#### 1.2 — Kanban Board de Processos
```
Crie um componente ProcessKanban — board Kanban para gestão visual de processos jurídicos.

Props: processes: { id: string, cnj: string, title: string, client: string, area: string, status: 'analise' | 'peticao_inicial' | 'instrucao' | 'sentenca' | 'encerrado', nextDeadline?: string, priority: 'alta' | 'media' | 'baixa' }[]

Colunas (5): Em Análise, Petição Inicial, Instrução, Sentença, Encerrado
- Header de cada coluna: nome + contador (badge gold)
- Cards arrastáveis (drag-and-drop com HTML5 DnD API nativa, sem lib externa)
- Card: fundo #0d1f3c, border rgba(192,192,192,0.10), rounded-lg, p-3
  - CNJ em font-mono text-[11px] text-[#D4AF37]
  - Título em text-sm font-medium text-white truncate
  - Cliente em text-xs text-[#A0AEC0]
  - Badge de área (cor por área: cível=#60A5FA, trabalhista=#FBBF24, criminal=#F87171, tributário=#4ADE80)
  - Próximo prazo com ícone Clock, text-[10px], vermelho se < 3 dias
  - Barra esquerda de 3px colorida por prioridade (alta=#F87171, media=#FBBF24, baixa=#4ADE80)
- Drop zone: outline pontilhado gold quando dragging
- Scroll horizontal se muitas colunas (mobile)
- Fundo das colunas: bg-[#0a1628] border border-[rgba(192,192,192,0.06)] rounded-xl
```

#### 1.3 — Gráfico Radar de Magistrado
```
Crie um componente JudgeRadarChart para visualizar o perfil decisório de um magistrado.

Props: judgeData: { favorReu: number, favorAutor: number, acordos: number, sentencas: number, tempoMedio: number, reformas: number } (valores 0-100)

Design:
- SVG radar chart com 6 eixos (hexagonal)
- Linhas do grid em rgba(192,192,192,0.08), 5 níveis
- Labels nos eixos em text-[10px] text-[#718096]
- Área preenchida em rgba(212,175,55,0.15) com borda #D4AF37
- Pontos nos vértices: circles 4px fill #D4AF37
- Hover em cada ponto: tooltip com valor exato
- Fundo do container: #0d1f3c com border padrão
- Responsivo: min 280px, max 400px
- Legenda abaixo: mini cards com valor + label para cada eixo
```

#### 1.4 — Calendário de Prazos Compacto
```
Crie um componente CompactDeadlineCalendar — calendário mensal compacto para sidebar ou widget.

Props: deadlines: { date: string, title: string, type: 'fatal' | 'ordinario' | 'audiencia', processId: string }[], month?: Date

Design:
- Grid 7x6 (Dom-Sáb), header com setas de navegação de mês
- Cada dia: célula 36x36px
- Dias com prazo: dot indicator abaixo do número
  - fatal: dot vermelho (#F87171)
  - ordinario: dot amarelo (#FBBF24) 
  - audiencia: dot azul (#60A5FA)
  - Múltiplos: multi-dot (até 3 dots side by side)
- Hover no dia: popover com lista dos prazos do dia
- Dia atual: border gold (#D4AF37), font-bold
- Dias fora do mês: text-[#2D3748], opacity-50
- Header: mês/ano em text-sm font-medium text-white, setas em silver
- Fundo: #0d1f3c, border padrão
- Compacto: max-width 320px
```

### 2. COMPONENTES DE FORMULÁRIO

#### 2.1 — Formulário Multi-Step
```
Crie um componente MultiStepForm genérico para formulários longos tipo cadastro de processo.

Props: 
- steps: { id: string, label: string, icon: ReactNode, fields: ReactNode }[]
- onComplete: (data: Record<string, unknown>) => void
- onCancel?: () => void

Design:
- Progress bar horizontal no topo: steps como circles conectados por linha
  - Concluído: circle gold (#D4AF37) com check
  - Atual: circle gold com borda animada (pulse)
  - Futuro: circle silver dim (#4A5568) 
  - Linha entre: concluída=gold, futura=rgba(192,192,192,0.10)
- Labels dos steps abaixo de cada circle em text-[10px] uppercase tracking-wider
- Content area: renderiza o `fields` ReactNode do step atual
- Footer: "Voltar" (outline silver) + "Próximo" (botão gold) + step X de Y
- Último step: "Próximo" vira "Concluir" (gold sólido bg-[#D4AF37] text-[#060d1a])
- Animação: slide-left ao avançar, slide-right ao voltar (150ms, ease-luxury)
- Validação visual: inputs com erro ganham border-[#F87171]
- Responsivo: em mobile a progress bar vira vertical mini (esquerda)
```

#### 2.2 — Seletor de Cliente com Autocomplete
```
Crie um componente ClientSelector — input com autocomplete para selecionar clientes.

Props:
- clients: { id: string, name: string, type: 'pf' | 'pj', cpfCnpj: string, email?: string }[]
- value?: string (id)
- onChange: (clientId: string) => void
- onCreate?: () => void

Design:
- Input: padrão APEX (bg-[#0a1628], border silver, placeholder "Buscar cliente...")
- Dropdown: posicionado abaixo, fundo #0d1f3c, border, shadow-lg, max-height 240px, scroll
- Cada resultado:
  - Avatar circle (iniciais, bg gold dim)
  - Nome em text-sm text-white
  - Tipo badge (PF azul, PJ verde) + CPF/CNPJ em text-[10px] text-[#718096] mono
  - Email em text-xs text-[#4A5568]
- Hover: bg-[#121f36]
- Keyboard: arrow up/down + enter para selecionar
- Sem resultados: "Nenhum cliente encontrado" + botão "Cadastrar novo" (gold)
- Selecionado: input mostra nome + badge tipo, com X para limpar
```

### 3. COMPONENTES DE DASHBOARD

#### 3.1 — Widget de Agenda Semanal
```
Crie um componente WeeklyAgenda para dashboard — visão semanal de compromissos jurídicos.

Props: events: { date: string, time?: string, title: string, type: 'prazo_fatal' | 'prazo_ordinario' | 'audiencia' | 'reuniao' | 'diligencia', processId?: string, location?: string }[]

Design:
- 7 colunas (Seg-Dom), header com nome do dia + número
- Dia atual destacado: header gold, coluna com bg levemente mais claro
- Cada evento: pill horizontal dentro da coluna
  - Cores por tipo: prazo_fatal=#F87171, prazo_ordinario=#FBBF24, audiencia=#60A5FA, reuniao=#D4AF37, diligencia=#4ADE80
  - Pill: bg-[rgba(COR, 0.12)] border-l-2 border-COR, text-[11px] text-white, truncate
  - Max 3 pills visíveis por dia, depois "+N mais" em text-[10px] text-[#718096]
- Hover em pill: expand com todos os detalhes (horário, processo, local)
- Navegação: < semana anterior | Hoje | semana seguinte >
- Mobile: scroll horizontal, largura mínima por coluna 120px
- Fundo do widget: bg-[#0d1f3c] rounded-xl border p-4
```

#### 3.2 — Widget de Performance do Escritório
```
Crie um componente OfficePerformanceWidget para dashboard executivo.

Props: metrics: { casesWon: number, casesLost: number, casesSettled: number, avgDuration: number, revenue: number, clientSatisfaction: number }

Design:
- Donut chart SVG central: won (gold), lost (red), settled (blue)
  - Centro: total de casos + "Processos"
  - Legenda abaixo com dots + labels + valores
- Barra de progresso para cada métrica:
  - "Tempo Médio": barra com fill gradiente gold, label em dias
  - "Satisfação": barra com fill verde, label em %
  - "Receita": barra com fill gold, label em R$
- Cada barra: fundo bg-[rgba(192,192,192,0.06)], fill arredondado, height 6px
- Label esquerda em text-xs text-[#A0AEC0], valor direita em text-xs font-medium text-white
- Container: bg-[#0d1f3c] rounded-xl border padrão p-5
```

#### 3.3 — Widget de Alertas Críticos
```
Crie um componente CriticalAlerts para dashboard — mostra alertas que precisam de ação imediata.

Props: alerts: { id: string, type: 'prazo_vencido' | 'prazo_hoje' | 'intimacao' | 'audiencia_amanha' | 'pagamento_atrasado', title: string, description: string, processId?: string, deadline?: string, action: string, actionHref: string }[]

Design:
- Lista vertical de alert cards, ordenada por urgência
- Cada card:
  - Ícone esquerdo por tipo (AlertTriangle, Clock, Bell, Calendar, DollarSign) com cor
  - Barra lateral esquerda 3px na cor do tipo
  - Título em text-sm font-medium text-white
  - Descrição em text-xs text-[#A0AEC0]
  - Tempo restante em text-[10px] (ex: "Vence em 2h" em vermelho, "Amanhã" em amarelo)
  - Botão de ação (text-[11px] text-[#D4AF37] underline, hover gold light)
- Cores: vencido=#F87171, hoje=#FBBF24, intimacao=#60A5FA, audiencia=#D4AF37, pagamento=#F87171
- Header: "Alertas Críticos" + badge com contagem (red pulse se > 0)
- Empty: "Nenhum alerta pendente" com ícone CheckCircle verde
- Container: bg-[#0d1f3c] rounded-xl border p-4
- Max 5 visíveis, depois "Ver todos (N)"
```

### 4. COMPONENTES DE COMUNICAÇÃO

#### 4.1 — Composer de Mensagem Jurídica
```
Crie um componente LegalMessageComposer — editor de mensagem para comunicação com clientes.

Props:
- templates?: { id: string, name: string, content: string }[]
- onSend: (message: { to: string, subject: string, body: string, attachments: File[] }) => void
- channels: ('email' | 'whatsapp' | 'sms')[]

Design:
- Header: select de canal (tabs: Email | WhatsApp | SMS) com ícones
  - Tab ativa: border-bottom gold, text-white
  - Tab inativa: text-[#718096]
- Campo "Para": input autocomplete de clientes (ClientSelector)
- Campo "Assunto" (só email): input padrão APEX
- Body: textarea com min-height 200px, resize vertical
  - Toolbar mini acima: Negrito, Itálico, Link, Template (dropdown com templates)
  - Selecionar template preenche o body (confirmação antes)
- Área de anexos: drop zone com ícone Paperclip, lista de anexos adicionados
  - Cada anexo: nome + tamanho + X para remover
- Footer: "Cancelar" (outline) + "Enviar" (gold), com loading state
- Todo o componente: bg-[#0d1f3c] rounded-xl border p-5
```

### 5. PÁGINAS COMPLETAS

#### 5.1 — Painel Financeiro Executivo
```
Crie uma página de painel financeiro executivo para escritório de advocacia.

Layout:
1. PageHeader: "Financeiro Executivo", subtitle com mês/ano atual
2. StatCardGrid (4 cards): Receita Bruta (R$, trend up, gold), Despesas (R$, trend), Lucro Líquido (R$, trend), Taxa de Inadimplência (%, trend down = bom)
3. Gráfico de barras: Receita vs Despesa últimos 12 meses (SVG puro, barras gold para receita, silver para despesa)
4. Grid 2 colunas:
   - Esquerda: Honorários por Área (pie chart SVG: cível, trabalhista, criminal, tributário)
   - Direita: Top 5 Clientes por Receita (mini DataTable: rank, nome, total, % share)
5. DataTable: Faturas Pendentes (cliente, processo, valor, vencimento, dias atraso, status badge)

Use os componentes importados de @/components/legal/shared.
Todas as barras/charts devem ser SVG puro (sem recharts ou chart.js).
Dados mock mas estruturalmente realistas (valores em R$ brasileiro).
```

#### 5.2 — Página de Detalhe do Processo
```
Crie um layout de página de detalhe para um processo jurídico, com tabs.

Layout:
1. PageHeader: número CNJ como título, cliente + vara como subtitle, breadcrumbs [Dashboard > Processos > CNJ]
2. Badges abaixo do header: Área (cível/trabalhista/etc), Status (ativo/suspenso/encerrado), Urgência (alta/media/baixa)
3. Tabs: Resumo | Movimentações | Prazos | Documentos | Financeiro | Partes

Tab Resumo:
- Grid 2 colunas:
  - Esquerda: Dados do Processo (grid de label:value pairs), Polo Ativo, Polo Passivo
  - Direita: Próximos 3 Prazos (mini cards), Última Movimentação (card), Valor da Causa
- StatCardGrid: Dias desde distribuição, Total movimentações, Peças juntadas, Honorários pagos

Tab Movimentações: CaseTimeline (o componente de timeline)
Tab Prazos: lista com filtro de status (pendente/concluído/vencido)
Tab Documentos: grid de cards com ícone de tipo (PDF, DOC, IMG), nome, data, tamanho, download
Tab Financeiro: honorários vinculados + histórico de pagamentos
Tab Partes: cards com dados de cada parte (advogados, autor, réu)

Use os componentes APEX existentes. Tabs com underline gold no active.
```

---

## Dicas de Iteração

**Se o resultado não ficou bom, NÃO acumule pedidos.** Reescreva o prompt incluindo:
- O que ficou bom (manter)
- O que precisa mudar (ser específico: "o card deve ter padding 20px, não 16px")
- Referência visual: "similar ao StatCardGrid que já existe no projeto"

**Após gerar no v0, peça ao Claude Code:**
> "Integre o componente [nome] gerado pelo v0 no projeto. O código está em [cole o código]. Conecte aos stores Zustand e garanta type-safety."
