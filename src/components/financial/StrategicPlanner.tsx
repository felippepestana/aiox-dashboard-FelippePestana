'use client';

import { useState } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Sparkles,
  Users,
  DollarSign,
  Calendar,
  PieChart,
} from 'lucide-react';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type TabId = 'goals' | 'swot' | 'breakeven' | 'scenarios' | 'kpis' | 'insights';

interface Goal {
  id: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  period: string;
}

const goals: Goal[] = [
  { id: '1', label: 'Receita Mensal', target: 150000, current: 124500, unit: 'BRL', period: 'Mensal' },
  { id: '2', label: 'Novos Pacientes', target: 40, current: 32, unit: 'pacientes', period: 'Mensal' },
  { id: '3', label: 'Ticket Medio', target: 850, current: 780, unit: 'BRL', period: 'Mensal' },
  { id: '4', label: 'Taxa de Retorno', target: 75, current: 68, unit: '%', period: 'Trimestral' },
  { id: '5', label: 'Procedimentos Esteticos', target: 35, current: 28, unit: '%', period: 'Trimestral' },
  { id: '6', label: 'Receita Anual', target: 1800000, current: 1456000, unit: 'BRL', period: 'Anual' },
];

const swotData = {
  strengths: [
    'Equipe altamente qualificada com especializacoes diversas',
    'Localizacao privilegiada com facil acesso',
    'Tecnologia de ponta em equipamentos',
    'Alto indice de satisfacao dos pacientes (4.8/5)',
    'Presenca digital forte nas redes sociais',
  ],
  weaknesses: [
    'Dependencia de poucos procedimentos de alto valor',
    'Falta de plano de fidelizacao estruturado',
    'Capacidade ociosa em horarios especificos',
    'Custo operacional elevado com laboratorio',
    'Ausencia de teleatendimento',
  ],
  opportunities: [
    'Crescimento da demanda por estetica dental',
    'Parcerias com empresas para planos corporativos',
    'Expansao de servicos de ortodontia invisivel',
    'Marketing digital com conteudo educativo',
    'Implementacao de planos de pagamento flexiveis',
  ],
  threats: [
    'Concorrencia de clinicas populares',
    'Instabilidade economica reduzindo procedimentos eletivos',
    'Regulamentacoes mais restritivas do CRO',
    'Aumento nos custos de insumos importados',
    'Mudancas em convenios e planos odontologicos',
  ],
};

const monthlyProjections = [
  { month: 'Jul', best: 145000, expected: 128000, worst: 105000 },
  { month: 'Ago', best: 152000, expected: 132000, worst: 108000 },
  { month: 'Set', best: 158000, expected: 138000, worst: 112000 },
  { month: 'Out', best: 165000, expected: 142000, worst: 115000 },
  { month: 'Nov', best: 170000, expected: 148000, worst: 118000 },
  { month: 'Dez', best: 180000, expected: 155000, worst: 122000 },
];

const kpiMetrics = [
  { label: 'Taxa de Conversao', value: 72, target: 80, unit: '%', trend: 3.2 },
  { label: 'Custo por Aquisicao', value: 185, target: 150, unit: 'BRL', trend: -8.5 },
  { label: 'Lifetime Value (LTV)', value: 4200, target: 5000, unit: 'BRL', trend: 12.4 },
  { label: 'Margem Operacional', value: 34, target: 40, unit: '%', trend: 2.1 },
  { label: 'NPS (Net Promoter Score)', value: 78, target: 85, unit: 'pts', trend: 5.0 },
  { label: 'Taxa de Cancelamento', value: 8, target: 5, unit: '%', trend: -1.2 },
  { label: 'Ocupacao de Agenda', value: 82, target: 90, unit: '%', trend: 4.5 },
  { label: 'Receita por Cadeira/Dia', value: 2100, target: 2500, unit: 'BRL', trend: 7.3 },
];

const aiInsights = [
  {
    title: 'Oportunidade de Crescimento em Estetica',
    description: 'Analise de tendencia indica aumento de 45% na demanda por clareamento e facetas na sua regiao. Recomendamos campanha focada nesses procedimentos.',
    impact: 'alto',
    category: 'Receita',
  },
  {
    title: 'Otimizacao de Horarios Ociosos',
    description: 'Identificamos que terca e quarta das 14h-16h tem baixa ocupacao. Sugerimos promocoes especificas ou atendimento de emergencia nesses horarios.',
    impact: 'medio',
    category: 'Operacional',
  },
  {
    title: 'Reducao de Custos com Laboratorio',
    description: 'Comparativo de precos mostra que ha laboratorios parceiros com valores 18% menores para proteses e coroas sem perda de qualidade.',
    impact: 'alto',
    category: 'Custos',
  },
  {
    title: 'Programa de Indicacoes',
    description: '32% dos novos pacientes vem por indicacao. Um programa estruturado de bonus por indicacao pode aumentar esse numero em ate 50%.',
    impact: 'medio',
    category: 'Marketing',
  },
  {
    title: 'Risco de Inadimplencia',
    description: 'Detectamos padrao de atraso em pagamentos parcelados acima de 6x. Sugerimos limite de 4x sem juros e 6x com taxa.',
    impact: 'alto',
    category: 'Financeiro',
  },
];

export default function StrategicPlanner() {
  const [activeTab, setActiveTab] = useState<TabId>('goals');
  const [expandedSwot, setExpandedSwot] = useState<string | null>('strengths');

  // Break-even state
  const [fixedCosts, setFixedCosts] = useState(42000);
  const [avgTicket, setAvgTicket] = useState(780);
  const [variableCostPct, setVariableCostPct] = useState(25);

  const breakEvenPatients = Math.ceil(fixedCosts / (avgTicket * (1 - variableCostPct / 100)));
  const breakEvenRevenue = breakEvenPatients * avgTicket;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'goals', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'swot', label: 'SWOT', icon: <Shield className="w-4 h-4" /> },
    { id: 'breakeven', label: 'Ponto de Equilibrio', icon: <Calculator className="w-4 h-4" /> },
    { id: 'scenarios', label: 'Cenarios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'kpis', label: 'KPIs', icon: <PieChart className="w-4 h-4" /> },
    { id: 'insights', label: 'IA Insights', icon: <Brain className="w-4 h-4" /> },
  ];

  const maxProjection = Math.max(...monthlyProjections.map((p) => p.best));

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Planejamento Estrategico</h1>
        <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0D9488] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              const isOnTrack = pct >= 75;
              return (
                <div key={goal.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">{goal.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {goal.period}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-gray-800">
                      {goal.unit === 'BRL' ? formatBRL(goal.current) : `${goal.current}${goal.unit === '%' ? '%' : ''}`}
                    </span>
                    <span className="text-sm text-gray-400">
                      / {goal.unit === 'BRL' ? formatBRL(goal.target) : `${goal.target}${goal.unit === '%' ? '%' : ` ${goal.unit}`}`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-[#0D9488]' : 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isOnTrack ? 'text-[#0D9488]' : 'text-amber-500'}>
                      {pct.toFixed(1)}% da meta
                    </span>
                    <span className="text-gray-400">
                      {isOnTrack ? 'No caminho certo' : 'Atencao necessaria'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SWOT Tab */}
      {activeTab === 'swot' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: 'strengths', label: 'Forcas', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700', items: swotData.strengths },
            { key: 'weaknesses', label: 'Fraquezas', color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700', items: swotData.weaknesses },
            { key: 'opportunities', label: 'Oportunidades', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700', items: swotData.opportunities },
            { key: 'threats', label: 'Ameacas', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700', items: swotData.threats },
          ].map((section) => (
            <div key={section.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedSwot(expandedSwot === section.key ? null : section.key)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${section.color}`} />
                  <span className="font-semibold text-gray-800">{section.label}</span>
                  <span className="text-xs text-gray-400">{section.items.length} itens</span>
                </div>
                {expandedSwot === section.key ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSwot === section.key && (
                <div className="px-4 pb-4 space-y-2">
                  {section.items.map((item, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${section.lightColor}`}>
                      <div className={`w-5 h-5 rounded-full ${section.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5`}>
                        {idx + 1}
                      </div>
                      <p className={`text-sm ${section.textColor}`}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Break-even Tab */}
      {activeTab === 'breakeven' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-[#0D9488]" />
              <h3 className="font-semibold text-gray-800">Calculadora de Ponto de Equilibrio</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Custos Fixos Mensais (R$)
                </label>
                <input
                  type="number"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
                <p className="text-xs text-gray-400 mt-1">Aluguel, folha, utilidades, etc.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Ticket Medio por Paciente (R$)
                </label>
                <input
                  type="number"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Custo Variavel por Procedimento (%)
                </label>
                <input
                  type="number"
                  value={variableCostPct}
                  onChange={(e) => setVariableCostPct(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
                <p className="text-xs text-gray-400 mt-1">Material, laboratorio, descartaveis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-6">Resultado</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#0D9488]/5 rounded-lg border border-[#0D9488]/20">
                <p className="text-sm text-gray-600 mb-1">Pacientes Necessarios por Mes</p>
                <p className="text-3xl font-bold text-[#0D9488]">{breakEvenPatients}</p>
                <p className="text-xs text-gray-500 mt-1">para cobrir todos os custos fixos</p>
              </div>
              <div className="p-4 bg-[#D4A76A]/5 rounded-lg border border-[#D4A76A]/20">
                <p className="text-sm text-gray-600 mb-1">Receita Minima Mensal</p>
                <p className="text-3xl font-bold text-[#D4A76A]">{formatBRL(breakEvenRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">para atingir o ponto de equilibrio</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Margem de Contribuicao por Paciente</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatBRL(avgTicket * (1 - variableCostPct / 100))}
                </p>
                <p className="text-xs text-gray-500 mt-1">{100 - variableCostPct}% do ticket medio</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Pac./Dia (22 dias)</p>
                  <p className="text-lg font-bold text-gray-800">{Math.ceil(breakEvenPatients / 22)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Pac./Semana</p>
                  <p className="text-lg font-bold text-gray-800">{Math.ceil(breakEvenPatients / 4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Melhor Cenario', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', total: monthlyProjections.reduce((s, p) => s + p.best, 0) },
              { label: 'Cenario Esperado', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', total: monthlyProjections.reduce((s, p) => s + p.expected, 0) },
              { label: 'Pior Cenario', color: 'bg-red-50 border-red-200', textColor: 'text-red-700', total: monthlyProjections.reduce((s, p) => s + p.worst, 0) },
            ].map((scenario) => (
              <div key={scenario.label} className={`rounded-xl border p-5 ${scenario.color}`}>
                <p className={`text-sm font-medium ${scenario.textColor}`}>{scenario.label}</p>
                <p className={`text-2xl font-bold ${scenario.textColor} mt-2`}>
                  {formatBRL(scenario.total)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Proximo semestre</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800">Projecoes Mensais</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                  <span className="text-gray-500">Melhor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-400" />
                  <span className="text-gray-500">Esperado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-400" />
                  <span className="text-gray-500">Pior</span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-4 h-52">
              {monthlyProjections.map((proj) => (
                <div key={proj.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex justify-center gap-1 items-end h-44">
                    <div
                      className="flex-1 max-w-[16px] bg-emerald-400 rounded-t-sm"
                      style={{ height: `${(proj.best / maxProjection) * 100}%` }}
                      title={`Melhor: ${formatBRL(proj.best)}`}
                    />
                    <div
                      className="flex-1 max-w-[16px] bg-blue-400 rounded-t-sm"
                      style={{ height: `${(proj.expected / maxProjection) * 100}%` }}
                      title={`Esperado: ${formatBRL(proj.expected)}`}
                    />
                    <div
                      className="flex-1 max-w-[16px] bg-red-400 rounded-t-sm"
                      style={{ height: `${(proj.worst / maxProjection) * 100}%` }}
                      title={`Pior: ${formatBRL(proj.worst)}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{proj.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Mes</th>
                  <th className="text-right text-xs font-semibold text-emerald-600 py-3 px-4">Melhor</th>
                  <th className="text-right text-xs font-semibold text-blue-600 py-3 px-4">Esperado</th>
                  <th className="text-right text-xs font-semibold text-red-600 py-3 px-4">Pior</th>
                </tr>
              </thead>
              <tbody>
                {monthlyProjections.map((proj) => (
                  <tr key={proj.month} className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-sm font-medium text-gray-700">{proj.month}/2025</td>
                    <td className="py-2.5 px-4 text-sm text-right text-emerald-600">{formatBRL(proj.best)}</td>
                    <td className="py-2.5 px-4 text-sm text-right text-blue-600">{formatBRL(proj.expected)}</td>
                    <td className="py-2.5 px-4 text-sm text-right text-red-600">{formatBRL(proj.worst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((kpi) => {
            const pct = Math.min((kpi.value / kpi.target) * 100, 100);
            const isGood = kpi.label.includes('Cancelamento') || kpi.label.includes('Custo')
              ? kpi.value <= kpi.target
              : kpi.value >= kpi.target * 0.85;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 mb-2">{kpi.label}</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-800">
                    {kpi.unit === 'BRL' ? formatBRL(kpi.value) : kpi.value}
                  </span>
                  {kpi.unit !== 'BRL' && (
                    <span className="text-sm text-gray-400">{kpi.unit}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {kpi.trend >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className={`text-xs ${kpi.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Math.abs(kpi.trend)}%
                  </span>
                  <span className="text-xs text-gray-400">vs mes anterior</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isGood ? 'bg-[#0D9488]' : 'bg-amber-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Meta: {kpi.unit === 'BRL' ? formatBRL(kpi.target) : `${kpi.target} ${kpi.unit}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#0D9488]/10 to-[#D4A76A]/10 rounded-xl border border-[#0D9488]/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-[#D4A76A]" />
              <h3 className="font-semibold text-gray-800">Recomendacoes da IA</h3>
            </div>
            <p className="text-sm text-gray-600">
              Analise baseada nos dados financeiros, operacionais e de mercado da Sbarzi Odontologia.
              Atualizado com os dados mais recentes disponveis.
            </p>
          </div>

          {aiInsights.map((insight, idx) => {
            const impactColors = {
              alto: 'bg-red-50 text-red-700 border-red-200',
              medio: 'bg-amber-50 text-amber-700 border-amber-200',
              baixo: 'bg-blue-50 text-blue-700 border-blue-200',
            };
            const impactColor = impactColors[insight.impact as keyof typeof impactColors];
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{insight.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{insight.category}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${impactColor}`}>
                    Impacto {insight.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed ml-11">{insight.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
