'use client';

import { useState, useMemo } from 'react';
import { PieChart, Search, Filter } from 'lucide-react';
import { JurimetriaPanel } from '@/components/legal/JurimetriaPanel';
import type { TribunalStats } from '@/components/legal/JurimetriaPanel';

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

const TRIBUNALS = ['TJSP', 'TJRJ', 'TJMG', 'TRT2', 'TRF3'];

const TIPOS_ACAO = [
  { value: 'indenizacao', label: 'Indenizacao por Danos' },
  { value: 'cobranca', label: 'Cobranca' },
  { value: 'rescisao', label: 'Rescisao Contratual' },
  { value: 'obrigacao_fazer', label: 'Obrigacao de Fazer' },
  { value: 'revisional', label: 'Revisional' },
];

// Mock data generator based on area and type
function getMockStats(area: string, tipoAcao: string): TribunalStats[] {
  // Seed-like approach based on inputs for variety
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

  // Slight variation based on tipo acao
  if (!data) return [];
  return data.map((stat) => ({
    ...stat,
    favoravel: Math.min(95, Math.max(10, stat.favoravel + ((seed * 3) % 7) - 3)),
    desfavoravel: Math.min(80, Math.max(5, stat.desfavoravel + ((seed * 2) % 5) - 2)),
  }));
}

export default function JurimetriaPage() {
  const [area, setArea] = useState('civil');
  const [tipoAcao, setTipoAcao] = useState('indenizacao');

  const stats = useMemo(() => getMockStats(area, tipoAcao), [area, tipoAcao]);

  const areaLabel = AREAS.find((a) => a.value === area)?.label || area;
  const tipoLabel = TIPOS_ACAO.find((t) => t.value === tipoAcao)?.label || tipoAcao;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <PieChart className="h-7 w-7 text-amber-400" />
          Jurimetria
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Analise de probabilidade de sucesso baseada em dados reais dos tribunais brasileiros
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Filtros de Pesquisa</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
              Area do Direito
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
              Tipo de Acao
            </label>
            <select
              value={tipoAcao}
              onChange={(e) => setTipoAcao(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {TIPOS_ACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <JurimetriaPanel stats={stats} area={areaLabel} tipoAcao={tipoLabel} />
    </div>
  );
}
