'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, LayoutTemplate, PenLine, FileText, ClipboardList, Edit, CheckCircle } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { PageHeader } from '@/components/legal/shared';
import { PetitionTemplateSelector } from '@/components/legal/PetitionTemplateSelector';
import { PetitionTemplateEditor } from '@/components/legal/PetitionTemplateEditor';
import { MultiStepForm } from '@/components/legal/MultiStepForm';
import type { PetitionType } from '@/types/legal';
import type { PetitionTemplate } from '@/lib/petition-templates';

type NewPetitionMode = 'choose' | 'template-select' | 'template-edit' | 'scratch' | 'assisted';

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
  const { addPetition, processes, getClientById } = useLegalStore();

  const [mode, setMode] = useState<NewPetitionMode>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<PetitionTemplate | null>(null);

  // Scratch form state
  const [form, setForm] = useState({
    processId: '',
    type: 'inicial' as PetitionType,
    title: '',
    content: '',
  });

  // Template-based form state (processId selected before editor opens)
  const [templateProcessId, setTemplateProcessId] = useState('');

  const fieldClass =
    'w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2 px-3 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20';
  const labelClass = 'block text-xs font-medium text-[#8899aa] mb-1';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleScratchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPetition({
      ...form,
      status: 'draft',
      documentIds: [],
    });
    router.push('/legal/petitions');
  };

  const handleTemplateSelect = (template: PetitionTemplate) => {
    setSelectedTemplate(template);
    setMode('template-edit');
  };

  const handleTemplateSave = (content: string, title: string) => {
    addPetition({
      processId: templateProcessId,
      type: (selectedTemplate?.petitionType as PetitionType) ?? 'outro',
      title,
      content,
      status: 'draft',
      documentIds: [],
      templateId: selectedTemplate?.id,
    });
    router.push('/legal/petitions');
  };

  // Get linked process/client for the template editor auto-fill
  const linkedProcess = processes.find((p) => p.id === templateProcessId);
  const linkedClient = linkedProcess ? getClientById(linkedProcess.clientId) : undefined;

  const baseBreadcrumbs = [
    { label: 'Dashboard', href: '/legal' },
    { label: 'Petições', href: '/legal/petitions' },
    { label: 'Nova Petição', href: '/legal/petitions/new' },
  ];

  // ── Mode: Choose ──────────────────────────────────────────────────────────

  if (mode === 'choose') {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Nova Peça Processual"
          subtitle="Escolha como deseja criar a nova peça"
          breadcrumbs={baseBreadcrumbs}
          actions={
            <button
              type="button"
              onClick={() => router.push('/legal/petitions')}
              className="flex items-center gap-2 text-[#6b7a8d] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
        />

        {/* Option cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
          {/* Template */}
          <button
            type="button"
            onClick={() => setMode('template-select')}
            className="group rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4 group-hover:bg-amber-500/20 transition-colors">
              <LayoutTemplate className="h-6 w-6 text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Usar Template</h2>
            <p className="text-sm text-[#6b7a8d] leading-relaxed">
              Escolha entre 10 modelos prontos de peças brasileiras com estrutura legal completa e
              preenchimento automático de variáveis.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400">
              <Sparkles className="h-3 w-3" />
              <span>Recomendado — mais rápido</span>
            </div>
          </button>

          {/* Modo Assistido */}
          <button
            type="button"
            onClick={() => setMode('assisted')}
            className="group rounded-xl border border-blue-500/20 bg-[#0d1320] p-6 text-left hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4 group-hover:bg-blue-500/20 transition-colors">
              <ClipboardList className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Modo Assistido</h2>
            <p className="text-sm text-[#6b7a8d] leading-relaxed">
              Preencha a peça passo a passo com um formulário guiado: tipo, dados, conteúdo e
              revisão final antes de salvar.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-400">
              <CheckCircle className="h-3 w-3" />
              <span>Guiado em 4 etapas</span>
            </div>
          </button>

          {/* Scratch */}
          <button
            type="button"
            onClick={() => setMode('scratch')}
            className="group rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 text-left hover:border-[#2a3342] transition-all"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0a0f1a] border border-[#1a2332] mb-4 group-hover:border-[#2a3342] transition-colors">
              <PenLine className="h-6 w-6 text-[#6b7a8d]" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Em Branco</h2>
            <p className="text-sm text-[#6b7a8d] leading-relaxed">
              Comece com uma folha em branco e redija a peça livremente, sem estrutura
              pré-definida.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#6b7a8d]">
              <PenLine className="h-3 w-3" />
              <span>Controle total do conteúdo</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Mode: Template Select ─────────────────────────────────────────────────

  if (mode === 'template-select') {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Selecionar Template"
          subtitle="Escolha o modelo de peça processual"
          breadcrumbs={baseBreadcrumbs}
          actions={
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="flex items-center gap-2 text-[#6b7a8d] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
        />

        {/* Optional: link a process before selecting template */}
        {processes.length > 0 && (
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <label className={labelClass}>
              Vincular a um Processo (opcional — melhora o preenchimento automático)
            </label>
            <select
              className={fieldClass}
              value={templateProcessId}
              onChange={(e) => setTemplateProcessId(e.target.value)}
            >
              <option value="">Sem processo vinculado</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.cnj} — {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <PetitionTemplateSelector
            onSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplate?.id}
          />
        </div>
      </div>
    );
  }

  // ── Mode: Template Edit ───────────────────────────────────────────────────

  if (mode === 'template-edit' && selectedTemplate) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Editar Peça a partir de Template"
          subtitle={selectedTemplate.name}
          breadcrumbs={baseBreadcrumbs}
        />

        {/* Squad Integration Banner */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-400">Assistência por IA</h3>
              <p className="text-xs text-[#8899aa] mt-1">
                Ao salvar o rascunho, o squad <strong>case-analysis</strong> pode ser acionado
                para auxiliar na fundamentação, pesquisa jurisprudencial e revisão da peça.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <PetitionTemplateEditor
            template={selectedTemplate}
            process={linkedProcess}
            client={linkedClient}
            onBack={() => setMode('template-select')}
            onSave={handleTemplateSave}
          />
        </div>
      </div>
    );
  }

  // ── Mode: Assisted (MultiStepForm) ───────────────────────────────────────

  if (mode === 'assisted') {
    const assistedSteps = [
      {
        id: 'tipo',
        label: 'Tipo',
        icon: <FileText className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-[#8899aa]">Selecione o tipo de peça processual que deseja criar.</p>
            <div>
              <label className={labelClass}>Tipo de Peça *</label>
              <select
                className={fieldClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PetitionType })}
              >
                {PETITION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Título da Peça *</label>
              <input
                type="text"
                placeholder="Ex.: Petição Inicial — Ação de Cobrança"
                className={fieldClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
        ),
        validate: () => !!form.title.trim(),
      },
      {
        id: 'dados',
        label: 'Dados',
        icon: <ClipboardList className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-[#8899aa]">Informe os dados básicos do processo e cliente vinculado.</p>
            <div>
              <label className={labelClass}>Processo Vinculado *</label>
              <select
                className={fieldClass}
                value={form.processId}
                onChange={(e) => setForm({ ...form, processId: e.target.value })}
              >
                <option value="">Selecione um processo</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.cnj} — {p.title}
                  </option>
                ))}
              </select>
              {processes.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-400">
                  Nenhum processo cadastrado. Você pode salvar sem vincular um processo.
                </p>
              )}
            </div>
            {form.processId && (() => {
              const proc = processes.find((p) => p.id === form.processId);
              const client = proc ? getClientById(proc.clientId) : undefined;
              return proc ? (
                <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">Resumo do Processo</p>
                  <p className="text-xs text-[#8899aa]"><span className="text-white">Processo:</span> {proc.title}</p>
                  <p className="text-xs text-[#8899aa] font-mono"><span className="text-white">CNJ:</span> {proc.cnj}</p>
                  {client && <p className="text-xs text-[#8899aa]"><span className="text-white">Cliente:</span> {client.name}</p>}
                </div>
              ) : null;
            })()}
          </div>
        ),
        validate: () => true,
      },
      {
        id: 'conteudo',
        label: 'Conteúdo',
        icon: <Edit className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-400">
                Redija o corpo da peça. O squad <strong>case-analysis</strong> pode ser acionado após salvar para
                auxiliar na fundamentação e pesquisa jurisprudencial.
              </p>
            </div>
            <div>
              <label className={labelClass}>Conteúdo da Peça</label>
              <textarea
                className={`${fieldClass} min-h-[300px] font-mono text-xs leading-relaxed`}
                placeholder="Redija o conteúdo da peça processual aqui..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
        ),
        validate: () => true,
      },
      {
        id: 'revisao',
        label: 'Revisão',
        icon: <CheckCircle className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <p className="text-sm text-[#8899aa]">Revise as informações antes de salvar o rascunho.</p>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a2332] pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d]">Resumo da Peça</span>
                <span className="text-xs text-[#D4AF37] font-medium">Rascunho</span>
              </div>
              <ReviewRow label="Tipo" value={PETITION_TYPES.find((t) => t.value === form.type)?.label ?? form.type} />
              <ReviewRow label="Título" value={form.title || '—'} />
              <ReviewRow
                label="Processo"
                value={
                  form.processId
                    ? (processes.find((p) => p.id === form.processId)?.cnj ?? '—')
                    : 'Não vinculado'
                }
              />
              <ReviewRow
                label="Conteúdo"
                value={
                  form.content
                    ? `${form.content.slice(0, 80)}${form.content.length > 80 ? '…' : ''}`
                    : 'Sem conteúdo'
                }
              />
            </div>
            {!form.title.trim() && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                O título da peça é obrigatório. Volte ao passo "Tipo" para preenchê-lo.
              </div>
            )}
          </div>
        ),
        validate: () => !!form.title.trim(),
      },
    ];

    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Nova Peça — Modo Assistido"
          subtitle="Preencha a peça em 4 etapas guiadas"
          breadcrumbs={baseBreadcrumbs}
          actions={
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="flex items-center gap-2 text-[#6b7a8d] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          }
        />
        <MultiStepForm
          steps={assistedSteps}
          onComplete={() => {
            handleScratchSubmit({ preventDefault: () => {} } as React.FormEvent);
          }}
          onCancel={() => router.push('/legal/petitions')}
        />
      </div>
    );
  }

  // ── Mode: Scratch ─────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Nova Peça — Em Branco"
        subtitle="Elabore uma nova peça com assistência do squad de análise"
        breadcrumbs={baseBreadcrumbs}
        actions={
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="flex items-center gap-2 text-[#6b7a8d] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      {/* Squad Integration Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-400">Assistência por IA</h3>
            <p className="text-xs text-[#8899aa] mt-1">
              Ao salvar o rascunho, o squad <strong>case-analysis</strong> pode ser acionado para
              auxiliar na fundamentação, pesquisa jurisprudencial e revisão da peça. Selecione o
              tipo de peça e o processo vinculado para ativar os templates disponíveis.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleScratchSubmit}
        className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Processo Vinculado *</label>
            <select
              className={fieldClass}
              value={form.processId}
              onChange={(e) => setForm({ ...form, processId: e.target.value })}
              required
            >
              <option value="">Selecione um processo</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.cnj} — {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de Peça *</label>
            <select
              className={fieldClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PetitionType })}
            >
              {PETITION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Título *</label>
            <input
              type="text"
              placeholder="Título da peça"
              className={fieldClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
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
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-amber-500/20 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Acionar Squad
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar Rascunho
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-24 flex-shrink-0 text-xs text-[#6b7a8d] font-medium">{label}</span>
      <span className="text-xs text-white break-words">{value}</span>
    </div>
  );
}
