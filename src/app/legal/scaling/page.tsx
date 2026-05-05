'use client';

import { useState } from 'react';
import {
  Rocket,
  Users,
  Target,
  ListChecks,
  DollarSign,
  Plus,
  X,
  Star,
  CalendarDays,
  Goal,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';

type Quadrant = 'people' | 'strategy' | 'execution' | 'cash';

const QUADRANT_META: Record<Quadrant, { label: string; icon: React.ElementType; color: string }> = {
  people: { label: 'Pessoas', icon: Users, color: 'text-blue-400' },
  strategy: { label: 'Estrategia', icon: Target, color: 'text-amber-400' },
  execution: { label: 'Execucao', icon: ListChecks, color: 'text-green-400' },
  cash: { label: 'Caixa', icon: DollarSign, color: 'text-purple-400' },
};

const DEFAULT_PLAN = {
  id: 'scaling-default',
  people: [
    'Contratar associado senior em Direito Tributario',
    'Implementar programa de mentoria',
    'Definir plano de carreira para associados',
  ],
  strategy: [
    'Posicionar escritorio como referencia em Direito Digital',
    'Expandir para consultoria preventiva empresarial',
    'Desenvolver parceria com escritorios internacionais',
  ],
  execution: [
    'Adotar sistema integrado de gestao de processos',
    'Automatizar geracoes de peticoes padrao',
    'Reuniao semanal de alinhamento de equipe',
  ],
  cash: [
    'Aumentar receita recorrente em 25%',
    'Reduzir inadimplencia para abaixo de 5%',
    'Diversificar fontes de receita com consultorias',
  ],
  quarterlyPriorities: [
    'Fechar 5 novos contratos de consultoria preventiva',
    'Concluir migracao para sistema PJe integrado',
    'Lancar programa de conteudo juridico no LinkedIn',
  ],
  annualGoals: [
    'Faturamento anual de R$ 3.5M',
    'Taxa de retencao de clientes acima de 90%',
    'NPS de clientes acima de 75',
    'Atingir 50 contratos de consultoria preventiva',
  ],
  bhag: 'Ser o escritorio de referencia nacional em Direito Digital e Inovacao Juridica ate 2030',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ScalingUpPage() {
  const { scalingUpPlan, updateScalingPlan } = useLegalStrategyStore();
  const plan = scalingUpPlan ?? DEFAULT_PLAN;

  const [editingQuadrant, setEditingQuadrant] = useState<Quadrant | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editingBhag, setEditingBhag] = useState(false);
  const [bhagDraft, setBhagDraft] = useState(plan.bhag);
  const [newPriority, setNewPriority] = useState('');
  const [newGoal, setNewGoal] = useState('');

  function savePlan(updates: Partial<typeof plan>) {
    updateScalingPlan({ ...plan, ...updates, updatedAt: new Date().toISOString() });
  }

  function addItemToQuadrant(quadrant: Quadrant) {
    if (!newItem.trim()) return;
    const current = [...plan[quadrant]];
    current.push(newItem.trim());
    savePlan({ [quadrant]: current });
    setNewItem('');
  }

  function removeItemFromQuadrant(quadrant: Quadrant, index: number) {
    const current = [...plan[quadrant]];
    current.splice(index, 1);
    savePlan({ [quadrant]: current });
  }

  function addPriority() {
    if (!newPriority.trim()) return;
    savePlan({ quarterlyPriorities: [...plan.quarterlyPriorities, newPriority.trim()] });
    setNewPriority('');
  }

  function removePriority(index: number) {
    const updated = [...plan.quarterlyPriorities];
    updated.splice(index, 1);
    savePlan({ quarterlyPriorities: updated });
  }

  function addGoal() {
    if (!newGoal.trim()) return;
    savePlan({ annualGoals: [...plan.annualGoals, newGoal.trim()] });
    setNewGoal('');
  }

  function removeGoal(index: number) {
    const updated = [...plan.annualGoals];
    updated.splice(index, 1);
    savePlan({ annualGoals: updated });
  }

  function saveBhag() {
    savePlan({ bhag: bhagDraft.trim() });
    setEditingBhag(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Rocket className="h-7 w-7 text-amber-400" />
          Scaling Up - Plano Estrategico
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          One-Page Strategic Plan para o escritorio
        </p>
      </div>

      {/* BHAG */}
      <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            <Star className="h-5 w-5" />
            BHAG - Meta Grande, Cabeluda e Audaciosa
          </h2>
          {!editingBhag && (
            <button
              onClick={() => { setBhagDraft(plan.bhag); setEditingBhag(true); }}
              className="text-xs text-[#6b7a8d] hover:text-amber-400 transition-colors"
            >
              Editar
            </button>
          )}
        </div>
        {editingBhag ? (
          <div className="flex gap-3">
            <input
              value={bhagDraft}
              onChange={(e) => setBhagDraft(e.target.value)}
              className="flex-1 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={saveBhag}
              className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditingBhag(false)}
              className="rounded-lg bg-[#1a2332] px-3 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <p className="text-white text-lg font-medium">&ldquo;{plan.bhag}&rdquo;</p>
        )}
      </div>

      {/* 4 Quadrants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.keys(QUADRANT_META) as Quadrant[]).map((quadrant) => {
          const meta = QUADRANT_META[quadrant];
          const Icon = meta.icon;
          const isEditing = editingQuadrant === quadrant;

          return (
            <div key={quadrant} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${meta.color}`}>
                  <Icon className="h-5 w-5" />
                  {meta.label}
                </h3>
                <button
                  onClick={() => setEditingQuadrant(isEditing ? null : quadrant)}
                  className="text-xs text-[#6b7a8d] hover:text-amber-400 transition-colors"
                >
                  {isEditing ? 'Fechar' : 'Editar'}
                </button>
              </div>

              <div className="space-y-2">
                {plan[quadrant].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${meta.color.replace('text-', 'bg-')}`} />
                    <p className="text-sm text-white flex-1">{item}</p>
                    {isEditing && (
                      <button
                        onClick={() => removeItemFromQuadrant(quadrant, idx)}
                        className="text-[#6b7a8d] hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-3">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItemToQuadrant(quadrant)}
                    placeholder={`Adicionar item em ${meta.label}...`}
                    className="flex-1 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={() => addItemToQuadrant(quadrant)}
                    className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quarterly Priorities & Annual Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Priorities */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-amber-400" />
            Prioridades Trimestrais
          </h3>
          <div className="space-y-2">
            {plan.quarterlyPriorities.map((priority, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
              >
                <span className="text-xs font-bold text-amber-400 mt-0.5 flex-shrink-0">
                  {idx + 1}.
                </span>
                <p className="text-sm text-white flex-1">{priority}</p>
                <button
                  onClick={() => removePriority(idx)}
                  className="text-[#6b7a8d] hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPriority()}
              placeholder="Nova prioridade trimestral..."
              className="flex-1 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={addPriority}
              className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Annual Goals */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Goal className="h-5 w-5 text-amber-400" />
            Metas Anuais
          </h3>
          <div className="space-y-2">
            {plan.annualGoals.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
              >
                <span className="text-xs font-bold text-green-400 mt-0.5 flex-shrink-0">
                  {idx + 1}.
                </span>
                <p className="text-sm text-white flex-1">{goal}</p>
                <button
                  onClick={() => removeGoal(idx)}
                  className="text-[#6b7a8d] hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Nova meta anual..."
              className="flex-1 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={addGoal}
              className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
