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
  BarChart3,
} from 'lucide-react';

interface Precedent {
  id: string;
  ementa: string;
  court: string;
  courtBadge: string;
  theme: string;
  date: string;
  relator: string;
  similarity: number;
  number: string;
  area: string;
}

const MOCK_PRECEDENTS: Precedent[] = [
  {
    id: 'p1',
    number: 'REsp 1.234.567/SP',
    ementa: 'RECURSO ESPECIAL. DIREITO DIGITAL. LGPD. DANO MORAL. VAZAMENTO DE DADOS PESSOAIS. RESPONSABILIDADE OBJETIVA DO CONTROLADOR. QUANTUM INDENIZATORIO. Configura-se dano moral in re ipsa o vazamento de dados pessoais sensiveis por falha de seguranca do controlador, nos termos do art. 42 da Lei 13.709/2018.',
    court: 'STJ',
    courtBadge: 'STJ',
    theme: 'Protecao de Dados',
    date: '2025-11-15',
    relator: 'Min. Ricardo Villas Boas Cueva',
    similarity: 97,
    area: 'digital',
  },
  {
    id: 'p2',
    number: 'RE 1.037.396/SP',
    ementa: 'RECURSO EXTRAORDINARIO. RESPONSABILIDADE CIVIL. INTERNET. PROVEDORES DE APLICACAO. MARCO CIVIL DA INTERNET. ART. 19. CONSTITUCIONALIDADE. LIBERDADE DE EXPRESSAO. Repercussao geral reconhecida. A responsabilidade do provedor de aplicacao depende de descumprimento de ordem judicial especifica.',
    court: 'STF',
    courtBadge: 'STF',
    theme: 'Marco Civil',
    date: '2025-09-20',
    relator: 'Min. Dias Toffoli',
    similarity: 92,
    area: 'digital',
  },
  {
    id: 'p3',
    number: 'RR-0001234-56.2023.5.02.0001',
    ementa: 'RECURSO DE REVISTA. TELETRABALHO. CONTROLE DE JORNADA. HORAS EXTRAS. REFORMA TRABALHISTA. O empregado em regime de teletrabalho que esta sujeito a controle de jornada por meios telematicos faz jus ao pagamento de horas extras, nos termos do art. 62, III, da CLT.',
    court: 'TST',
    courtBadge: 'TST',
    theme: 'Teletrabalho',
    date: '2025-08-10',
    relator: 'Min. Maria Helena Mallmann',
    similarity: 88,
    area: 'trabalhista',
  },
  {
    id: 'p4',
    number: 'ADI 7.066/DF',
    ementa: 'ACAO DIRETA DE INCONSTITUCIONALIDADE. DIREITO TRIBUTARIO. DIFAL ICMS. LEI COMPLEMENTAR 190/2022. ANTERIORIDADE. A cobranca do diferencial de aliquotas do ICMS nas operacoes interestaduais destinadas a consumidor final deve observar os principios da anterioridade anual e nonagesimal.',
    court: 'STF',
    courtBadge: 'STF',
    theme: 'Tributario',
    date: '2025-06-25',
    relator: 'Min. Alexandre de Moraes',
    similarity: 85,
    area: 'tributario',
  },
  {
    id: 'p5',
    number: 'REsp 2.056.789/RJ',
    ementa: 'RECURSO ESPECIAL. DIREITO DE FAMILIA. ALIENACAO PARENTAL. GUARDA COMPARTILHADA. MELHOR INTERESSE DA CRIANCA. A pratica de alienacao parental comprovada autoriza a alteracao da guarda em favor do genitor alienado, priorizando o melhor interesse da crianca e do adolescente.',
    court: 'STJ',
    courtBadge: 'STJ',
    theme: 'Familia',
    date: '2025-12-05',
    relator: 'Min. Nancy Andrighi',
    similarity: 82,
    area: 'familia',
  },
  {
    id: 'p6',
    number: 'TJSP 1098765-43.2024.8.26.0100',
    ementa: 'APELACAO. DIREITO DO CONSUMIDOR. PLANO DE SAUDE. NEGATIVA DE COBERTURA. TRATAMENTO ONCOLOGICO. ROL DA ANS. CARATER EXEMPLIFICATIVO. A negativa de cobertura de procedimento prescrito pelo medico assistente e abusiva quando fundamentada exclusivamente na ausencia do tratamento no rol da ANS.',
    court: 'TJSP',
    courtBadge: 'TJSP',
    theme: 'Consumidor',
    date: '2025-10-18',
    relator: 'Des. Francisco Loureiro',
    similarity: 79,
    area: 'consumidor',
  },
  {
    id: 'p7',
    number: 'REsp 1.998.456/MG',
    ementa: 'RECURSO ESPECIAL. DIREITO EMPRESARIAL. RECUPERACAO JUDICIAL. CRAM DOWN. APROVACAO DO PLANO. REQUISITOS DO ART. 58, PAR. 1, DA LEI 11.101/05. O juiz pode conceder a recuperacao judicial mesmo sem aprovacao de todas as classes de credores, desde que cumpridos os requisitos legais do cram down.',
    court: 'STJ',
    courtBadge: 'STJ',
    theme: 'Empresarial',
    date: '2025-07-30',
    relator: 'Min. Luis Felipe Salomao',
    similarity: 76,
    area: 'empresarial',
  },
  {
    id: 'p8',
    number: 'TJRJ 0054321-98.2024.8.19.0001',
    ementa: 'APELACAO CRIMINAL. CRIMES CIBERNETICOS. ESTELIONATO DIGITAL. ART. 171, PAR. 2-A, CP. FRAUDE ELETRONICA. COMPETENCIA. O crime de fraude eletronica praticado mediante envio de mensagem via aplicativo se consuma no local onde a vitima efetivamente realizou a transferencia bancaria.',
    court: 'TJRJ',
    courtBadge: 'TJRJ',
    theme: 'Penal',
    date: '2026-01-12',
    relator: 'Des. Paulo Rangel',
    similarity: 73,
    area: 'penal',
  },
  {
    id: 'p9',
    number: 'REsp 2.100.123/PR',
    ementa: 'RECURSO ESPECIAL. DIREITO AMBIENTAL. RESPONSABILIDADE CIVIL AMBIENTAL. TEORIA DO RISCO INTEGRAL. NEXO CAUSAL. AREA DE PRESERVACAO PERMANENTE. A responsabilidade civil por dano ambiental e objetiva e fundada na teoria do risco integral, sendo irrelevante a licitude da atividade.',
    court: 'STJ',
    courtBadge: 'STJ',
    theme: 'Ambiental',
    date: '2025-05-20',
    relator: 'Min. Herman Benjamin',
    similarity: 70,
    area: 'ambiental',
  },
  {
    id: 'p10',
    number: 'TRF3 5012345-67.2024.4.03.6100',
    ementa: 'APELACAO. DIREITO PREVIDENCIARIO. APOSENTADORIA ESPECIAL. ATIVIDADE INSALUBRE. RUIDO. AGENTE NOCIVO. EPI. EFICACIA. O fornecimento de EPI eficaz para neutralizar agente nocivo ruido acima de 85 dB nao descaracteriza o tempo de servico especial, conforme entendimento do STF no ARE 664.335.',
    court: 'TRF3',
    courtBadge: 'TRF3',
    theme: 'Previdenciario',
    date: '2026-02-08',
    relator: 'Des. Fed. Tania Marangoni',
    similarity: 67,
    area: 'previdenciario',
  },
];

const COURTS = ['Todos', 'STF', 'STJ', 'TST', 'TJSP', 'TJRJ', 'TRF3'];
const THEMES = ['Todos', 'Protecao de Dados', 'Marco Civil', 'Teletrabalho', 'Tributario', 'Familia', 'Consumidor', 'Empresarial', 'Penal', 'Ambiental', 'Previdenciario'];

const ITEMS_PER_PAGE = 5;

export default function PrecedentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState('Todos');
  const [themeFilter, setThemeFilter] = useState('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let results = MOCK_PRECEDENTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.ementa.toLowerCase().includes(q) ||
          p.number.toLowerCase().includes(q) ||
          p.relator.toLowerCase().includes(q) ||
          p.theme.toLowerCase().includes(q)
      );
    }

    if (courtFilter !== 'Todos') {
      results = results.filter((p) => p.court === courtFilter);
    }

    if (themeFilter !== 'Todos') {
      results = results.filter((p) => p.theme === themeFilter);
    }

    if (dateFrom) {
      results = results.filter((p) => p.date >= dateFrom);
    }

    if (dateTo) {
      results = results.filter((p) => p.date <= dateTo);
    }

    return results;
  }, [searchQuery, courtFilter, themeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function getSimilarityColor(score: number) {
    if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-[#6b7a8d] bg-[#1a2332] border-[#1a2332]';
  }

  function getCourtBadgeColor(court: string) {
    switch (court) {
      case 'STF': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'STJ': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'TST': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'TJSP': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TJRJ': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'TRF3': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-[#1a2332] text-[#6b7a8d] border-[#1a2332]';
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-amber-400" />
          Pesquisa de Jurisprudencia
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Busca inteligente em precedentes dos tribunais brasileiros
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
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
              value={themeFilter}
              onChange={(e) => { setThemeFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>{t === 'Todos' ? 'Todos os Temas' : t}</option>
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
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {paginated.map((precedent) => (
          <div
            key={precedent.id}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-[#2a3342] transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getCourtBadgeColor(precedent.court)}`}>
                  {precedent.courtBadge}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{precedent.number}</p>
                  <p className="text-xs text-[#6b7a8d] mt-0.5">{precedent.theme}</p>
                </div>
              </div>
              <div className={`rounded-lg border px-3 py-1.5 text-center ${getSimilarityColor(precedent.similarity)}`}>
                <p className="text-lg font-bold">{precedent.similarity}%</p>
                <p className="text-[9px] uppercase tracking-wider">Similaridade</p>
              </div>
            </div>

            <p className="text-sm text-[#c0c8d4] leading-relaxed mb-3">{precedent.ementa}</p>

            <div className="flex items-center gap-4 text-xs text-[#6b7a8d]">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{precedent.relator}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(precedent.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5" />
                <span className="capitalize">{precedent.area}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
            <Search className="h-8 w-8 text-[#6b7a8d] mx-auto mb-3" />
            <p className="text-sm text-[#6b7a8d]">Nenhum precedente encontrado com os filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg bg-[#1a2332] p-2 text-[#6b7a8d] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
          ))}
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
