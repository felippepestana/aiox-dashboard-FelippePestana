import { describe, expect, it } from 'vitest';
import {
  isValidCNJ,
  hasValidCNJCheckDigit,
  parseCNJ,
  getTribunalFromCNJ,
  getDatajudIndex,
} from '@/lib/court/cnj-utils';

// All fixtures below carry REAL mod-97 check digits (Resolução CNJ 65/2008):
// DD = 98 - ((NNNNNNN + AAAA + J + TR + OOOO concatenated) * 100 mod 97)
const CNJ_TJSP  = '0001234-71.2024.8.26.0100';
const CNJ_TRT2  = '0001234-98.2024.5.02.0000';
const CNJ_STF   = '0000001-90.2023.1.00.0000';

describe('cnj-utils', () => {
  // ─── hasValidCNJCheckDigit ───────────────────────────────────────────────

  describe('hasValidCNJCheckDigit', () => {
    it('aceita dígito verificador correto', () => {
      expect(hasValidCNJCheckDigit(CNJ_TJSP)).toBe(true);
      expect(hasValidCNJCheckDigit(CNJ_TRT2)).toBe(true);
    });

    it('rejeita dígito verificador incorreto', () => {
      expect(hasValidCNJCheckDigit('0001234-56.2024.8.26.0100')).toBe(false);
      expect(hasValidCNJCheckDigit('0001234-72.2024.8.26.0100')).toBe(false);
    });

    it('rejeita formato inválido', () => {
      expect(hasValidCNJCheckDigit('123456')).toBe(false);
    });
  });

  // ─── isValidCNJ ───────────────────────────────────────────────────────────

  describe('isValidCNJ', () => {
    it('formato e dígito válidos TJSP retorna true', () => {
      expect(isValidCNJ(CNJ_TJSP)).toBe(true);
    });

    it('formato e dígito válidos STF retorna true', () => {
      expect(isValidCNJ(CNJ_STF)).toBe(true);
    });

    it('formato e dígito válidos TRT2 retorna true', () => {
      expect(isValidCNJ(CNJ_TRT2)).toBe(true);
    });

    it('formato válido com dígito verificador errado retorna false', () => {
      expect(isValidCNJ('0001234-56.2024.8.26.0100')).toBe(false);
    });

    it('número sem separadores retorna false', () => {
      expect(isValidCNJ('00012347120248260100')).toBe(false);
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
      expect(isValidCNJ(`  ${CNJ_TJSP}  `)).toBe(true);
    });
  });

  // ─── parseCNJ ─────────────────────────────────────────────────────────────

  describe('parseCNJ', () => {
    const validCNJ = CNJ_TJSP;

    it('retorna null para CNJ inválido', () => {
      expect(parseCNJ('invalido')).toBeNull();
    });

    it('retorna null para dígito verificador errado', () => {
      expect(parseCNJ('0001234-56.2024.8.26.0100')).toBeNull();
    });

    it('extrai sequencial (7 dígitos)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.sequencial).toBe('0001234');
    });

    it('extrai dígito verificador (2 dígitos)', () => {
      const parsed = parseCNJ(validCNJ);
      expect(parsed?.digito).toBe('71');
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
    it('segmento 1 → STF (sem índice DataJud)', () => {
      const parsed = parseCNJ(CNJ_STF);
      expect(parsed?.tribunalName).toBe('STF');
      expect(parsed?.datajudIndex).toBeNull();
    });

    it('segmento 2 código 00 → CNJ (sem índice DataJud)', () => {
      const parsed = parseCNJ('0000001-09.2023.2.00.0000');
      expect(parsed?.tribunalName).toBe('CNJ');
      expect(parsed?.datajudIndex).toBeNull();
    });

    it('segmento 2 código diferente de 00 → STJ', () => {
      const parsed = parseCNJ('0000001-79.2023.2.01.0000');
      expect(parsed?.tribunalName).toBe('STJ');
      expect(parsed?.datajudIndex).toBe('api_publica_stj');
    });

    it('segmento 3 → TSE', () => {
      const parsed = parseCNJ('0000001-88.2024.3.00.0000');
      expect(parsed?.tribunalName).toBe('TSE');
      expect(parsed?.datajudIndex).toBe('api_publica_tse');
    });

    it('segmento 5 → Justiça do Trabalho (TRT)', () => {
      const parsed = parseCNJ(CNJ_TRT2);
      expect(parsed?.tribunalName).toBe('TRT2');
      expect(parsed?.datajudIndex).toBe('api_publica_trt2');
    });

    it('segmento 5 código 00 → TST', () => {
      const parsed = parseCNJ('0001234-55.2024.5.00.0000');
      expect(parsed?.tribunalName).toBe('TST');
    });

    it('segmento 6 → Justiça Eleitoral (TRE-DF com alias tre-dft)', () => {
      const parsed = parseCNJ('0000001-41.2024.6.07.0001');
      expect(parsed?.tribunalName).toBe('TRE-DF');
      expect(parsed?.datajudIndex).toBe('api_publica_tre-dft');
    });

    it('segmento 6 → TRE-GO (ausente no upstream, corrigido aqui)', () => {
      const parsed = parseCNJ('0000001-84.2024.6.09.0001');
      expect(parsed?.tribunalName).toBe('TRE-GO');
      expect(parsed?.datajudIndex).toBe('api_publica_tre-go');
    });

    it('segmento 7 → Justiça Militar Estadual (TJM-RS)', () => {
      const parsed = parseCNJ('0000001-67.2024.7.21.0001');
      expect(parsed?.tribunalName).toBe('TJM-RS');
      expect(parsed?.datajudIndex).toBe('api_publica_tjmrs');
    });

    it('segmento 8 código 19 → TJRJ', () => {
      const parsed = parseCNJ('0001234-66.2024.8.19.0100');
      expect(parsed?.tribunalName).toBe('TJRJ');
    });

    it('segmento 8 código 07 → TJDF com alias tjdft', () => {
      const parsed = parseCNJ('0000001-67.2024.8.07.0100');
      expect(parsed?.tribunalName).toBe('TJDF');
      expect(parsed?.datajudIndex).toBe('api_publica_tjdft');
    });

    it('segmento 9 → Justiça Federal (TRF)', () => {
      const parsed = parseCNJ('0001234-38.2024.9.03.0000');
      expect(parsed?.tribunalName).toBe('TRF3');
      expect(parsed?.datajudIndex).toBe('api_publica_trf3');
    });
  });

  // ─── getTribunalFromCNJ ───────────────────────────────────────────────────

  describe('getTribunalFromCNJ', () => {
    it('retorna nome do tribunal para CNJ válido', () => {
      expect(getTribunalFromCNJ(CNJ_TJSP)).toBe('TJSP');
    });

    it('retorna null para CNJ inválido', () => {
      expect(getTribunalFromCNJ('invalido')).toBeNull();
    });

    it('detecta TJMG corretamente', () => {
      expect(getTribunalFromCNJ('0001234-34.2024.8.13.0100')).toBe('TJMG');
    });
  });

  // ─── getDatajudIndex ──────────────────────────────────────────────────────

  describe('getDatajudIndex', () => {
    it('TJSP → api_publica_tjsp', () => {
      expect(getDatajudIndex('TJSP')).toBe('api_publica_tjsp');
    });

    it('STF → null (sem cobertura na API pública)', () => {
      expect(getDatajudIndex('STF')).toBeNull();
    });

    it('TRF3 → api_publica_trf3', () => {
      expect(getDatajudIndex('TRF3')).toBe('api_publica_trf3');
    });

    it('TST → api_publica_tst', () => {
      expect(getDatajudIndex('TST')).toBe('api_publica_tst');
    });

    it('desconhecido retorna null (sem fallback TJSP)', () => {
      expect(getDatajudIndex('XXXXX')).toBeNull();
    });

    it('TRE-AC → api_publica_tre-ac (alias hifenizado)', () => {
      expect(getDatajudIndex('TRE-AC')).toBe('api_publica_tre-ac');
    });

    it('TJM-SP → api_publica_tjmsp', () => {
      expect(getDatajudIndex('TJM-SP')).toBe('api_publica_tjmsp');
    });

    it('TJDF → api_publica_tjdft (sufixo especial)', () => {
      expect(getDatajudIndex('TJDF')).toBe('api_publica_tjdft');
    });

    it('case-insensitive', () => {
      expect(getDatajudIndex('tjsp')).toBe('api_publica_tjsp');
    });
  });
});
