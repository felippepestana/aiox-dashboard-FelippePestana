'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Gavel,
  Search,
  MapPin,
  Scale,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface JudgeProfile {
  id: string;
  name: string;
  tribunal: string;
  vara: string;
  areas: string[];
  caseCount: number;
  sentiment: number; // 0-100
  favorableRate: number;
  avgDuration: string;
}

const MOCK_JUDGES: JudgeProfile[] = [
  {
    id: 'judge-1',
    name: 'Des. Maria Helena Diniz',
    tribunal: 'TJSP',
    vara: '2a Vara Civel',
    areas: ['Civil', 'Consumidor', 'Familia'],
    caseCount: 4280,
    sentiment: 72,
    favorableRate: 58,
    avgDuration: '14 meses',
  },
  {
    id: 'judge-2',
    name: 'Des. Paulo Roberto Gomes',
    tribunal: 'TJRJ',
    vara: '5a Vara Empresarial',
    areas: ['Empresarial', 'Recuperacao Judicial', 'Societario'],
    caseCount: 2150,
    sentiment: 65,
    favorableRate: 45,
    avgDuration: '18 meses',
  },
  {
    id: 'judge-3',
    name: 'Juiz Fed. Ana Claudia Torres',
    tribunal: 'TRF3',
    vara: '1a Vara Federal Tributaria',
    areas: ['Tributario', 'Administrativo', 'Previdenciario'],
    caseCount: 3620,
    sentiment: 80,
    favorableRate: 62,
    avgDuration: '22 meses',
  },
  {
    id: 'judge-4',
    name: 'Juiz Ricardo Souza Lima',
    tribunal: 'TRT2',
    vara: '12a Vara do Trabalho',
    areas: ['Trabalhista', 'Dano Moral', 'Acidente de Trabalho'],
    caseCount: 5100,
    sentiment: 55,
    favorableRate: 52,
    avgDuration: '10 meses',
  },
  {
    id: 'judge-5',
    name: 'Des. Fernanda Batista Neves',
    tribunal: 'TJSP',
    vara: '3a Camara de Direito Privado',
    areas: ['Civil', 'Digital', 'LGPD'],
    caseCount: 1890,
    sentiment: 88,
    favorableRate: 67,
    avgDuration: '16 meses',
  },
];

const TRIBUNALS = ['Todos', 'TJSP', 'TJRJ', 'TRF3', 'TRT2'];
const JUDGE_AREAS = ['Todas', 'Civil', 'Consumidor', 'Familia', 'Empresarial', 'Tributario', 'Trabalhista', 'Digital', 'Administrativo', 'Previdenciario'];

export default function JudgesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tribunalFilter, setTribunalFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todas');

  const filtered = useMemo(() => {
    let results = MOCK_JUDGES;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          j.vara.toLowerCase().includes(q) ||
          j.tribunal.toLowerCase().includes(q)
      );
    }

    if (tribunalFilter !== 'Todos') {
      results = results.filter((j) => j.tribunal === tribunalFilter);
    }

    if (areaFilter !== 'Todas') {
      results = results.filter((j) =>
        j.areas.some((a) => a.toLowerCase().includes(areaFilter.toLowerCase()))
      );
    }

    return results;
  }, [searchQuery, tribunalFilter, areaFilter]);

  function getSentimentColor(score: number) {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSentimentLabel(score: number) {
    if (score >= 75) return 'Favoravel';
    if (score >= 50) return 'Neutro';
    return 'Desfavoravel';
  }

  function getSentimentBarColor(score: number) {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Gavel className="h-7 w-7 text-amber-400" />
          Inteligencia de Magistrados
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Perfis, padroes de decisao e analise de magistrados
        </p>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, tribunal ou vara..."
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={tribunalFilter}
              onChange={(e) => setTribunalFilter(e.target.value)}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {TRIBUNALS.map((t) => (
                <option key={t} value={t}>{t === 'Todos' ? 'Todos os Tribunais' : t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {JUDGE_AREAS.map((a) => (
                <option key={a} value={a}>{a === 'Todas' ? 'Todas as Areas' : a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Magistrados Mapeados</p>
          <p className="text-2xl font-bold text-white mt-1">{MOCK_JUDGES.length}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Total de Processos</p>
          <p className="text-2xl font-bold text-white mt-1">
            {MOCK_JUDGES.reduce((s, j) => s + j.caseCount, 0).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Sentimento Medio</p>
          <p className="text-2xl font-bold text-white mt-1">
            {(MOCK_JUDGES.reduce((s, j) => s + j.sentiment, 0) / MOCK_JUDGES.length).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa Favoravel Media</p>
          <p className="text-2xl font-bold text-white mt-1">
            {(MOCK_JUDGES.reduce((s, j) => s + j.favorableRate, 0) / MOCK_JUDGES.length).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Judge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((judge) => (
          <Link
            key={judge.id}
            href={`/legal/judges/${judge.id}`}
            className="group rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {judge.name}
                </h3>
                <p className="text-xs text-[#6b7a8d] mt-0.5">{judge.vara}</p>
                <span className="inline-block rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d] mt-1">
                  {judge.tribunal}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#6b7a8d] group-hover:text-amber-400 transition-colors" />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {judge.areas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20"
                >
                  {area}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <BarChart3 className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Processos</p>
                <p className="text-sm font-semibold text-white">{judge.caseCount.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Favoravel</p>
                <p className="text-sm font-semibold text-white">{judge.favorableRate}%</p>
              </div>
              <div className="text-center">
                <Scale className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Duracao</p>
                <p className="text-sm font-semibold text-white">{judge.avgDuration}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#6b7a8d]">Sentimento</span>
                <span className={`text-xs font-medium ${getSentimentColor(judge.sentiment)}`}>
                  {getSentimentLabel(judge.sentiment)} ({judge.sentiment}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1a2332]">
                <div
                  className={`h-1.5 rounded-full ${getSentimentBarColor(judge.sentiment)}`}
                  style={{ width: `${judge.sentiment}%` }}
                />
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
            <Search className="h-8 w-8 text-[#6b7a8d] mx-auto mb-3" />
            <p className="text-sm text-[#6b7a8d]">Nenhum magistrado encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
