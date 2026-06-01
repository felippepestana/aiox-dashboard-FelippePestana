'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Eye,
  Sparkles,
  FileText,
  ChevronLeft,
  User,
} from 'lucide-react';
import {
  fillTemplate,
  validateTemplateVariables,
  TEMPLATE_CATEGORY_LABELS,
} from '@/lib/petition-templates';
import type { PetitionTemplate, TemplateVariable } from '@/lib/petition-templates';
import type { LegalProcess, LegalClient } from '@/types/legal';

export interface PetitionTemplateEditorProps {
  template: PetitionTemplate;
  /** Optionally pre-fill from a linked process */
  process?: LegalProcess;
  /** Optionally pre-fill from a linked client */
  client?: LegalClient;
  onBack: () => void;
  /** Called when user saves the document as a draft */
  onSave: (content: string, title: string) => void;
}

function VariableField({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (val: string) => void;
}) {
  const baseClass =
    'w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20';

  if (variable.type === 'textarea') {
    return (
      <textarea
        rows={4}
        className={`${baseClass} py-2 px-3 resize-none`}
        placeholder={variable.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (variable.type === 'select' && variable.options) {
    return (
      <select
        className={`${baseClass} py-2 px-3`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecione...</option>
        {variable.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (variable.type === 'date') {
    return (
      <input
        type="text"
        className={`${baseClass} py-2 px-3`}
        placeholder={variable.placeholder || 'dd/mm/aaaa'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (variable.type === 'number') {
    return (
      <input
        type="text"
        inputMode="decimal"
        className={`${baseClass} py-2 px-3`}
        placeholder={variable.placeholder || '0,00'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      className={`${baseClass} py-2 px-3`}
      placeholder={variable.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PetitionTemplateEditor({
  template,
  process,
  client,
  onBack,
  onSave,
}: PetitionTemplateEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Initialise with defaults
    const init: Record<string, string> = {};
    for (const v of template.variables) {
      init[v.name] = v.defaultValue ?? '';
    }
    return init;
  });

  const [title, setTitle] = useState(template.name);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Auto-fill from process/client when they are provided
  useEffect(() => {
    if (!process && !client) return;

    setValues((prev) => {
      const next = { ...prev };

      if (client) {
        if (!next.cliente_nome && client.name) next.cliente_nome = client.name;
        if (!next.cliente_cpf && client.cpfCnpj) next.cliente_cpf = client.cpfCnpj;
        if (!next.cliente_rg && client.rg) next.cliente_rg = client.rg;
        if (!next.cliente_profissao && client.profession)
          next.cliente_profissao = client.profession;
        if (!next.cliente_endereco && client.address) {
          const a = client.address;
          next.cliente_endereco = [
            a.street,
            a.number,
            a.complement,
            a.neighborhood,
            `${a.city} - ${a.state}`,
            a.zipCode,
          ]
            .filter(Boolean)
            .join(', ');
        }
      }

      if (process) {
        if (!next.numero_processo && process.cnj) next.numero_processo = process.cnj;
        if (!next.vara && process.vara) next.vara = process.vara;
        if (!next.comarca && process.comarca) next.comarca = process.comarca;
        if (!next.estado && process.state) next.estado = process.state;
        if (!next.parte_contraria && process.opposingParty)
          next.parte_contraria = process.opposingParty;
        if (!next.valor_causa && process.causeValue)
          next.valor_causa = process.causeValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
      }

      if (!next.data) {
        next.data = new Date().toLocaleDateString('pt-BR');
      }

      return next;
    });
  }, [process, client]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const filledContent = useMemo(() => fillTemplate(template, values), [template, values]);

  const { valid, missing } = useMemo(
    () => validateTemplateVariables(template, values),
    [template, values]
  );

  const handleSave = () => {
    onSave(filledContent, title);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(filledContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([filledContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAutoFillDate = () => {
    setValue('data', new Date().toLocaleDateString('pt-BR'));
  };

  // Split variables into required and optional groups
  const requiredVars = template.variables.filter((v) => v.required);
  const optionalVars = template.variables.filter((v) => !v.required);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[#6b7a8d] hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d]">
              {TEMPLATE_CATEGORY_LABELS[template.category]}
            </span>
            <span className="text-[#2a3342]">·</span>
            <span className="text-xs text-[#6b7a8d]">Editor de Template</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-lg font-semibold text-white border-none outline-none focus:text-amber-100 placeholder-[#4a5568]"
            placeholder="Título da peça..."
          />
        </div>

        {/* Auto-fill badge */}
        {(process || client) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/5 px-2.5 py-1.5 text-xs text-green-400">
            <User className="h-3 w-3" />
            <span>Dados preenchidos automaticamente</span>
          </div>
        )}
      </div>

      {/* Validation warning */}
      {!valid && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-400">Campos obrigatórios não preenchidos:</p>
            <p className="text-xs text-[#8899aa] mt-0.5">{missing.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Mobile tab switcher */}
      <div className="flex rounded-lg border border-[#1a2332] overflow-hidden lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-amber-500/10 text-amber-400'
              : 'text-[#6b7a8d] hover:text-white'
          }`}
        >
          Formulário
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-amber-500/10 text-amber-400'
              : 'text-[#6b7a8d] hover:text-white'
          }`}
        >
          Pré-visualização
        </button>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Variable Form */}
        <div
          className={`space-y-5 ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}
        >
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Campos Obrigatórios</h3>
            </div>

            <div className="space-y-4">
              {requiredVars.map((variable) => (
                <div key={variable.name}>
                  <label className="block text-xs font-medium text-[#8899aa] mb-1">
                    {variable.label}{' '}
                    <span className="text-amber-500">*</span>
                    {' '}
                    <span className="font-mono text-[10px] text-[#4a5568]">{`{{${variable.name}}}`}</span>
                  </label>
                  <VariableField
                    variable={variable}
                    value={values[variable.name] ?? ''}
                    onChange={(val) => setValue(variable.name, val)}
                  />
                </div>
              ))}
            </div>
          </div>

          {optionalVars.length > 0 && (
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#6b7a8d]" />
                <h3 className="text-sm font-semibold text-white">Campos Opcionais</h3>
                <span className="text-xs text-[#4a5568]">(melhoram o documento)</span>
              </div>

              <div className="space-y-4">
                {optionalVars.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-xs font-medium text-[#8899aa] mb-1">
                      {variable.label}{' '}
                      <span className="font-mono text-[10px] text-[#4a5568]">{`{{${variable.name}}}`}</span>
                      {variable.name === 'data' && (
                        <button
                          type="button"
                          onClick={handleAutoFillDate}
                          className="ml-2 text-[10px] text-amber-400 hover:text-amber-300 underline"
                        >
                          Hoje
                        </button>
                      )}
                    </label>
                    <VariableField
                      variable={variable}
                      value={values[variable.name] ?? ''}
                      onChange={(val) => setValue(variable.name, val)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div
          className={`${activeTab === 'form' ? 'hidden lg:block' : ''}`}
        >
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#6b7a8d]" />
                <h3 className="text-sm font-semibold text-white">Pré-visualização</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-2.5 py-1.5 text-xs text-[#6b7a8d] hover:text-white transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-2.5 py-1.5 text-xs text-[#6b7a8d] hover:text-white transition-colors"
                >
                  <Download className="h-3 w-3" />
                  .doc
                </button>
              </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4 min-h-[400px]">
              <pre className="text-xs text-[#c0c8d4] leading-relaxed whitespace-pre-wrap font-sans">
                {filledContent}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <button
          type="button"
          onClick={() => {
            const reset: Record<string, string> = {};
            for (const v of template.variables) reset[v.name] = v.defaultValue ?? '';
            setValues(reset);
          }}
          className="flex items-center gap-2 rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Limpar
        </button>

        <div className="flex items-center gap-3">
          {/* Completion indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {valid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Pronto para salvar</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-[#6b7a8d]" />
                <span className="text-[#6b7a8d]">{missing.length} campo(s) pendente(s)</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar como Rascunho
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

