'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Search, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useLegalStore } from '@/stores/legal-store';
import type { LegalArea, CourtSystem, UrgencyLevel, FeeType } from '@/types/legal';
import { PageHeader } from '@/components/legal/shared';
import { ClientSelector } from '@/components/legal/ClientSelector';
import type { ClientOption } from '@/components/legal/ClientSelector';

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
  { value: 'datajud', label: 'DataJud' },
  { value: 'manual', label: 'Manual' },
];

type CnjSearchStatus = 'idle' | 'searching' | 'found' | 'not_found' | 'error';

interface DataJudResult {
  cnj: string;
  classe: string;
  assuntos: string[];
  tribunal: string;
  orgaoJulgador: string;
  dataAjuizamento: string;
  grau: string;
  movimentos: { codigo: number; nome: string; dataHora: string }[];
}

function formatCnj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  if (digits.length <= 7) return digits;
  let formatted = digits.slice(0, 7);
  if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
  if (digits.length > 9) formatted += '.' + digits.slice(9, 13);
  if (digits.length > 13) formatted += '.' + digits.slice(13, 14);
  if (digits.length > 14) formatted += '.' + digits.slice(14, 16);
  if (digits.length > 16) formatted += '.' + digits.slice(16, 20);
  return formatted;
}

function inferAreaFromAssuntos(assuntos: string[]): LegalArea {
  const text = assuntos.join(' ').toLowerCase();
  if (text.includes('trabalh') || text.includes('rescis') || text.includes('hora extra')) return 'trabalhista';
  if (text.includes('tribut') || text.includes('icms') || text.includes('fiscal')) return 'tributario';
  if (text.includes('penal') || text.includes('crime') || text.includes('furto')) return 'penal';
  if (text.includes('consum') || text.includes('fornec')) return 'consumidor';
  if (text.includes('famil') || text.includes('alimen') || text.includes('guard')) return 'familia';
  if (text.includes('empres') || text.includes('societ') || text.includes('falenc')) return 'empresarial';
  if (text.includes('previd') || text.includes('aposent') || text.includes('inss')) return 'previdenciario';
  if (text.includes('ambient') || text.includes('meio ambiente')) return 'ambiental';
  if (text.includes('digit') || text.includes('lgpd') || text.includes('internet')) return 'digital';
  if (text.includes('admin') || text.includes('licitac') || text.includes('servidor')) return 'administrativo';
  return 'civil';
}

function inferCourtSystem(tribunal: string): CourtSystem {
  const t = tribunal.toUpperCase();
  if (t.includes('TRT') || t.includes('TST')) return 'pje';
  if (t.includes('TRF')) return 'eproc';
  if (t.includes('TJSP')) return 'esaj';
  if (t.includes('TJPR') || t.includes('TJMT')) return 'projudi';
  return 'pje';
}

function inferState(tribunal: string): string {
  const map: Record<string, string> = {
    TJSP: 'SP', TJRJ: 'RJ', TJMG: 'MG', TJRS: 'RS', TJPR: 'PR', TJSC: 'SC',
    TJBA: 'BA', TJPE: 'PE', TJCE: 'CE', TJGO: 'GO', TJDF: 'DF', TJPA: 'PA',
    TJAM: 'AM', TJMA: 'MA', TJMT: 'MT', TJMS: 'MS', TJRO: 'RO', TJAC: 'AC',
    TJRR: 'RR', TJAP: 'AP', TJTO: 'TO', TJAL: 'AL', TJSE: 'SE', TJPI: 'PI',
    TJRN: 'RN', TJPB: 'PB', TJES: 'ES', TRT2: 'SP', TRT1: 'RJ', TRF3: 'SP',
  };
  const key = Object.keys(map).find(k => tribunal.toUpperCase().includes(k));
  return key ? map[key] : '';
}

export default function NewProcessPage() {
  const router = useRouter();
  const { addProcess, addMovement, clients } = useLegalStore();

  const clientOptions: ClientOption[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    cpfCnpj: c.cpfCnpj,
    email: c.email,
  }));

  const [cnjInput, setCnjInput] = useState('');
  const [searchStatus, setSearchStatus] = useState<CnjSearchStatus>('idle');
  const [datajudResult, setDatajudResult] = useState<DataJudResult | null>(null);
  const [preFilledFromCnj, setPreFilledFromCnj] = useState(false);

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

  const searchCnj = async () => {
    const cnj = cnjInput.replace(/\D/g, '');
    if (cnj.length < 20) {
      setSearchStatus('error');
      return;
    }

    setSearchStatus('searching');
    try {
      const response = await fetch(`/api/legal/court/datajud?cnj=${encodeURIComponent(cnjInput)}`);
      const data = await response.json();

      if (data.success && data.data?.process) {
        const process = data.data.process as DataJudResult;
        setDatajudResult(process);
        setSearchStatus('found');

        const assuntos = process.assuntos || [];
        const area = inferAreaFromAssuntos(assuntos);
        const courtSystem = inferCourtSystem(process.tribunal || '');
        const state = inferState(process.tribunal || '');
        const orgao = process.orgaoJulgador || '';
        const varaMatch = orgao.match(/(\d+[ªa]?\s*Vara[^-]*)/i);
        const comarcaMatch = orgao.match(/(?:Comarca|Foro|Secao)\s+(?:de\s+)?(.+?)$/i);

        setForm(prev => ({
          ...prev,
          cnj: cnjInput,
          title: `${process.classe || 'Processo'} — ${assuntos[0] || 'Sem assunto'}`,
          area,
          court: process.tribunal || '',
          vara: varaMatch ? varaMatch[1].trim() : orgao,
          comarca: comarcaMatch ? comarcaMatch[1].trim() : '',
          state,
          courtSystem,
          object: assuntos.join(', '),
        }));
        setPreFilledFromCnj(true);
      } else {
        setSearchStatus('not_found');
        setForm(prev => ({ ...prev, cnj: cnjInput }));
      }
    } catch {
      setSearchStatus('not_found');
      setForm(prev => ({ ...prev, cnj: cnjInput }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processId = addProcess({
      ...form,
      status: 'active',
      contingencyPct: form.feeType === 'contingency' ? 30 : undefined,
      tags: datajudResult ? ['datajud-vinculado', 'sync-ativo'] : [],
    });

    if (datajudResult?.movimentos) {
      for (const mov of datajudResult.movimentos.slice(0, 20)) {
        addMovement({
          processId,
          date: mov.dataHora || new Date().toISOString(),
          description: mov.nome || 'Movimentação',
          type: String(mov.codigo || ''),
          source: 'datajud',
          isRead: false,
        });
      }
    }

    router.push(`/legal/processes/${processId}`);
  };

  const fieldClass = "w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2 px-3 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20";
  const labelClass = "block text-xs font-medium text-[#8899aa] mb-1";
  const prefilledClass = preFilledFromCnj ? "border-green-500/30 bg-green-500/5" : "";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Novo Processo"
        subtitle="Inicie pela consulta do número CNJ para pré-cadastro automático"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Processos', href: '/legal/processes' },
          { label: 'Novo Processo', href: '/legal/processes/new' },
        ]}
      />

      {/* CNJ Search Section */}
      <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Passo 1 — Consultar Processo pelo CNJ
        </h2>
        <p className="text-xs text-[#8899aa] mb-4">
          Digite o número CNJ do processo. A plataforma buscará automaticamente os dados públicos no DataJud/CNJ
          e preencherá o formulário para você. O vínculo com o tribunal será mantido para atualizações automáticas.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full rounded-lg border-2 border-amber-500/20 bg-[#0a0f1a] py-3 px-4 text-lg text-white font-mono placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              value={cnjInput}
              onChange={(e) => {
                setCnjInput(formatCnj(e.target.value));
                if (searchStatus !== 'idle') setSearchStatus('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && searchCnj()}
            />
            {searchStatus === 'found' && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
            )}
          </div>
          <button
            onClick={searchCnj}
            disabled={searchStatus === 'searching' || cnjInput.replace(/\D/g, '').length < 20}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searchStatus === 'searching' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>
            ) : (
              <><Search className="h-4 w-4" /> Consultar CNJ</>
            )}
          </button>
        </div>

        {/* Search Status Messages */}
        {searchStatus === 'found' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">Processo encontrado no DataJud!</p>
              <p className="text-xs text-[#8899aa] mt-1">
                Os dados foram preenchidos automaticamente (campos em verde). Revise e complemente as informações do seu cliente e honorários.
                O processo ficará vinculado ao DataJud para atualizações automáticas a cada 3 horas.
              </p>
              {datajudResult && (
                <div className="mt-2 text-xs text-[#6b7a8d]">
                  <span className="text-white">{datajudResult.classe}</span> — {datajudResult.tribunal} — {datajudResult.orgaoJulgador}
                  {datajudResult.movimentos && (
                    <span className="ml-2 text-amber-400">({datajudResult.movimentos.length} movimentações importadas)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {searchStatus === 'not_found' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Processo não encontrado no DataJud</p>
              <p className="text-xs text-[#8899aa] mt-1">
                O número CNJ não foi localizado na base pública. Você pode preencher os dados manualmente abaixo.
                O processo poderá ser vinculado posteriormente quando disponível no DataJud.
              </p>
            </div>
          </div>
        )}

        {searchStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Formato do CNJ incompleto. Use: NNNNNNN-DD.YYYY.J.TR.OOOO
          </div>
        )}
      </div>

      {/* Sync Info Banner */}
      {preFilledFromCnj && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-400">Sincronização Automática Ativada</p>
            <p className="text-xs text-[#8899aa] mt-1">
              Ao salvar, este processo será monitorado automaticamente. Novas movimentações, decisões e publicações
              serão verificadas <strong>a cada 3 horas</strong> via DataJud e atualizadas no sistema.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 space-y-6">
        {/* Identification */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Passo 2 — Dados do Processo {preFilledFromCnj && <span className="text-green-400 text-[10px] ml-2">PRÉ-PREENCHIDO VIA DATAJUD</span>}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Número CNJ *</label>
              <input type="text" className={`${fieldClass} ${prefilledClass} font-mono`} value={form.cnj}
                onChange={(e) => setForm({ ...form, cnj: e.target.value })} required readOnly={preFilledFromCnj} />
            </div>
            <div>
              <label className={labelClass}>Título / Classe *</label>
              <input type="text" placeholder="Título do processo" className={`${fieldClass} ${prefilledClass}`}
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Área do Direito *</label>
              <select className={`${fieldClass} ${prefilledClass}`} value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value as LegalArea })}>
                {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sistema do Tribunal</label>
              <select className={`${fieldClass} ${prefilledClass}`} value={form.courtSystem}
                onChange={(e) => setForm({ ...form, courtSystem: e.target.value as CourtSystem })}>
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
              <input type="text" placeholder="Ex: TJSP" className={`${fieldClass} ${prefilledClass}`}
                value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Vara / Órgão Julgador</label>
              <input type="text" placeholder="Ex: 1ª Vara Cível" className={`${fieldClass} ${prefilledClass}`}
                value={form.vara} onChange={(e) => setForm({ ...form, vara: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Comarca</label>
              <input type="text" placeholder="Ex: São Paulo" className={`${fieldClass} ${prefilledClass}`}
                value={form.comarca} onChange={(e) => setForm({ ...form, comarca: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <input type="text" placeholder="Ex: SP" className={`${fieldClass} ${prefilledClass}`}
                value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Juiz</label>
              <input type="text" placeholder="Nome do juiz" className={fieldClass}
                value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Urgência</label>
              <select className={fieldClass} value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as UrgencyLevel })}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parties — User fills this */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
            Passo 3 — Partes e Honorários <span className="text-[10px] text-[#6b7a8d] ml-2">PREENCHIMENTO MANUAL</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Cliente *</label>
              <ClientSelector
                clients={clientOptions}
                value={form.clientId || undefined}
                onChange={(clientId) => setForm({ ...form, clientId: clientId ?? '' })}
                placeholder="Buscar cliente..."
              />
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
              <input type="text" placeholder="Descrição do objeto" className={`${fieldClass} ${prefilledClass}`}
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
              <select className={fieldClass} value={form.feeType}
                onChange={(e) => setForm({ ...form, feeType: e.target.value as FeeType })}>
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
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
            <Save className="h-4 w-4" />
            {preFilledFromCnj ? 'Cadastrar e Ativar Sincronização' : 'Cadastrar Processo'}
          </button>
        </div>
      </form>
    </div>
  );
}
