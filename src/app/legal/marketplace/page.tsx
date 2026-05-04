'use client';

import { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Star,
  Download,
  Eye,
  Filter,
  Plus,
  Gift,
  Sparkles,
  FileText,
  Briefcase,
  Users,
  Building2,
  Shield,
  Gavel,
  Heart,
  ChevronDown,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketplacePetition {
  id: string;
  title: string;
  area: string;
  areaBadgeColor: string;
  type: string;
  author: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  description: string;
  tags: string[];
  createdAt: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PETITIONS: MarketplacePetition[] = [
  {
    id: '1',
    title: 'Contestacao - Acao de Cobranca Indevida',
    area: 'Consumidor',
    areaBadgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    type: 'Contestacao',
    author: 'Dra. Maria Silva',
    rating: 4.8,
    reviewCount: 124,
    downloads: 1842,
    description: 'Modelo completo de contestacao para acoes de cobranca indevida com fundamentacao no CDC.',
    tags: ['CDC', 'cobranca', 'dano moral'],
    createdAt: '2025-08-15',
  },
  {
    id: '2',
    title: 'Peticao Inicial - Revisional de Contrato Bancario',
    area: 'Civil',
    areaBadgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    type: 'Inicial',
    author: 'Dr. Carlos Mendes',
    rating: 4.6,
    reviewCount: 89,
    downloads: 1356,
    description: 'Inicial revisional com pedido de recalculo de juros, anatocismo e comissao de permanencia.',
    tags: ['bancario', 'revisional', 'juros'],
    createdAt: '2025-09-02',
  },
  {
    id: '3',
    title: 'Reclamacao Trabalhista - Verbas Rescisorias',
    area: 'Trabalhista',
    areaBadgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    type: 'Inicial',
    author: 'Dr. Roberto Alves',
    rating: 4.9,
    reviewCount: 203,
    downloads: 2891,
    description: 'Reclamacao trabalhista completa para cobranca de verbas rescisorias nao pagas na rescisao.',
    tags: ['rescisao', 'FGTS', 'aviso previo'],
    createdAt: '2025-07-20',
  },
  {
    id: '4',
    title: 'Mandado de Seguranca - Ato Administrativo',
    area: 'Administrativo',
    areaBadgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    type: 'Mandado de Seguranca',
    author: 'Dra. Ana Beatriz',
    rating: 4.7,
    reviewCount: 67,
    downloads: 945,
    description: 'MS com pedido liminar contra ato administrativo ilegal com abuso de poder.',
    tags: ['mandado', 'liminar', 'administrativo'],
    createdAt: '2025-10-05',
  },
  {
    id: '5',
    title: 'Habeas Corpus - Prisao Preventiva',
    area: 'Penal',
    areaBadgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    type: 'Habeas Corpus',
    author: 'Dr. Fernando Costa',
    rating: 4.5,
    reviewCount: 156,
    downloads: 2103,
    description: 'HC contra decreto de prisao preventiva com argumentacao sobre desproporcionalidade.',
    tags: ['HC', 'prisao', 'liberdade'],
    createdAt: '2025-06-18',
  },
  {
    id: '6',
    title: 'Acao de Divorcio Litigioso com Partilha',
    area: 'Familia',
    areaBadgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    type: 'Inicial',
    author: 'Dra. Patricia Lima',
    rating: 4.4,
    reviewCount: 78,
    downloads: 1120,
    description: 'Acao de divorcio litigioso com pedido de partilha de bens, guarda e alimentos.',
    tags: ['divorcio', 'partilha', 'alimentos'],
    createdAt: '2025-11-01',
  },
  {
    id: '7',
    title: 'Recurso Especial - Responsabilidade Civil',
    area: 'Civil',
    areaBadgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    type: 'Recurso Especial',
    author: 'Dr. Henrique Rocha',
    rating: 4.3,
    reviewCount: 45,
    downloads: 678,
    description: 'REsp com prequestionamento sobre quantum indenizatorio e responsabilidade objetiva.',
    tags: ['REsp', 'STJ', 'responsabilidade civil'],
    createdAt: '2025-09-22',
  },
  {
    id: '8',
    title: 'Defesa Administrativa - Auto de Infracao Tributario',
    area: 'Tributario',
    areaBadgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    type: 'Defesa Administrativa',
    author: 'Dra. Luciana Ferreira',
    rating: 4.7,
    reviewCount: 92,
    downloads: 1487,
    description: 'Impugnacao administrativa contra auto de infracao com argumentacao sobre decadencia.',
    tags: ['tributario', 'auto de infracao', 'decadencia'],
    createdAt: '2025-08-30',
  },
];

const AREA_FILTERS = [
  'Todas',
  'Civil',
  'Trabalhista',
  'Tributario',
  'Penal',
  'Administrativo',
  'Consumidor',
  'Familia',
];

const TYPE_FILTERS = [
  'Todos',
  'Inicial',
  'Contestacao',
  'Recurso Especial',
  'Mandado de Seguranca',
  'Habeas Corpus',
  'Defesa Administrativa',
];

const RATING_FILTERS = [
  { label: 'Qualquer', value: 0 },
  { label: '4+ estrelas', value: 4 },
  { label: '4.5+ estrelas', value: 4.5 },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filteredPetitions = useMemo(() => {
    return MOCK_PETITIONS.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.author.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (areaFilter !== 'Todas' && p.area !== areaFilter) return false;
      if (typeFilter !== 'Todos' && p.type !== typeFilter) return false;
      if (ratingFilter > 0 && p.rating < ratingFilter) return false;
      return true;
    });
  }, [searchQuery, areaFilter, typeFilter, ratingFilter]);

  function renderStars(rating: number) {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.3;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        );
      } else if (i === full && hasHalf) {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400/50 text-amber-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="h-3.5 w-3.5 text-[#2a3342]" />
        );
      }
    }
    return stars;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Store className="h-7 w-7 text-amber-400" />
            Marketplace de Pecas Juridicas
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {MOCK_PETITIONS.length} pecas disponiveis - Compartilhe e reutilize modelos
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20">
          <Plus className="h-4 w-4" />
          Contribuir com Peca
        </button>
      </div>

      {/* Credits Banner */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
            <Gift className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Compartilhe suas pecas e ganhe creditos</h2>
            <p className="text-sm text-[#8899aa] mt-0.5">
              Cada peca aprovada rende creditos que podem ser usados para acessar modelos premium e funcionalidades exclusivas.
            </p>
          </div>
          <Sparkles className="h-20 w-20 text-amber-500/10 absolute -right-2 -top-2" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              type="text"
              placeholder="Buscar pecas por titulo, area, tags ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#1a2332] bg-[#0d1320] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
              showFilters
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-[#1a2332] bg-[#0d1320] text-[#6b7a8d] hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] uppercase tracking-wider mb-1.5">Area</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {AREA_FILTERS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] uppercase tracking-wider mb-1.5">Tipo</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {TYPE_FILTERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] uppercase tracking-wider mb-1.5">Avaliacao</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {RATING_FILTERS.map((r) => (
                  <option key={r.label} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-[#6b7a8d]">
        {filteredPetitions.length} {filteredPetitions.length === 1 ? 'resultado' : 'resultados'} encontrados
      </div>

      {/* Petition Cards Grid */}
      {filteredPetitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <FileText className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhuma peca encontrada com os filtros selecionados</p>
          <button
            onClick={() => { setSearchQuery(''); setAreaFilter('Todas'); setTypeFilter('Todos'); setRatingFilter(0); }}
            className="mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPetitions.map((petition) => (
            <div
              key={petition.id}
              className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-[#2a3342] transition-all group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                    {petition.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${petition.areaBadgeColor}`}>
                      {petition.area}
                    </span>
                    <span className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">
                      {petition.type}
                    </span>
                  </div>
                </div>
                <button className="flex-shrink-0 rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-[#8899aa] mb-3 line-clamp-2">
                {petition.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {petition.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-[#0a0f1a] px-2 py-0.5 text-[10px] text-[#6b7a8d] border border-[#1a2332]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1a2332]">
                <div className="flex items-center gap-3">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {renderStars(petition.rating)}
                    <span className="text-xs text-[#8899aa] ml-1">
                      {petition.rating} ({petition.reviewCount})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Downloads */}
                  <div className="flex items-center gap-1 text-xs text-[#6b7a8d]">
                    <Download className="h-3 w-3" />
                    <span>{petition.downloads.toLocaleString('pt-BR')}</span>
                  </div>

                  {/* Author */}
                  <span className="text-xs text-[#6b7a8d]">{petition.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
