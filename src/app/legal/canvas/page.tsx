'use client';

import { useMemo, useCallback } from 'react';
import { LayoutDashboard, Save } from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { LegalCanvasBoard } from '@/components/legal/LegalCanvasBoard';
import type { CanvasSection } from '@/components/legal/LegalCanvasBoard';
import type { LegalCanvas } from '@/types/legal';

const SECTION_KEYS = [
  { key: 'mission', title: 'Missao' },
  { key: 'vision', title: 'Visao' },
  { key: 'practiceAreas', title: 'Areas de Atuacao' },
  { key: 'targetClients', title: 'Clientes-Alvo' },
  { key: 'channels', title: 'Canais' },
  { key: 'revenue', title: 'Fontes de Receita' },
  { key: 'costs', title: 'Estrutura de Custos' },
  { key: 'partnerships', title: 'Parcerias' },
  { key: 'competitiveAdvantage', title: 'Vantagem Competitiva' },
] as const;

function createEmptyCanvas(): LegalCanvas {
  const now = new Date().toISOString();
  return {
    id: `canvas-${Date.now()}`,
    firmName: '',
    mission: '',
    vision: '',
    values: [],
    practiceAreas: [],
    targetClients: [],
    channels: [],
    revenue: [],
    costs: [],
    partnerships: [],
    competitiveAdvantage: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getCanvasField(canvas: LegalCanvas, key: string): string[] {
  switch (key) {
    case 'mission': return canvas.mission ? [canvas.mission] : [];
    case 'vision': return canvas.vision ? [canvas.vision] : [];
    case 'practiceAreas': return canvas.practiceAreas as string[];
    case 'targetClients': return canvas.targetClients;
    case 'channels': return canvas.channels;
    case 'revenue': return canvas.revenue;
    case 'costs': return canvas.costs;
    case 'partnerships': return canvas.partnerships;
    case 'competitiveAdvantage': return canvas.competitiveAdvantage;
    default: return [];
  }
}

function setCanvasField(canvas: LegalCanvas, key: string, items: string[]): LegalCanvas {
  const updated = { ...canvas, updatedAt: new Date().toISOString() };
  switch (key) {
    case 'mission':
      updated.mission = items.join('; ');
      break;
    case 'vision':
      updated.vision = items.join('; ');
      break;
    case 'practiceAreas':
      (updated as Record<string, unknown>).practiceAreas = items;
      break;
    case 'targetClients':
      updated.targetClients = items;
      break;
    case 'channels':
      updated.channels = items;
      break;
    case 'revenue':
      updated.revenue = items;
      break;
    case 'costs':
      updated.costs = items;
      break;
    case 'partnerships':
      updated.partnerships = items;
      break;
    case 'competitiveAdvantage':
      updated.competitiveAdvantage = items;
      break;
  }
  return updated;
}

export default function CanvasPage() {
  const { legalCanvas, updateCanvas } = useLegalStrategyStore();
  const canvas = legalCanvas ?? createEmptyCanvas();

  const sections: CanvasSection[] = useMemo(() => {
    return SECTION_KEYS.map((sk) => ({
      key: sk.key,
      title: sk.title,
      items: getCanvasField(canvas, sk.key),
    }));
  }, [canvas]);

  const handleAddItem = useCallback(
    (sectionKey: string, item: string) => {
      const currentItems = getCanvasField(canvas, sectionKey);
      const updated = setCanvasField(canvas, sectionKey, [...currentItems, item]);
      updateCanvas(updated);
    },
    [canvas, updateCanvas]
  );

  const handleRemoveItem = useCallback(
    (sectionKey: string, index: number) => {
      const currentItems = getCanvasField(canvas, sectionKey);
      const newItems = currentItems.filter((_, i) => i !== index);
      const updated = setCanvasField(canvas, sectionKey, newItems);
      updateCanvas(updated);
    },
    [canvas, updateCanvas]
  );

  function seedDemoCanvas() {
    const now = new Date().toISOString();
    const demo: LegalCanvas = {
      id: `canvas-${Date.now()}`,
      firmName: 'Escritorio Modelo Advogados',
      mission: 'Fornecer servicos juridicos de excelencia com foco em resultados e etica',
      vision: 'Ser referencia em advocacia empresarial na regiao ate 2028',
      values: ['Etica', 'Excelencia', 'Inovacao', 'Transparencia'],
      practiceAreas: ['empresarial', 'tributario', 'trabalhista', 'civil'] as LegalCanvas['practiceAreas'],
      targetClients: ['PMEs', 'Startups', 'Holdings Familiares', 'Empresas de Tecnologia'],
      channels: ['Indicacoes', 'LinkedIn', 'Eventos OAB', 'Webinars', 'Blog Juridico'],
      revenue: ['Honorarios Contratuais', 'Consultoria Mensal', 'Honorarios Exitum', 'Sucumbencia'],
      costs: ['Salarios', 'Aluguel', 'Tecnologia', 'Capacitacao', 'Marketing'],
      partnerships: ['Contabilidades', 'Consultorias Empresariais', 'Correspondentes', 'Legal Techs'],
      competitiveAdvantage: ['Atendimento Personalizado', 'Tecnologia Juridica', 'Especializacao', 'Rede de Parceiros'],
      createdAt: now,
      updatedAt: now,
    };
    updateCanvas(demo);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-amber-400" />
            Legal Canvas
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Modelo Canvas adaptado para escritorios de advocacia - Metodologia Lara Selem
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!legalCanvas && (
            <button
              onClick={seedDemoCanvas}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              Carregar Demo
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400 border border-green-500/20">
            <Save className="h-3.5 w-3.5" />
            Auto-save ativo
          </div>
        </div>
      </div>

      {/* Canvas Board */}
      <LegalCanvasBoard
        sections={sections}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
