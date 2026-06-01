import { describe, expect, it } from 'vitest';
import {
  pageToOffset,
  totalPages,
  buildPaginatedResult,
  parsePaginationParams,
  buildCursorResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';

describe('pagination', () => {
  // ─── pageToOffset ─────────────────────────────────────────────────────────

  describe('pageToOffset', () => {
    it('página 1 resulta em offset 0', () => {
      expect(pageToOffset(1, 20)).toBe(0);
    });

    it('página 2 com pageSize 20 resulta em offset 20', () => {
      expect(pageToOffset(2, 20)).toBe(20);
    });

    it('página 3 com pageSize 10 resulta em offset 20', () => {
      expect(pageToOffset(3, 10)).toBe(20);
    });

    it('página 0 ou negativa é tratada como página 1 (offset 0)', () => {
      expect(pageToOffset(0, 20)).toBe(0);
      expect(pageToOffset(-5, 20)).toBe(0);
    });
  });

  // ─── totalPages ──────────────────────────────────────────────────────────

  describe('totalPages', () => {
    it('100 registros com pageSize 20 = 5 páginas', () => {
      expect(totalPages(100, 20)).toBe(5);
    });

    it('arredonda para cima quando não divisível', () => {
      expect(totalPages(21, 20)).toBe(2);
    });

    it('zero registros = 0 páginas', () => {
      expect(totalPages(0, 20)).toBe(0);
    });

    it('pageSize 0 retorna 0 páginas (sem divisão por zero)', () => {
      expect(totalPages(100, 0)).toBe(0);
    });
  });

  // ─── buildPaginatedResult ─────────────────────────────────────────────────

  describe('buildPaginatedResult', () => {
    it('estrutura correta com dados e contagem', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = buildPaginatedResult(data, 50, { page: 1, pageSize: 20 });

      expect(result.data).toBe(data);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(3);
      expect(result.hasMore).toBe(true);
    });

    it('hasMore é false na última página', () => {
      const result = buildPaginatedResult([], 20, { page: 1, pageSize: 20 });
      expect(result.hasMore).toBe(false);
    });

    it('hasMore é false quando está além da última página', () => {
      const result = buildPaginatedResult([], 20, { page: 5, pageSize: 20 });
      expect(result.hasMore).toBe(false);
    });

    it('hasMore é true quando há páginas restantes', () => {
      const result = buildPaginatedResult(Array(20).fill({}), 100, { page: 2, pageSize: 20 });
      expect(result.hasMore).toBe(true);
    });
  });

  // ─── parsePaginationParams ────────────────────────────────────────────────

  describe('parsePaginationParams', () => {
    it('valores padrão quando URLSearchParams está vazio', () => {
      const params = parsePaginationParams(new URLSearchParams());
      expect(params.page).toBe(1);
      expect(params.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(params.sortOrder).toBe('asc');
    });

    it('lê page, pageSize, sortBy e sortOrder corretamente', () => {
      const sp = new URLSearchParams('page=3&pageSize=50&sortBy=name&sortOrder=desc');
      const params = parsePaginationParams(sp);
      expect(params.page).toBe(3);
      expect(params.pageSize).toBe(50);
      expect(params.sortBy).toBe('name');
      expect(params.sortOrder).toBe('desc');
    });

    it('clampeia pageSize no máximo 100', () => {
      const sp = new URLSearchParams('pageSize=999');
      const params = parsePaginationParams(sp);
      expect(params.pageSize).toBe(100);
    });

    it('clampeia pageSize no mínimo 1', () => {
      const sp = new URLSearchParams('pageSize=0');
      const params = parsePaginationParams(sp);
      expect(params.pageSize).toBeGreaterThanOrEqual(1);
    });

    it('page negativa ou zero é tratada como 1', () => {
      const sp = new URLSearchParams('page=-1');
      const params = parsePaginationParams(sp);
      expect(params.page).toBe(1);
    });

    it('page inválida (string) usa valor padrão 1', () => {
      const sp = new URLSearchParams('page=abc');
      const params = parsePaginationParams(sp);
      expect(params.page).toBe(1);
    });

    it('pageSize inválido usa DEFAULT_PAGE_SIZE', () => {
      const sp = new URLSearchParams('pageSize=xyz');
      const params = parsePaginationParams(sp);
      expect(params.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });

    it('sortOrder inválido usa "asc"', () => {
      const sp = new URLSearchParams('sortOrder=invalid');
      const params = parsePaginationParams(sp);
      expect(params.sortOrder).toBe('asc');
    });

    it('defaults são aplicados para campos ausentes', () => {
      const sp = new URLSearchParams();
      const params = parsePaginationParams(sp, { pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' });
      expect(params.pageSize).toBe(10);
      expect(params.sortBy).toBe('createdAt');
      expect(params.sortOrder).toBe('desc');
    });
  });

  // ─── buildCursorResult ────────────────────────────────────────────────────

  describe('buildCursorResult', () => {
    it('sem registros extra, hasMore é false', () => {
      const rows = [{ id: '1', created_at: '2025-01-01' }];
      const result = buildCursorResult(rows, 10, 'created_at');
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('registros extra indicam hasMore = true', () => {
      const rows = Array.from({ length: 11 }, (_, i) => ({
        id: String(i),
        created_at: `2025-01-${String(i + 1).padStart(2, '0')}`,
      }));
      const result = buildCursorResult(rows, 10, 'created_at');
      expect(result.hasMore).toBe(true);
      expect(result.data).toHaveLength(10);
      expect(result.nextCursor).toBe(rows[9].created_at);
    });

    it('nextCursor é o campo do último item retornado', () => {
      const rows = Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        created_at: `2025-01-${String(i + 1).padStart(2, '0')}`,
      }));
      const result = buildCursorResult(rows, 5, 'created_at');
      expect(result.nextCursor).toBe('2025-01-05');
    });
  });

  // ─── PaginatedResult type structure ──────────────────────────────────────

  describe('PaginatedResult estrutura de tipos', () => {
    it('contém todas as propriedades esperadas', () => {
      const result = buildPaginatedResult([{ name: 'João' }], 1, { page: 1, pageSize: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('hasMore');
    });
  });
});
