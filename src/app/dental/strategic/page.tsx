'use client';

import { useState } from 'react';
import {
  Target, TrendingUp, DollarSign, Users, Calculator, BarChart3,
  CheckCircle2, AlertCircle, Sparkles, ChevronRight, ArrowUpRight,
  Shield, Lightbulb, Zap,
} from 'lucide-react';

const GOALS = [
  { label: 'Meta de Receita Mensal', current: 47850, target: 60000, unit: 'R$', color: 'green' },
  { label: 'Novos Pacientes/Mês', current: 18, target: 25, unit: '', color: 'blue' },
  { label: 'Taxa de Retorno', current: 72, target: 85, unit: '%', color: 'teal' },
  { label: 'NPS (Satisfação)', current: 8.7, target: 9.5, unit: '/10', color: 'amber' },
];

const SWOT = {
  strengths: [
    'Localização privilegiada em Porto Velho',
    'Especialização em implantodontia',
    'Equipe qualificada e atualizada',
    'Tecnologia de ponta (CBCT, scanner)',
    'Atendimento humanizado e personalizado',
  ],
  weaknesses: [
    'Capacidade limitada de atendimento',
    'Dependência de poucos fornecedores',
    'Marketing digital ainda em desenvolvimento',
    'Ausência de plano de fidelização',
  ],
  opportunities: [
    'Crescimento da demanda por estética dental',
    'Poucos concorrentes com tecnologia avançada',
    'Turismo de saúde na região Norte',
    'Parcerias com convênios empresariais',
    'Expansão para teleconsulta odontológica',
  ],
  threats: [
    'Entrada de grandes redes odontológicas',
    'Instabilidade econômica e inadimplência',
    'Aumento dos custos de insumos importados',
    'Regulamentações cada vez mais rígidas',
  ],
};

const SCENARIOS = [
  { name: 'Otimista', revenue: 72000, patients: 35, growth: 20, color: 'green' },
  { name: 'Esperado', revenue: 60000, patients: 25, growth: 12, color: 'teal' },
  { name: 'Conservador', revenue: 50000, patients: 20, growth: 5, color: 'amber' },
];

const KPI_TRACKING = [
  { name: 'Ticket Médio', value: 'R$ 850', trend: '+5%', status: 'good' },
  { name: 'Taxa de Conversão', value: '68%', trend: '+3%', status: 'good' },
  { name: 'Custo por Aquisição', value: 'R$ 120', trend: '-8%', status: 'good' },
  { name: 'Tempo Médio Tratamento', value: '45 dias', trend: '-12%', status: 'good' },
  { name: 'Taxa de Cancelamento', value: '8%', trend: '+2%', status: 'attention' },
  { name: 'Margem de Lucro', value: '61%', trend: '+3%', status: 'good' },
];

export default function StrategicPage() {
  const [activeTab, setActiveTab] = useState<'goals' | 'swot' | 'scenarios' | 'kpis'>('goals');

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700">
              <Target className="h-5 w-5 text-white" />
            </div>
            Planejamento Estratégico
          </h1>
          <p className="text-sm text-[#86868B] mt-1">Consultoria de negócios e planejamento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white border border-[#E5E5EA] overflow-x-auto mb-6 md:mb-8 w-full md:w-fit">
        {([
          { id: 'goals', label: 'Metas', icon: Target },
          { id: 'swot', label: 'SWOT', icon: Shield },
          { id: 'scenarios', label: 'Cenários', icon: BarChart3 },
          { id: 'kpis', label: 'KPIs', icon: TrendingUp },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-5 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {GOALS.map((goal) => {
              const progress = typeof goal.current === 'number' && typeof goal.target === 'number'
                ? Math.min(100, (goal.current / goal.target) * 100)
                : 0;
              const colorClasses: Record<string, { bar: string; text: string }> = {
                green: { bar: 'from-green-500 to-green-400', text: 'text-green-400' },
                blue: { bar: 'from-blue-500 to-blue-400', text: 'text-blue-400' },
                teal: { bar: 'from-[#C4956A] to-[#C4956A]', text: 'text-[#C4956A]' },
                amber: { bar: 'from-amber-500 to-amber-400', text: 'text-amber-400' },
              };
              const c = colorClasses[goal.color];
              return (
                <div key={goal.label} className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">{goal.label}</p>
                    <span className={`text-xs font-medium ${c.text}`}>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-[#1D1D1F]">
                      {goal.unit === 'R$' ? goal.current.toLocaleString('pt-BR') : goal.current}
                    </span>
                    <span className="text-sm text-[#AEAEB2] mb-1">
                      / {goal.unit === 'R$' ? goal.target.toLocaleString('pt-BR') : goal.target}{goal.unit !== 'R$' ? goal.unit : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8E8ED]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Break-even Calculator */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-purple-400" />
              Calculadora de Ponto de Equilíbrio
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-4">
                <p className="text-[10px] text-[#AEAEB2] mb-1">Custos Fixos Mensais</p>
                <p className="text-lg font-bold text-[#1D1D1F]">R$ 12.800</p>
              </div>
              <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-4">
                <p className="text-[10px] text-[#AEAEB2] mb-1">Ticket Médio</p>
                <p className="text-lg font-bold text-[#1D1D1F]">R$ 850</p>
              </div>
              <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-4">
                <p className="text-[10px] text-[#AEAEB2] mb-1">Margem de Contribuição</p>
                <p className="text-lg font-bold text-[#1D1D1F]">61%</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[#C4956A]/20 to-[#C4956A]/5 border border-[#C4956A]/20 p-4">
                <p className="text-[10px] text-[#C4956A] mb-1">Ponto de Equilíbrio</p>
                <p className="text-lg font-bold text-[#C4956A]">25 pacientes/mês</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWOT Tab */}
      {activeTab === 'swot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {([
            { key: 'strengths', title: 'Forças', color: 'green', icon: CheckCircle2 },
            { key: 'weaknesses', title: 'Fraquezas', color: 'red', icon: AlertCircle },
            { key: 'opportunities', title: 'Oportunidades', color: 'blue', icon: Lightbulb },
            { key: 'threats', title: 'Ameaças', color: 'amber', icon: Zap },
          ] as const).map((section) => {
            const Icon = section.icon;
            const colorMap: Record<string, { border: string; bg: string; text: string; iconColor: string }> = {
              green: { border: 'border-green-500/20', bg: 'from-green-500/10 to-green-500/5', text: 'text-green-400', iconColor: 'text-green-400' },
              red: { border: 'border-red-500/20', bg: 'from-red-500/10 to-red-500/5', text: 'text-red-400', iconColor: 'text-red-400' },
              blue: { border: 'border-blue-500/20', bg: 'from-blue-500/10 to-blue-500/5', text: 'text-blue-400', iconColor: 'text-blue-400' },
              amber: { border: 'border-amber-500/20', bg: 'from-amber-500/10 to-amber-500/5', text: 'text-amber-400', iconColor: 'text-amber-400' },
            };
            const c = colorMap[section.color];
            return (
              <div key={section.key} className={`rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-6`}>
                <h3 className={`text-sm font-semibold ${c.text} flex items-center gap-2 mb-4`}>
                  <Icon className={`h-4 w-4 ${c.iconColor}`} />
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {SWOT[section.key].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#48484A] leading-relaxed">
                      <ChevronRight className={`h-3 w-3 mt-0.5 flex-shrink-0 ${c.iconColor}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {SCENARIOS.map((scenario) => {
            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              green: { bg: 'from-green-500/15 to-green-500/5', border: 'border-green-500/20', text: 'text-green-400' },
              teal: { bg: 'from-[#C4956A]/15 to-[#C4956A]/5', border: 'border-[#C4956A]/20', text: 'text-[#C4956A]' },
              amber: { bg: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400' },
            };
            const c = colorMap[scenario.color];
            return (
              <div key={scenario.name} className={`rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-6`}>
                <h3 className={`text-lg font-bold ${c.text} mb-6`}>{scenario.name}</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] text-[#AEAEB2] uppercase tracking-wider mb-1">Receita Mensal</p>
                    <p className="text-xl md:text-2xl font-bold text-[#1D1D1F]">
                      {scenario.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#AEAEB2] uppercase tracking-wider mb-1">Novos Pacientes/Mês</p>
                    <p className="text-xl md:text-2xl font-bold text-[#1D1D1F]">{scenario.patients}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#AEAEB2] uppercase tracking-wider mb-1">Crescimento Anual</p>
                    <p className="text-xl md:text-2xl font-bold text-[#1D1D1F]">{scenario.growth}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#AEAEB2] uppercase tracking-wider mb-1">Receita Anual Projetada</p>
                    <p className="text-xl font-bold text-[#1D1D1F]">
                      {(scenario.revenue * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {KPI_TRACKING.map((kpi) => (
            <div key={kpi.name} className="rounded-2xl bg-white border border-[#E5E5EA] p-5 hover:border-[#C4956A]/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#86868B]">{kpi.name}</p>
                {kpi.status === 'attention' && <AlertCircle className="h-4 w-4 text-amber-400" />}
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#1D1D1F] mb-2">{kpi.value}</p>
              <span className={`flex items-center gap-1 text-xs font-medium ${
                kpi.status === 'good' ? 'text-green-400' : 'text-amber-400'
              }`}>
                <ArrowUpRight className="h-3 w-3" />
                {kpi.trend} vs mês anterior
              </span>
            </div>
          ))}

          {/* AI Recommendations */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-2xl bg-gradient-to-br from-[#D4A76A]/10 to-[#D4A76A]/5 border border-[#D4A76A]/20 p-4 md:p-6 mt-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#D4A76A]" />
              Recomendações Estratégicas IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {[
                { title: 'Expansão de Serviços', text: 'Considere adicionar Harmonização Orofacial ao portfólio. O mercado em Porto Velho tem baixa concorrência neste segmento.' },
                { title: 'Fidelização de Pacientes', text: 'Implemente um programa de indicação com desconto de 10%. Pacientes indicados têm 37% mais chance de aderir a tratamentos completos.' },
                { title: 'Otimização de Custos', text: 'Negocie contratos anuais com fornecedores de materiais. Estimativa de economia: R$ 2.400/ano com volume de compra consolidado.' },
              ].map((rec, i) => (
                <div key={i} className="rounded-xl bg-white/60 p-4">
                  <p className="text-xs font-semibold text-[#D4A76A] mb-2">{rec.title}</p>
                  <p className="text-xs text-[#48484A] leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
