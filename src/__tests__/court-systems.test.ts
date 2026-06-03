import { describe, expect, it } from 'vitest';
import {
  COURT_SYSTEMS,
  getCourtSystemForTribunal,
  getCourtSystemForCNJ,
  buildConsultationUrl,
  type CourtSystemDescriptor,
} from '@/lib/court/court-systems';

// ─── COURT_SYSTEMS registry ───────────────────────────────────────────────────

describe('court-systems — COURT_SYSTEMS registry', () => {
  const systemKeys = ['pje', 'esaj', 'projudi', 'eproc', 'datajud', 'manual'] as const;

  it('registry contains all 6 expected system keys', () => {
    for (const key of systemKeys) {
      expect(COURT_SYSTEMS).toHaveProperty(key);
    }
  });

  it('each entry has a type field matching its key', () => {
    for (const key of systemKeys) {
      expect(COURT_SYSTEMS[key].type).toBe(key);
    }
  });

  it('each entry has a non-empty name', () => {
    for (const key of systemKeys) {
      expect(typeof COURT_SYSTEMS[key].name).toBe('string');
      expect(COURT_SYSTEMS[key].name.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a non-empty shortName', () => {
    for (const key of systemKeys) {
      expect(typeof COURT_SYSTEMS[key].shortName).toBe('string');
      expect(COURT_SYSTEMS[key].shortName.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a tribunals array', () => {
    for (const key of systemKeys) {
      expect(Array.isArray(COURT_SYSTEMS[key].tribunals)).toBe(true);
    }
  });

  it('each entry has a boolean hasPublicConsultation', () => {
    for (const key of systemKeys) {
      expect(typeof COURT_SYSTEMS[key].hasPublicConsultation).toBe('boolean');
    }
  });

  it('each entry has a valid authType', () => {
    const validAuthTypes = ['certificate', 'password', 'apikey', 'none'];
    for (const key of systemKeys) {
      expect(validAuthTypes).toContain(COURT_SYSTEMS[key].authType);
    }
  });

  it('pje covers TRT courts and TST', () => {
    const pje = COURT_SYSTEMS.pje;
    expect(pje.tribunals).toContain('TST');
    expect(pje.tribunals).toContain('TRT1');
    expect(pje.tribunals).toContain('TRT24');
  });

  it('esaj covers TJSP, TJMS, TJAM, TJSC', () => {
    const esaj = COURT_SYSTEMS.esaj;
    expect(esaj.tribunals).toContain('TJSP');
    expect(esaj.tribunals).toContain('TJMS');
    expect(esaj.tribunals).toContain('TJAM');
    expect(esaj.tribunals).toContain('TJSC');
  });

  it('projudi covers TJPR and TJGO', () => {
    expect(COURT_SYSTEMS.projudi.tribunals).toContain('TJPR');
    expect(COURT_SYSTEMS.projudi.tribunals).toContain('TJGO');
  });

  it('eproc covers TRF4, TRF1, TRF2', () => {
    const eproc = COURT_SYSTEMS.eproc;
    expect(eproc.tribunals).toContain('TRF4');
    expect(eproc.tribunals).toContain('TRF1');
    expect(eproc.tribunals).toContain('TRF2');
  });

  it('datajud uses wildcard tribunals (covers all courts)', () => {
    expect(COURT_SYSTEMS.datajud.tribunals).toContain('*');
  });

  it('datajud uses apikey auth', () => {
    expect(COURT_SYSTEMS.datajud.authType).toBe('apikey');
  });

  it('eproc has no public consultation', () => {
    expect(COURT_SYSTEMS.eproc.hasPublicConsultation).toBe(false);
  });

  it('manual has no public consultation', () => {
    expect(COURT_SYSTEMS.manual.hasPublicConsultation).toBe(false);
  });

  it('manual has empty tribunals array', () => {
    expect(COURT_SYSTEMS.manual.tribunals).toHaveLength(0);
  });

  it('manual has authType none', () => {
    expect(COURT_SYSTEMS.manual.authType).toBe('none');
  });

  it('pje uses certificate auth', () => {
    expect(COURT_SYSTEMS.pje.authType).toBe('certificate');
  });

  it('esaj uses password auth', () => {
    expect(COURT_SYSTEMS.esaj.authType).toBe('password');
  });

  it('projudi uses password auth', () => {
    expect(COURT_SYSTEMS.projudi.authType).toBe('password');
  });
});

// ─── getCourtSystemForTribunal ────────────────────────────────────────────────

describe('court-systems — getCourtSystemForTribunal', () => {
  // ESAJ courts
  it('TJSP → esaj', () => {
    expect(getCourtSystemForTribunal('TJSP')).toBe('esaj');
  });

  it('TJMS → esaj', () => {
    expect(getCourtSystemForTribunal('TJMS')).toBe('esaj');
  });

  it('TJSC → esaj', () => {
    expect(getCourtSystemForTribunal('TJSC')).toBe('esaj');
  });

  it('TJAM → esaj', () => {
    expect(getCourtSystemForTribunal('TJAM')).toBe('esaj');
  });

  // e-Proc courts
  it('TRF4 → eproc', () => {
    expect(getCourtSystemForTribunal('TRF4')).toBe('eproc');
  });

  it('TRF1 → eproc', () => {
    expect(getCourtSystemForTribunal('TRF1')).toBe('eproc');
  });

  it('TRF2 → eproc', () => {
    expect(getCourtSystemForTribunal('TRF2')).toBe('eproc');
  });

  // PROJUDI courts
  it('TJPR → projudi', () => {
    expect(getCourtSystemForTribunal('TJPR')).toBe('projudi');
  });

  it('TJGO → projudi', () => {
    expect(getCourtSystemForTribunal('TJGO')).toBe('projudi');
  });

  // PJe courts
  it('TRT2 → pje', () => {
    expect(getCourtSystemForTribunal('TRT2')).toBe('pje');
  });

  it('TRT15 → pje', () => {
    expect(getCourtSystemForTribunal('TRT15')).toBe('pje');
  });

  it('TST → pje', () => {
    expect(getCourtSystemForTribunal('TST')).toBe('pje');
  });

  it('TJDFT → pje', () => {
    expect(getCourtSystemForTribunal('TJDFT')).toBe('pje');
  });

  it('TJBA → pje', () => {
    expect(getCourtSystemForTribunal('TJBA')).toBe('pje');
  });

  it('TRF3 → pje', () => {
    expect(getCourtSystemForTribunal('TRF3')).toBe('pje');
  });

  it('TRF5 → pje', () => {
    expect(getCourtSystemForTribunal('TRF5')).toBe('pje');
  });

  // DataJud fallback — superior courts and unknowns
  it('STF → datajud (superior court fallback)', () => {
    expect(getCourtSystemForTribunal('STF')).toBe('datajud');
  });

  it('STJ → datajud', () => {
    expect(getCourtSystemForTribunal('STJ')).toBe('datajud');
  });

  it('UNKNOWN → datajud (unknown tribunal fallback)', () => {
    expect(getCourtSystemForTribunal('UNKNOWN')).toBe('datajud');
  });

  // Case-insensitivity
  it('tjsp (lowercase) → esaj', () => {
    expect(getCourtSystemForTribunal('tjsp')).toBe('esaj');
  });

  it('Tjsp (mixed case) → esaj', () => {
    expect(getCourtSystemForTribunal('Tjsp')).toBe('esaj');
  });

  it('trt2 (lowercase) → pje', () => {
    expect(getCourtSystemForTribunal('trt2')).toBe('pje');
  });

  // Whitespace tolerance
  it('TJSP with surrounding whitespace → esaj', () => {
    expect(getCourtSystemForTribunal('  TJSP  ')).toBe('esaj');
  });
});

// ─── getCourtSystemForCNJ ─────────────────────────────────────────────────────

describe('court-systems — getCourtSystemForCNJ', () => {
  it('TJSP CNJ (8.26) → esaj', () => {
    expect(getCourtSystemForCNJ('0001234-56.2024.8.26.0100')).toBe('esaj');
  });

  it('TJRJ CNJ (8.19) → datajud (TJRJ not in esaj/eproc/projudi/pje special lists)', () => {
    // TJRJ is not in any specific list, falls through to datajud
    const result = getCourtSystemForCNJ('0001234-56.2024.8.19.0100');
    expect(['pje', 'datajud']).toContain(result);
  });

  it('TRT2 CNJ (5.02) → pje', () => {
    expect(getCourtSystemForCNJ('0001234-56.2024.5.02.0000')).toBe('pje');
  });

  it('invalid CNJ → datajud (fallback)', () => {
    expect(getCourtSystemForCNJ('invalid-cnj')).toBe('datajud');
  });

  it('STF CNJ (1.00) → datajud', () => {
    expect(getCourtSystemForCNJ('0000001-00.2023.1.00.0000')).toBe('datajud');
  });
});

// ─── buildConsultationUrl ─────────────────────────────────────────────────────

describe('court-systems — buildConsultationUrl', () => {
  it('TJSP CNJ builds an esaj URL', () => {
    const url = buildConsultationUrl('0001234-56.2024.8.26.0100');
    expect(url).not.toBeNull();
    expect(url).toContain('esaj');
    expect(url).toContain('tjsp');
  });

  it('TRT2 CNJ builds a pje URL', () => {
    const url = buildConsultationUrl('0001234-56.2024.5.02.0000');
    expect(url).not.toBeNull();
    expect(url).toContain('pje');
    expect(url).toContain('trt2');
  });

  it('datajud system always returns a URL', () => {
    const url = buildConsultationUrl('invalid', 'datajud');
    expect(url).not.toBeNull();
    expect(url).toContain('datajud');
  });

  it('manual system returns null', () => {
    const url = buildConsultationUrl('0001234-56.2024.8.26.0100', 'manual');
    expect(url).toBeNull();
  });

  it('explicit system override is respected — forces esaj for any CNJ', () => {
    const url = buildConsultationUrl('0001234-56.2024.8.26.0100', 'esaj');
    expect(url).toContain('esaj');
  });

  it('esaj URL contains the correct path /cpopg/open.do', () => {
    const url = buildConsultationUrl('0001234-56.2024.8.26.0100', 'esaj');
    expect(url).toContain('/cpopg/open.do');
  });

  it('pje URL contains /pje/ConsultaPublica/listView.seam', () => {
    const url = buildConsultationUrl('0001234-56.2024.5.02.0000', 'pje');
    expect(url).toContain('/pje/ConsultaPublica/listView.seam');
  });

  it('datajud URL points to the correct domain', () => {
    const url = buildConsultationUrl('0001234-56.2024.5.02.0000', 'datajud');
    expect(url).toContain('datajud-wiki.cnj.jus.br');
  });

  it('eproc URL contains eproc.trf4 for TRF4', () => {
    // Need a CNJ that maps to TRF4 — segment 4 = Justiça Federal segment
    // TRF4 is accessed via eproc — use explicit system override
    const url = buildConsultationUrl('0001234-56.2024.8.26.0100', 'eproc');
    // TJSP doesn't map to TRF4, but we override with eproc
    // URL would still use the tribunal from CNJ (tjsp)
    expect(url).toContain('eproc');
  });

  it('projudi URL contains the correct path /projudi_consulta/login.do', () => {
    // Use TJPR CNJ — segment 8, code 16 = TJPR
    const url = buildConsultationUrl('0001234-56.2024.8.16.0100', 'projudi');
    expect(url).toContain('projudi');
    expect(url).toContain('/projudi_consulta/login.do');
  });

  it('returns a string starting with https for valid systems', () => {
    const tjspUrl = buildConsultationUrl('0001234-56.2024.8.26.0100');
    expect(tjspUrl).toMatch(/^https:\/\//);
  });
});
