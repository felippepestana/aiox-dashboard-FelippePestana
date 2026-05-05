'use client';

import { useState } from 'react';
import {
  Bell,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';

// Mock publications for the placeholder
const MOCK_PUBLICATIONS = [
  {
    id: 'pub-1',
    source: 'DJE-SP',
    content:
      'INTIMACAO - Processo 1234567-89.2024.8.26.0100 - Fica intimado o advogado Dr. Silva para manifestacao no prazo de 15 dias uteis sobre os documentos juntados pela parte contraria.',
    publicationDate: '2026-04-09',
    isRead: false,
    matchedCnj: '1234567-89.2024.8.26.0100',
    matchedOab: 'OAB/SP 123.456',
  },
  {
    id: 'pub-2',
    source: 'DJE-SP',
    content:
      'DESPACHO - Processo 9876543-21.2024.8.26.0100 - Vistos. Defiro o pedido de tutela de urgencia. Cite-se a parte re para contestar no prazo legal.',
    publicationDate: '2026-04-08',
    isRead: true,
    matchedCnj: '9876543-21.2024.8.26.0100',
    matchedOab: 'OAB/SP 123.456',
  },
  {
    id: 'pub-3',
    source: 'DJE-RJ',
    content:
      'SENTENCA - Processo 5555555-55.2023.8.19.0001 - Julgo procedente o pedido para condenar a re ao pagamento de R$ 50.000,00 a titulo de danos morais.',
    publicationDate: '2026-04-07',
    isRead: false,
    matchedCnj: '5555555-55.2023.8.19.0001',
  },
  {
    id: 'pub-4',
    source: 'DJE-MG',
    content:
      'PAUTA DE JULGAMENTO - Processo 3333333-33.2024.8.13.0024 - Incluso na pauta de julgamento para o dia 15/04/2026 as 14h na 2a Camara Civel.',
    publicationDate: '2026-04-06',
    isRead: true,
    matchedCnj: '3333333-33.2024.8.13.0024',
  },
  {
    id: 'pub-5',
    source: 'DJE-SP',
    content:
      'CERTIDAO DE PUBLICACAO - Processo 7777777-77.2025.8.26.0100 - Certifico que a sentenca proferida nos autos foi disponibilizada no DJE em 05/04/2026.',
    publicationDate: '2026-04-05',
    isRead: false,
    matchedCnj: '7777777-77.2025.8.26.0100',
  },
];

export default function PublicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readState, setReadState] = useState<Record<string, boolean>>({});

  const publications = MOCK_PUBLICATIONS.filter((pub) => {
    const isRead = readState[pub.id] !== undefined ? readState[pub.id] : pub.isRead;
    if (showUnreadOnly && isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !pub.content.toLowerCase().includes(q) &&
        !(pub.matchedCnj || '').toLowerCase().includes(q) &&
        !pub.source.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  function toggleRead(id: string) {
    setReadState((prev) => {
      const currentPub = MOCK_PUBLICATIONS.find((p) => p.id === id);
      const currentRead = prev[id] !== undefined ? prev[id] : currentPub?.isRead || false;
      return { ...prev, [id]: !currentRead };
    });
  }

  function isRead(pub: (typeof MOCK_PUBLICATIONS)[0]): boolean {
    return readState[pub.id] !== undefined ? readState[pub.id] : pub.isRead;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bell className="h-7 w-7 text-amber-400" />
          Monitoramento de Publicacoes - DJE
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Acompanhamento de publicacoes nos Diarios de Justica Eletronicos
        </p>
      </div>

      {/* Phase 2 Notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Fase 2 - Integracao Pendente</p>
          <p className="text-xs text-[#6b7a8d] mt-1">
            Integracao com Diarios de Justica Eletronicos sera ativada na Fase 2. Os dados
            abaixo sao exemplos para demonstracao do layout.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por CNJ, conteudo ou fonte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showUnreadOnly
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
          }`}
        >
          {showUnreadOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showUnreadOnly ? 'Nao lidas' : 'Todas'}
        </button>
      </div>

      {/* Publications List */}
      {publications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Bell className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhuma publicacao encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {publications.map((pub) => {
            const read = isRead(pub);
            return (
              <div
                key={pub.id}
                className={`rounded-xl border bg-[#0d1320] p-5 transition-colors ${
                  read
                    ? 'border-[#1a2332]'
                    : 'border-amber-500/20 bg-amber-500/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                      {pub.source}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(pub.publicationDate)}
                    </div>
                    {!read && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400">
                        Nova
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleRead(pub.id)}
                    className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-white transition-colors"
                  >
                    {read ? 'Marcar nao lida' : 'Marcar lida'}
                  </button>
                </div>

                {pub.matchedCnj && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-mono">{pub.matchedCnj}</span>
                  </div>
                )}

                <p className="text-sm text-[#8899aa] leading-relaxed">{pub.content}</p>

                {pub.matchedOab && (
                  <div className="mt-3 pt-3 border-t border-[#1a2332] flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                    <ExternalLink className="h-3 w-3" />
                    Vinculado: {pub.matchedOab}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
