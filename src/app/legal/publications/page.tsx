'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';

export default function PublicationsPage() {
  const { movements, getProcessById, markMovementRead } = useLegalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const sortedMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((m) => {
        if (showUnreadOnly && m.isRead) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const process = getProcessById(m.processId);
          if (
            !m.description.toLowerCase().includes(q) &&
            !(process?.cnj || '').toLowerCase().includes(q) &&
            !m.source.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      });
  }, [movements, searchQuery, showUnreadOnly, getProcessById]);

  const unreadCount = movements.filter((m) => !m.isRead).length;

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const sourceBadge: Record<string, string> = {
    manual: 'bg-gray-500/10 text-gray-400',
    dje: 'bg-amber-500/10 text-amber-400',
    pje: 'bg-blue-500/10 text-blue-400',
    datajud: 'bg-emerald-500/10 text-emerald-400',
    esaj: 'bg-purple-500/10 text-purple-400',
    eproc: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bell className="h-7 w-7 text-amber-400" />
          Movimentações e Publicações
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          {movements.length} movimentações registradas
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
              {unreadCount} não lidas
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por CNJ, conteúdo ou fonte..."
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
          {showUnreadOnly ? 'Não lidas' : 'Todas'}
        </button>
      </div>

      {/* Movements List */}
      {sortedMovements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Bell className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">
            {showUnreadOnly ? 'Nenhuma movimentação não lida' : 'Nenhuma movimentação registrada'}
          </p>
          <p className="text-xs text-[#4a5568] mt-2">
            Movimentações aparecem aqui quando processos são cadastrados e sincronizados
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMovements.map((mov) => {
            const process = getProcessById(mov.processId);
            return (
              <div
                key={mov.id}
                className={`rounded-xl border bg-[#0d1320] p-5 transition-colors ${
                  mov.isRead
                    ? 'border-[#1a2332]'
                    : 'border-amber-500/20 bg-amber-500/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadge[mov.source] || sourceBadge.manual}`}>
                      {mov.source.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(mov.date)}
                    </div>
                    {mov.type && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400">
                        {mov.type}
                      </span>
                    )}
                    {!mov.isRead && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                        Nova
                      </span>
                    )}
                  </div>
                  {!mov.isRead && (
                    <button
                      onClick={() => markMovementRead(mov.id)}
                      className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-white transition-colors"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>

                {process && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-mono">{process.cnj}</span>
                    <span className="text-[#6b7a8d]">— {process.title}</span>
                  </div>
                )}

                <p className="text-sm text-[#8899aa] leading-relaxed">{mov.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
