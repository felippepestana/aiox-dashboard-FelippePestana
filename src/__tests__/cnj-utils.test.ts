import { describe, expect, it } from 'vitest';
import {
  isValidCNJ,
  parseCNJ,
  getTribunalFromCNJ,
  getDatajudIndex,
} from '@/lib/court/cnj-utils';

describe('cnj-utils', () => {
  // ─── isValidCNJ ───────────────────────────────────────────────────────────

  describe('isValidCNJ', () => {
    it('formato válido TJSP retorna true', () => {
      expect(isValidCNJ('0001234-56.2024.8.26.0100')).toBe(true);
    });

    it('formato válido STF retorna true', () => {
      expect(isValidCNJ('0000001-00.2023.1.00.0000')).toBe(true);
    });

    it('formato válido TRT2 retorna true', () => {
      expect(isValidCNJ('0001234-56.2024.5.02.0000')).toBe(true);
    });

    it('número sem separadores retorna false', () => {
      expect(isValidCNJ('00012345620248260100')).toBe(false);
    });

    it('número com dígitos insuficientes retorna false', () => {
      expect(isValidCNJ('123456')).toBe(false);
    });

    it('string vazia retorna false', () => {
      expect(isValidCNJ('')).toBe(false);
    });

    it('número com letras retorna false', () => {
      expect(isValidCNJ('0001234-AB.2024.8.26.0100')).toBe(false);
    });

    it('espaços no início/fim são ignorados (trim)', () => {
      expect(isValidCNJ('  0001234-56.2024.8.26.0100  ')).toBe(true);
    });
  });

  // ─── parseCNJ ─────────────────────────────────────────────────────────────

  describe('parseCNJ', () => {
    const validCNJ = '0001234-56.2024.8.26.0100';

    it('retorna null para CNJ inválido', () => {
      expect(parseCNJ('invalido')).toBeNull();
    });

    it('extrai sequencial (7 dígitos)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.sequencial).toBe('0001234');
    });

    it('extrai dígito verificador (2 dígitos)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.digito).toBe('56');
    });

    it('extrai ano (4 dígitos)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.ano).toBe('2024');
    });

    it('extrai segmento de justiça', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.justica).toBe('8'); // Justiça Estadual
    });

    it('extrai código do tribunal', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.tribunal).toBe('26'); // SP
    });

    it('extrai origem (vara/comarca)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.origem).toBe('0100');
    });

    it('extrai tribunalName corretamente para TJSP', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.tribunalName).toBe('TJSP');
    });

    it('inclui raw com o valor original', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.raw).toBe(validCNJ);
    });

    it('inclui datajudIndex', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.datajudIndex).toBe('api_publica_tjsp');
    });
  });

  // ─── Mapeamento de tribunal ───────────────────────────────────────────────

  describe('mapeamento de tribunal', () => {
    it('segmento 1 → STF', () => {
      const parsed = parseCNJ('0000001-00.2023.1.00.0000');
      expect(parsed?.tribunalName).toBe('STF');
    });

    it('segmento 2 código 00 → CNJ', () => {
      const parsed = parseCNJ('0000001-00.2023.2.00.0000');
      expect(parsed?.tribunalName).toBe('CNJ');
    });

    it('segmento 2 código diferente de 00 → STJ', () => {
      const parsed = parseCNJ('0000001-00.2023.2.01.0000');
      expect(parsed?.tribunalName).toBe('STJ');
    });

    it('segmento 5 → Justiça do Trabalho (TRT)', () => {
      const parsed = parseCNJ('0001234-56.2024.5.02.0000');
      expect(parsed?.tribunalName).toBe('TRT2');
    });

    it('segmento 5 código 00 → TST', () => {
      const parsed = parseCNJ('0001234-56.2024.5.00.0000');
      expect(parsed?.tribunalName).toBe('TST');
    });

    it('segmento 8 código 19 → TJRJ', () => {
      const parsed = parseCNJ('0001234-56.2024.8.19.0100');
      expect(parsed?.tribunalName).toBe('TJRJ');
    });

    it('segmento 9 → Justiça Federal (TRF)', () => {
      const parsed = parseCNJ('0001234-56.2024.9.03.0000');
      expect(parsed?.tribunalName).toBe('TRF3');
    });
  });

  // ─── getTribunalFromCNJ ───────────────────────────────────────────────────

  describe('getTribunalFromCNJ', () => {
    it('retorna nome do tribunal para CNJ válido', () => {
      expect(getTribunalFromCNJ('0001234-56.2024.8.26.0100')).toBe('TJSP');
    });

    it('retorna null para CNJ inválido', () => {
      expect(getTribunalFromCNJ('invalido')).toBeNull();
    });

    it('detecta TJMG corretamente', () => {
      expect(getTribunalFromCNJ('0001234-56.2024.8.13.0100')).toBe('TJMG');
    });
  });

  // ─── getDatajudIndex ──────────────────────────────────────────────────────

  describe('getDatajudIndex', () => {
    it('TJSP → api_publica_tjsp', () => {
      expect(getDatajudIndex('TJSP')).toBe('api_publica_tjsp');
    });

    it('STF → api_publica_stf', () => {
      expect(getDatajudIndex('STF')).toBe('api_publica_stf');
    });

    it('TRF3 → api_publica_trf3', () => {
      expect(getDatajudIndex('TRF3')).toBe('api_publica_trf3');
    });

    it('TST → api_publica_tst', () => {
      expect(getDatajudIndex('TST')).toBe('api_publica_tst');
    });

    it('desconhecido cai em fallback api_publica_tjsp', () => {
      expect(getDatajudIndex('XXXXX')).toBe('api_publica_tjsp');
    });

    it('TJDF → api_publica_tjdft (sufixo especial)', () => {
      expect(getDatajudIndex('TJDF')).toBe('api_publica_tjdft');
    });

    it('case-insensitive', () => {
      expect(getDatajudIndex('tjsp')).toBe('api_publica_tjsp');
    });
  });
});
