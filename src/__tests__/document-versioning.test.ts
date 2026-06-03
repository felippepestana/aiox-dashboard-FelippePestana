import { describe, expect, it } from 'vitest';
import { computeDiff } from '@/lib/document-versioning';

describe('document-versioning - computeDiff', () => {
  // ─── Adições ─────────────────────────────────────────────────────────────

  describe('somente adições', () => {
    it('adicionar linha ao final', () => {
      const diff = computeDiff('linha1\nlinha2', 'linha1\nlinha2\nlinha3');
      expect(diff.additions).toBe(1);
      expect(diff.removals).toBe(0);
      const added = diff.lines.filter((l) => l.type === 'added');
      expect(added).toHaveLength(1);
      expect(added[0].content).toBe('linha3');
    });

    it('adicionar linha no início', () => {
      const diff = computeDiff('linha2', 'linha1\nlinha2');
      expect(diff.additions).toBe(1);
      expect(diff.removals).toBe(0);
    });

    it('adicionar múltiplas linhas', () => {
      const diff = computeDiff('a', 'a\nb\nc\nd');
      expect(diff.additions).toBe(3);
      expect(diff.removals).toBe(0);
    });

    it('a partir de string vazia (empty split produz 1 linha vazia)', () => {
      // ''.split('\n') = [''] → 1 linha vazia existente que é substituída pela nova
      const diff = computeDiff('', 'nova linha');
      // 1 addition (nova linha) e 1 removal (linha vazia) OU só 1 addition — depende do LCS
      expect(diff.additions).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Remoções ─────────────────────────────────────────────────────────────

  describe('somente remoções', () => {
    it('remover última linha', () => {
      const diff = computeDiff('linha1\nlinha2\nlinha3', 'linha1\nlinha2');
      expect(diff.additions).toBe(0);
      expect(diff.removals).toBe(1);
      const removed = diff.lines.filter((l) => l.type === 'removed');
      expect(removed).toHaveLength(1);
      expect(removed[0].content).toBe('linha3');
    });

    it('remover linha do início', () => {
      const diff = computeDiff('linha1\nlinha2', 'linha2');
      expect(diff.removals).toBe(1);
      expect(diff.additions).toBe(0);
    });

    it('remover todas as linhas (empty string produz 1 linha vazia)', () => {
      // ''.split('\n') = [''] → a string vazia tem 1 linha vazia resultante
      // LCS entre ['a','b','c'] e [''] = 0 matches
      // Resultado: 3 removals + 1 addition (linha vazia)
      const diff = computeDiff('a\nb\nc', '');
      expect(diff.removals).toBe(3);
      expect(diff.additions).toBe(1); // linha vazia adicionada
    });
  });

  // ─── Mudanças mistas ──────────────────────────────────────────────────────

  describe('mudanças mistas', () => {
    it('substituir uma linha (1 remoção + 1 adição)', () => {
      const diff = computeDiff('linha1\nlinha2\nlinha3', 'linha1\nlinha_nova\nlinha3');
      expect(diff.removals).toBe(1);
      expect(diff.additions).toBe(1);
    });

    it('misto de adições e remoções', () => {
      const diff = computeDiff('a\nb\nc', 'a\nd\nc\ne');
      expect(diff.additions).toBeGreaterThan(0);
      expect(diff.removals).toBeGreaterThan(0);
    });

    it('linhas inalteradas têm tipo unchanged', () => {
      const diff = computeDiff('mantida\nalterada', 'mantida\nnova');
      const unchanged = diff.lines.filter((l) => l.type === 'unchanged');
      expect(unchanged.some((l) => l.content === 'mantida')).toBe(true);
    });
  });

  // ─── Strings idênticas ────────────────────────────────────────────────────

  describe('strings idênticas', () => {
    it('sem adições nem remoções', () => {
      const diff = computeDiff('conteúdo igual', 'conteúdo igual');
      expect(diff.additions).toBe(0);
      expect(diff.removals).toBe(0);
    });

    it('todas as linhas são unchanged', () => {
      const diff = computeDiff('linha1\nlinha2', 'linha1\nlinha2');
      const types = diff.lines.map((l) => l.type);
      expect(types.every((t) => t === 'unchanged')).toBe(true);
    });
  });

  // ─── Strings vazias ───────────────────────────────────────────────────────

  describe('strings vazias', () => {
    it('dois vazios produzem diff com 1 linha unchanged (linha vazia)', () => {
      // ''.split('\n') = [''] para ambos → 1 linha vazia = unchanged
      const diff = computeDiff('', '');
      expect(diff.additions).toBe(0);
      expect(diff.removals).toBe(0);
      expect(diff.lines.every((l) => l.type === 'unchanged')).toBe(true);
    });
  });

  // ─── lineNumber ───────────────────────────────────────────────────────────

  describe('lineNumber', () => {
    it('lineNumber começa em 1 e é sequencial', () => {
      const diff = computeDiff('a\nb\nc', 'a\nx\nc');
      const numbers = diff.lines.map((l) => l.lineNumber);
      expect(numbers[0]).toBe(1);
      for (let i = 1; i < numbers.length; i++) {
        expect(numbers[i]).toBe(numbers[i - 1] + 1);
      }
    });
  });

  // ─── Estrutura do retorno ─────────────────────────────────────────────────

  describe('estrutura DocumentDiff', () => {
    it('possui campos lines, additions e removals', () => {
      const diff = computeDiff('old', 'new');
      expect(diff).toHaveProperty('lines');
      expect(diff).toHaveProperty('additions');
      expect(diff).toHaveProperty('removals');
    });

    it('cada DiffLine possui type, content e lineNumber', () => {
      const diff = computeDiff('a\nb', 'a\nc');
      for (const line of diff.lines) {
        expect(line).toHaveProperty('type');
        expect(line).toHaveProperty('content');
        expect(line).toHaveProperty('lineNumber');
        expect(['unchanged', 'added', 'removed']).toContain(line.type);
      }
    });
  });
});
