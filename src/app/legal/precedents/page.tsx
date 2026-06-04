'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Scale,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { PrecedentResult, PrecedentFilters, Favorability } from '@/lib/legal-intelligence';
import { PageHeader, EmptyState } from '@/components/legal/shared';

// ─── Static mock data (always available) ────────────────────────────────────

interface StaticPrecedent extends PrecedentResult {
  id: string;
}

const STATIC_PRECEDENTS: StaticPrecedent[] = [
  {
    id: 'p1',
    caseNumber: 'REsp 1.234.567/SP',
    summary: 'RECURSO ESPECIAL. DIREITO DIGITAL. LGPD. DANO MORAL. VAZAMENTO DE DADOS PESSOAIS. Configura-se dano moral in re ipsa o vazamento de dados pessoais sensiveis por falha de seguranca do controlador, nos termos do art. 42 da Lei 13.709/2018.',
    relevanceScore: 97,
    favorability: 'favorable',
    tribunal: 'STJ',
    date: '2025-11-15',
    relator: 'Min. Ricardo Villas Boas Cueva',
    themes: ['LGPD', 'Dano Moral', 'Protecao de Dados'],
    area: 'digital',
  },
  {
    id: 'p2',
    caseNumber: 'RE 1.037.396/SP',
    summary: 'RECURSO EXTRAORDINARIO. RESPONSABILIDADE CIVIL. INTERNET. PROVEDORES DE APLICACAO. MARCO CIVIL DA INTERNET. A responsabilidade do provedor de aplicacao depende de descumprimento de ordem judicial especifica.',
    relevanceScore: 92,
    favorability: 'neutral',
    tribunal: 'STF',
    date: '2025-09-20',
    relator: 'Min. Dias Toffoli',
    themes: ['Marco Civil', 'Responsabilidade Civil', 'Internet'],
    area: 'digital',
  },
  {
    id: 'p3',
    caseNumber: 'RR-0001234-56.2023.5.02.0001',
    summary: 'RECURSO DE REVISTA. TELETRABALHO. CONTROLE DE JORNADA. HORAS EXTRAS. O empregado em regime de teletrabalho sujeito a controle por meios telematicos faz jus ao pagamento de horas extras.',
    relevanceScore: 88,
    favorability: 'favorable',
    tribunal: 'TST',
    date: '2025-08-10',
    relator: 'Min. Maria Helena Mallmann',
    themes: ['Teletrabalho', 'Horas Extras', 'CLT'],
    area: 'trabalhista',
  },
  {
    id: 'p4',
    caseNumber: 'ADI 7.066/DF',
    summary: 'ACAO DIRETA DE INCONSTITUCIONALIDADE. DIREITO TRIBUTARIO. DIFAL ICMS. A cobranca do diferencial de aliquotas deve observar os principios da anterioridade anual e nonagesimal.',
    relevanceScore: 85,
    favorability: 'favorable',
    tribunal: 'STF',
    date: '2025-06-25',
    relator: 'Min. Alexandre de Moraes',
    themes: ['ICMS', 'Tributario', 'Anterioridade'],
    area: 'tributario',
  },
  {
    id: 'p5',
    caseNumber: 'REsp 2.056.789/RJ',
    summary: 'RECURSO ESPECIAL. DIREITO DE FAMILIA. ALIENACAO PARENTAL. GUARDA COMPARTILHADA. A pratica de alienacao parental comprovada autoriza a alteracao da guarda em favor do genitor alienado.',
    relevanceScore: 82,
    favorability: 'favorable',
    tribunal: 'STJ',
    date: '2025-12-05',
    relator: 'Min. Nancy Andrighi',
    themes: ['Familia', 'Guarda', 'Alienacao Parental'],
    area: 'familia',
  },
  {
    id: 'p6',
    caseNumber: 'TJSP 1098765-43.2024.8.26.0100',
    summary: 'APELACAO. PLANO DE SAUDE. NEGATIVA DE COBERTURA. TRATAMENTO ONCOLOGICO. A negativa de cobertura de procedimento prescrito pelo medico e abusiva quando fundamentada na ausencia do tratamento no rol da ANS.',
    relevanceScore: 79,
    favorability: 'favorable',
    tribunal: 'TJSP',
    date: '2025-10-18',
    relator: 'Des. Francisco Loureiro',
    themes: ['Saude', 'Plano de Saude', 'Consumidor'],
    area: 'consumidor',
  },
  {
    id: 'p7',
    caseNumber: 'REsp 1.998.456/MG',
    summary: 'RECURSO ESPECIAL. RECUPERACAO JUDICIAL. CRAM DOWN. O juiz pode conceder a recuperacao judicial mesmo sem aprovacao de todas as classes de credores, desde que cumpridos os requisitos legais.',
    relevanceScore: 76,
    favorability: 'neutral',
    tribunal: 'STJ',
    date: '2025-07-30',
    relator: 'Min. Luis Felipe Salomao',
    themes: ['Recuperacao Judicial', 'Empresarial', 'Cram Down'],
    area: 'empresarial',
  },
  {
    id: 'p8',
    caseNumber: 'TRF3 5012345-67.2024.4.03.6100',
    summary: 'APELACAO. APOSENTADORIA ESPECIAL. RUIDO. EPI. O fornecimento de EPI eficaz para neutralizar agente nocivo nao descaracteriza o tempo de servico especial, conforme ARE 664.335.',
    relevanceScore: 67,
    favorability: 'favorable',
    tribunal: 'TRF3',
    date: '2026-02-08',
    relator: 'Des. Fed. Tania Marangoni',
    themes: ['Previdenciario', 'Aposentadoria Especial', 'EPI'],
    area: 'previdenciario',
  },
];

const COURTS = ['Todos', 'STF', 'STJ', 'TST', 'TJSP', 'TJRJ', 'TRF1', 'TRF2', 'TRF3', 'TRF4'];
const AREAS = ['Todas', 'civil', 'trabalhista', 'tributario', 'penal', 'consumidor', 'familia', 'empresarial', 'previdenciario', 'ambiental', 'digital', 'administrativo'];
const FAVORABILITIES: { value: string; label: string }[] = [
  { value: 'Todas', label: 'Todas' },
  { value: 'favorable', label: 'Favoravel' },
  { value: 'unfavorable', label: 'Desfavoravel' },
  { value: 'neutral', label: 'Neutro' },
];

const ITEMS_PER_PAGE = 5;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-12 rounded-lg bg-[#1a2332]" />
          <div>
            <div className="h-4 w-40 rounded bg-[#1a2332] mb-1" />
            <div className="h-3 w-24 rounded bg-[#1a2332]" />
          </div>
        </div>
        <div className="h-12 w-16 rounded-lg bg-[#1a2332]" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3 w-full rounded bg-[#1a2332]" />
        <div className="h-3 w-5/6 rounded bg-[#1a2332]" />
        <div className="h-3 w-4/6 rounded bg-[#1a2332]" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded bg-[#1a2332]" />
        <div className="h-3 w-20 rounded bg-[#1a2332]" />
      </div>
    </div>
  );
}

function FavorabilityBadge({ value }: { value: Favorability }) {
  if (value === 'favorable') {
    return (
      <div className="flex items-center gap-1 text-green-400">
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium">Favoravel</span>
      </div>
    );
  }
  if (value === 'unfavorable') {
    return (
      <div className="flex items-center gap-1 text-red-400">
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium">Desfavoravel</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[#6b7a8d]">
      <Minus className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium">Neutro</span>
    </div>
  );
}

function RelevanceBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-green-500' : score >= 65 ? 'bg-amber-500' : 'bg-[#6b7a8d]';
  const textColor = score >= 85 ? 'text-green-400' : score >= 65 ? 'text-amber-400' : 'text-[#6b7a8d]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1a2332]">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${textColor} w-10 text-right`}>{score}%</span>
    </div>
  );
}

function getCourtBadgeColor(court: string) {
  switch (court) {
    case 'STF': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'STJ': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'TST': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'TJSP': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'TJRJ': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'TRF1': case 'TRF2': case 'TRF3': case 'TRF4': case 'TRF5':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default: return 'bg-[#1a2332] text-[#6b7a8d] border-[#2a3342]';
  }
}

function PrecedentCard({ precedent }: { precedent: PrecedentResult & { id?: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-[#2a3342] transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold flex-shrink-0 ${getCourtBadgeColor(precedent.tribunal)}`}>
            {precedent.tribunal}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{precedent.caseNumber}</p>
            <p className="text-xs text-[#6b7a8d] mt-0.5 capitalize">{precedent.area}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-1.5">
            <p className="text-sm font-bold text-amber-400">{precedent.relevanceScore}%</p>
            <p className="text-[9px] text-[#6b7a8d] uppercase tracking-wider">Relevancia</p>
          </div>
        </div>
      </div>

      {/* Relevance bar */}
      <div className="mb-3">
        <RelevanceBar score={precedent.relevanceScore} />
      </div>

      {/* Summary */}
      <p className={`text-sm text-[#c0c8d4] leading-relaxed mb-3 ${!expanded ? 'line-clamp-3' : ''}`}>
        {precedent.summary}
      </p>

      {/* Themes */}
      {precedent.themes && precedent.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {precedent.themes.slice(0, expanded ? undefined : 3).map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-[#1a2332] border border-[#2a3342] px-2 py-0.5 text-[10px] text-[#6b7a8d]"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-[#6b7a8d]">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="truncate max-w-[160px]">{precedent.relator}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(precedent.date).toLocaleDateString('pt-BR')}</span>
          </div>
          <FavorabilityBadge value={precedent.favorability} />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-white hover:bg-[#2a3342] transition-colors flex-shrink-0"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Ver Detalhes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PrecedentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [favorabilityFilter, setFavorabilityFilter] = useState('Todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // AI search state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState<PrecedentResult[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isAiMode = aiResults !== null;

  // Filter static results
  const filteredStatic = useMemo(() => {
    let results = STATIC_PRECEDENTS as (PrecedentResult & { id: string })[];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.summary.toLowerCase().includes(q) ||
          p.caseNumber.toLowerCase().includes(q) ||
          p.relator.toLowerCase().includes(q) ||
          p.themes.some((t) => t.toLowerCase().includes(q)) ||
          p.area.toLowerCase().includes(q),
      );
    }
    if (courtFilter !== 'Todos') results = results.filter((p) => p.tribunal === courtFilter);
    if (areaFilter !== 'Todas') results = results.filter((p) => p.area === areaFilter);
    if (favorabilityFilter !== 'Todas') results = results.filter((p) => p.favorability === favorabilityFilter);
    if (dateFrom) results = results.filter((p) => p.date >= dateFrom);
    if (dateTo) results = results.filter((p) => p.date <= dateTo);

    return results;
  }, [searchQuery, courtFilter, areaFilter, favorabilityFilter, dateFrom, dateTo]);

  const displayResults: PrecedentResult[] = isAiMode ? aiResults : filteredStatic;
  const totalPages = Math.max(1, Math.ceil(displayResults.length / ITEMS_PER_PAGE));
  const paginated = displayResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  async function handleAiSearch() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setPage(1);

    try {
      const filters: PrecedentFilters = {};
      if (courtFilter !== 'Todos') filters.tribunal = courtFilter;
      if (areaFilter !== 'Todas') filters.area = areaFilter;
      if (favorabilityFilter !== 'Todas') filters.favorability = favorabilityFilter as Favorability;
      if (dateFrom || dateTo) filters.dateRange = { start: dateFrom || '2000-01-01', end: dateTo || new Date().toISOString().split('T')[0] };

      const response = await fetch('/api/legal/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search-precedents', query: aiQuery, filters }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${response.status}`);
      }

      const data = await response.json();
      setAiResults(data.results || []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao buscar precedentes');
    } finally {
      setAiLoading(false);
    }
  }

  function clearAiResults() {
    setAiResults(null);
    setAiError(null);
    setAiQuery('');
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Precedentes"
        subtitle="Busca inteligente em precedentes dos tribunais brasileiros"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Precedentes', href: '/legal/precedents' },
        ]}
      />

      {/* AI Search */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Busca Inteligente com IA</span>
          {isAiMode && (
            <button
              onClick={clearAiResults}
              className="ml-auto text-xs text-[#6b7a8d] hover:text-white border border-[#1a2332] rounded-lg px-3 py-1 transition-colors"
            >
              Limpar busca IA
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/60" />
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Descreva o caso juridico para busca por IA (ex: dano moral por vazamento de dados LGPD)..."
              className="w-full rounded-lg bg-[#0a0f1a] border border-amber-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <button
            onClick={handleAiSearch}
            disabled={aiLoading || !aiQuery.trim()}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? 'Buscando...' : 'Buscar com IA'}
          </button>
        </div>

        {aiError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{aiError}</p>
          </div>
        )}
      </div>

      {/* Standard Filters */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); if (isAiMode) clearAiResults(); }}
              placeholder="Buscar por ementa, numero, relator ou tema..."
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={courtFilter}
              onChange={(e) => { setCourtFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {COURTS.map((c) => (
                <option key={c} value={c}>{c === 'Todos' ? 'Todos os Tribunais' : c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={areaFilter}
              onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>{a === 'Todas' ? 'Todas as Areas' : a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={favorabilityFilter}
              onChange={(e) => { setFavorabilityFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {FAVORABILITIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#6b7a8d]" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-xs text-[#6b7a8d]">ate</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b7a8d]">
          {isAiMode ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">{displayResults.length}</span> resultado{displayResults.length !== 1 ? 's' : ''} encontrado{displayResults.length !== 1 ? 's' : ''} por IA
            </span>
          ) : (
            `${displayResults.length} resultado${displayResults.length !== 1 ? 's' : ''} encontrado${displayResults.length !== 1 ? 's' : ''}`
          )}
        </p>
      </div>

      {/* Skeleton Loading */}
      {aiLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results */}
      {!aiLoading && (
        <div className="space-y-4">
          {paginated.map((precedent, idx) => (
            <PrecedentCard key={(precedent as StaticPrecedent).id || `ai-${idx}`} precedent={precedent} />
          ))}

          {displayResults.length === 0 && (
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320]">
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="Nenhum precedente encontrado"
                description={
                  isAiMode
                    ? 'A busca por IA não retornou resultados. Tente reformular a consulta.'
                    : 'Tente ajustar os filtros ou use a busca por IA para resultados mais abrangentes.'
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!aiLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg bg-[#1a2332] p-2 text-[#6b7a8d] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-[#1a2332] text-[#6b7a8d] hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-[#1a2332] p-2 text-[#6b7a8d] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
