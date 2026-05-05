'use client';

import { useState } from 'react';
import {
  FileText,
  Users,
  Tag,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Calendar,
  DollarSign,
  BookOpen,
  User,
  Building,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalysisEntity {
  type: 'party' | 'lawyer' | 'judge' | 'date' | 'value' | 'law';
  label: string;
  value: string;
}

export interface AnalysisClause {
  id: string;
  title: string;
  summary: string;
  risk: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  summary: string;
  entities: AnalysisEntity[];
  classification: {
    documentType: string;
    legalArea: string;
    complexityScore: number;
  };
  clauses: AnalysisClause[];
}

export interface DocumentAnalysisProps {
  result: AnalysisResult;
  fileName: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumo', label: 'Resumo', icon: FileText },
  { id: 'entidades', label: 'Entidades', icon: Users },
  { id: 'classificacao', label: 'Classificação', icon: Tag },
  { id: 'clausulas', label: 'Cláusulas', icon: Scale },
] as const;

type TabId = (typeof TABS)[number]['id'];

function entityIcon(type: AnalysisEntity['type']) {
  switch (type) {
    case 'party': return Building;
    case 'lawyer': return User;
    case 'judge': return Scale;
    case 'date': return Calendar;
    case 'value': return DollarSign;
    case 'law': return BookOpen;
  }
}

function entityColor(type: AnalysisEntity['type']) {
  switch (type) {
    case 'party': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'lawyer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'judge': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'date': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'value': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'law': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }
}

function riskColor(risk: AnalysisClause['risk']) {
  switch (risk) {
    case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
  }
}

function riskLabel(risk: AnalysisClause['risk']) {
  switch (risk) {
    case 'low': return 'Baixo Risco';
    case 'medium': return 'Risco Moderado';
    case 'high': return 'Alto Risco';
  }
}

function riskIcon(risk: AnalysisClause['risk']) {
  switch (risk) {
    case 'low': return CheckCircle;
    case 'medium': return AlertTriangle;
    case 'high': return AlertCircle;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DocumentAnalysis({ result, fileName }: DocumentAnalysisProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resumo');
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  const toggleClause = (id: string) => {
    setExpandedClause((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* File header */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <FileText className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{fileName}</p>
          <p className="text-xs text-[#6b7a8d]">Análise completa via IA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#1a2332] bg-[#0d1320] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        {/* Resumo */}
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Resumo do Documento</h3>
            <p className="text-sm text-[#8899aa] leading-relaxed whitespace-pre-line">
              {result.summary}
            </p>
          </div>
        )}

        {/* Entidades */}
        {activeTab === 'entidades' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Entidades Identificadas</h3>
            <div className="flex flex-wrap gap-2">
              {result.entities.map((entity, idx) => {
                const Icon = entityIcon(entity.type);
                return (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${entityColor(entity.type)}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{entity.label}:</span>
                    <span className="text-xs">{entity.value}</span>
                  </div>
                );
              })}
            </div>
            {result.entities.length === 0 && (
              <p className="text-sm text-[#6b7a8d]">Nenhuma entidade identificada.</p>
            )}
          </div>
        )}

        {/* Classificacao */}
        {activeTab === 'classificacao' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Classificação do Documento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Tipo do Documento</p>
                <p className="text-sm font-semibold text-white">{result.classification.documentType}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Área Jurídica</p>
                <p className="text-sm font-semibold text-amber-400">{result.classification.legalArea}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Complexidade</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 rounded-full bg-[#1a2332]">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.classification.complexityScore >= 8
                          ? 'bg-red-500'
                          : result.classification.complexityScore >= 5
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${result.classification.complexityScore * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {result.classification.complexityScore}/10
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clausulas */}
        {activeTab === 'clausulas' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cláusulas Identificadas</h3>
            {result.clauses.length === 0 ? (
              <p className="text-sm text-[#6b7a8d]">Nenhuma cláusula identificada (aplicável apenas a contratos).</p>
            ) : (
              <div className="space-y-2">
                {result.clauses.map((clause) => {
                  const expanded = expandedClause === clause.id;
                  const RiskIcon = riskIcon(clause.risk);
                  return (
                    <div
                      key={clause.id}
                      className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] overflow-hidden"
                    >
                      <button
                        onClick={() => toggleClause(clause.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#1a2332]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <RiskIcon className={`h-4 w-4 ${
                            clause.risk === 'low' ? 'text-green-400' :
                            clause.risk === 'medium' ? 'text-yellow-400' : 'text-red-400'
                          }`} />
                          <span className="text-sm font-medium text-white">{clause.title}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${riskColor(clause.risk)}`}>
                            {riskLabel(clause.risk)}
                          </span>
                        </div>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
                        )}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#1a2332]">
                          <p className="text-sm text-[#8899aa] leading-relaxed">{clause.summary}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
