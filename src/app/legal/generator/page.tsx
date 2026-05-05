'use client';

import { useState, useCallback } from 'react';
import { Wand2, Copy, Download, Save, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { PetitionWizard } from '@/components/legal/PetitionWizard';

const LEGAL_AREAS = [
  { value: 'civil', label: 'Civil' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'penal', label: 'Penal' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Familia' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'previdenciario', label: 'Previdenciario' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'digital', label: 'Digital' },
] as const;

const PETITION_TYPES = [
  { value: 'inicial', label: 'Peticao Inicial' },
  { value: 'contestacao', label: 'Contestacao' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'embargo', label: 'Embargo' },
  { value: 'agravo', label: 'Agravo' },
  { value: 'tutela', label: 'Tutela de Urgencia' },
  { value: 'mandado_seguranca', label: 'Mandado de Seguranca' },
  { value: 'habeas_corpus', label: 'Habeas Corpus' },
  { value: 'contrarrazoes', label: 'Contrarrazoes' },
  { value: 'recurso_especial', label: 'Recurso Especial' },
  { value: 'recurso_extraordinario', label: 'Recurso Extraordinario' },
] as const;

const WIZARD_STEPS = [
  { title: 'Area e Tipo', description: 'Selecione a area e tipo de peca' },
  { title: 'Dados do Caso', description: 'Preencha as informacoes' },
  { title: 'Peticao Gerada', description: 'Revise e exporte' },
];

interface CaseDetails {
  clientName: string;
  opposingParty: string;
  court: string;
  vara: string;
  comarca: string;
  facts: string;
  arguments: string;
  requests: string;
}

function generatePetition(
  area: string,
  type: string,
  details: CaseDetails
): string {
  const areaLabel = LEGAL_AREAS.find((a) => a.value === area)?.label || area;
  const typeLabel = PETITION_TYPES.find((t) => t.value === type)?.label || type;
  const today = new Date().toLocaleDateString('pt-BR');

  return `EXCELENTISSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ${details.vara.toUpperCase() || '__ VARA'} ${details.court ? `DO ${details.court.toUpperCase()}` : ''} DA COMARCA DE ${details.comarca.toUpperCase() || '________'}

${typeLabel.toUpperCase()} - AREA: ${areaLabel.toUpperCase()}

${details.clientName.toUpperCase() || 'REQUERENTE'}, devidamente qualificado(a) nos autos, por seu(sua) advogado(a) que esta subscreve, vem, respeitosamente, perante Vossa Excelencia, com fundamento nos dispositivos legais aplicaveis, propor a presente

${typeLabel.toUpperCase()}

em face de ${details.opposingParty.toUpperCase() || 'REQUERIDO(A)'}, pelos fatos e fundamentos a seguir expostos.

I - DOS FATOS

${details.facts || '[Descreva os fatos relevantes do caso]'}

II - DO DIREITO

${details.arguments || '[Apresente os fundamentos juridicos aplicaveis]'}

Conforme jurisprudencia dominante dos Tribunais Superiores e a doutrina majoritaria na area de ${areaLabel}, os fatos narrados configuram situacao que merece tutela jurisdicional.

Cumpre destacar que o artigo 5, inciso XXXV, da Constituicao Federal, assegura que "a lei nao excluira da apreciacao do Poder Judiciario lesao ou ameaca a direito", fundamentando o presente pedido.

III - DOS PEDIDOS

Ante o exposto, requer:

${details.requests || '[Especifique os pedidos]'}

a) A citacao da parte Requerida para, querendo, contestar a presente acao, sob pena de revelia;

b) A producao de todas as provas admitidas em direito, especialmente documental, testemunhal e pericial;

c) A condenacao da parte Requerida ao pagamento das custas processuais e honorarios advocaticios;

d) A concessao dos beneficios da justica gratuita, caso aplicavel.

Da-se a causa o valor de R$ [VALOR].

Termos em que,
Pede deferimento.

${details.comarca || '[Cidade]'}, ${today}.

_____________________________
Advogado(a) - OAB/__ n. ______

---
Documento gerado por AIOX Legal - Assistente Juridico com IA
Nota: Este documento e um rascunho e deve ser revisado por um advogado habilitado antes de seu protocolo.`;
}

export default function GeneratorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [area, setArea] = useState('');
  const [petitionType, setPetitionType] = useState('');
  const [details, setDetails] = useState<CaseDetails>({
    clientName: '',
    opposingParty: '',
    court: '',
    vara: '',
    comarca: '',
    facts: '',
    arguments: '',
    requests: '',
  });
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const canAdvance = useCallback(() => {
    if (currentStep === 0) return area !== '' && petitionType !== '';
    if (currentStep === 1) return details.clientName.trim() !== '' && details.facts.trim() !== '';
    return false;
  }, [currentStep, area, petitionType, details]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Generate petition
      setIsGenerating(true);
      setCurrentStep(2);
      setTimeout(() => {
        const text = generatePetition(area, petitionType, details);
        setGeneratedText(text);
        setIsGenerating(false);
      }, 2000);
    } else {
      setCurrentStep((s) => Math.min(s + 1, 2));
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peticao_${petitionType}_${area}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateDetail = (field: keyof CaseDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Wand2 className="h-7 w-7 text-amber-400" />
          Gerador de Peticoes com IA
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Crie pecas juridicas profissionais em minutos com assistencia de inteligencia artificial
        </p>
      </div>

      {/* Wizard */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <PetitionWizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          canAdvance={canAdvance()}
        >
          {/* Step 1: Area & Type */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Area do Direito
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {LEGAL_AREAS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setArea(a.value)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        area === a.value
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          : 'border-[#1a2332] bg-[#0a0f1a] text-[#8899aa] hover:border-[#2a3342] hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Tipo de Peca
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {PETITION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setPetitionType(t.value)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${
                        petitionType === t.value
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          : 'border-[#1a2332] bg-[#0a0f1a] text-[#8899aa] hover:border-[#2a3342] hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Case Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                    Nome do Cliente *
                  </label>
                  <input
                    value={details.clientName}
                    onChange={(e) => updateDetail('clientName', e.target.value)}
                    placeholder="Nome completo do cliente"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                    Parte Contraria
                  </label>
                  <input
                    value={details.opposingParty}
                    onChange={(e) => updateDetail('opposingParty', e.target.value)}
                    placeholder="Nome da parte contraria"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                    Tribunal / Foro
                  </label>
                  <input
                    value={details.court}
                    onChange={(e) => updateDetail('court', e.target.value)}
                    placeholder="Ex: Tribunal de Justica de Sao Paulo"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                    Vara
                  </label>
                  <input
                    value={details.vara}
                    onChange={(e) => updateDetail('vara', e.target.value)}
                    placeholder="Ex: 3a Vara Civel"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                    Comarca
                  </label>
                  <input
                    value={details.comarca}
                    onChange={(e) => updateDetail('comarca', e.target.value)}
                    placeholder="Ex: Sao Paulo - SP"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                  Resumo dos Fatos *
                </label>
                <textarea
                  value={details.facts}
                  onChange={(e) => updateDetail('facts', e.target.value)}
                  placeholder="Descreva os fatos relevantes do caso..."
                  rows={4}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                  Fundamentos Juridicos
                </label>
                <textarea
                  value={details.arguments}
                  onChange={(e) => updateDetail('arguments', e.target.value)}
                  placeholder="Apresente os fundamentos juridicos e legislacao aplicavel..."
                  rows={4}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7a8d] mb-1.5 uppercase tracking-wider">
                  Pedidos Especificos
                </label>
                <textarea
                  value={details.requests}
                  onChange={(e) => updateDetail('requests', e.target.value)}
                  placeholder="Liste os pedidos a serem formulados..."
                  rows={3}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder:text-[#4a5568] focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Generated Petition */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-[#1a2332] border-t-amber-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-sm text-[#6b7a8d]">Gerando peticao com IA...</p>
                  <p className="text-xs text-[#4a5568]">Analisando legislacao e jurisprudencia aplicavel</p>
                </div>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 rounded-lg border border-[#2a3342] bg-[#0a0f1a] px-4 py-2 text-sm font-medium text-[#8899aa] hover:text-white hover:border-amber-500/30 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 rounded-lg border border-[#2a3342] bg-[#0a0f1a] px-4 py-2 text-sm font-medium text-[#8899aa] hover:text-white hover:border-amber-500/30 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Baixar .doc
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all"
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

                  {/* Generated Text */}
                  <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-6 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm text-[#c0c8d4] leading-relaxed whitespace-pre-wrap font-sans">
                      {generatedText}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </PetitionWizard>
      </div>
    </div>
  );
}
