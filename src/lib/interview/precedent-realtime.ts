/**
 * Real-Time Precedent Search
 * Monitors interview transcript for legal keywords/terms and auto-searches
 * precedent database with debouncing to avoid excessive queries.
 */

import type { TranscriptEntry, LegalArea } from '@/types/legal';
import {
  PrecedentSearchEngine,
  type Precedent,
  type PrecedentSearchParams,
} from '@/lib/jurisprudence/precedent-search';

type PrecedentResult = Precedent;
const searchEngine = new PrecedentSearchEngine();
async function searchPrecedents(params: PrecedentSearchParams) {
  const result = await searchEngine.search(params);
  return result;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RealtimePrecedentMatch {
  id: string;
  trigger: string;
  keyword: string;
  precedents: PrecedentResult[];
  timestamp: string;
  transcriptEntryId: string;
}

export interface RealtimePrecedentConfig {
  debounceMs: number;
  maxResults: number;
  minKeywordLength: number;
  autoSearch: boolean;
}

export interface RealtimePrecedentService {
  processEntry: (entry: TranscriptEntry, area: LegalArea) => Promise<RealtimePrecedentMatch | null>;
  processTranscript: (entries: TranscriptEntry[], area: LegalArea) => Promise<RealtimePrecedentMatch[]>;
  getMatches: () => RealtimePrecedentMatch[];
  clearMatches: () => void;
  setConfig: (config: Partial<RealtimePrecedentConfig>) => void;
  onMatch: (callback: (match: RealtimePrecedentMatch) => void) => void;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: RealtimePrecedentConfig = {
  debounceMs: 2000,
  maxResults: 3,
  minKeywordLength: 4,
  autoSearch: true,
};

// ─── Legal Keywords by Area ─────────────────────────────────────────────────

const LEGAL_KEYWORDS: Record<LegalArea, string[]> = {
  civil: [
    'dano moral', 'dano material', 'responsabilidade civil', 'inadimplemento',
    'resolução contratual', 'obrigação de fazer', 'indenização', 'lucro cessante',
    'boa-fé', 'enriquecimento sem causa', 'prescrição', 'decadência',
    'caso fortuito', 'força maior', 'vício redibitório', 'evicção',
    'cláusula penal', 'multa contratual', 'abuso de direito',
  ],
  trabalhista: [
    'justa causa', 'rescisão indireta', 'hora extra', 'adicional noturno',
    'insalubridade', 'periculosidade', 'acúmulo de função', 'desvio de função',
    'estabilidade', 'gestante', 'cipeiro', 'acidentado', 'assédio moral',
    'dano existencial', 'vínculo empregatício', 'terceirização',
    'equiparação salarial', 'supressão de intervalo',
  ],
  tributario: [
    'bitributação', 'isenção', 'imunidade', 'base de cálculo',
    'fato gerador', 'crédito tributário', 'compensação', 'repetição de indébito',
    'decadência tributária', 'prescrição tributária', 'lançamento',
    'substituição tributária', 'responsabilidade tributária',
  ],
  penal: [
    'legítima defesa', 'estado de necessidade', 'crime continuado',
    'concurso de crimes', 'atenuante', 'agravante', 'dosimetria',
    'regime de cumprimento', 'progressão de regime', 'liberdade provisória',
    'prisão preventiva', 'excesso de prazo', 'nulidade processual',
  ],
  administrativo: [
    'poder discricionário', 'ato vinculado', 'desvio de finalidade',
    'motivação do ato', 'anulação', 'revogação', 'convalidação',
    'licitação', 'contrato administrativo', 'improbidade',
    'responsabilidade do estado',
  ],
  consumidor: [
    'vício do produto', 'fato do produto', 'propaganda enganosa',
    'cláusula abusiva', 'inversão do ônus da prova', 'recall',
    'garantia legal', 'garantia contratual', 'direito de arrependimento',
    'prática abusiva', 'cobrança indevida',
  ],
  familia: [
    'guarda compartilhada', 'alienação parental', 'alimentos',
    'partilha de bens', 'regime de bens', 'divórcio litigioso',
    'união estável', 'reconhecimento de paternidade', 'pensão alimentícia',
    'regulamentação de visitas',
  ],
  empresarial: [
    'dissolução societária', 'desconsideração da personalidade jurídica',
    'recuperação judicial', 'falência', 'conflito societário',
    'cláusula de não concorrência', 'propriedade intelectual',
    'marca registrada', 'concorrência desleal',
  ],
  previdenciario: [
    'aposentadoria especial', 'auxílio-doença', 'aposentadoria por invalidez',
    'benefício por incapacidade', 'atividade especial', 'tempo de contribuição',
    'qualidade de segurado', 'período de graça', 'carência',
    'revisão de benefício', 'desaposentação',
  ],
  ambiental: [
    'dano ambiental', 'responsabilidade objetiva', 'licenciamento ambiental',
    'área de preservação permanente', 'reserva legal', 'poluidor-pagador',
    'reparação ambiental', 'crime ambiental',
  ],
  digital: [
    'LGPD', 'vazamento de dados', 'direito ao esquecimento',
    'remoção de conteúdo', 'responsabilidade de plataforma',
    'Marco Civil da Internet', 'proteção de dados pessoais',
    'consentimento do titular', 'dado sensível',
  ],
};

// ─── Debounce Utility ───────────────────────────────────────────────────────

function createDebouncer(delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Map<string, () => Promise<void>>();

  return {
    schedule(key: string, fn: () => Promise<void>) {
      pending.set(key, fn);
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const tasks = Array.from(pending.values());
        pending.clear();
        for (const task of tasks) {
          await task();
        }
      }, delayMs);
    },
    cancel() {
      if (timer) clearTimeout(timer);
      pending.clear();
    },
  };
}

// ─── Extract Keywords from Text ─────────────────────────────────────────────

function extractLegalKeywords(text: string, area: LegalArea, minLength: number): string[] {
  const areaKeywords = LEGAL_KEYWORDS[area] || [];
  const textLower = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of areaKeywords) {
    if (keyword.length >= minLength && textLower.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  }

  return found;
}

// ─── Create Service ─────────────────────────────────────────────────────────

let matchCounter = 0;

export function createRealtimePrecedentService(): RealtimePrecedentService {
  let config: RealtimePrecedentConfig = { ...DEFAULT_CONFIG };
  let matches: RealtimePrecedentMatch[] = [];
  let matchCallback: ((match: RealtimePrecedentMatch) => void) | null = null;
  const processedKeywords = new Set<string>();
  const debouncer = createDebouncer(config.debounceMs);

  async function searchForKeyword(
    keyword: string,
    area: LegalArea,
    entryId: string
  ): Promise<RealtimePrecedentMatch | null> {
    if (processedKeywords.has(keyword)) return null;
    processedKeywords.add(keyword);

    const params: PrecedentSearchParams = {
      keywords: keyword,
      area,
      pageSize: config.maxResults,
    };

    try {
      const result = await searchPrecedents(params);

      if (result.results.length > 0) {
        matchCounter += 1;
        const match: RealtimePrecedentMatch = {
          id: `rpm-${Date.now()}-${matchCounter}`,
          trigger: keyword,
          keyword,
          precedents: result.results,
          timestamp: new Date().toISOString(),
          transcriptEntryId: entryId,
        };
        matches.push(match);
        matchCallback?.(match);
        return match;
      }
    } catch {
      // Silently handle search errors
    }

    return null;
  }

  return {
    async processEntry(
      entry: TranscriptEntry,
      area: LegalArea
    ): Promise<RealtimePrecedentMatch | null> {
      if (!config.autoSearch) return null;
      if (entry.speaker === 'system') return null;

      const keywords = extractLegalKeywords(entry.text, area, config.minKeywordLength);

      if (keywords.length === 0) return null;

      // Use the most specific (longest) keyword found
      const bestKeyword = keywords.sort((a, b) => b.length - a.length)[0];

      return new Promise((resolve) => {
        debouncer.schedule(bestKeyword, async () => {
          const match = await searchForKeyword(bestKeyword, area, entry.id);
          resolve(match);
        });

        // If debouncer doesn't resolve quickly, resolve with null
        setTimeout(() => resolve(null), config.debounceMs + 1000);
      });
    },

    async processTranscript(
      entries: TranscriptEntry[],
      area: LegalArea
    ): Promise<RealtimePrecedentMatch[]> {
      const newMatches: RealtimePrecedentMatch[] = [];

      for (const entry of entries) {
        if (entry.speaker === 'system') continue;

        const keywords = extractLegalKeywords(entry.text, area, config.minKeywordLength);
        for (const keyword of keywords) {
          const match = await searchForKeyword(keyword, area, entry.id);
          if (match) newMatches.push(match);
        }
      }

      return newMatches;
    },

    getMatches() {
      return [...matches];
    },

    clearMatches() {
      matches = [];
      processedKeywords.clear();
      matchCounter = 0;
    },

    setConfig(overrides: Partial<RealtimePrecedentConfig>) {
      config = { ...config, ...overrides };
    },

    onMatch(callback: (match: RealtimePrecedentMatch) => void) {
      matchCallback = callback;
    },
  };
}
