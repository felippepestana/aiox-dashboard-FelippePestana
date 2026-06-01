import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryCache, buildCacheKey, DEFAULT_TTL_MS, DEFAULT_MAX_SIZE } from '@/lib/query-cache';

describe('query-cache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache({ maxSize: 5, defaultTtl: 1000 });
  });

  // ─── set/get básico ───────────────────────────────────────────────────────

  describe('set e get', () => {
    it('armazena e recupera valores simples', () => {
      cache.set('key1', 'valor');
      expect(cache.get('key1')).toBe('valor');
    });

    it('armazena objetos complexos', () => {
      const obj = { id: 1, nome: 'Teste', nested: { a: true } };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });

    it('chave inexistente retorna undefined', () => {
      expect(cache.get('inexistente')).toBeUndefined();
    });

    it('has() retorna true para entrada válida', () => {
      cache.set('abc', 123);
      expect(cache.has('abc')).toBe(true);
    });

    it('has() retorna false para chave inexistente', () => {
      expect(cache.has('naoexiste')).toBe(false);
    });
  });

  // ─── TTL e expiração ──────────────────────────────────────────────────────

  describe('TTL', () => {
    it('entrada expirada retorna undefined', async () => {
      cache = new QueryCache({ defaultTtl: 1 }); // 1ms TTL
      cache.set('temp', 'valor');
      await new Promise((r) => setTimeout(r, 10));
      expect(cache.get('temp')).toBeUndefined();
    });

    it('TTL personalizado por entrada', async () => {
      cache = new QueryCache({ defaultTtl: 10000 });
      cache.set('short', 'expira', 1); // 1ms
      cache.set('long', 'persiste', 10000);
      await new Promise((r) => setTimeout(r, 10));
      expect(cache.get('short')).toBeUndefined();
      expect(cache.get('long')).toBe('persiste');
    });

    it('has() retorna false para entrada expirada', async () => {
      cache = new QueryCache({ defaultTtl: 1 });
      cache.set('x', 'y');
      await new Promise((r) => setTimeout(r, 10));
      expect(cache.has('x')).toBe(false);
    });
  });

  // ─── LRU eviction ────────────────────────────────────────────────────────

  describe('Evicção LRU', () => {
    it('ao exceder maxSize, remove a entrada menos recentemente usada', async () => {
      const smallCache = new QueryCache({ maxSize: 3, defaultTtl: 10000 });
      smallCache.set('a', 1);
      await new Promise((r) => setTimeout(r, 2));
      smallCache.set('b', 2);
      await new Promise((r) => setTimeout(r, 2));
      smallCache.set('c', 3);

      // Acessa 'a' e 'b' para torná-los mais recentes (após pequena pausa para garantir timestamp diferente)
      await new Promise((r) => setTimeout(r, 2));
      smallCache.get('a');
      await new Promise((r) => setTimeout(r, 2));
      smallCache.get('b');

      // Adiciona 'd' — deve evictar 'c' (LRU, acessado pela última vez antes de 'a' e 'b')
      await new Promise((r) => setTimeout(r, 2));
      smallCache.set('d', 4);

      expect(smallCache.get('a')).toBe(1);
      expect(smallCache.get('b')).toBe(2);
      expect(smallCache.get('c')).toBeUndefined();
      expect(smallCache.get('d')).toBe(4);
    });

    it('size reflete a contagem correta', () => {
      const c = new QueryCache({ maxSize: 10, defaultTtl: 10000 });
      c.set('a', 1);
      c.set('b', 2);
      expect(c.size).toBe(2);
    });

    it('não excede maxSize', () => {
      const c = new QueryCache({ maxSize: 3, defaultTtl: 10000 });
      c.set('a', 1);
      c.set('b', 2);
      c.set('c', 3);
      c.set('d', 4); // deve evictar
      expect(c.size).toBeLessThanOrEqual(3);
    });
  });

  // ─── invalidate ───────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('remove uma entrada específica', () => {
      cache.set('remove-me', 'valor');
      cache.invalidate('remove-me');
      expect(cache.get('remove-me')).toBeUndefined();
    });

    it('não afeta outras entradas', () => {
      cache.set('manter', 'ok');
      cache.set('remover', 'bye');
      cache.invalidate('remover');
      expect(cache.get('manter')).toBe('ok');
    });
  });

  // ─── invalidatePrefix ────────────────────────────────────────────────────

  describe('invalidatePrefix', () => {
    it('remove todas as entradas com o prefixo', () => {
      cache.set('users:1', 'Alice');
      cache.set('users:2', 'Bob');
      cache.set('orders:1', 'pedido');
      cache.invalidatePrefix('users:');
      expect(cache.get('users:1')).toBeUndefined();
      expect(cache.get('users:2')).toBeUndefined();
      expect(cache.get('orders:1')).toBe('pedido');
    });

    it('prefixo vazio não causa erro', () => {
      cache.set('abc', 1);
      expect(() => cache.invalidatePrefix('')).not.toThrow();
    });
  });

  // ─── invalidateAll ────────────────────────────────────────────────────────

  describe('invalidateAll', () => {
    it('limpa todas as entradas', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.invalidateAll();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  // ─── getOrFetch ───────────────────────────────────────────────────────────

  describe('getOrFetch', () => {
    it('chama fetcher no cache miss e armazena resultado', async () => {
      const fetcher = vi.fn().mockResolvedValue('dados');
      const result = await cache.getOrFetch('misskey', fetcher);
      expect(result).toBe('dados');
      expect(fetcher).toHaveBeenCalledOnce();
    });

    it('não chama fetcher no cache hit', async () => {
      cache.set('hitkey', 'cached');
      const fetcher = vi.fn().mockResolvedValue('novo');
      const result = await cache.getOrFetch('hitkey', fetcher);
      expect(result).toBe('cached');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('segunda chamada usa cache (fetcher chamado uma vez)', async () => {
      const fetcher = vi.fn().mockResolvedValue('valor');
      await cache.getOrFetch('key', fetcher);
      await cache.getOrFetch('key', fetcher);
      expect(fetcher).toHaveBeenCalledOnce();
    });
  });

  // ─── purgeExpired ─────────────────────────────────────────────────────────

  describe('purgeExpired', () => {
    it('remove entradas expiradas mantendo as válidas', async () => {
      const c = new QueryCache({ maxSize: 10, defaultTtl: 10000 });
      c.set('expired', 'x', 1); // 1ms TTL
      c.set('valid', 'y', 10000);
      await new Promise((r) => setTimeout(r, 10));
      c.purgeExpired();
      expect(c.get('expired')).toBeUndefined();
      expect(c.get('valid')).toBe('y');
    });

    it('purgeExpired não afeta entradas ainda válidas', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.purgeExpired();
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });
  });

  // ─── buildCacheKey ────────────────────────────────────────────────────────

  describe('buildCacheKey', () => {
    it('sem params retorna base key', () => {
      expect(buildCacheKey('users')).toBe('users');
    });

    it('com params gera chave determinística', () => {
      const k1 = buildCacheKey('users', { page: 1, size: 20 });
      const k2 = buildCacheKey('users', { size: 20, page: 1 });
      expect(k1).toBe(k2);
    });

    it('valores undefined e null são ignorados', () => {
      const k1 = buildCacheKey('users', { page: 1, filter: undefined });
      const k2 = buildCacheKey('users', { page: 1 });
      expect(k1).toBe(k2);
    });

    it('strings vazias são ignoradas', () => {
      const k1 = buildCacheKey('users', { page: 1, name: '' });
      const k2 = buildCacheKey('users', { page: 1 });
      expect(k1).toBe(k2);
    });
  });

  // ─── Constantes padrão ───────────────────────────────────────────────────

  describe('constantes', () => {
    it('DEFAULT_TTL_MS é 5 minutos', () => {
      expect(DEFAULT_TTL_MS).toBe(5 * 60 * 1000);
    });

    it('DEFAULT_MAX_SIZE é 50', () => {
      expect(DEFAULT_MAX_SIZE).toBe(50);
    });
  });
});
