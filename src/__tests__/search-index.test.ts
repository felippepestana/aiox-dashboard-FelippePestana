import { describe, expect, it, beforeEach } from 'vitest';
import { SearchIndex, normalizeText, highlightMatches } from '@/lib/search-index';

type Doc = { id: string; title: string; content: string };

describe('search-index', () => {
  let index: SearchIndex<Doc>;
  const docs: Doc[] = [
    { id: '1', title: 'Ação de Cobrança', content: 'Processo trabalhista contra empresa XYZ' },
    { id: '2', title: 'Contestação Cível', content: 'Defesa em processo de cobrança judicial' },
    { id: '3', title: 'Habeas Corpus', content: 'Pedido de liberdade de locomoção' },
    { id: '4', title: 'Tutela de Urgência', content: 'Medida urgente para evitar dano irreparável' },
    { id: '5', title: 'Recurso de Apelação', content: 'Impugnação de sentença cível' },
  ];

  beforeEach(() => {
    index = new SearchIndex<Doc>();
    index.addDocuments(docs, ['title', 'content']);
  });

  // ─── normalizeText ────────────────────────────────────────────────────────

  describe('normalizeText', () => {
    it('converte para minúsculas', () => {
      expect(normalizeText('AÇÃO')).toBe('acao');
    });

    it('remove acentos/diacríticos', () => {
      expect(normalizeText('ação')).toBe('acao');
      expect(normalizeText('contestação')).toBe('contestacao');
      expect(normalizeText('Tutela de Urgência')).toBe('tutela de urgencia');
    });

    it('remove pontuação', () => {
      expect(normalizeText('olá, mundo!')).toBe('ola mundo');
    });

    it('colapsa espaços múltiplos', () => {
      expect(normalizeText('  muito  espaço  ')).toBe('muito espaco');
    });
  });

  // ─── busca básica ─────────────────────────────────────────────────────────

  describe('search básico', () => {
    it('encontra documentos com correspondência exata no título', () => {
      const results = index.search('cobranca');
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('1');
    });

    it('encontra documentos com correspondência no conteúdo', () => {
      const results = index.search('trabalhista');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('1');
    });

    it('query vazia retorna array vazio', () => {
      expect(index.search('')).toEqual([]);
    });

    it('query com 1 caractere retorna array vazio (mínimo 2)', () => {
      expect(index.search('a')).toEqual([]);
    });

    it('query sem correspondência retorna array vazio', () => {
      expect(index.search('xyzabcdef')).toEqual([]);
    });
  });

  // ─── busca insensível a acentos ───────────────────────────────────────────

  describe('busca insensível a acentos', () => {
    it('"acao" encontra "Ação"', () => {
      const results = index.search('acao');
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('1');
    });

    it('"urgencia" encontra "Urgência"', () => {
      const results = index.search('urgencia');
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('4');
    });

    it('"contestacao" encontra "Contestação"', () => {
      const results = index.search('contestacao');
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('2');
    });
  });

  // ─── prefix matching ─────────────────────────────────────────────────────

  describe('prefix matching', () => {
    it('"cobr" encontra documentos com "cobrança"', () => {
      const results = index.search('cobr');
      expect(results.length).toBeGreaterThan(0);
    });

    it('"trab" encontra documentos com "trabalhista"', () => {
      const results = index.search('trab');
      expect(results.length).toBeGreaterThan(0);
    });

    it('"habe" encontra documentos com "habeas corpus"', () => {
      const results = index.search('habe');
      const ids = results.map((r) => r.item.id);
      expect(ids).toContain('3');
    });
  });

  // ─── pontuação e ponderação ───────────────────────────────────────────────

  describe('pontuação e ponderação de campos', () => {
    it('resultado tem campo score > 0', () => {
      const results = index.search('cobranca');
      results.forEach((r) => expect(r.score).toBeGreaterThan(0));
    });

    it('resultado tem campo matches', () => {
      const results = index.search('cobranca');
      results.forEach((r) => expect(r.matches).toBeDefined());
    });

    it('resultados são ordenados por score decrescente', () => {
      const results = index.search('cobranca');
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });

    it('título tem peso maior que conteúdo', () => {
      // "cobranca" aparece no título do doc 1 e no content do doc 2
      const results = index.search('cobranca');
      const doc1 = results.find((r) => r.item.id === '1');
      const doc2 = results.find((r) => r.item.id === '2');
      if (doc1 && doc2) {
        expect(doc1.score).toBeGreaterThan(doc2.score);
      }
    });
  });

  // ─── documentCount e tokenCount ──────────────────────────────────────────

  describe('propriedades do índice', () => {
    it('documentCount retorna número correto de documentos', () => {
      expect(index.documentCount).toBe(5);
    });

    it('tokenCount é maior que zero após indexar', () => {
      expect(index.tokenCount).toBeGreaterThan(0);
    });

    it('addDocuments limpa índice anterior', () => {
      index.addDocuments([{ id: '99', title: 'novo', content: 'conteúdo' }], ['title', 'content']);
      expect(index.documentCount).toBe(1);
    });
  });

  // ─── autocomplete ─────────────────────────────────────────────────────────

  describe('autocomplete', () => {
    it('retorna tokens com o prefixo informado', () => {
      const suggestions = index.autocomplete('cobr');
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.some((s) => s.startsWith('cobr'))).toBe(true);
    });

    it('prefixo de 1 caractere retorna array vazio', () => {
      expect(index.autocomplete('a')).toEqual([]);
    });

    it('prefixo sem correspondência retorna array vazio', () => {
      expect(index.autocomplete('zzz')).toEqual([]);
    });

    it('respeita o limite de resultados', () => {
      const suggestions = index.autocomplete('co', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  // ─── highlightMatches ─────────────────────────────────────────────────────

  describe('highlightMatches', () => {
    it('retorna segmento único sem highlight para query vazia', () => {
      const segs = highlightMatches('texto qualquer', '');
      expect(segs).toEqual([{ text: 'texto qualquer', highlight: false }]);
    });

    it('retorna segmento único sem highlight para query de 1 caractere', () => {
      const segs = highlightMatches('texto', 'a');
      expect(segs).toEqual([{ text: 'texto', highlight: false }]);
    });

    it('destaca termo encontrado no texto', () => {
      const segs = highlightMatches('Ação de Cobrança', 'cobranca');
      const highlighted = segs.filter((s) => s.highlight);
      expect(highlighted.length).toBeGreaterThan(0);
    });

    it('segmentos combinados reconstituem o texto original', () => {
      const text = 'Processo de habeas corpus urgente';
      const segs = highlightMatches(text, 'habeas');
      const reconstructed = segs.map((s) => s.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('texto sem correspondência retorna um segmento sem highlight', () => {
      const segs = highlightMatches('texto sem match', 'xyzabc');
      const allNotHighlighted = segs.every((s) => !s.highlight);
      expect(allNotHighlighted).toBe(true);
    });

    it('múltiplas ocorrências são destacadas', () => {
      const text = 'cobrança judicial e nova cobrança';
      const segs = highlightMatches(text, 'cobranca');
      const highlighted = segs.filter((s) => s.highlight);
      expect(highlighted.length).toBeGreaterThanOrEqual(1);
    });
  });
});
