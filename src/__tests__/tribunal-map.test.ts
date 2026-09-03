import { describe, expect, it } from 'vitest';
import {
  TRIBUNAL_MAP,
  ALL_TRIBUNAIS,
  getTribunalInfo,
  getDatajudAlias,
  getTribunalDisplayName,
} from '@/lib/court/tribunal-map';

describe('tribunal-map', () => {
  it('cobre 91 tribunais (90 da biblioteca + TRE-GO)', () => {
    expect(ALL_TRIBUNAIS).toHaveLength(91);
  });

  it('cobre os 4 tribunais superiores com índice DataJud', () => {
    for (const sigla of ['TST', 'TSE', 'STJ', 'STM']) {
      expect(TRIBUNAL_MAP[sigla]?.segment).toBe('superior');
    }
  });

  it('cobre os 6 TRFs, 24 TRTs, 27 TREs, 27 TJs e 3 TJMs', () => {
    const bySegment = (segment: string) =>
      ALL_TRIBUNAIS.filter((t) => t.segment === segment).length;
    expect(bySegment('federal')).toBe(6);
    expect(bySegment('trabalho')).toBe(24);
    expect(bySegment('eleitoral')).toBe(27);
    expect(bySegment('estadual')).toBe(27);
    expect(bySegment('militar')).toBe(3);
  });

  it('inclui todos os 27 TREs, com TRE-GO (ausente no upstream)', () => {
    const ufs = [
      'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
      'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
      'SE', 'SP', 'TO',
    ];
    for (const uf of ufs) {
      expect(TRIBUNAL_MAP[`TRE-${uf}`], `TRE-${uf}`).toBeDefined();
    }
    expect(getDatajudAlias('TRE-GO')).toBe('tre-go');
  });

  it('TRE-DF usa o alias tre-dft', () => {
    expect(getDatajudAlias('TRE-DF')).toBe('tre-dft');
  });

  it('TJDF usa o alias tjdft', () => {
    expect(getDatajudAlias('TJDF')).toBe('tjdft');
  });

  it('justiça militar estadual usa aliases sem hífen', () => {
    expect(getDatajudAlias('TJM-RS')).toBe('tjmrs');
    expect(getDatajudAlias('TJM-SP')).toBe('tjmsp');
    expect(getDatajudAlias('TJM-MG')).toBe('tjmmg');
  });

  it('normaliza grafias sem hífen e caixa baixa', () => {
    expect(getDatajudAlias('TREAC')).toBe('tre-ac');
    expect(getDatajudAlias('tjmrs')).toBe('tjmrs');
    expect(getDatajudAlias('tre-go')).toBe('tre-go');
  });

  it('aceita as grafias upstream TJDFT e TREDFT', () => {
    expect(getDatajudAlias('TJDFT')).toBe('tjdft');
    expect(getDatajudAlias('TREDFT')).toBe('tre-dft');
  });

  it('STF e CNJ não têm índice público — retornam null', () => {
    expect(getDatajudAlias('STF')).toBeNull();
    expect(getDatajudAlias('CNJ')).toBeNull();
  });

  it('sigla desconhecida retorna null (sem fallback)', () => {
    expect(getDatajudAlias('XXXXX')).toBeNull();
    expect(getTribunalInfo('TJZZ')).toBeNull();
  });

  it('todos os aliases são válidos para compor api_publica_{alias}', () => {
    for (const t of ALL_TRIBUNAIS) {
      expect(t.alias, t.sigla).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('aliases são únicos', () => {
    const aliases = ALL_TRIBUNAIS.map((t) => t.alias);
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it('expõe nome por extenso para exibição', () => {
    expect(getTribunalDisplayName('TJSP')).toBe('Tribunal de Justiça de São Paulo');
    expect(getTribunalDisplayName('TRE-GO')).toBe('Tribunal Regional Eleitoral de Goiás');
    expect(getTribunalDisplayName('ZZZ')).toBeNull();
  });
});
