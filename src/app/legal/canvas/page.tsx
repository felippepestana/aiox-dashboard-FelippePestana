'use client';

import { useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Save,
  Plus,
  X,
  GripVertical,
  FileDown,
  Wand2,
  Trash2,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import type { LegalCanvas } from '@/types/legal';

// ─── Canvas Block Definitions ───────────────────────────────────────────────

interface CanvasBlock {
  key: keyof CanvasData;
  title: string;
  description: string;
  colorClass: string;
  headerColor: string;
  gridArea: string;
  examples: string[];
}

interface StickyNote {
  id: string;
  text: string;
  color: string;
}

type CanvasData = {
  valorJuridica: StickyNote[];
  segmentosClientes: StickyNote[];
  canaisAtendimento: StickyNote[];
  relacionamentoClientes: StickyNote[];
  fontesReceita: StickyNote[];
  recursosChave: StickyNote[];
  atividadesChave: StickyNote[];
  parceriasEstrategicas: StickyNote[];
  estruturaCustos: StickyNote[];
};

const NOTE_COLORS = [
  'bg-amber-500/20 border-amber-500/30 text-amber-200',
  'bg-blue-500/20 border-blue-500/30 text-blue-200',
  'bg-emerald-500/20 border-emerald-500/30 text-emerald-200',
  'bg-purple-500/20 border-purple-500/30 text-purple-200',
  'bg-rose-500/20 border-rose-500/30 text-rose-200',
  'bg-cyan-500/20 border-cyan-500/30 text-cyan-200',
];

const CANVAS_BLOCKS: CanvasBlock[] = [
  {
    key: 'parceriasEstrategicas',
    title: 'Parcerias Estratégicas',
    description: 'Alianças e redes de suporte',
    colorClass: 'border-violet-500/30 bg-violet-500/5',
    headerColor: 'text-violet-400',
    gridArea: 'partnerships',
    examples: ['Contabilidades parceiras', 'Correspondentes jurídicos', 'Legal Techs', 'Consultorias'],
  },
  {
    key: 'atividadesChave',
    title: 'Atividades-Chave',
    description: 'O que o escritório faz de mais importante',
    colorClass: 'border-blue-500/30 bg-blue-500/5',
    headerColor: 'text-blue-400',
    gridArea: 'activities',
    examples: ['Contencioso cível', 'Consultoria empresarial', 'Compliance', 'Planejamento tributário'],
  },
  {
    key: 'valorJuridica',
    title: 'Proposta de Valor Jurídica',
    description: 'O que diferencia o escritório',
    colorClass: 'border-amber-500/30 bg-amber-500/5',
    headerColor: 'text-amber-400',
    gridArea: 'value',
    examples: ['Especialização setorial', 'Atendimento ágil', 'Tecnologia jurídica', 'Custo-benefício'],
  },
  {
    key: 'relacionamentoClientes',
    title: 'Relacionamento com Clientes',
    description: 'Como o escritório se relaciona',
    colorClass: 'border-pink-500/30 bg-pink-500/5',
    headerColor: 'text-pink-400',
    gridArea: 'relationship',
    examples: ['Atendimento personalizado', 'Portal do cliente', 'Reuniões periódicas', 'WhatsApp Business'],
  },
  {
    key: 'segmentosClientes',
    title: 'Segmentos de Clientes',
    description: 'Para quem o escritório trabalha',
    colorClass: 'border-cyan-500/30 bg-cyan-500/5',
    headerColor: 'text-cyan-400',
    gridArea: 'segments',
    examples: ['PMEs', 'Startups', 'Holdings familiares', 'Pessoas físicas de alta renda'],
  },
  {
    key: 'recursosChave',
    title: 'Recursos-Chave',
    description: 'Ativos essenciais ao serviço',
    colorClass: 'border-orange-500/30 bg-orange-500/5',
    headerColor: 'text-orange-400',
    gridArea: 'resources',
    examples: ['Equipe especializada', 'Software jurídico', 'Base de jurisprudência', 'Reputação OAB'],
  },
  {
    key: 'canaisAtendimento',
    title: 'Canais de Atendimento',
    description: 'Como chega até os clientes',
    colorClass: 'border-teal-500/30 bg-teal-500/5',
    headerColor: 'text-teal-400',
    gridArea: 'channels',
    examples: ['Indicações', 'LinkedIn', 'Site + SEO', 'Eventos da OAB'],
  },
  {
    key: 'estruturaCustos',
    title: 'Estrutura de Custos',
    description: 'Principais despesas do escritório',
    colorClass: 'border-red-500/30 bg-red-500/5',
    headerColor: 'text-red-400',
    gridArea: 'costs',
    examples: ['Salários e pró-labore', 'Aluguel', 'Tecnologia', 'Capacitação e eventos'],
  },
  {
    key: 'fontesReceita',
    title: 'Fontes de Receita',
    description: 'Como o escritório monetiza',
    colorClass: 'border-emerald-500/30 bg-emerald-500/5',
    headerColor: 'text-emerald-400',
    gridArea: 'revenue',
    examples: ['Honorários contratuais', 'Consultoria mensal', 'Honorários de sucumbência', 'Êxito (ad exitum)'],
  },
];

const DEMO_DATA: CanvasData = {
  parceriasEstrategicas: [
    { id: 'p1', text: 'Contabilidades parceiras', color: NOTE_COLORS[0] },
    { id: 'p2', text: 'Correspondentes jurídicos', color: NOTE_COLORS[3] },
    { id: 'p3', text: 'Legal Techs aliadas', color: NOTE_COLORS[1] },
  ],
  atividadesChave: [
    { id: 'a1', text: 'Contencioso cível e empresarial', color: NOTE_COLORS[1] },
    { id: 'a2', text: 'Consultoria preventiva', color: NOTE_COLORS[2] },
    { id: 'a3', text: 'Compliance e LGPD', color: NOTE_COLORS[4] },
  ],
  valorJuridica: [
    { id: 'v1', text: 'Especialização setorial (Tech & Startups)', color: NOTE_COLORS[0] },
    { id: 'v2', text: 'Tecnologia jurídica avançada', color: NOTE_COLORS[1] },
    { id: 'v3', text: 'Transparência e comunicação clara', color: NOTE_COLORS[2] },
  ],
  relacionamentoClientes: [
    { id: 'r1', text: 'Portal do cliente com acesso aos processos', color: NOTE_COLORS[3] },
    { id: 'r2', text: 'Reuniões mensais de alinhamento', color: NOTE_COLORS[0] },
    { id: 'r3', text: 'WhatsApp Business dedicado', color: NOTE_COLORS[2] },
  ],
  segmentosClientes: [
    { id: 's1', text: 'PMEs em crescimento', color: NOTE_COLORS[4] },
    { id: 's2', text: 'Startups e scale-ups', color: NOTE_COLORS[1] },
    { id: 's3', text: 'Holdings familiares', color: NOTE_COLORS[0] },
  ],
  recursosChave: [
    { id: 'rk1', text: 'Equipe especializada (5 advogados)', color: NOTE_COLORS[0] },
    { id: 'rk2', text: 'Software de gestão jurídica (APEX)', color: NOTE_COLORS[5] },
    { id: 'rk3', text: 'Base própria de jurisprudência', color: NOTE_COLORS[2] },
  ],
  canaisAtendimento: [
    { id: 'c1', text: 'Indicações de clientes satisfeitos', color: NOTE_COLORS[2] },
    { id: 'c2', text: 'LinkedIn e conteúdo jurídico', color: NOTE_COLORS[1] },
    { id: 'c3', text: 'Webinars e eventos OAB', color: NOTE_COLORS[3] },
  ],
  estruturaCustos: [
    { id: 'ec1', text: 'Salários e pró-labore (60%)', color: NOTE_COLORS[4] },
    { id: 'ec2', text: 'Aluguel e infraestrutura (15%)', color: NOTE_COLORS[0] },
    { id: 'ec3', text: 'Tecnologia e software (10%)', color: NOTE_COLORS[1] },
    { id: 'ec4', text: 'Marketing e eventos (10%)', color: NOTE_COLORS[5] },
  ],
  fontesReceita: [
    { id: 'fr1', text: 'Honorários contratuais mensais', color: NOTE_COLORS[2] },
    { id: 'fr2', text: 'Consultoria mensal (retainer)', color: NOTE_COLORS[1] },
    { id: 'fr3', text: 'Honorários de sucumbência', color: NOTE_COLORS[0] },
    { id: 'fr4', text: 'Êxito (ad exitum) — 20–30%', color: NOTE_COLORS[3] },
  ],
};

function generateId() {
  return `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function emptyCanvas(): CanvasData {
  return {
    valorJuridica: [],
    segmentosClientes: [],
    canaisAtendimento: [],
    relacionamentoClientes: [],
    fontesReceita: [],
    recursosChave: [],
    atividadesChave: [],
    parceriasEstrategicas: [],
    estruturaCustos: [],
  };
}

// ─── Block Component ─────────────────────────────────────────────────────────

interface BlockProps {
  block: CanvasBlock;
  notes: StickyNote[];
  onAdd: (key: keyof CanvasData, text: string, color: string) => void;
  onRemove: (key: keyof CanvasData, id: string) => void;
  onDragStart: (note: StickyNote, fromKey: keyof CanvasData) => void;
  onDrop: (toKey: keyof CanvasData) => void;
  dragging: { note: StickyNote; from: keyof CanvasData } | null;
}

function CanvasBlockCard({ block, notes, onAdd, onRemove, onDragStart, onDrop, dragging }: BlockProps) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    if (text.trim()) {
      onAdd(block.key, text.trim(), selectedColor);
      setText('');
      setAdding(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col min-h-[160px] transition-all ${block.colorClass} ${
        dragOver ? 'ring-2 ring-amber-500/50 scale-[1.01]' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (dragging) onDrop(block.key); }}
    >
      {/* Header */}
      <div className="mb-2">
        <h3 className={`text-xs font-bold uppercase tracking-wider ${block.headerColor}`}>
          {block.title}
        </h3>
        <p className="text-[10px] text-[#6b7a8d] mt-0.5">{block.description}</p>
      </div>

      {/* Notes */}
      <div className="flex-1 flex flex-wrap gap-1.5 content-start mb-2 min-h-[60px]">
        {notes.length === 0 && !adding && (
          <p className="text-[10px] text-[#4a5568] italic self-start">
            {block.examples[0]}...
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            draggable
            onDragStart={() => onDragStart(note, block.key)}
            className={`group inline-flex items-start gap-1 rounded-md border px-2 py-1 text-xs cursor-grab active:cursor-grabbing max-w-full ${note.color}`}
          >
            <GripVertical className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-40" />
            <span className="flex-1 break-words min-w-0">{note.text}</span>
            <button
              onClick={() => onRemove(block.key, note.id)}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 ml-0.5 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add note */}
      {adding ? (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  c.includes('amber') ? 'bg-amber-400' :
                  c.includes('blue') ? 'bg-blue-400' :
                  c.includes('emerald') ? 'bg-emerald-400' :
                  c.includes('purple') ? 'bg-purple-400' :
                  c.includes('rose') ? 'bg-rose-400' : 'bg-cyan-400'
                } ${selectedColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setAdding(false); setText(''); }
              }}
              placeholder="Escreva um item..."
              className="flex-1 rounded-md bg-[#0a0f1a] border border-[#1a2332] px-2 py-1 text-xs text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/30"
            >
              OK
            </button>
            <button
              onClick={() => { setAdding(false); setText(''); }}
              className="rounded-md px-1 py-1 text-[#6b7a8d] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); }}
          className={`flex items-center gap-1 text-[10px] mt-auto ${block.headerColor} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </button>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const { legalCanvas, updateCanvas } = useLegalStrategyStore();

  // Store canvas data in a local state keyed by our 9-block schema
  // We persist it into legalCanvas.competitiveAdvantage (as JSON) for simplicity
  const [canvasData, setCanvasData] = useState<CanvasData>(() => {
    if (legalCanvas?.competitiveAdvantage?.length) {
      try {
        const raw = legalCanvas.competitiveAdvantage[0];
        if (raw.startsWith('{')) return JSON.parse(raw) as CanvasData;
      } catch {
        // fall through
      }
    }
    return emptyCanvas();
  });

  const [dragging, setDragging] = useState<{ note: StickyNote; from: keyof CanvasData } | null>(null);
  const [firmName, setFirmName] = useState(legalCanvas?.firmName ?? '');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const persist = useCallback((data: CanvasData, name: string) => {
    const now = new Date().toISOString();
    updateCanvas({
      id: legalCanvas?.id ?? `canvas-${Date.now()}`,
      firmName: name,
      mission: '',
      vision: '',
      values: [],
      practiceAreas: [],
      targetClients: [],
      channels: [],
      revenue: [],
      costs: [],
      partnerships: [],
      competitiveAdvantage: [JSON.stringify(data)],
      createdAt: legalCanvas?.createdAt ?? now,
      updatedAt: now,
    });
    setSavedAt(now);
  }, [legalCanvas, updateCanvas]);

  const handleAdd = useCallback((key: keyof CanvasData, text: string, color: string) => {
    setCanvasData((prev) => {
      const next = { ...prev, [key]: [...prev[key], { id: generateId(), text, color }] };
      persist(next, firmName);
      return next;
    });
  }, [firmName, persist]);

  const handleRemove = useCallback((key: keyof CanvasData, id: string) => {
    setCanvasData((prev) => {
      const next = { ...prev, [key]: prev[key].filter((n) => n.id !== id) };
      persist(next, firmName);
      return next;
    });
  }, [firmName, persist]);

  const handleDragStart = useCallback((note: StickyNote, from: keyof CanvasData) => {
    setDragging({ note, from });
  }, []);

  const handleDrop = useCallback((to: keyof CanvasData) => {
    if (!dragging || dragging.from === to) { setDragging(null); return; }
    setCanvasData((prev) => {
      const next = {
        ...prev,
        [dragging.from]: prev[dragging.from].filter((n) => n.id !== dragging.note.id),
        [to]: [...prev[to], dragging.note],
      };
      persist(next, firmName);
      return next;
    });
    setDragging(null);
  }, [dragging, firmName, persist]);

  function loadDemo() {
    setCanvasData(DEMO_DATA);
    setFirmName('Escritório Modelo Advogados');
    persist(DEMO_DATA, 'Escritório Modelo Advogados');
  }

  function clearCanvas() {
    const empty = emptyCanvas();
    setCanvasData(empty);
    persist(empty, firmName);
  }

  async function exportPDF() {
    const { default: html2canvas } = await import('html2canvas').catch(() => ({ default: null }));
    const canvasEl = document.getElementById('legal-canvas-board');
    if (!html2canvas || !canvasEl) {
      window.print();
      return;
    }
    const snapshot = await html2canvas(canvasEl, { backgroundColor: '#0a0f1a', scale: 1.5 });
    const img = snapshot.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = img;
    link.download = `canvas-juridico-${firmName || 'escritorio'}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }

  const totalNotes = Object.values(canvasData).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-amber-400" />
            Legal Business Canvas
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Modelo Canvas adaptado para escritórios de advocacia — Metodologia Lara Selem
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {totalNotes === 0 && (
            <button
              onClick={loadDemo}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Wand2 className="h-4 w-4" />
              Demo
            </button>
          )}
          {totalNotes > 0 && (
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </button>
          )}
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-2 text-sm font-medium text-white hover:bg-[#1e2a3d] transition-colors border border-[#2a3444]"
          >
            <FileDown className="h-4 w-4" />
            Exportar
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400 border border-green-500/20">
            <Save className="h-3.5 w-3.5" />
            {savedAt ? `Salvo ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Auto-save ativo'}
          </div>
        </div>
      </div>

      {/* Firm name input */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-[#6b7a8d] whitespace-nowrap">Nome do Escritório:</label>
        <input
          type="text"
          value={firmName}
          onChange={(e) => {
            setFirmName(e.target.value);
            persist(canvasData, e.target.value);
          }}
          placeholder="Ex: Silva & Associados Advogados"
          className="flex-1 max-w-md rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-1.5 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50"
        />
        {totalNotes > 0 && (
          <span className="text-xs text-[#6b7a8d]">{totalNotes} notas no canvas</span>
        )}
      </div>

      {/* Canvas Board — Business Model Canvas Layout */}
      {/* Classic BMC layout: 5 cols × 2 rows + bottom cost/revenue row */}
      <div id="legal-canvas-board" className="space-y-2">
        {/* Row 1: Partners | Activities | Value | Relationship | Segments */}
        <div className="grid grid-cols-5 gap-2">
          {/* Partners — spans 2 rows */}
          <div className="row-span-2">
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'parceriasEstrategicas')!}
              notes={canvasData.parceriasEstrategicas}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          {/* Activities */}
          <div>
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'atividadesChave')!}
              notes={canvasData.atividadesChave}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          {/* Value Proposition — spans 2 rows */}
          <div className="row-span-2">
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'valorJuridica')!}
              notes={canvasData.valorJuridica}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          {/* Relationship */}
          <div>
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'relacionamentoClientes')!}
              notes={canvasData.relacionamentoClientes}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          {/* Segments — spans 2 rows */}
          <div className="row-span-2">
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'segmentosClientes')!}
              notes={canvasData.segmentosClientes}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
        </div>

        {/* Row 2: (Partners cont.) | Resources | (Value cont.) | Channels | (Segments cont.) */}
        <div className="grid grid-cols-5 gap-2" style={{ marginTop: 0 }}>
          <div className="invisible" /> {/* partners placeholder */}
          <div>
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'recursosChave')!}
              notes={canvasData.recursosChave}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          <div className="invisible" /> {/* value placeholder */}
          <div>
            <CanvasBlockCard
              block={CANVAS_BLOCKS.find((b) => b.key === 'canaisAtendimento')!}
              notes={canvasData.canaisAtendimento}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragging={dragging}
            />
          </div>
          <div className="invisible" /> {/* segments placeholder */}
        </div>

        {/* Row 3: Costs | Revenue */}
        <div className="grid grid-cols-2 gap-2">
          <CanvasBlockCard
            block={CANVAS_BLOCKS.find((b) => b.key === 'estruturaCustos')!}
            notes={canvasData.estruturaCustos}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            dragging={dragging}
          />
          <CanvasBlockCard
            block={CANVAS_BLOCKS.find((b) => b.key === 'fontesReceita')!}
            notes={canvasData.fontesReceita}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            dragging={dragging}
          />
        </div>
      </div>

      {/* Legend */}
      <p className="text-[10px] text-[#4a5568] text-center pb-2">
        Arraste notas entre blocos para reorganizar · Clique em &quot;Adicionar&quot; em cada bloco para inserir itens · Exportar salva como imagem PNG
      </p>
    </div>
  );
}
