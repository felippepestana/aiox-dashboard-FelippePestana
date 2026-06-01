'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  FileJson,
  Clock,
} from 'lucide-react';
import type { ConsentPurpose, ConsentRecord, DataRetentionPolicy } from '@/lib/lgpd-compliance';
import { getDataRetentionPolicy } from '@/lib/lgpd-compliance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LGPDPanelProps {
  clientId: string;
  clientName?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  legal_representation: 'Representação Legal',
  marketing: 'Marketing e Comunicações',
  analytics: 'Análise e Relatórios',
  third_party_sharing: 'Compartilhamento com Terceiros',
  data_retention_extended: 'Retenção Estendida de Dados',
};

const PURPOSE_DESCRIPTIONS: Record<ConsentPurpose, string> = {
  legal_representation: 'Necessário para prestação dos serviços jurídicos. Obrigatório.',
  marketing: 'Envio de newsletters, informativos jurídicos e materiais de marketing.',
  analytics: 'Uso dos dados para análise de tendências e melhoria dos serviços.',
  third_party_sharing: 'Compartilhamento de dados com parceiros, peritos e correspondentes.',
  data_retention_extended: 'Manutenção dos dados além do período mínimo legal.',
};

const CONSENT_PURPOSES: ConsentPurpose[] = [
  'legal_representation',
  'marketing',
  'analytics',
  'third_party_sharing',
  'data_retention_extended',
];

const COMPLIANCE_CHECKLIST = [
  { id: 'privacy_notice', label: 'Aviso de Privacidade apresentado ao cliente', required: true },
  { id: 'legal_basis', label: 'Base legal identificada para cada tratamento', required: true },
  { id: 'data_mapping', label: 'Mapeamento de dados realizado', required: true },
  { id: 'dpo_appointed', label: 'DPO (Encarregado) designado', required: false },
  { id: 'security_measures', label: 'Medidas de segurança técnica implementadas', required: true },
  { id: 'incident_plan', label: 'Plano de resposta a incidentes definido', required: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LGPDPanel({ clientId, clientName }: LGPDPanelProps) {
  const [consents, setConsents] = useState<Record<ConsentPurpose, ConsentRecord | null>>(
    {} as Record<ConsentPurpose, ConsentRecord | null>,
  );
  const [retentionPolicy] = useState<DataRetentionPolicy[]>(getDataRetentionPolicy());
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [toggling, setToggling] = useState<ConsentPurpose | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
  const [anonymizing, setAnonymizing] = useState(false);
  const [anonymized, setAnonymized] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(COMPLIANCE_CHECKLIST.map((c) => [c.id, false])),
  );

  const loadConsents = useCallback(async () => {
    setLoadingConsents(true);
    try {
      const res = await fetch(`/api/legal/lgpd/consent?clientId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const data = await res.json();
        setConsents(data.consents ?? {});
      }
    } catch {
      // ignore — server may not have route yet
    } finally {
      setLoadingConsents(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  async function toggleConsent(purpose: ConsentPurpose, currentlyGranted: boolean) {
    if (purpose === 'legal_representation') return; // Cannot revoke mandatory consent
    setToggling(purpose);
    try {
      const res = await fetch('/api/legal/lgpd/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, purpose, granted: !currentlyGranted }),
      });
      if (res.ok) {
        setConsents((prev) => ({
          ...prev,
          [purpose]: {
            ...(prev[purpose] ?? { id: '', clientId, purpose }),
            granted: !currentlyGranted,
            grantedAt: !currentlyGranted ? new Date().toISOString() : prev[purpose]?.grantedAt ?? null,
            revokedAt: !currentlyGranted ? null : new Date().toISOString(),
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  }

  async function exportClientData() {
    setExportingData(true);
    try {
      const res = await fetch(`/api/legal/lgpd/export?clientId=${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados-cliente-${clientId}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: show error state
    } finally {
      setExportingData(false);
    }
  }

  async function anonymizeClient() {
    setAnonymizing(true);
    try {
      const res = await fetch('/api/legal/lgpd/anonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setAnonymized(true);
        setShowAnonymizeConfirm(false);
      }
    } catch {
      // ignore
    } finally {
      setAnonymizing(false);
    }
  }

  function isGranted(purpose: ConsentPurpose): boolean {
    const record = consents[purpose];
    return record?.granted ?? (purpose === 'legal_representation');
  }

  const grantedCount = CONSENT_PURPOSES.filter(isGranted).length;
  const checklistCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <ShieldCheck className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Conformidade LGPD</h3>
          <p className="text-xs text-[#6b7a8d]">
            {clientName ? `Cliente: ${clientName}` : `ID: ${clientId}`} · Lei 13.709/2018
          </p>
        </div>
      </div>

      {/* Anonymized banner */}
      {anonymized && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Dados anonimizados</p>
            <p className="text-xs text-[#8899aa] mt-0.5">
              Os dados pessoais deste cliente foram substituídos por dados sintéticos conforme solicitado.
            </p>
          </div>
        </div>
      )}

      {/* Actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export data */}
        <button
          onClick={exportClientData}
          disabled={exportingData || anonymized}
          className="flex items-center justify-between gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <FileJson className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Exportar Dados</p>
              <p className="text-[11px] text-[#6b7a8d]">Direito de Acesso — Art. 18, II</p>
            </div>
          </div>
          {exportingData ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          ) : (
            <Download className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {/* Anonymize */}
        <button
          onClick={() => setShowAnonymizeConfirm(true)}
          disabled={anonymized}
          className="flex items-center justify-between gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <Trash2 className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Anonimizar Dados</p>
              <p className="text-[11px] text-[#6b7a8d]">Direito ao Esquecimento — Art. 18, VI</p>
            </div>
          </div>
          <Trash2 className="h-4 w-4 text-[#6b7a8d]" />
        </button>
      </div>

      {/* Anonymize confirm dialog */}
      {showAnonymizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAnonymizeConfirm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0d1320] p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Confirmar Anonimização</h3>
                <p className="text-xs text-[#6b7a8d] mt-1">Esta ação é irreversível.</p>
              </div>
            </div>
            <p className="text-sm text-[#8899aa] mb-6">
              Todos os dados pessoais do cliente (nome, CPF/CNPJ, e-mail, telefone, endereço) serão
              substituídos por dados sintéticos. Registros processuais serão mantidos por obrigação legal
              (LGPD Art. 16, I).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAnonymizeConfirm(false)}
                className="flex-1 rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={anonymizeClient}
                disabled={anonymizing}
                className="flex-1 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {anonymizing ? 'Anonimizando...' : 'Confirmar Anonimização'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consent management */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Gestão de Consentimentos</h4>
          <span className="text-xs text-[#6b7a8d]">
            {grantedCount}/{CONSENT_PURPOSES.length} concedidos
          </span>
        </div>

        {loadingConsents ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {CONSENT_PURPOSES.map((purpose) => {
              const granted = isGranted(purpose);
              const mandatory = purpose === 'legal_representation';
              const isToggling = toggling === purpose;

              return (
                <div
                  key={purpose}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
                    granted
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-[#1a2332] bg-[#0a0f1a]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{PURPOSE_LABELS[purpose]}</p>
                      {mandatory && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6b7a8d] mt-0.5">{PURPOSE_DESCRIPTIONS[purpose]}</p>
                    {consents[purpose]?.grantedAt && (
                      <p className="text-[10px] text-[#4a5568] mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Concedido em {new Date(consents[purpose]!.grantedAt!).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleConsent(purpose, granted)}
                    disabled={mandatory || isToggling}
                    className="flex-shrink-0 mt-0.5 disabled:cursor-not-allowed"
                    title={mandatory ? 'Consentimento obrigatório não pode ser revogado' : undefined}
                  >
                    {isToggling ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    ) : granted ? (
                      <ToggleRight className={`h-6 w-6 ${mandatory ? 'text-amber-400' : 'text-green-400'}`} />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[#4a5568]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data retention status */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Políticas de Retenção de Dados
        </h4>
        <div className="space-y-2">
          {retentionPolicy.map((policy) => (
            <div
              key={policy.dataType}
              className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white capitalize">{policy.dataType.replace('_', ' ')}</p>
                <p className="text-[11px] text-[#6b7a8d] mt-0.5">{policy.legalBasis}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-400">
                  {Math.round(policy.retentionDays / 365)} anos
                </p>
                <p className="text-[11px] text-[#6b7a8d]">{policy.retentionDays} dias</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#8899aa]">
            Prazos calculados com base no CPC art. 206, CLT art. 11, CTN art. 174 e LGPD art. 15–16.
            Dados com obrigação legal de guarda não podem ser excluídos antes do prazo mínimo.
          </p>
        </div>
      </div>

      {/* Compliance checklist */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            Checklist de Conformidade
          </h4>
          <span className="text-xs text-[#6b7a8d]">
            {checklistCount}/{COMPLIANCE_CHECKLIST.length} concluídos
          </span>
        </div>

        <div className="space-y-2">
          {COMPLIANCE_CHECKLIST.map((item) => {
            const checked = checklist[item.id];
            return (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? 'border-green-500/50 bg-green-500/20'
                      : 'border-[#2a3444] bg-transparent'
                  }`}
                  onClick={() => setChecklist((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                >
                  {checked && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                </div>
                <span className={`flex-1 text-sm ${checked ? 'text-[#8899aa] line-through' : 'text-white'}`}>
                  {item.label}
                </span>
                {item.required ? (
                  <span className="text-[9px] font-bold uppercase text-red-400 border border-red-500/30 rounded-full px-1.5 py-0.5 bg-red-500/10">
                    Req
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase text-[#4a5568] border border-[#2a3444] rounded-full px-1.5 py-0.5">
                    Opt
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {/* Overall compliance status */}
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
          {checklistCount === COMPLIANCE_CHECKLIST.length ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-400">Checklist completo — conformidade verificada</p>
            </>
          ) : COMPLIANCE_CHECKLIST.filter((c) => c.required && !checklist[c.id]).length === 0 ? (
            <>
              <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-400">
                Requisitos obrigatórios atendidos — {COMPLIANCE_CHECKLIST.length - checklistCount} item(ns) opcionais pendentes
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium text-red-400">
                {COMPLIANCE_CHECKLIST.filter((c) => c.required && !checklist[c.id]).length} requisito(s) obrigatório(s) pendente(s)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
