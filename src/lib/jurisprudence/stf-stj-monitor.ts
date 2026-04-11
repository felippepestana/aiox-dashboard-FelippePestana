/**
 * STF/STJ Precedent Monitor
 * Auto-updating tracker for Supreme Court and Superior Court decisions,
 * binding precedents, repetitive themes, and general repercussion.
 */

export interface MonitoredTheme {
  id: string;
  numero: number;
  tribunal: 'STF' | 'STJ';
  titulo: string;
  tese?: string;
  status: 'pending' | 'decided' | 'reviewing';
  area: string;
  lastUpdate: string;
  relator: string;
  processosAfetados: string[];
}

export interface MonitorAlert {
  id: string;
  type: 'new_decision' | 'new_sumula' | 'theme_update' | 'voting_session' | 'new_repetitive';
  tribunal: 'STF' | 'STJ';
  title: string;
  description: string;
  date: string;
  themeId?: string;
  url?: string;
  isRead: boolean;
}

export interface MonitorConfig {
  themes: number[];
  areas: string[];
  keywords: string[];
  tribunals: ('STF' | 'STJ')[];
  autoRefreshMinutes: number;
}

/**
 * Fetch latest alerts from monitored themes and courts.
 * In production, would poll DataJud API, STF/STJ RSS feeds, and DJE.
 */
export async function fetchAlerts(config: MonitorConfig): Promise<MonitorAlert[]> {
  // Mock alerts for development
  return getMockAlerts().filter((alert) => {
    if (config.tribunals.length > 0 && !config.tribunals.includes(alert.tribunal)) {
      return false;
    }
    return true;
  });
}

/**
 * Fetch monitored themes with latest status.
 */
export async function fetchMonitoredThemes(
  themeNumbers: number[]
): Promise<MonitoredTheme[]> {
  const allThemes = getMockThemes();
  if (themeNumbers.length === 0) return allThemes;
  return allThemes.filter((t) => themeNumbers.includes(t.numero));
}

/**
 * Check for new binding precedents (súmulas vinculantes) since a given date.
 */
export async function checkNewSumulas(since: string): Promise<MonitorAlert[]> {
  return getMockAlerts().filter(
    (a) => a.type === 'new_sumula' && a.date >= since
  );
}

/**
 * Get voting session schedule for STF.
 */
export async function getVotingSchedule(): Promise<MonitorAlert[]> {
  return getMockAlerts().filter((a) => a.type === 'voting_session');
}

function getMockAlerts(): MonitorAlert[] {
  return [
    {
      id: 'alert-1',
      type: 'theme_update',
      tribunal: 'STJ',
      title: 'Tema 988 — Atualização',
      description: 'Nova decisão aplicando a taxatividade mitigada do art. 1.015 do CPC em matéria de competência.',
      date: '2026-04-10',
      themeId: 'tema-988',
      isRead: false,
    },
    {
      id: 'alert-2',
      type: 'voting_session',
      tribunal: 'STF',
      title: 'Sessão de Julgamento — Plenário Virtual',
      description: 'Início de votação do RE 1.418.722 — Impenhorabilidade de bem de família do fiador em locação comercial.',
      date: '2026-04-11',
      isRead: false,
    },
    {
      id: 'alert-3',
      type: 'new_repetitive',
      tribunal: 'STJ',
      title: 'Novo Tema Repetitivo — Tema 1.290',
      description: 'Possibilidade de purgação da mora após o decurso do prazo de 5 dias previsto no §2º do art. 3º do DL 911/69.',
      date: '2026-04-09',
      themeId: 'tema-1290',
      isRead: false,
    },
  ];
}

function getMockThemes(): MonitoredTheme[] {
  return [
    {
      id: 'tema-988',
      numero: 988,
      tribunal: 'STJ',
      titulo: 'Taxatividade mitigada do rol do art. 1.015 do CPC/2015',
      tese: 'O rol do art. 1.015 do CPC é de taxatividade mitigada, por isso admite a interposição de agravo de instrumento quando verificada a urgência decorrente da inutilidade do julgamento da questão no recurso de apelação.',
      status: 'decided',
      area: 'processual_civil',
      lastUpdate: '2018-12-05',
      relator: 'Min. Nancy Andrighi',
      processosAfetados: ['REsp 1.696.396/MT', 'REsp 1.704.520/MT'],
    },
    {
      id: 'tema-1095',
      numero: 1095,
      tribunal: 'STJ',
      titulo: 'Notificação extrajudicial prévia para busca e apreensão fiduciária',
      tese: 'A notificação extrajudicial realizada e recebida no endereço do contrato é válida para fins de comprovação da mora.',
      status: 'decided',
      area: 'civil',
      lastUpdate: '2023-09-13',
      relator: 'Min. Marco Buzzi',
      processosAfetados: ['REsp 1.951.662/RS'],
    },
  ];
}
