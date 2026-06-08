'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Target,
  Sparkles,
  Loader2,
  AlertCircle,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  Zap,
  Bot,
} from 'lucide-react';
import { PageHeader } from '@/components/legal/shared';
import { JurimetriaPanel } from '@/components/legal/JurimetriaPanel';
import type { TribunalStats } from '@/components/legal/JurimetriaPanel';

// ─── Data ─────────────────────────────────────────────────────────────────────

const AREAS = [
  { value: 'civil', label: 'Civil' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Familia' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'previdenciario', label: 'Previdenciario' },
];

const TIPOS_ACAO = [
  { value: 'indenizacao', label: 'Indenizacao por Danos' },
  { value: 'cobranca', label: 'Cobranca' },
  { value: 'rescisao', label: 'Rescisao Contratual' },
  { value: 'obrigacao_fazer', label: 'Obrigacao de Fazer' },
  { value: 'revisional', label: 'Revisional' },
];

// Success rates by area across all tribunals (for the bar chart)
const AREA_SUCCESS_RATES = [
  { area: 'Consumidor', rate: 74, total: 12400, avgValue: 15000 },
  { area: 'Familia', rate: 60, total: 8200, avgValue: 4500 },
  { area: 'Civil', rate: 58, total: 22000, avgValue: 42000 },
  { area: 'Empresarial', rate: 55, total: 6800, avgValue: 220000 },
  { area: 'Previdenciario', rate: 53, total: 9100, avgValue: 58000 },
  { area: 'Trabalhista', rate: 51, total: 18300, avgValue: 26000 },
  { area: 'Tributario', rate: 40, total: 7500, avgValue: 108000 },
  { area: 'Penal', rate: 31, total: 11200, avgValue: 0 },
];

// Average duration by tribunal
const TRIBUNAL_DURATION = [
  { tribunal: 'TRT2', avgMonths: 10, cases: 18300 },
  { tribunal: 'TJSP', avgMonths: 14, cases: 42000 },
  { tribunal: 'TJRJ', avgMonths: 17, cases: 28000 },
  { tribunal: 'TJMG', avgMonths: 18, cases: 22000 },
  { tribunal: 'TRF3', avgMonths: 26, cases: 15000 },
  { tribunal: 'STJ', avgMonths: 32, cases: 9500 },
  { tribunal: 'STF', avgMonths: 48, cases: 3200 },
];

// Top performing areas
const TOP_AREAS = [
  { area: 'Consumidor - Planos de Saude', rate: 81, trend: 'up' as const },
  { area: 'Trabalhista - TRT2', rate: 72, trend: 'up' as const },
  { area: 'Digital - LGPD', rate: 71, trend: 'up' as const },
  { area: 'Previdenciario - TRF3', rate: 68, trend: 'stable' as const },
  { area: 'Tributario - PIS/COFINS', rate: 67, trend: 'up' as const },
];

function getMockStats(area: string, tipoAcao: string): TribunalStats[] {
  const seed = (area.length + tipoAcao.length) % 5;

  const baseData: Record<string, TribunalStats[]> = {
    civil: [
      { tribunal: 'TJSP', favoravel: 62, desfavoravel: 25, parcial: 13, valorMedio: 45000, duracaoMedia: '18 meses' },
      { tribunal: 'TJRJ', favoravel: 58, desfavoravel: 28, parcial: 14, valorMedio: 38000, duracaoMedia: '22 meses' },
      { tribunal: 'TJMG', favoravel: 55, desfavoravel: 30, parcial: 15, valorMedio: 32000, duracaoMedia: '20 meses' },
      { tribunal: 'TRT2', favoravel: 48, desfavoravel: 35, parcial: 17, valorMedio: 28000, duracaoMedia: '16 meses' },
      { tribunal: 'TRF3', favoravel: 52, desfavoravel: 32, parcial: 16, valorMedio: 55000, duracaoMedia: '24 meses' },
    ],
    trabalhista: [
      { tribunal: 'TJSP', favoravel: 45, desfavoravel: 35, parcial: 20, valorMedio: 25000, duracaoMedia: '14 meses' },
      { tribunal: 'TJRJ', favoravel: 50, desfavoravel: 30, parcial: 20, valorMedio: 22000, duracaoMedia: '16 meses' },
      { tribunal: 'TJMG', favoravel: 42, desfavoravel: 38, parcial: 20, valorMedio: 18000, duracaoMedia: '12 meses' },
      { tribunal: 'TRT2', favoravel: 72, desfavoravel: 18, parcial: 10, valorMedio: 35000, duracaoMedia: '10 meses' },
      { tribunal: 'TRF3', favoravel: 40, desfavoravel: 40, parcial: 20, valorMedio: 20000, duracaoMedia: '18 meses' },
    ],
    tributario: [
      { tribunal: 'TJSP', favoravel: 35, desfavoravel: 45, parcial: 20, valorMedio: 120000, duracaoMedia: '30 meses' },
      { tribunal: 'TJRJ', favoravel: 38, desfavoravel: 42, parcial: 20, valorMedio: 95000, duracaoMedia: '28 meses' },
      { tribunal: 'TJMG', favoravel: 33, desfavoravel: 47, parcial: 20, valorMedio: 85000, duracaoMedia: '26 meses' },
      { tribunal: 'TRT2', favoravel: 30, desfavoravel: 50, parcial: 20, valorMedio: 60000, duracaoMedia: '24 meses' },
      { tribunal: 'TRF3', favoravel: 55, desfavoravel: 30, parcial: 15, valorMedio: 180000, duracaoMedia: '36 meses' },
    ],
    consumidor: [
      { tribunal: 'TJSP', favoravel: 75, desfavoravel: 15, parcial: 10, valorMedio: 15000, duracaoMedia: '10 meses' },
      { tribunal: 'TJRJ', favoravel: 78, desfavoravel: 12, parcial: 10, valorMedio: 18000, duracaoMedia: '12 meses' },
      { tribunal: 'TJMG', favoravel: 70, desfavoravel: 18, parcial: 12, valorMedio: 12000, duracaoMedia: '11 meses' },
      { tribunal: 'TRT2', favoravel: 50, desfavoravel: 30, parcial: 20, valorMedio: 8000, duracaoMedia: '9 meses' },
      { tribunal: 'TRF3', favoravel: 65, desfavoravel: 20, parcial: 15, valorMedio: 20000, duracaoMedia: '14 meses' },
    ],
    familia: [
      { tribunal: 'TJSP', favoravel: 60, desfavoravel: 22, parcial: 18, valorMedio: 5000, duracaoMedia: '8 meses' },
      { tribunal: 'TJRJ', favoravel: 58, desfavoravel: 24, parcial: 18, valorMedio: 4500, duracaoMedia: '10 meses' },
      { tribunal: 'TJMG', favoravel: 55, desfavoravel: 25, parcial: 20, valorMedio: 4000, duracaoMedia: '9 meses' },
      { tribunal: 'TRT2', favoravel: 40, desfavoravel: 35, parcial: 25, valorMedio: 3000, duracaoMedia: '7 meses' },
      { tribunal: 'TRF3', favoravel: 50, desfavoravel: 28, parcial: 22, valorMedio: 6000, duracaoMedia: '12 meses' },
    ],
    penal: [
      { tribunal: 'TJSP', favoravel: 32, desfavoravel: 55, parcial: 13, valorMedio: 0, duracaoMedia: '24 meses' },
      { tribunal: 'TJRJ', favoravel: 28, desfavoravel: 60, parcial: 12, valorMedio: 0, duracaoMedia: '26 meses' },
      { tribunal: 'TJMG', favoravel: 35, desfavoravel: 50, parcial: 15, valorMedio: 0, duracaoMedia: '22 meses' },
      { tribunal: 'TRT2', favoravel: 25, desfavoravel: 60, parcial: 15, valorMedio: 0, duracaoMedia: '20 meses' },
      { tribunal: 'TRF3', favoravel: 30, desfavoravel: 55, parcial: 15, valorMedio: 0, duracaoMedia: '28 meses' },
    ],
    empresarial: [
      { tribunal: 'TJSP', favoravel: 58, desfavoravel: 28, parcial: 14, valorMedio: 250000, duracaoMedia: '24 meses' },
      { tribunal: 'TJRJ', favoravel: 55, desfavoravel: 30, parcial: 15, valorMedio: 200000, duracaoMedia: '26 meses' },
      { tribunal: 'TJMG', favoravel: 50, desfavoravel: 32, parcial: 18, valorMedio: 180000, duracaoMedia: '22 meses' },
      { tribunal: 'TRT2', favoravel: 45, desfavoravel: 35, parcial: 20, valorMedio: 150000, duracaoMedia: '20 meses' },
      { tribunal: 'TRF3', favoravel: 52, desfavoravel: 30, parcial: 18, valorMedio: 300000, duracaoMedia: '30 meses' },
    ],
    previdenciario: [
      { tribunal: 'TJSP', favoravel: 48, desfavoravel: 35, parcial: 17, valorMedio: 60000, duracaoMedia: '20 meses' },
      { tribunal: 'TJRJ', favoravel: 52, desfavoravel: 30, parcial: 18, valorMedio: 55000, duracaoMedia: '22 meses' },
      { tribunal: 'TJMG', favoravel: 50, desfavoravel: 32, parcial: 18, valorMedio: 48000, duracaoMedia: '18 meses' },
      { tribunal: 'TRT2', favoravel: 42, desfavoravel: 38, parcial: 20, valorMedio: 40000, duracaoMedia: '16 meses' },
      { tribunal: 'TRF3', favoravel: 68, desfavoravel: 20, parcial: 12, valorMedio: 75000, duracaoMedia: '24 meses' },
    ],
  };

  const data = baseData[area] || baseData.civil;
  return data.map((stat) => ({
    ...stat,
    favoravel: Math.min(95, Math.max(10, stat.favoravel + ((seed * 3) % 7) - 3)),
    desfavoravel: Math.min(80, Math.max(5, stat.desfavoravel + ((seed * 2) % 5) - 2)),
  }));
}

// ─── SVG Charts ───────────────────────────────────────────────────────────────

function AreaSuccessBarChart() {
  const maxRate = 100;
  const BAR_HEIGHT = 22;
  const GAP = 10;
  const LABEL_WIDTH = 180;
  const BAR_MAX_WIDTH = 220;
  const chartHeight = AREA_SUCCESS_RATES.length * (BAR_HEIGHT + GAP);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${LABEL_WIDTH + BAR_MAX_WIDTH + 80} ${chartHeight}`}
      className="w-full"
    >
      {AREA_SUCCESS_RATES.map((item, i) => {
        const y = i * (BAR_HEIGHT + GAP);
        const barWidth = (item.rate / maxRate) * BAR_MAX_WIDTH;
        const barColor = item.rate >= 65 ? '#22c55e' : item.rate >= 45 ? '#f59e0b' : '#ef4444';
        const textColor = item.rate >= 65 ? '#4ade80' : item.rate >= 45 ? '#fbbf24' : '#f87171';

        return (
          <g key={item.area}>
            <text
              x={LABEL_WIDTH - 8}
              y={y + BAR_HEIGHT / 2 + 4}
              textAnchor="end"
              fontSize="11"
              fill="#6b7a8d"
            >
              {item.area}
            </text>
            {/* Background */}
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={BAR_MAX_WIDTH}
              height={BAR_HEIGHT}
              rx="4"
              fill="#1a2332"
            />
            {/* Filled */}
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={barWidth}
              height={BAR_HEIGHT}
              rx="4"
              fill={barColor}
              opacity="0.8"
            />
            {/* Rate label */}
            <text
              x={LABEL_WIDTH + barWidth + 6}
              y={y + BAR_HEIGHT / 2 + 4}
              fontSize="12"
              fontWeight="bold"
              fill={textColor}
            >
              {item.rate}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DurationBarChart() {
  const maxMonths = 50;
  const BAR_HEIGHT = 20;
  const GAP = 10;
  const LABEL_WIDTH = 60;
  const BAR_MAX_WIDTH = 260;
  const chartHeight = TRIBUNAL_DURATION.length * (BAR_HEIGHT + GAP);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${LABEL_WIDTH + BAR_MAX_WIDTH + 80} ${chartHeight}`}
      className="w-full"
    >
      {TRIBUNAL_DURATION.map((item, i) => {
        const y = i * (BAR_HEIGHT + GAP);
        const barWidth = (item.avgMonths / maxMonths) * BAR_MAX_WIDTH;
        const barColor = item.avgMonths <= 14 ? '#22c55e' : item.avgMonths <= 24 ? '#f59e0b' : '#ef4444';

        return (
          <g key={item.tribunal}>
            <text
              x={LABEL_WIDTH - 6}
              y={y + BAR_HEIGHT / 2 + 4}
              textAnchor="end"
              fontSize="11"
              fontWeight="600"
              fill="#c0c8d4"
            >
              {item.tribunal}
            </text>
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={BAR_MAX_WIDTH}
              height={BAR_HEIGHT}
              rx="4"
              fill="#1a2332"
            />
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={barWidth}
              height={BAR_HEIGHT}
              rx="4"
              fill={barColor}
              opacity="0.7"
            />
            <text
              x={LABEL_WIDTH + barWidth + 6}
              y={y + BAR_HEIGHT / 2 + 4}
              fontSize="11"
              fill="#6b7a8d"
            >
              {item.avgMonths}m
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function OutcomePieChart({ favorable, partial, unfavorable }: { favorable: number; partial: number; unfavorable: number }) {
  const total = favorable + partial + unfavorable;
  const cx = 70;
  const cy = 70;
  const r = 55;

  function polarToXY(deg: number, radius: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function makeArc(startDeg: number, endDeg: number, color: string, key: string) {
    if (endDeg - startDeg <= 0) return null;
    const isLarge = endDeg - startDeg > 180 ? 1 : 0;
    const start = polarToXY(startDeg, r);
    const end = polarToXY(endDeg, r);
    return (
      <path
        key={key}
        d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${isLarge} 1 ${end.x} ${end.y} Z`}
        fill={color}
        opacity="0.85"
      />
    );
  }

  const favDeg = (favorable / total) * 360;
  const parcDeg = (partial / total) * 360;
  const desfDeg = (unfavorable / total) * 360;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {makeArc(0, favDeg, '#22c55e', 'fav')}
      {makeArc(favDeg, favDeg + parcDeg, '#f59e0b', 'parc')}
      {makeArc(favDeg + parcDeg, favDeg + parcDeg + desfDeg, '#ef4444', 'desf')}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#0a0f1a" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#f59e0b">
        {favorable}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7a8d">
        Favoravel
      </text>
    </svg>
  );
}

// ─── AI Prediction Panel ─────────────────────────────────────────────────────

interface AiPrediction {
  successProbability: number;
  avgDuration: string;
  recommendedTribunal: string;
  keyRisks: string[];
  keyStrengths: string[];
  recommendation: string;
}

function AiPredictionPanel({ area, tipoAcao }: { area: string; tipoAcao: string }) {
  const [description, setDescription] = useState('');
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePredict() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/legal/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'similarity',
          description: `Área: ${area}. Tipo: ${tipoAcao}. Caso: ${description}`,
          area,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${response.status}`);
      }

      const data = await response.json();

      // Build a prediction from similarity results
      const results = data.results || [];
      const avgSimilarity = results.length > 0
        ? results.reduce((s: number, r: { similarityScore: number }) => s + r.similarityScore, 0) / results.length
        : 55;

      setPrediction({
        successProbability: Math.round(Math.min(95, Math.max(10, avgSimilarity * 0.9 + 10))),
        avgDuration: '14-18 meses',
        recommendedTribunal: 'TJSP',
        keyRisks: results.slice(0, 2).map((r: { keyDifferences: string[] }) => r.keyDifferences?.[0] || 'Risco identificado'),
        keyStrengths: results.slice(0, 2).map((r: { matchingFactors: string[] }) => r.matchingFactors?.[0] || 'Fator favoravel'),
        recommendation: data.recommendation || 'Analise baseada em casos similares. Consulte um especialista.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar previsao');
    } finally {
      setLoading(false);
    }
  }

  const probColor = prediction
    ? prediction.successProbability >= 65 ? 'text-green-400'
      : prediction.successProbability >= 45 ? 'text-amber-400'
        : 'text-red-400'
    : 'text-white';

  const probBar = prediction
    ? prediction.successProbability >= 65 ? 'bg-green-500'
      : prediction.successProbability >= 45 ? 'bg-amber-500'
        : 'bg-red-500'
    : 'bg-[#6b7a8d]';

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-400">Previsao de Resultado por IA</h3>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os fatos do caso para previsao de resultado (ex: empresa recusou cobertura de tratamento oncologico, paciente possui plano ha 5 anos)..."
            className="w-full rounded-lg bg-[#0a0f1a] border border-amber-500/30 px-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/60 resize-none"
            rows={3}
          />
        </div>
      </div>

      <button
        onClick={handlePredict}
        disabled={loading || !description.trim()}
        className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Analisando...' : 'Prever Resultado'}
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {prediction && (
        <div className="space-y-4">
          {/* Probability */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6b7a8d]">Probabilidade de Exito</span>
              <span className={`text-2xl font-bold ${probColor}`}>{prediction.successProbability}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#1a2332]">
              <div
                className={`h-2.5 rounded-full ${probBar} transition-all`}
                style={{ width: `${prediction.successProbability}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Strengths */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Pontos Fortes</h4>
              <ul className="space-y-1.5">
                {prediction.keyStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#c0c8d4] flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Riscos</h4>
              <ul className="space-y-1.5">
                {prediction.keyRisks.map((r, i) => (
                  <li key={i} className="text-xs text-[#c0c8d4] flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">-</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
            <p className="text-xs font-semibold text-amber-400 mb-1">Recomendacao Estrategica</p>
            <p className="text-sm text-[#c0c8d4]">{prediction.recommendation}</p>
          </div>

          <p className="text-[10px] text-[#6b7a8d]">
            Previsao baseada em analise de casos similares. Nao constitui garantia de resultado.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── AI Jurimetric Analysis Panel ────────────────────────────────────────────

function AIJurimetricAnalysis() {
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (!analysisQuery.trim()) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Faça uma análise jurimetrica sobre: ${analysisQuery}. Inclua: taxa de sucesso estimada por tipo de ação, tempo médio de tramitação, tribunais mais favoráveis, argumentos mais eficazes, e tendências recentes da jurisprudência.`,
            },
          ],
          taskType: 'strategy_analysis',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setAnalysisResult(data.content || data.message || '');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro ao gerar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  function renderMarkdown(text: string) {
    return text.split('\n').map((line, i) => {
      // Bold text: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      if (line.trim() === '') return <br key={i} />;
      return (
        <p key={i} className="text-sm text-[#c0c8d4] leading-relaxed mb-1">
          {parts}
        </p>
      );
    });
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-400">Análise Jurimetrica com IA</h3>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
          Tema ou Área para Análise
        </label>
        <textarea
          value={analysisQuery}
          onChange={(e) => setAnalysisQuery(e.target.value)}
          placeholder="Digite o tema ou área para análise jurimetrica (ex: dano moral por negativação indevida, rescisão contratual por inadimplemento, plano de saúde e tratamento oncológico)..."
          className="w-full rounded-lg bg-[#0a0f1a] border border-amber-500/30 px-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/60 resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleAnalysis}
        disabled={analyzing || !analysisQuery.trim()}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {analyzing ? 'Analisando...' : 'Analisar com IA'}
      </button>

      {analysisError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{analysisError}</p>
        </div>
      )}

      {analyzing && !analysisResult && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 rounded bg-[#1a2332]" style={{ width: `${70 + i * 5}%` }} />
              <div className="h-3 rounded bg-[#1a2332]" style={{ width: `${50 + i * 7}%` }} />
            </div>
          ))}
        </div>
      )}

      {analysisResult && !analyzing && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-5 space-y-1">
          {renderMarkdown(analysisResult)}
          <p className="text-[10px] text-[#6b7a8d] pt-3 border-t border-[#1a2332] mt-3">
            Análise gerada por IA. Não constitui parecer jurídico. Consulte sempre um profissional habilitado.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── AI Usage Stats ───────────────────────────────────────────────────────────

interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  records: { task_type: string; model: string; tokens_used: number; cost_usd: number; created_at: string }[];
  byTaskType: Record<string, { count: number; tokens: number; cost: number }>;
  byModel: Record<string, { count: number; tokens: number; cost: number }>;
}

function AIUsageStats() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingUsage(true);
    fetch('/api/ai/usage?days=30')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.message || data.error);
        setUsage(data as UsageSummary);
      })
      .catch((err) => setUsageError(err.message))
      .finally(() => setLoadingUsage(false));
  }, []);

  const totalQueries = usage ? usage.records.length : 0;
  const topTaskTypes = usage
    ? Object.entries(usage.byTaskType)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
    : [];
  const topModels = usage
    ? Object.entries(usage.byModel)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
    : [];
  const maxCount = topTaskTypes.length > 0 ? topTaskTypes[0][1].count : 1;

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="h-5 w-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Uso de IA — Últimos 30 Dias</h3>
      </div>

      {loadingUsage && (
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
              <div className="h-3 w-20 rounded bg-[#1a2332] mb-2" />
              <div className="h-6 w-16 rounded bg-[#1a2332]" />
            </div>
          ))}
        </div>
      )}

      {usageError && !loadingUsage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{usageError}</p>
        </div>
      )}

      {usage && !loadingUsage && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Consultas</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalQueries.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">requisições totais</p>
            </div>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Tokens</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {usage.totalTokens >= 1000
                  ? `${(usage.totalTokens / 1000).toFixed(1)}k`
                  : usage.totalTokens.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">tokens consumidos</p>
            </div>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Custo</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${usage.totalCost.toFixed(4)}
              </p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">custo estimado (USD)</p>
            </div>
          </div>

          {/* Task type breakdown bar chart */}
          {topTaskTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider mb-3">Por Tipo de Tarefa</h4>
              <div className="space-y-2.5">
                {topTaskTypes.map(([taskType, stats]) => (
                  <div key={taskType}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#c0c8d4] capitalize">{taskType.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-semibold text-amber-400">{stats.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1a2332]">
                      <div
                        className="h-2 rounded-full bg-amber-500 transition-all"
                        style={{ width: `${(stats.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model breakdown */}
          {topModels.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider mb-3">Por Modelo</h4>
              <div className="flex flex-wrap gap-2">
                {topModels.map(([model, stats]) => (
                  <div
                    key={model}
                    className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 flex items-center gap-2"
                  >
                    <Bot className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs text-white">{model}</span>
                    <span className="text-xs text-[#6b7a8d]">{stats.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalQueries === 0 && (
            <p className="text-sm text-[#6b7a8d] text-center py-4">Nenhuma consulta registrada nos últimos {30} dias.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JurimetriaPage() {
  const [area, setArea] = useState('civil');
  const [tipoAcao, setTipoAcao] = useState('indenizacao');
  const [activeTab, setActiveTab] = useState<'tribunais' | 'areas' | 'duracao' | 'predicao' | 'analise'>('tribunais');

  const stats = useMemo(() => getMockStats(area, tipoAcao), [area, tipoAcao]);
  const areaLabel = AREAS.find((a) => a.value === area)?.label || area;
  const tipoLabel = TIPOS_ACAO.find((t) => t.value === tipoAcao)?.label || tipoAcao;

  // Aggregate stats for the current area
  const avgFav = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.favoravel, 0) / stats.length) : 0;
  const avgParcial = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.parcial, 0) / stats.length) : 0;
  const avgDesf = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.desfavoravel, 0) / stats.length) : 0;
  const avgValor = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.valorMedio, 0) / stats.length) : 0;

  const TABS = [
    { id: 'tribunais', label: 'Por Tribunal' },
    { id: 'areas', label: 'Por Area' },
    { id: 'duracao', label: 'Duracao' },
    { id: 'predicao', label: 'Predicao IA' },
    { id: 'analise', label: 'Analise IA' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Jurimetria"
        subtitle="Analise estatistica e previsao de resultados baseada em dados dos tribunais brasileiros"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Jurimetria', href: '/legal/jurimetria' },
        ]}
      />

      {/* Filters */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Filtros de Pesquisa</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">Area do Direito</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">Tipo de Acao</label>
            <select
              value={tipoAcao}
              onChange={(e) => setTipoAcao(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {TIPOS_ACAO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa Favoravel</span>
          </div>
          <p className={`text-3xl font-bold ${avgFav >= 65 ? 'text-green-400' : avgFav >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgFav}%
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">Media dos tribunais</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Valor Medio</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {avgValor > 0
              ? avgValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
              : 'N/A'}
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">Condenacao media</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Parcial</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{avgParcial}%</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Procedencia parcial</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-red-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Desfavoravel</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{avgDesf}%</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Improcedencia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#1a2332] bg-[#0d1320] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'tribunais' && (
        <JurimetriaPanel stats={stats} area={areaLabel} tipoAcao={tipoLabel} />
      )}

      {activeTab === 'areas' && (
        <div className="space-y-6">
          {/* Outcome pie + area bar side-by-side on large */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart for current filters */}
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Distribuicao de Resultados — {areaLabel}
              </h3>
              <div className="flex items-center gap-6">
                <OutcomePieChart favorable={avgFav} partial={avgParcial} unfavorable={avgDesf} />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-green-500" />
                    <span className="text-sm text-[#c0c8d4]">Favoravel</span>
                    <span className="text-sm font-bold text-green-400 ml-auto">{avgFav}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-amber-500" />
                    <span className="text-sm text-[#c0c8d4]">Parcial</span>
                    <span className="text-sm font-bold text-amber-400 ml-auto">{avgParcial}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-red-500" />
                    <span className="text-sm text-[#c0c8d4]">Desfavoravel</span>
                    <span className="text-sm font-bold text-red-400 ml-auto">{avgDesf}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top performing areas */}
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                Areas com Maior Exito
              </h3>
              <div className="space-y-3">
                {TOP_AREAS.map((item) => (
                  <div key={item.area} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.trend === 'up' ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      ) : item.trend === ('down' as string) ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-[#6b7a8d] flex-shrink-0" />
                      )}
                      <span className="text-sm text-[#c0c8d4] truncate">{item.area}</span>
                    </div>
                    <span className="text-sm font-bold text-green-400 ml-3 flex-shrink-0">{item.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Area success rates bar chart */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h3 className="text-sm font-semibold text-white mb-5">
              Taxa de Exito por Area do Direito (Todos os Tribunais)
            </h3>
            <AreaSuccessBarChart />
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1a2332]">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-xs text-[#6b7a8d]">Acima de 65%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-500" />
                <span className="text-xs text-[#6b7a8d]">45% - 65%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-xs text-[#6b7a8d]">Abaixo de 45%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'duracao' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Duracao Media por Tribunal (meses)
            </h3>
            <DurationBarChart />
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1a2332]">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-xs text-[#6b7a8d]">Ate 14 meses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-500" />
                <span className="text-xs text-[#6b7a8d]">14 - 24 meses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-xs text-[#6b7a8d]">Acima de 24 meses</span>
              </div>
            </div>
          </div>

          {/* Duration vs Success cross-analysis */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Custo-Beneficio por Tribunal</h3>
            <div className="space-y-3">
              {stats.map((stat) => {
                const durationNum = parseInt(stat.duracaoMedia);
                const roi = stat.valorMedio > 0 ? ((stat.favoravel / 100) * stat.valorMedio) / (durationNum * 500) : 0;
                return (
                  <div key={stat.tribunal} className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{stat.tribunal}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#6b7a8d]">Duracao: <span className="text-white">{stat.duracaoMedia}</span></span>
                        {stat.valorMedio > 0 && (
                          <span className="text-[#6b7a8d]">Valor: <span className="text-white">{stat.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span></span>
                        )}
                        {roi > 0 && (
                          <span className="text-amber-400 font-medium">ROI: {roi.toFixed(1)}x</span>
                        )}
                      </div>
                    </div>
                    <div className="flex h-3 rounded overflow-hidden">
                      <div className="bg-green-500" style={{ width: `${stat.favoravel}%` }} />
                      <div className="bg-amber-500" style={{ width: `${stat.parcial}%` }} />
                      <div className="bg-red-500" style={{ width: `${stat.desfavoravel}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'predicao' && (
        <AiPredictionPanel area={areaLabel} tipoAcao={tipoLabel} />
      )}

      {activeTab === 'analise' && (
        <AIJurimetricAnalysis />
      )}

      {/* AI Usage Stats — always shown at the bottom */}
      <AIUsageStats />
    </div>
  );
}
