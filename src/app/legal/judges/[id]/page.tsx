'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOCK_JUDGE = {
  name: 'Dr. João Silva', tribunal: 'TJSP', vara: '1ª Vara Cível', areas: ['Cível', 'Consumidor', 'Empresarial'],
  totalCases: 1250, favorableRate: 58, sentiment: 6.5,
  patterns: [
    { area: 'Cível', total: 450, favorable: 261, unfavorable: 144, partial: 45, rate: 58 },
    { area: 'Consumidor', total: 380, favorable: 266, unfavorable: 76, partial: 38, rate: 70 },
    { area: 'Empresarial', total: 200, favorable: 80, unfavorable: 100, partial: 20, rate: 40 },
    { area: 'Família', total: 120, favorable: 72, unfavorable: 36, partial: 12, rate: 60 },
    { area: 'Trabalhista', total: 100, favorable: 65, unfavorable: 25, partial: 10, rate: 65 },
  ],
  recentDecisions: [
    { id: 'd1', cnj: '1234567-89.2025.8.26.0100', date: '2026-04-08', area: 'Cível', outcome: 'favorable', summary: 'Procedente ação de indenização. Condenou réu ao pagamento de R$ 10.000,00.' },
    { id: 'd2', cnj: '9876543-21.2025.8.26.0100', date: '2026-04-05', area: 'Consumidor', outcome: 'favorable', summary: 'Declarou abusividade de cláusula contratual. Revisão deferida.' },
    { id: 'd3', cnj: '5432109-87.2025.8.26.0100', date: '2026-04-02', area: 'Empresarial', outcome: 'unfavorable', summary: 'Improcedente ação de dissolução parcial de sociedade.' },
  ],
  topics: ['Responsabilidade Civil', 'Contratos', 'Direito do Consumidor', 'Busca e Apreensão', 'Indenização por Danos Morais'],
};

function getSentimentColor(s: number) { return s >= 7 ? 'text-green-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400'; }
function getOutcomeIcon(o: string) {
  if (o === 'favorable') return <TrendingUp className="h-4 w-4 text-green-400" />;
  if (o === 'unfavorable') return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-yellow-400" />;
}

export default function JudgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const judge = MOCK_JUDGE; // In production, fetch by id

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/legal/judges" className="text-[#6b7a8d] hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <User className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{judge.name}</h1>
            <p className="text-sm text-[#6b7a8d]">{judge.tribunal} — {judge.vara}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Total Processos</p>
          <p className="text-2xl font-bold text-white mt-1">{judge.totalCases.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa Favorável</p>
          <p className="text-2xl font-bold text-white mt-1">{judge.favorableRate}%</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Sentimento</p>
          <p className={`text-2xl font-bold mt-1 ${getSentimentColor(judge.sentiment)}`}>{judge.sentiment.toFixed(1)}/10</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Áreas</p>
          <div className="flex flex-wrap gap-1 mt-2">{judge.areas.map((a) => <span key={a} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400">{a}</span>)}</div>
        </div>
      </div>

      {/* Voting Patterns */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Padrão de Decisões por Área</h2>
        <div className="space-y-4">
          {judge.patterns.map((p) => (
            <div key={p.area}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white">{p.area}</span>
                <span className="text-xs text-[#6b7a8d]">{p.total} processos | {p.rate}% favorável</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-[#1a2332]">
                <div className="bg-green-500/60" style={{ width: `${(p.favorable / p.total) * 100}%` }} title={`Favorável: ${p.favorable}`} />
                <div className="bg-yellow-500/60" style={{ width: `${(p.partial / p.total) * 100}%` }} title={`Parcial: ${p.partial}`} />
                <div className="bg-red-500/60" style={{ width: `${(p.unfavorable / p.total) * 100}%` }} title={`Desfavorável: ${p.unfavorable}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-[#4a5568]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500/60" /> Favorável</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500/60" /> Parcial</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500/60" /> Desfavorável</span>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Decisões Recentes</h2>
        <div className="space-y-3">
          {judge.recentDecisions.map((d) => (
            <div key={d.id} className="flex items-start gap-3 py-3 border-b border-[#1a2332] last:border-0">
              {getOutcomeIcon(d.outcome)}
              <div className="flex-1">
                <p className="text-sm text-[#c0ccda]">{d.summary}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#4a5568]">
                  <span className="font-mono">{d.cnj}</span>
                  <span>{d.date}</span>
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 bg-blue-500/10 text-blue-400">{d.area}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Topics */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Tópicos Principais</h2>
        <div className="flex flex-wrap gap-2">
          {judge.topics.map((t) => <span key={t} className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">{t}</span>)}
        </div>
      </div>
    </div>
  );
}
