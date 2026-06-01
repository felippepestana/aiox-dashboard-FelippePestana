'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  ChevronRight,
  Tag,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import {
  PETITION_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  getTemplatesByCategory,
} from '@/lib/petition-templates';
import type { PetitionTemplate, TemplateCategory } from '@/lib/petition-templates';

export interface PetitionTemplateSelectorProps {
  onSelect: (template: PetitionTemplate) => void;
  selectedTemplateId?: string;
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  peticao_inicial: 'PI',
  defesa: 'DE',
  recurso: 'RE',
  urgencia: 'TU',
  constitucional: 'AC',
  execucao: 'EX',
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  peticao_inicial: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  defesa: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  recurso: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  urgencia: 'text-red-400 bg-red-500/10 border-red-500/20',
  constitucional: 'text-green-400 bg-green-500/10 border-green-500/20',
  execucao: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export function PetitionTemplateSelector({
  onSelect,
  selectedTemplateId,
}: PetitionTemplateSelectorProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<PetitionTemplate | null>(null);

  const allCategories = useMemo(
    () =>
      (Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]).filter(
        (cat) => getTemplatesByCategory(cat).length > 0
      ),
    []
  );

  const filteredTemplates = useMemo(() => {
    let templates =
      activeCategory === 'all'
        ? PETITION_TEMPLATES
        : getTemplatesByCategory(activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          TEMPLATE_CATEGORY_LABELS[t.category].toLowerCase().includes(q)
      );
    }

    return templates;
  }, [activeCategory, search]);

  // Group filtered templates by category for display
  const grouped = useMemo(() => {
    const map: Partial<Record<TemplateCategory, PetitionTemplate[]>> = {};
    for (const t of filteredTemplates) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category]!.push(t);
    }
    return map;
  }, [filteredTemplates]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
        <input
          type="text"
          placeholder="Buscar template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2 pl-9 pr-3 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeCategory === 'all'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              : 'border-[#1a2332] text-[#6b7a8d] hover:text-white'
          }`}
        >
          Todos ({PETITION_TEMPLATES.length})
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-[#1a2332] text-[#6b7a8d] hover:text-white'
            }`}
          >
            {TEMPLATE_CATEGORY_LABELS[cat]} ({getTemplatesByCategory(cat).length})
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0a0f1a] py-12">
          <FileText className="h-10 w-10 text-[#6b7a8d] mb-3" />
          <p className="text-sm text-[#6b7a8d]">Nenhum template encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(grouped) as TemplateCategory[]).map((cat) => (
            <div key={cat}>
              {/* Category heading — only show when displaying multiple categories */}
              {activeCategory === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d]">
                    {TEMPLATE_CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex-1 h-px bg-[#1a2332]" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped[cat]!.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  const colorClass = CATEGORY_COLORS[template.category];

                  return (
                    <div
                      key={template.id}
                      className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/5'
                          : 'border-[#1a2332] bg-[#0a0f1a] hover:border-[#2a3342]'
                      }`}
                    >
                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        </div>
                      )}

                      {/* Category badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3 ${colorClass}`}
                      >
                        {CATEGORY_ICONS[template.category]}
                        {TEMPLATE_CATEGORY_LABELS[template.category]}
                      </span>

                      {/* Template name */}
                      <h3 className="text-sm font-medium text-white mb-1 pr-6">
                        {template.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#6b7a8d] leading-relaxed line-clamp-2 mb-4">
                        {template.description}
                      </p>

                      {/* Variable count */}
                      <div className="flex items-center gap-1 text-xs text-[#4a5568] mb-3">
                        <FileText className="h-3 w-3" />
                        <span>{template.variables.length} variáveis</span>
                        <span className="mx-1">·</span>
                        <span>
                          {template.variables.filter((v) => v.required).length} obrigatórias
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(template)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-white hover:border-[#2a3342] transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelect(template)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400 transition-colors"
                        >
                          Usar Template
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-[#1a2332] bg-[#0d1320] shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-[#1a2332]">
              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${CATEGORY_COLORS[previewTemplate.category]}`}
                >
                  {TEMPLATE_CATEGORY_LABELS[previewTemplate.category]}
                </span>
                <h2 className="text-base font-semibold text-white">{previewTemplate.name}</h2>
                <p className="text-xs text-[#6b7a8d] mt-1">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="ml-4 text-[#6b7a8d] hover:text-white text-lg font-light leading-none"
              >
                ×
              </button>
            </div>

            {/* Variable list */}
            <div className="p-5 border-b border-[#1a2332]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d] mb-3">
                Variáveis do Template
              </p>
              <div className="flex flex-wrap gap-2">
                {previewTemplate.variables.map((v) => (
                  <span
                    key={v.name}
                    className={`rounded-md px-2 py-1 text-xs font-mono ${
                      v.required
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-[#0a0f1a] text-[#6b7a8d] border border-[#1a2332]'
                    }`}
                  >
                    {`{{${v.name}}}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Template preview */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d] mb-3">
                Estrutura do Documento
              </p>
              <pre className="text-xs text-[#8899aa] leading-relaxed whitespace-pre-wrap font-mono bg-[#0a0f1a] rounded-lg p-4 border border-[#1a2332]">
                {previewTemplate.content.slice(0, 600)}
                {previewTemplate.content.length > 600 ? '\n...' : ''}
              </pre>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#1a2332]">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
              >
                Usar Template
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { PetitionTemplate };
