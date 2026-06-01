// =============================================================================
// SearchIndex - Client-side full-text search with inverted index
// Supports Portuguese accent-insensitive search and prefix matching
// =============================================================================

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalize a string for search: lowercase, remove accents/diacritics.
 * Handles Portuguese characters (ã, õ, é, ç, etc.).
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^\w\s]/g, ' ')        // punctuation → space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenise a normalised string into words.
 * Filters out single characters to reduce noise.
 */
function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((t) => t.length > 1);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchResult<T> {
  item: T;
  score: number;
  /** Map of field → matched token positions (for highlighting). */
  matches: Record<string, number[]>;
}

interface IndexEntry {
  docId: number;
  field: string;
  positions: number[];
}

// ─── SearchIndex ─────────────────────────────────────────────────────────────

export class SearchIndex<T extends Record<string, unknown>> {
  /** Inverted index: token → list of IndexEntry */
  private readonly index = new Map<string, IndexEntry[]>();
  /** Prefix trie node → set of tokens with that prefix */
  private readonly prefixes = new Map<string, Set<string>>();

  private documents: T[] = [];
  private fields: (keyof T)[] = [];

  // ─── Build ──────────────────────────────────────────────────────────────────

  /**
   * Index an array of documents on the specified fields.
   * Replaces any previously indexed data.
   */
  addDocuments(docs: T[], fields: (keyof T)[]): void {
    this.index.clear();
    this.prefixes.clear();
    this.documents = docs;
    this.fields = fields;

    for (let docId = 0; docId < docs.length; docId++) {
      const doc = docs[docId];
      for (const field of fields) {
        const raw = doc[field];
        if (!raw || typeof raw !== 'string') continue;
        const tokens = tokenize(raw);

        tokens.forEach((token, position) => {
          // Inverted index
          const entries = this.index.get(token) ?? [];
          const existing = entries.find((e) => e.docId === docId && e.field === String(field));
          if (existing) {
            existing.positions.push(position);
          } else {
            entries.push({ docId, field: String(field), positions: [position] });
          }
          this.index.set(token, entries);

          // Prefix trie (store all prefixes of length >= 2)
          for (let len = 2; len <= token.length; len++) {
            const prefix = token.slice(0, len);
            const set = this.prefixes.get(prefix) ?? new Set<string>();
            set.add(token);
            this.prefixes.set(prefix, set);
          }
        });
      }
    }
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  /**
   * Full-text search returning ranked results with relevance scores.
   * - Exact token matches score higher than prefix matches.
   * - Earlier fields score higher (first field in array has higher weight).
   * - TF-style scoring: more token occurrences in a doc = higher score.
   */
  search(query: string, limit = 50): SearchResult<T>[] {
    if (!query || query.trim().length < 2) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Collect candidate tokens: exact + prefix expansions
    const expandedTokenSets: Set<string>[] = queryTokens.map((qt) => {
      const set = new Set<string>();
      if (this.index.has(qt)) set.add(qt);
      const prefixMatches = this.prefixes.get(qt);
      if (prefixMatches) {
        for (const t of prefixMatches) set.add(t);
      }
      return set;
    });

    // Score documents
    const scores = new Map<number, number>();
    const matchMap = new Map<number, Record<string, number[]>>();

    expandedTokenSets.forEach((tokenSet, qi) => {
      // Exact query token = 2.0 multiplier; prefix = 1.0
      const queryToken = queryTokens[qi];

      for (const token of tokenSet) {
        const isExact = token === queryToken;
        const entries = this.index.get(token) ?? [];

        for (const entry of entries) {
          const { docId, field, positions } = entry;

          // Field position weight: first field is most important
          const fieldIdx = this.fields.findIndex((f) => String(f) === field);
          const fieldWeight = fieldIdx === -1 ? 1 : 1 / (fieldIdx + 1);

          const tokenScore =
            positions.length * // term frequency
            fieldWeight *
            (isExact ? 2.0 : 1.0);

          scores.set(docId, (scores.get(docId) ?? 0) + tokenScore);

          // Track match positions for highlighting
          const docMatches = matchMap.get(docId) ?? {};
          docMatches[field] = [...(docMatches[field] ?? []), ...positions];
          matchMap.set(docId, docMatches);
        }
      }
    });

    // Sort by score descending, resolve ties by original document order
    const results: SearchResult<T>[] = [];
    for (const [docId, score] of scores.entries()) {
      results.push({
        item: this.documents[docId],
        score,
        matches: matchMap.get(docId) ?? {},
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  // ─── Autocomplete ────────────────────────────────────────────────────────────

  /**
   * Return up to `limit` unique tokens that start with `prefix`.
   * Used for autocomplete suggestions.
   */
  autocomplete(prefix: string, limit = 10): string[] {
    const norm = normalizeText(prefix);
    if (norm.length < 2) return [];
    const set = this.prefixes.get(norm);
    if (!set) return [];
    return Array.from(set).slice(0, limit);
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  get documentCount(): number {
    return this.documents.length;
  }

  get tokenCount(): number {
    return this.index.size;
  }
}

// ─── Highlight Helper ─────────────────────────────────────────────────────────

/**
 * Wrap matching substrings in a text with a highlight marker.
 * Returns segments: { text, highlight } for rendering.
 */
export interface TextSegment {
  text: string;
  highlight: boolean;
}

export function highlightMatches(text: string, query: string): TextSegment[] {
  if (!query || query.trim().length < 2) {
    return [{ text, highlight: false }];
  }

  const normQuery = normalizeText(query);
  const normText = normalizeText(text);
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Find all non-overlapping occurrences of each query word
  const words = normQuery.split(' ').filter((w) => w.length > 1);
  const positions: [number, number][] = [];

  for (const word of words) {
    let start = 0;
    while (start < normText.length) {
      const idx = normText.indexOf(word, start);
      if (idx === -1) break;
      positions.push([idx, idx + word.length]);
      start = idx + 1;
    }
  }

  // Sort and merge overlapping ranges
  positions.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of positions) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  for (const [start, end] of merged) {
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), highlight: false });
    }
    segments.push({ text: text.slice(start, end), highlight: true });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}
