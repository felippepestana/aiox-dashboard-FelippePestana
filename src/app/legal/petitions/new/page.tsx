'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { PetitionType } from '@/types/legal';

const PETITION_TYPES: { value: PetitionType; label: string }[] = [
  { value: 'inicial', label: 'Petição Inicial' },
  { value: 'contestacao', label: 'Contestação' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'embargo', label: 'Embargos de Declaração' },
  { value: 'agravo', label: 'Agravo de Instrumento' },
  { value: 'tutela', label: 'Tutela de Urgência' },
  { value: 'mandado_seguranca', label: 'Mandado de Segurança' },
  { value: 'habeas_corpus', label: 'Habeas Corpus' },
  { value: 'recurso_especial', label: 'Recurso Especial' },
  { value: 'recurso_extraordinario', label: 'Recurso Extraordinário' },
  { value: 'contrarrazoes', label: 'Contrarrazões' },
  { value: 'parecer', label: 'Parecer' },
  { value: 'outro', label: 'Outro' },
];

export default function NewPetitionPage() {
  const router = useRouter();
  const { addPetition, processes } = useLegalStore();

  const [form, setForm] = useState({
    processId: '',
    type: 'inicial' as PetitionType,
    title: '',
    content: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPetition({
      ...form,
      status: 'draft',
      documentIds: [],
    });
    router.push('/legal/petitions');
  };

  const fieldClass = "w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2 px-3 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20";
  const labelClass = "block text-xs font-medium text-[#8899aa] mb-1";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/legal/petitions" className="text-[#6b7a8d] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Peça Processual</h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Elabore uma nova peça com assistência do squad de análise</p>
        </div>
      </div>

      {/* Squad Integration Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-400">Assistência por IA</h3>
            <p className="text-xs text-[#8899aa] mt-1">
              Ao salvar o rascunho, o squad <strong>case-analysis</strong> pode ser acionado para auxiliar na
              fundamentação, pesquisa jurisprudencial e revisão da peça. Selecione o tipo de peça e o processo
              vinculado para ativar os templates disponíveis.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Processo Vinculado *</label>
            <select className={fieldClass} value={form.processId} onChange={(e) => setForm({ ...form, processId: e.target.value })} required>
              <option value="">Selecione um processo</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>{p.cnj} — {p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de Peça *</label>
            <select className={fieldClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PetitionType })}>
              {PETITION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Título *</label>
            <input type="text" placeholder="Título da peça" className={fieldClass}
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className={labelClass}>Conteúdo da Peça</label>
          <textarea
            className={`${fieldClass} min-h-[400px] font-mono text-xs leading-relaxed`}
            placeholder="Redija o conteúdo da peça processual aqui...&#10;&#10;Dica: Use os templates do squad case-analysis como ponto de partida."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-[#1a2332]">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-amber-500/20 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Sparkles className="h-4 w-4" />
            Acionar Squad
          </button>
          <div className="flex gap-3">
            <Link href="/legal/petitions" className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors">
              Cancelar
            </Link>
            <button type="submit" className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
              <Save className="h-4 w-4" />
              Salvar Rascunho
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
