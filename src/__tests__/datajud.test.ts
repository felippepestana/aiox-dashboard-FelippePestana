import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  searchByCNJ,
  getMovements,
  searchByClassAndOrgao,
  DataJudError,
} from '@/lib/court/datajud';

// Fixtures with REAL mod-97 check digits (isValidCNJ is strict)
const CNJ_TJSP = '0001234-71.2024.8.26.0100';
const CNJ_TRE_GO = '0000001-84.2024.6.09.0001';
const CNJ_STF = '0000001-90.2023.1.00.0000';

const API_KEY = 'test-key';

function esResponse(hits: unknown[], total = hits.length) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      hits: { total: { value: total, relation: 'eq' }, hits },
    }),
  };
}

function processHit(overrides: Record<string, unknown> = {}) {
  return {
    _index: 'api_publica_tjsp',
    _id: '1',
    _score: 1,
    _source: {
      numeroProcesso: CNJ_TJSP,
      classe: { codigo: 7, nome: 'Procedimento Comum Cível' },
      tribunal: 'TJSP',
      dataAjuizamento: '2024-11-01T08:00:00Z',
      dataHoraUltimaAtualizacao: '2024-11-20T15:30:00Z',
      grau: 'G1',
      nivelSigilo: 0,
      orgaoJulgador: { codigo: 100, nome: '1ª Vara Cível', codigoMunicipioIBGE: 3550308 },
      assuntos: [{ codigo: 6226, nome: 'Indenização por Dano Moral' }],
      movimentos: [
        {
          codigo: 11010,
          nome: 'Despacho',
          dataHora: '2024-11-15T14:30:00Z',
          complementosTabelados: [
            { codigo: 1, nome: 'tipo_decisao', descricao: 'Cite-se a parte ré' },
            { codigo: 2, nome: 'tipo_prazo', descricao: 'Prazo de 15 dias' },
          ],
        },
        {
          codigo: 26,
          nome: 'Distribuição',
          dataHora: '2024-11-01T08:15:00Z',
        },
      ],
      ...overrides,
    },
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('datajud client', () => {
  // ─── searchByCNJ ──────────────────────────────────────────────────────────

  describe('searchByCNJ', () => {
    it('mapeia o processo a partir do _source', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([processHit()]));

      const info = await searchByCNJ(CNJ_TJSP, API_KEY);
      expect(info).toMatchObject({
        cnj: CNJ_TJSP,
        tribunal: 'TJSP',
        classe: 'Procedimento Comum Cível',
        classeCodigo: 7,
        orgaoJulgadorCodigo: 100,
        assuntos: ['Indenização por Dano Moral'],
        grau: 'G1',
      });
    });

    it('consulta o índice correto para um CNJ eleitoral (TRE-GO)', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));

      await searchByCNJ(CNJ_TRE_GO, API_KEY);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('/api_publica_tre-go/_search');
    });

    it('retorna null quando não há resultados', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));
      await expect(searchByCNJ(CNJ_TJSP, API_KEY)).resolves.toBeNull();
    });

    it('lança DataJudError 422 para tribunal sem cobertura (STF)', async () => {
      await expect(searchByCNJ(CNJ_STF, API_KEY)).rejects.toMatchObject({
        name: 'DataJudError',
        status: 422,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejeita CNJ com dígito verificador inválido sem chamar a API', async () => {
      await expect(searchByCNJ('0001234-56.2024.8.26.0100', API_KEY)).rejects.toThrow(
        /CNJ inválido/,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('propaga DataJudError com status em erro HTTP 401 (sem retry)', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { reason: 'unauthorized' } }),
      });

      await expect(searchByCNJ(CNJ_TJSP, API_KEY)).rejects.toMatchObject({
        name: 'DataJudError',
        status: 401,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('faz retry em 429 e propaga DataJudError após esgotar tentativas', async () => {
      vi.useFakeTimers();
      try {
        fetchMock.mockResolvedValue({
          ok: false,
          status: 429,
          json: async () => ({}),
        });

        const promise = searchByCNJ(CNJ_TJSP, API_KEY);
        const assertion = expect(promise).rejects.toMatchObject({
          name: 'DataJudError',
          status: 429,
          message: expect.stringContaining('Limite de requisições'),
        });
        await vi.runAllTimersAsync();
        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
      }
    });

    it('recupera após um 500 transitório (retry com sucesso)', async () => {
      vi.useFakeTimers();
      try {
        fetchMock
          .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
          .mockResolvedValueOnce(esResponse([processHit()]));

        const promise = searchByCNJ(CNJ_TJSP, API_KEY);
        await vi.runAllTimersAsync();
        const info = await promise;
        expect(info?.cnj).toBe(CNJ_TJSP);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── getMovements ─────────────────────────────────────────────────────────

  describe('getMovements', () => {
    it('congela o formato da chave de dedup: type=String(codigo), date=dataHora', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([processHit()]));

      const movements = await getMovements(CNJ_TJSP, API_KEY, 'proc-1');
      // INVARIANT: `${type}-${date}` is the persisted dedup key — these
      // literal values must never change format across releases.
      expect(movements[0].type).toBe('11010');
      expect(movements[0].date).toBe('2024-11-15T14:30:00Z');
      expect(movements[1].type).toBe('26');
      expect(movements[1].date).toBe('2024-11-01T08:15:00Z');
    });

    it('junta complementosTabelados com "; " na descrição', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([processHit()]));

      const movements = await getMovements(CNJ_TJSP, API_KEY, 'proc-1');
      expect(movements[0].description).toBe(
        'Despacho — Cite-se a parte ré; Prazo de 15 dias',
      );
      expect(movements[1].description).toBe('Distribuição');
    });

    it('lança DataJudError 404 quando o processo não existe', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));

      await expect(getMovements(CNJ_TJSP, API_KEY, 'proc-1')).rejects.toMatchObject({
        name: 'DataJudError',
        status: 404,
      });
    });

    it('filtra por since e ordena do mais recente para o mais antigo', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([processHit()]));

      const movements = await getMovements(
        CNJ_TJSP, API_KEY, 'proc-1', '2024-11-10T00:00:00Z',
      );
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('11010');
    });
  });

  // ─── searchByClassAndOrgao ────────────────────────────────────────────────

  describe('searchByClassAndOrgao', () => {
    it('monta bool.must + sort e devolve o cursor da última página', async () => {
      const hits = Array.from({ length: 2 }, (_, i) => ({
        ...processHit(),
        sort: [1700000000000 + i],
      }));
      fetchMock.mockResolvedValueOnce(esResponse(hits, 10));

      const result = await searchByClassAndOrgao(
        { tribunal: 'TJSP', classeCodigo: 7, orgaoJulgadorCodigo: 100, size: 2 },
        API_KEY,
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.query.bool.must).toEqual([
        { match: { 'classe.codigo': 7 } },
        { match: { 'orgaoJulgador.codigo': 100 } },
      ]);
      expect(body.sort).toEqual([{ '@timestamp': { order: 'asc' } }]);
      expect(body.search_after).toBeUndefined();

      expect(result.total).toBe(10);
      expect(result.processes).toHaveLength(2);
      expect(result.nextSearchAfter).toEqual([1700000000001]);
    });

    it('encadeia searchAfter na requisição seguinte', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));

      await searchByClassAndOrgao(
        {
          tribunal: 'TJSP',
          classeCodigo: 7,
          orgaoJulgadorCodigo: 100,
          searchAfter: [1700000000001],
        },
        API_KEY,
      );

      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.search_after).toEqual([1700000000001]);
    });

    it('página incompleta encerra a paginação (nextSearchAfter null)', async () => {
      fetchMock.mockResolvedValueOnce(
        esResponse([{ ...processHit(), sort: [1] }], 1),
      );

      const result = await searchByClassAndOrgao(
        { tribunal: 'TJSP', classeCodigo: 7, orgaoJulgadorCodigo: 100, size: 20 },
        API_KEY,
      );
      expect(result.nextSearchAfter).toBeNull();
    });

    it('lança DataJudError 422 para tribunal sem cobertura', async () => {
      await expect(
        searchByClassAndOrgao(
          { tribunal: 'STF', classeCodigo: 7, orgaoJulgadorCodigo: 100 },
          API_KEY,
        ),
      ).rejects.toMatchObject({ name: 'DataJudError', status: 422 });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('aceita sigla de tribunal normalizada (treac → tre-ac)', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));

      await searchByClassAndOrgao(
        { tribunal: 'treac', classeCodigo: 7, orgaoJulgadorCodigo: 100 },
        API_KEY,
      );
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('/api_publica_tre-ac/_search');
    });

    it('clampa size para o intervalo 1..100', async () => {
      fetchMock.mockResolvedValueOnce(esResponse([]));

      await searchByClassAndOrgao(
        { tribunal: 'TJSP', classeCodigo: 7, orgaoJulgadorCodigo: 100, size: 500 },
        API_KEY,
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.size).toBe(100);
    });
  });

  // ─── DataJudError ─────────────────────────────────────────────────────────

  it('DataJudError preserva status e name', () => {
    const err = new DataJudError('boom', 503);
    expect(err.name).toBe('DataJudError');
    expect(err.status).toBe(503);
    expect(err).toBeInstanceOf(Error);
  });
});
