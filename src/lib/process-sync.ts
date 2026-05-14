/**
 * Process Sync Service
 * Periodically checks all linked processes for new movements, decisions,
 * and publications via DataJud API.
 *
 * Default interval: every 3 hours
 * Checks: movements, decisions, publications, deadlines
 */

export interface SyncResult {
  processId: string;
  cnj: string;
  newMovements: number;
  lastChecked: string;
  status: 'updated' | 'no_changes' | 'error';
  error?: string;
}

export interface SyncConfig {
  intervalMs: number;
  enabled: boolean;
  lastFullSync: string | null;
  processesLinked: number;
}

const DEFAULT_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

let syncTimer: ReturnType<typeof setInterval> | null = null;
let syncConfig: SyncConfig = {
  intervalMs: DEFAULT_INTERVAL,
  enabled: true,
  lastFullSync: null,
  processesLinked: 0,
};

export function getSyncConfig(): SyncConfig {
  return { ...syncConfig };
}

export function updateSyncConfig(updates: Partial<SyncConfig>): SyncConfig {
  syncConfig = { ...syncConfig, ...updates };
  if (updates.intervalMs || updates.enabled !== undefined) {
    restartSync();
  }
  return { ...syncConfig };
}

/**
 * Check a single process for updates via DataJud
 */
export async function syncProcess(
  processId: string,
  cnj: string,
  lastChecked?: string
): Promise<SyncResult> {
  try {
    const since = lastChecked || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(
      `/api/legal/court/datajud?cnj=${encodeURIComponent(cnj)}`
    );

    if (!response.ok) {
      return {
        processId,
        cnj,
        newMovements: 0,
        lastChecked: new Date().toISOString(),
        status: 'error',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        processId,
        cnj,
        newMovements: 0,
        lastChecked: new Date().toISOString(),
        status: 'no_changes',
      };
    }

    const movements = data.data?.movements || [];
    const newMovements = movements.filter(
      (m: { dataHora?: string }) => m.dataHora && m.dataHora > since
    );

    return {
      processId,
      cnj,
      newMovements: newMovements.length,
      lastChecked: new Date().toISOString(),
      status: newMovements.length > 0 ? 'updated' : 'no_changes',
    };
  } catch (error) {
    return {
      processId,
      cnj,
      newMovements: 0,
      lastChecked: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all linked processes
 */
export async function syncAllProcesses(
  processes: { id: string; cnj: string; tags: string[] }[]
): Promise<SyncResult[]> {
  const linked = processes.filter(p =>
    p.tags.includes('datajud-vinculado') || p.tags.includes('sync-ativo')
  );

  syncConfig.processesLinked = linked.length;

  if (linked.length === 0) {
    syncConfig.lastFullSync = new Date().toISOString();
    return [];
  }

  const results: SyncResult[] = [];

  // Process in batches of 5 to avoid overwhelming the API
  for (let i = 0; i < linked.length; i += 5) {
    const batch = linked.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(p => syncProcess(p.id, p.cnj))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + 5 < linked.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  syncConfig.lastFullSync = new Date().toISOString();
  return results;
}

/**
 * Start periodic sync
 */
export function startSync(
  getProcesses: () => { id: string; cnj: string; tags: string[] }[],
  onUpdate: (results: SyncResult[]) => void
): void {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  if (!syncConfig.enabled) return;

  syncTimer = setInterval(async () => {
    const processes = getProcesses();
    const results = await syncAllProcesses(processes);
    const updated = results.filter(r => r.status === 'updated');
    if (updated.length > 0) {
      onUpdate(results);
    }
  }, syncConfig.intervalMs);

  // Also run immediately on start
  setTimeout(async () => {
    const processes = getProcesses();
    const results = await syncAllProcesses(processes);
    onUpdate(results);
  }, 5000);
}

/**
 * Stop periodic sync
 */
export function stopSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/**
 * Restart sync with current config
 */
function restartSync(): void {
  stopSync();
}

/**
 * Format time until next sync
 */
export function getNextSyncTime(): string {
  if (!syncConfig.lastFullSync) return 'Aguardando primeira sincronização...';

  const lastSync = new Date(syncConfig.lastFullSync).getTime();
  const nextSync = lastSync + syncConfig.intervalMs;
  const now = Date.now();
  const remaining = nextSync - now;

  if (remaining <= 0) return 'Sincronizando...';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) return `Próxima sync em ${hours}h ${minutes}min`;
  return `Próxima sync em ${minutes}min`;
}
