'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useLegalStore } from '@/stores/legal-store';
import type { LegalArea, CourtSystem, UrgencyLevel, FeeType } from '@/types/legal';

const AREAS: { value: LegalArea; label: string }[] = [
  { value: 'civil', label: 'Cível' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'penal', label: 'Penal' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Família' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'digital', label: 'Digital' },
];

const COURTS: { value: CourtSystem; label: string }[] = [
  { value: 'pje', label: 'PJE' },
  { value: 'esaj', label: 'e-SAJ' },
  { value: 'eproc', label: 'e-Proc' },
  { value: 'projudi', label: 'PROJUDI' },
  { value: 'manual', label: 'Manual' },
];

export default function NewProcessPage() {
  const router = useRouter();
  const { addProcess, clients } = useLegalStore();

  const [form, setForm] = useState({
    cnj: '',
    title: '',
    area: 'civil' as LegalArea,
    court: '',
    judge: '',
    vara: '',
    comarca: '',
    state: '',
    clientId: '',
    opposingParty: '',
    opposingLawyer: '',
    urgency: 'medium' as UrgencyLevel,
    courtSystem: 'pje' as CourtSystem,
    object: '',
    causeValue: 0,
    feeType: 'fixed' as FeeType,
    feeAmount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProcess({
      ...form,
      status: 'active',
      contingencyPct: form.feeType === 'contingency' ? 30 : undefined,
      tags: [],
    });
    router.push('/legal/processes');
  };

  const fieldClass = "w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2 px-3 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20";
  const labelClass = "block text-xs font-medium text-[#8899aa] mb-1";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/legal/processes" className="text-[#6b7a8d] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo Processo</h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Cadastre um novo processo judicial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 space-y-6">
        {/* Identification */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Identificação</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Número CNJ *</label>
              <input type="text" placeholder="0000000-00.0000.0.00.0000" className={fieldClass}
                value={form.cnj} onChange={(e) => setForm({ ...form, cnj: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Título *</label>
              <input type="text" placeholder="Título do processo" className={fieldClass}
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Área do Direito *</label>
              <select className={fieldClass} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as LegalArea })}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sistema do Tribunal</label>
              <select className={fieldClass} value={form.courtSystem} onChange={(e) => setForm({ ...form, courtSystem: e.target.value as CourtSystem })}>
                {COURTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Court Info */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Tribunal</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Tribunal</label>
              <input type="text" placeholder="Ex: TJSP" className={fieldClass}
                value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Vara</label>
              <input type="text" placeholder="Ex: 1ª Vara Cível" className={fieldClass}
                value={form.vara} onChange={(e) => setForm({ ...form, vara: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Comarca</label>
              <input type="text" placeholder="Ex: São Paulo" className={fieldClass}
                value={form.comarca} onChange={(e) => setForm({ ...form, comarca: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <input type="text" placeholder="Ex: SP" className={fieldClass}
                value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Juiz</label>
              <input type="text" placeholder="Nome do juiz" className={fieldClass}
                value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Urgência</label>
              <select className={fieldClass} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value as UrgencyLevel })}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Partes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Cliente</label>
              <select className={fieldClass} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Selecione um cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Parte Contrária</label>
              <input type="text" placeholder="Nome da parte contrária" className={fieldClass}
                value={form.opposingParty} onChange={(e) => setForm({ ...form, opposingParty: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Advogado da Parte Contrária</label>
              <input type="text" placeholder="Nome do advogado" className={fieldClass}
                value={form.opposingLawyer} onChange={(e) => setForm({ ...form, opposingLawyer: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Objeto da Ação</label>
              <input type="text" placeholder="Descrição do objeto" className={fieldClass}
                value={form.object} onChange={(e) => setForm({ ...form, object: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Financial */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Financeiro</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Valor da Causa (R$)</label>
              <input type="number" placeholder="0,00" className={fieldClass}
                value={form.causeValue / 100 || ''} onChange={(e) => setForm({ ...form, causeValue: Math.round(parseFloat(e.target.value || '0') * 100) })} />
            </div>
            <div>
              <label className={labelClass}>Tipo de Honorário</label>
              <select className={fieldClass} value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value as FeeType })}>
                <option value="fixed">Fixo</option>
                <option value="hourly">Por Hora</option>
                <option value="contingency">Êxito</option>
                <option value="mixed">Misto</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Valor do Honorário (R$)</label>
              <input type="number" placeholder="0,00" className={fieldClass}
                value={form.feeAmount / 100 || ''} onChange={(e) => setForm({ ...form, feeAmount: Math.round(parseFloat(e.target.value || '0') * 100) })} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#1a2332]">
          <Link href="/legal/processes" className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
            <Save className="h-4 w-4" />
            Cadastrar Processo
          </button>
        </div>
      </form>
    </div>
  );
}
