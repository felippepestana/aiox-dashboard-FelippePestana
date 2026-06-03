'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Users,
  FileText as FileTextIcon,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { CourtIntegration } from '@/components/legal/CourtIntegration';
import { getCourtSystemForCNJ, buildConsultationUrl, COURT_SYSTEMS } from '@/lib/court/court-systems';
import { getTribunalFromCNJ } from '@/lib/court/cnj-utils';
import type { CourtSystem } from '@/types/legal';

// ─── Local types ──────────────────────────────────────────────────────────────

interface CourtMovement {
  id: string;
  date: string;
  description: string;
  type: string;
  source: string;
}

interface CourtDeadline {
  processId: string;
  title: string;
  dueDate: string;
  type: string;
  source: string;
}

interface SyncData {
  searchResult: {
    title: string;
    court: string;
    vara: string;
    comarca: string;
    status: string;
    lastMovement?: string;
  } | null;
  newMovementsCount: number;
  deadlines: CourtDeadline[];
  syncedAt: string;
  system: CourtSystem;
  tribunal: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProcessCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getProcessById, getMovementsByProcess } = useLegalStore();

  const process = getProcessById(id);
  const localMovements = process ? getMovementsByProcess(id) : [];

  const [syncing, setSyncing] = useState(false);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [courtMovements, setCourtMovements] = useState<CourtMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Derived values
  const cnj = process?.cnj ?? '';
  const tribunal = cnj ? (getTribunalFromCNJ(cnj) ?? 'DESCONHECIDO') : '';
  const system = cnj ? getCourtSystemForCNJ(cnj) : 'datajud';
  const consultationUrl = cnj ? buildConsultationUrl(cnj, system) : null;
  const systemDescriptor = COURT_SYSTEMS[system];

  // Load court movements from Supabase (already-synced datajud/pje movements)
  useEffect(() => {
    if (!id) return;
    setLoadingMovements(true);
    fetch(`/api/legal/movements?processId=${id}&source=datajud,pje,esaj,eproc,projudi`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCourtMovements(json.data);
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setLoadingMovements(false));
  }, [id]);

  // ── Sync handler ────────────────────────────────────────────────────────

  const handleSync = async () => {
    if (!cnj || !id) return;
    setSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch('/api/legal/court', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', processId: id, cnj }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSyncError(json.error ?? 'Falha na sincronização');
      } else {
        setSyncData(json.data as SyncData);
        // Reload court movements
        setLoadingMovements(true);
        fetch(`/api/legal/movements?processId=${id}`)
          .then((r) => r.json())
          .then((j) => { if (j.data) setCourtMovements(j.data.filter((m: CourtMovement) => m.source !== 'manual')); })
          .catch(() => {})
          .finally(() => setLoadingMovements(false));
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Erro de rede');
    }

    setSyncing(false);
  };

  // ── Guards ───────────────────────────────────────────────────────────────

  if (!process) {
    return (
      <div className="p-6">
        <Link href="/legal/processes" className="flex items-center gap-2 text-[#6b7a8d] hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
          <p className="text-[#6b7a8d]">Processo não encontrado</p>
        </div>
      </div>
    );
  }

  if (!cnj) {
    return (
      <div className="p-6">
        <Link href={`/legal/processes/${id}`} className="flex items-center gap-2 text-[#6b7a8d] hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao processo
        </Link>
        <div className="rounded-xl border border-yellow-500/20 bg-[#0d1320] p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-sm text-white mb-1">Número CNJ não informado</p>
          <p className="text-xs text-[#6b7a8d]">Adicione um número CNJ ao processo para habilitar a integração com o tribunal.</p>
          <Link href={`/legal/processes/${id}`} className="inline-block mt-4 text-xs text-amber-400 hover:text-amber-300">
            Editar processo
          </Link>
        </div>
      </div>
    );
  }

  // Compare court vs local movements
  const courtMovementIds = new Set(courtMovements.map((m) => `${m.type}-${m.date}`));
  const localOnlyMovements = localMovements.filter(
    (m) => m.source === 'manual' && !courtMovementIds.has(`${m.type}-${m.date}`),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/legal/processes/${id}`} className="text-[#6b7a8d] hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{process.title}</h1>
            <p className="text-sm text-amber-400 font-mono mt-0.5">{process.cnj}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {consultationUrl && (
            <a
              href={consultationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[#1a2332] px-3 py-1 text-xs text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Consultar no Tribunal
            </a>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-full border border-[#1a2332] px-3 py-1 text-xs text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Sync error */}
      {syncError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {syncError}
          </p>
        </div>
      )}

      {/* Sync success summary */}
      {syncData && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Sincronizado com {syncData.tribunal} via {systemDescriptor?.shortName ?? system.toUpperCase()}
              {syncData.newMovementsCount > 0 && (
                <span className="ml-1">— {syncData.newMovementsCount} movimentação(ões) nova(s)</span>
              )}
            </p>
            <span className="text-[10px] text-green-400/60 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(syncData.syncedAt).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Court integration widget */}
        <div className="lg:col-span-1 space-y-4">
          <CourtIntegration
            processId={id}
            cnj={cnj}
            onSyncComplete={(count) => {
              if (count > 0) {
                // Refresh movements list
                setLoadingMovements(true);
                fetch(`/api/legal/movements?processId=${id}`)
                  .then((r) => r.json())
                  .then((j) => { if (j.data) setCourtMovements(j.data.filter((m: CourtMovement) => m.source !== 'manual')); })
                  .catch(() => {})
                  .finally(() => setLoadingMovements(false));
              }
            }}
          />

          {/* Deadlines from last sync */}
          {syncData?.deadlines && syncData.deadlines.length > 0 && (
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                Prazos do Tribunal ({syncData.deadlines.length})
              </h3>
              <div className="space-y-2">
                {syncData.deadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1a2332] last:border-0">
                    <span className="text-xs text-[#c0ccda]">{d.title}</span>
                    <span className="text-xs text-amber-400 font-mono">
                      {new Date(d.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Movements comparison */}
        <div className="lg:col-span-2 space-y-4">
          {/* Court movements */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-400" />
                Movimentações do Tribunal
                <span className="text-xs font-normal text-[#6b7a8d]">
                  ({courtMovements.length})
                </span>
              </h3>
              {!loadingMovements && (
                <span className="text-[10px] text-[#4a5568]">
                  {syncData?.syncedAt
                    ? `Atualizado: ${new Date(syncData.syncedAt).toLocaleDateString('pt-BR')}`
                    : 'Dados do DataJud/PJe'}
                </span>
              )}
            </div>

            {loadingMovements ? (
              <div className="flex items-center gap-2 py-4 text-[#4a5568]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Carregando movimentações...</span>
              </div>
            ) : courtMovements.length === 0 ? (
              <div className="py-6 text-center">
                <Globe className="h-8 w-8 text-[#2a3342] mx-auto mb-2" />
                <p className="text-xs text-[#4a5568]">Nenhuma movimentação sincronizada</p>
                <p className="text-[11px] text-[#3a4352] mt-1">Clique em &quot;Sincronizar&quot; para importar dados do tribunal</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {courtMovements.map((m) => (
                  <div
                    key={m.id}
                    className="flex gap-3 py-2 border-b border-[#1a2332] last:border-0"
                  >
                    <div className="flex-shrink-0 mt-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#c0ccda]">{m.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#4a5568]">
                          {new Date(m.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] bg-blue-500/10 text-blue-400">
                          {m.source}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local-only movements (not in court system) */}
          {localOnlyMovements.length > 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-[#0d1320] p-4">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
                <FileTextIcon className="h-3.5 w-3.5 text-yellow-400" />
                Movimentações Locais Apenas ({localOnlyMovements.length})
              </h3>
              <p className="text-[11px] text-[#6b7a8d] mb-3">
                Estas movimentações foram registradas manualmente e não aparecem no tribunal.
              </p>
              <div className="space-y-2">
                {localOnlyMovements.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex gap-3 py-1.5 border-b border-[#1a2332] last:border-0">
                    <div className="flex-shrink-0 mt-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#c0ccda]">{m.description}</p>
                      <span className="text-[10px] text-[#4a5568]">
                        {new Date(m.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
