import { describe, expect, it } from 'vitest';
import {
  getAllowedActions,
  getNextStatus,
  TRANSITIONS,
  type ApprovalStatus,
  type ApprovalAction,
} from '@/lib/approval-workflow';

describe('approval-workflow', () => {
  // ─── getAllowedActions ─────────────────────────────────────────────────────

  describe('getAllowedActions', () => {
    it('draft permite apenas submit_for_review', () => {
      const actions = getAllowedActions('draft');
      expect(actions).toEqual(['submit_for_review']);
    });

    it('pending_review permite approve e request_revision', () => {
      const actions = getAllowedActions('pending_review');
      expect(actions).toContain('approve');
      expect(actions).toContain('request_revision');
      expect(actions).toHaveLength(2);
    });

    it('approved permite finalize e request_revision', () => {
      const actions = getAllowedActions('approved');
      expect(actions).toContain('finalize');
      expect(actions).toContain('request_revision');
    });

    it('revision_requested permite submit_for_review e revert_to_draft', () => {
      const actions = getAllowedActions('revision_requested');
      expect(actions).toContain('submit_for_review');
      expect(actions).toContain('revert_to_draft');
    });

    it('final não permite nenhuma ação (estado terminal)', () => {
      const actions = getAllowedActions('final');
      expect(actions).toHaveLength(0);
    });
  });

  // ─── getNextStatus ────────────────────────────────────────────────────────

  describe('getNextStatus', () => {
    it('draft + submit_for_review → pending_review', () => {
      expect(getNextStatus('draft', 'submit_for_review')).toBe('pending_review');
    });

    it('pending_review + approve → approved', () => {
      expect(getNextStatus('pending_review', 'approve')).toBe('approved');
    });

    it('pending_review + request_revision → revision_requested', () => {
      expect(getNextStatus('pending_review', 'request_revision')).toBe('revision_requested');
    });

    it('approved + finalize → final', () => {
      expect(getNextStatus('approved', 'finalize')).toBe('final');
    });

    it('approved + request_revision → revision_requested', () => {
      expect(getNextStatus('approved', 'request_revision')).toBe('revision_requested');
    });

    it('revision_requested + submit_for_review → pending_review', () => {
      expect(getNextStatus('revision_requested', 'submit_for_review')).toBe('pending_review');
    });

    it('revision_requested + revert_to_draft → draft', () => {
      expect(getNextStatus('revision_requested', 'revert_to_draft')).toBe('draft');
    });
  });

  // ─── Transições inválidas ─────────────────────────────────────────────────

  describe('transições inválidas retornam null', () => {
    it('draft + approve → null', () => {
      expect(getNextStatus('draft', 'approve')).toBeNull();
    });

    it('draft + finalize → null', () => {
      expect(getNextStatus('draft', 'finalize')).toBeNull();
    });

    it('final + qualquer ação → null', () => {
      const actions: ApprovalAction[] = [
        'submit_for_review',
        'approve',
        'request_revision',
        'finalize',
        'revert_to_draft',
      ];
      for (const action of actions) {
        expect(getNextStatus('final', action)).toBeNull();
      }
    });

    it('pending_review + revert_to_draft → null', () => {
      expect(getNextStatus('pending_review', 'revert_to_draft')).toBeNull();
    });

    it('pending_review + finalize → null', () => {
      expect(getNextStatus('pending_review', 'finalize')).toBeNull();
    });
  });

  // ─── Fluxo completo ───────────────────────────────────────────────────────

  describe('fluxo completo: draft → pending_review → approved → final', () => {
    it('executa a sequência completa de aprovação', () => {
      let status: ApprovalStatus = 'draft';

      status = getNextStatus(status, 'submit_for_review')!;
      expect(status).toBe('pending_review');

      status = getNextStatus(status, 'approve')!;
      expect(status).toBe('approved');

      status = getNextStatus(status, 'finalize')!;
      expect(status).toBe('final');
    });
  });

  // ─── Fluxo de revisão ─────────────────────────────────────────────────────

  describe('fluxo de revisão: pending_review → revision_requested → pending_review', () => {
    it('ciclo de revisão funciona corretamente', () => {
      let status: ApprovalStatus = 'draft';

      status = getNextStatus(status, 'submit_for_review')!;
      expect(status).toBe('pending_review');

      status = getNextStatus(status, 'request_revision')!;
      expect(status).toBe('revision_requested');

      status = getNextStatus(status, 'submit_for_review')!;
      expect(status).toBe('pending_review');

      // Agora aprova
      status = getNextStatus(status, 'approve')!;
      expect(status).toBe('approved');
    });
  });

  // ─── TRANSITIONS table ────────────────────────────────────────────────────

  describe('tabela TRANSITIONS', () => {
    it('possui todos os 5 status definidos', () => {
      const statuses: ApprovalStatus[] = [
        'draft', 'pending_review', 'approved', 'revision_requested', 'final',
      ];
      for (const s of statuses) {
        expect(TRANSITIONS).toHaveProperty(s);
      }
    });

    it('estado final não tem transições', () => {
      expect(Object.keys(TRANSITIONS.final)).toHaveLength(0);
    });
  });
});
