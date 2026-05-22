// API Client — camelCase ↔ snake_case mapping + typed fetch wrappers

export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = snakeToCamel(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => snakeToCamel(r) as T);
}

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

// ─── Processes ──────────────────────────────────────────────────────────────

export async function fetchProcesses(params?: { area?: string; status?: string; search?: string }) {
  const sp = new URLSearchParams();
  if (params?.area) sp.set('area', params.area);
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  const qs = sp.toString();
  const res = await apiFetch<{ processes: Record<string, unknown>[] }>(`/api/legal/processes${qs ? `?${qs}` : ''}`);
  return mapRows(res.processes);
}

export async function createProcess(body: Record<string, unknown>) {
  const res = await apiFetch<{ process: Record<string, unknown> }>('/api/legal/processes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.process);
}

export async function updateProcess(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ process: Record<string, unknown> }>(`/api/legal/processes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.process);
}

export async function deleteProcess(id: string) {
  await apiFetch(`/api/legal/processes/${id}`, { method: 'DELETE' });
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function fetchClients(params?: { type?: string; search?: string }) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.search) sp.set('search', params.search);
  const qs = sp.toString();
  const res = await apiFetch<{ clients: Record<string, unknown>[] }>(`/api/legal/clients${qs ? `?${qs}` : ''}`);
  return mapRows(res.clients);
}

export async function createClient(body: Record<string, unknown>) {
  const res = await apiFetch<{ client: Record<string, unknown> }>('/api/legal/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.client);
}

export async function updateClient(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ client: Record<string, unknown> }>(`/api/legal/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.client);
}

export async function deleteClient(id: string) {
  await apiFetch(`/api/legal/clients/${id}`, { method: 'DELETE' });
}

// ─── Deadlines ──────────────────────────────────────────────────────────────

export async function fetchDeadlines(params?: { status?: string; processId?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.processId) sp.set('processId', params.processId);
  const qs = sp.toString();
  const res = await apiFetch<{ deadlines: Record<string, unknown>[] }>(`/api/legal/deadlines${qs ? `?${qs}` : ''}`);
  return mapRows(res.deadlines);
}

export async function createDeadline(body: Record<string, unknown>) {
  const res = await apiFetch<{ deadline: Record<string, unknown> }>('/api/legal/deadlines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.deadline);
}

export async function updateDeadline(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ deadline: Record<string, unknown> }>(`/api/legal/deadlines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.deadline);
}

export async function deleteDeadline(id: string) {
  await apiFetch(`/api/legal/deadlines/${id}`, { method: 'DELETE' });
}

// ─── Petitions ──────────────────────────────────────────────────────────────

export async function fetchPetitions(params?: { status?: string; processId?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.processId) sp.set('processId', params.processId);
  const qs = sp.toString();
  const res = await apiFetch<{ petitions: Record<string, unknown>[] }>(`/api/legal/petitions${qs ? `?${qs}` : ''}`);
  return mapRows(res.petitions);
}

export async function createPetition(body: Record<string, unknown>) {
  const res = await apiFetch<{ petition: Record<string, unknown> }>('/api/legal/petitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.petition);
}

export async function updatePetition(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ petition: Record<string, unknown> }>(`/api/legal/petitions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.petition);
}

export async function deletePetition(id: string) {
  await apiFetch(`/api/legal/petitions/${id}`, { method: 'DELETE' });
}

// ─── Movements ──────────────────────────────────────────────────────────────

export async function fetchMovements(processId?: string) {
  const qs = processId ? `?processId=${processId}` : '';
  const res = await apiFetch<{ movements: Record<string, unknown>[] }>(`/api/legal/movements${qs}`);
  return mapRows(res.movements);
}

export async function createMovement(body: Record<string, unknown>) {
  const res = await apiFetch<{ movement: Record<string, unknown> }>('/api/legal/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.movement);
}

export async function updateMovement(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ movement: Record<string, unknown> }>(`/api/legal/movements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.movement);
}

// ─── Honorarios ─────────────────────────────────────────────────────────────

export async function fetchHonorarios(params?: { clientId?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.clientId) sp.set('clientId', params.clientId);
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  const res = await apiFetch<{ honorarios: Record<string, unknown>[] }>(`/api/legal/honorarios${qs ? `?${qs}` : ''}`);
  return mapRows(res.honorarios);
}

export async function createHonorario(body: Record<string, unknown>) {
  const res = await apiFetch<{ honorario: Record<string, unknown> }>('/api/legal/honorarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.honorario);
}

export async function updateHonorario(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ honorario: Record<string, unknown> }>(`/api/legal/honorarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.honorario);
}

export async function deleteHonorario(id: string) {
  await apiFetch(`/api/legal/honorarios/${id}`, { method: 'DELETE' });
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function fetchTransactions(params?: { type?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  const qs = sp.toString();
  const res = await apiFetch<{ transactions: Record<string, unknown>[] }>(`/api/legal/transactions${qs ? `?${qs}` : ''}`);
  return mapRows(res.transactions);
}

export async function createTransaction(body: Record<string, unknown>) {
  const res = await apiFetch<{ transaction: Record<string, unknown> }>('/api/legal/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.transaction);
}

export async function deleteTransaction(id: string) {
  await apiFetch(`/api/legal/transactions/${id}`, { method: 'DELETE' });
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export async function fetchLeads(params?: { status?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  const res = await apiFetch<{ leads: Record<string, unknown>[] }>(`/api/legal/leads${qs ? `?${qs}` : ''}`);
  return mapRows(res.leads);
}

export async function createLead(body: Record<string, unknown>) {
  const res = await apiFetch<{ lead: Record<string, unknown> }>('/api/legal/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.lead);
}

export async function updateLead(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ lead: Record<string, unknown> }>(`/api/legal/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.lead);
}

export async function deleteLead(id: string) {
  await apiFetch(`/api/legal/leads/${id}`, { method: 'DELETE' });
}

// ─── Campaigns ──────────────────────────────────────────────────────────────

export async function fetchCampaigns(params?: { status?: string; area?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.area) sp.set('area', params.area);
  const qs = sp.toString();
  const res = await apiFetch<{ campaigns: Record<string, unknown>[] }>(`/api/legal/campaigns${qs ? `?${qs}` : ''}`);
  return mapRows(res.campaigns);
}

export async function createCampaign(body: Record<string, unknown>) {
  const res = await apiFetch<{ campaign: Record<string, unknown> }>('/api/legal/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.campaign);
}

export async function updateCampaign(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ campaign: Record<string, unknown> }>(`/api/legal/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.campaign);
}

export async function deleteCampaign(id: string) {
  await apiFetch(`/api/legal/campaigns/${id}`, { method: 'DELETE' });
}

// ─── Content Items ──────────────────────────────────────────────────────────

export async function fetchContentItems(params?: { channel?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.channel) sp.set('channel', params.channel);
  if (params?.status) sp.set('status', params.status);
  const qs = sp.toString();
  const res = await apiFetch<{ contentItems: Record<string, unknown>[] }>(`/api/legal/content-items${qs ? `?${qs}` : ''}`);
  return mapRows(res.contentItems);
}

export async function createContentItem(body: Record<string, unknown>) {
  const res = await apiFetch<{ contentItem: Record<string, unknown> }>('/api/legal/content-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.contentItem);
}

export async function updateContentItem(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ contentItem: Record<string, unknown> }>(`/api/legal/content-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.contentItem);
}

export async function deleteContentItem(id: string) {
  await apiFetch(`/api/legal/content-items/${id}`, { method: 'DELETE' });
}

// ─── KPIs ───────────────────────────────────────────────────────────────────

export async function fetchKpis() {
  const res = await apiFetch<{ kpis: Record<string, unknown>[] }>('/api/legal/kpis');
  return mapRows(res.kpis);
}

export async function createKpi(body: Record<string, unknown>) {
  const res = await apiFetch<{ kpi: Record<string, unknown> }>('/api/legal/kpis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.kpi);
}

export async function updateKpi(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ kpi: Record<string, unknown> }>(`/api/legal/kpis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.kpi);
}

export async function deleteKpi(id: string) {
  await apiFetch(`/api/legal/kpis/${id}`, { method: 'DELETE' });
}

// ─── SELEM Assessments ──────────────────────────────────────────────────────

export async function fetchSelemAssessments(pillar?: string) {
  const qs = pillar ? `?pillar=${pillar}` : '';
  const res = await apiFetch<{ assessments: Record<string, unknown>[] }>(`/api/legal/selem${qs}`);
  return mapRows(res.assessments);
}

export async function createSelemAssessment(body: Record<string, unknown>) {
  const res = await apiFetch<{ assessment: Record<string, unknown> }>('/api/legal/selem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.assessment);
}

export async function updateSelemAssessment(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ assessment: Record<string, unknown> }>(`/api/legal/selem/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.assessment);
}

export async function deleteSelemAssessment(id: string) {
  await apiFetch(`/api/legal/selem/${id}`, { method: 'DELETE' });
}

// ─── Leadership Pipeline ────────────────────────────────────────────────────

export async function fetchLeadershipEntries() {
  const res = await apiFetch<{ entries: Record<string, unknown>[] }>('/api/legal/leadership');
  return mapRows(res.entries);
}

export async function createLeadershipEntry(body: Record<string, unknown>) {
  const res = await apiFetch<{ entry: Record<string, unknown> }>('/api/legal/leadership', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.entry);
}

export async function updateLeadershipEntry(id: string, updates: Record<string, unknown>) {
  const res = await apiFetch<{ entry: Record<string, unknown> }>(`/api/legal/leadership/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return snakeToCamel(res.entry);
}

export async function deleteLeadershipEntry(id: string) {
  await apiFetch(`/api/legal/leadership/${id}`, { method: 'DELETE' });
}

// ─── Legal Canvas ───────────────────────────────────────────────────────────

export async function fetchCanvas() {
  const res = await apiFetch<{ canvas: Record<string, unknown> | null }>('/api/legal/canvas');
  return res.canvas ? snakeToCamel(res.canvas) : null;
}

export async function saveCanvas(body: Record<string, unknown>) {
  const res = await apiFetch<{ canvas: Record<string, unknown> }>('/api/legal/canvas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return snakeToCamel(res.canvas);
}
