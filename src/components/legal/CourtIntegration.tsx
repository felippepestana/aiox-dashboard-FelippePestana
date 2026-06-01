'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Shield,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
} from 'lucide-react';
import type { CourtSystem } from '@/types/legal';
import { getCourtSystemForCNJ, buildConsultationUrl, COURT_SYSTEMS } from '@/lib/court/court-systems';
import { getTribunalFromCNJ } from '@/lib/court/cnj-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourtIntegrationProps {
  /** Internal process ID (Supabase UUID) */
  processId: string;
  /** CNJ process number */
  cnj: string;
  /** Optional callback after a successful sync */
  onSyncComplete?: (newMovementsCount: number) => void;
}

interface SavedCredential {
  id: string;
  system: CourtSystem;
  username: string;
  tribunalCode: string;
  lastUsed: string | null;
  isValid: boolean;
  createdAt: string;
}

interface SyncResult {
  searchResult: {
    title: string;
    court: string;
    vara: string;
    status: string;
    lastMovement?: string;
  } | null;
  newMovementsCount: number;
  syncedAt: string;
  system: CourtSystem;
  tribunal: string;
}

// ─── System badge colours ─────────────────────────────────────────────────────

const SYSTEM_COLORS: Record<CourtSystem | string, string> = {
  pje:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  esaj:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  eproc:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  projudi: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  datajud: 'bg-green-500/10 text-green-400 border-green-500/20',
  manual:  'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SystemBadge({ system }: { system: CourtSystem }) {
  const descriptor = COURT_SYSTEMS[system];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${SYSTEM_COLORS[system] ?? SYSTEM_COLORS.manual}`}>
      {descriptor?.shortName ?? system.toUpperCase()}
    </span>
  );
}

function CredentialRow({
  cred,
  onDelete,
  onTest,
}: {
  cred: SavedCredential;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null | undefined>(undefined);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch(`/api/legal/court?action=test-credential&credentialId=${cred.id}`);
      const json = await res.json();
      setTestResult(json.data?.valid ?? null);
      onTest(cred.id);
    } catch {
      setTestResult(null);
    }
    setTesting(false);
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#1a2332] last:border-0">
      <SystemBadge system={cred.system} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{cred.username}</p>
        <p className="text-[10px] text-[#6b7a8d]">{cred.tribunalCode}</p>
      </div>
      <div className="flex items-center gap-1">
        {/* Validity indicator */}
        {testResult === true && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
        {testResult === false && <XCircle className="h-3.5 w-3.5 text-red-400" />}
        {testResult === null && <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />}
        {!cred.isValid && testResult === undefined && (
          <span title="Credencial marcada como inválida">
            <XCircle className="h-3.5 w-3.5 text-red-400/60" />
          </span>
        )}
        {cred.lastUsed && (
          <span className="text-[10px] text-[#4a5568] mr-1">
            {new Date(cred.lastUsed).toLocaleDateString('pt-BR')}
          </span>
        )}
        <button
          onClick={handleTest}
          disabled={testing}
          className="rounded px-2 py-1 text-[10px] text-[#6b7a8d] hover:text-amber-400 border border-[#1a2332] hover:border-amber-500/20 transition-colors disabled:opacity-40"
          title="Testar credencial"
        >
          {testing ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Testar'}
        </button>
        <button
          onClick={() => onDelete(cred.id)}
          className="rounded p-1 text-[#4a5568] hover:text-red-400 transition-colors"
          title="Remover credencial"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface CourtIntegrationState {
  lastSync: SyncResult | null;
  credentials: SavedCredential[];
}

export function CourtIntegration({ processId, cnj, onSyncComplete }: CourtIntegrationProps) {
  const tribunal = getTribunalFromCNJ(cnj) ?? 'DESCONHECIDO';
  const system = getCourtSystemForCNJ(cnj);
  const consultationUrl = buildConsultationUrl(cnj, system);
  const systemDescriptor = COURT_SYSTEMS[system];

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Credentials state
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [showCredSection, setShowCredSection] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCred, setNewCred] = useState({
    system: system as CourtSystem,
    tribunal: tribunal,
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingCred, setSavingCred] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  // Load credentials on mount
  const loadCredentials = useCallback(async () => {
    setLoadingCreds(true);
    try {
      const res = await fetch('/api/legal/court?action=credentials');
      const json = await res.json();
      if (json.success) setCredentials(json.data ?? []);
    } catch {
      // non-fatal
    }
    setLoadingCreds(false);
  }, []);

  useEffect(() => {
    if (showCredSection) loadCredentials();
  }, [showCredSection, loadCredentials]);

  // ── Sync handler ────────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/legal/court', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', processId, cnj }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSyncError(json.error ?? 'Falha na sincronização');
      } else {
        const result: SyncResult = {
          searchResult: json.data.searchResult,
          newMovementsCount: json.data.newMovementsCount ?? 0,
          syncedAt: json.data.syncedAt,
          system: json.data.system,
          tribunal: json.data.tribunal,
        };
        setLastSync(result);
        onSyncComplete?.(result.newMovementsCount);
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Erro de rede');
    }
    setSyncing(false);
  };

  // ── Save credential ─────────────────────────────────────────────────────

  const handleSaveCredential = async () => {
    if (!newCred.username || !newCred.password) return;
    setSavingCred(true);
    setCredError(null);
    try {
      const res = await fetch('/api/legal/court', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-credential',
          system: newCred.system,
          username: newCred.username,
          password: newCred.password,
          tribunal: newCred.tribunal,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCredError(json.error ?? 'Falha ao salvar');
      } else {
        setNewCred({ system, tribunal, username: '', password: '' });
        setShowAddForm(false);
        await loadCredentials();
      }
    } catch (err) {
      setCredError(err instanceof Error ? err.message : 'Erro de rede');
    }
    setSavingCred(false);
  };

  // ── Delete credential ───────────────────────────────────────────────────

  const handleDeleteCredential = async (id: string) => {
    try {
      await fetch(`/api/legal/court?credentialId=${id}`, { method: 'DELETE' });
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // non-fatal
    }
  };

  const processCredentials = credentials.filter(
    (c) => c.system === system && c.tribunalCode === tribunal,
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2332]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Tribunal</h3>
        </div>
        <div className="flex items-center gap-2">
          {consultationUrl && (
            <a
              href={consultationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[#6b7a8d] hover:text-amber-400 border border-[#1a2332] hover:border-amber-500/20 transition-colors"
              title="Consultar no tribunal"
            >
              <ExternalLink className="h-3 w-3" />
              Consultar
            </a>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[#6b7a8d] hover:text-amber-400 border border-[#1a2332] hover:border-amber-500/20 transition-colors disabled:opacity-40"
            title="Sincronizar dados do tribunal"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Court system info */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SystemBadge system={system} />
          <span className="text-xs text-[#8899aa]">{systemDescriptor?.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">Tribunal</p>
            <p className="text-xs text-white mt-0.5">{tribunal}</p>
          </div>
          {systemDescriptor?.hasPublicConsultation && (
            <div>
              <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">Consulta Pública</p>
              <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Disponível
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sync status */}
      {(lastSync || syncError) && (
        <div className={`mx-4 mb-3 rounded-lg px-3 py-2 text-xs ${syncError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
          {syncError ? (
            <span className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 flex-shrink-0" /> {syncError}
            </span>
          ) : lastSync ? (
            <div className="space-y-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {lastSync.newMovementsCount > 0
                  ? `${lastSync.newMovementsCount} nova(s) movimentação(ões) importada(s)`
                  : 'Processo atualizado — nenhuma movimentação nova'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-green-400/70">
                <Clock className="h-3 w-3" />
                {new Date(lastSync.syncedAt).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Synced process data preview */}
      {lastSync?.searchResult && (
        <div className="mx-4 mb-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 space-y-1">
          <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">Dados do Tribunal</p>
          {lastSync.searchResult.title && (
            <p className="text-xs text-[#c0ccda]">{lastSync.searchResult.title}</p>
          )}
          <div className="flex gap-4">
            {lastSync.searchResult.court && (
              <span className="text-[10px] text-[#6b7a8d]">{lastSync.searchResult.court}</span>
            )}
            {lastSync.searchResult.status && (
              <span className="text-[10px] text-amber-400">{lastSync.searchResult.status}</span>
            )}
          </div>
        </div>
      )}

      {/* Credentials section toggle */}
      <div className="border-t border-[#1a2332]">
        <button
          onClick={() => setShowCredSection((v) => !v)}
          className="flex items-center justify-between w-full px-4 py-3 text-xs text-[#6b7a8d] hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-amber-400/70" />
            Credenciais Salvas
            {processCredentials.length > 0 && (
              <span className="rounded-full bg-amber-500/10 text-amber-400 px-1.5 py-0.5 text-[10px]">
                {processCredentials.length}
              </span>
            )}
          </span>
          {showCredSection ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showCredSection && (
          <div className="px-4 pb-4 space-y-3">
            {/* Credential list */}
            {loadingCreds ? (
              <p className="text-xs text-[#4a5568]">Carregando...</p>
            ) : processCredentials.length === 0 ? (
              <p className="text-xs text-[#4a5568]">Nenhuma credencial salva para {tribunal} ({system.toUpperCase()})</p>
            ) : (
              <div>
                {processCredentials.map((cred) => (
                  <CredentialRow
                    key={cred.id}
                    cred={cred}
                    onDelete={handleDeleteCredential}
                    onTest={() => loadCredentials()}
                  />
                ))}
              </div>
            )}

            {/* Add credential button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#1a2332] px-3 py-2 text-xs text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors w-full justify-center"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Credencial
              </button>
            )}

            {/* Add credential form */}
            {showAddForm && (
              <div className="rounded-lg border border-amber-500/20 bg-[#0a0f1a] p-3 space-y-3">
                <p className="text-xs font-medium text-white">Nova Credencial</p>

                {/* System selector */}
                <div>
                  <label className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Sistema</label>
                  <select
                    value={newCred.system}
                    onChange={(e) => setNewCred((f) => ({ ...f, system: e.target.value as CourtSystem }))}
                    className="mt-1 w-full rounded border border-[#1a2332] bg-[#0d1320] px-2 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  >
                    {(['pje', 'esaj', 'eproc', 'projudi'] as CourtSystem[]).map((s) => (
                      <option key={s} value={s}>{COURT_SYSTEMS[s]?.shortName ?? s}</option>
                    ))}
                  </select>
                </div>

                {/* Tribunal */}
                <div>
                  <label className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Tribunal</label>
                  <input
                    type="text"
                    value={newCred.tribunal}
                    onChange={(e) => setNewCred((f) => ({ ...f, tribunal: e.target.value.toUpperCase() }))}
                    placeholder="Ex: TJSP, TRT2..."
                    className="mt-1 w-full rounded border border-[#1a2332] bg-[#0d1320] px-2 py-1.5 text-xs text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Usuário / CPF</label>
                  <input
                    type="text"
                    value={newCred.username}
                    onChange={(e) => setNewCred((f) => ({ ...f, username: e.target.value }))}
                    placeholder="Usuário ou CPF"
                    className="mt-1 w-full rounded border border-[#1a2332] bg-[#0d1320] px-2 py-1.5 text-xs text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
                  />
                </div>

                {/* Password (always masked) */}
                <div>
                  <label className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Senha</label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newCred.password}
                      onChange={(e) => setNewCred((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Senha do sistema judicial"
                      autoComplete="new-password"
                      className="w-full rounded border border-[#1a2332] bg-[#0d1320] px-2 py-1.5 pr-8 text-xs text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8899aa] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {credError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" /> {credError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCredential}
                    disabled={savingCred || !newCred.username || !newCred.password}
                    className="flex-1 rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400 disabled:opacity-40 transition-colors"
                  >
                    {savingCred ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setCredError(null); }}
                    className="rounded border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

                <p className="text-[10px] text-[#4a5568]">
                  A senha é criptografada com AES-256-GCM antes de ser armazenada.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
