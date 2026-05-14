'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSearch, Loader2, Sparkles, Send, Upload, User, Bot, Scale, AlertCircle, CheckCircle2, Scissors, MessageSquare } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnalysisEntity {
  type: 'party' | 'lawyer' | 'judge' | 'date' | 'value' | 'law';
  label: string;
  value: string;
}

interface AnalysisClause {
  id: string;
  title: string;
  summary: string;
  risk: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  summary: string;
  docType: string;
  legalArea: string;
  complexity: number;
  entities: AnalysisEntity[];
  clauses: AnalysisClause[];
  strategy: StrategyAnalysis;
}

interface StrategyAnalysis {
  recommendation: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  riskLevel: 'low' | 'medium' | 'high';
  estimatedSuccessRate: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: { name: string; size: number }[];
}

type AnalysisPhase = 'upload' | 'polo_question' | 'analyzing' | 'results' | 'chat';
type UserPolo = 'autor' | 'reu' | 'terceiro' | null;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── File Splitter ──────────────────────────────────────────────────────────

function splitLargeFile(file: File, chunkSizeMB: number = 5): { name: string; partNumber: number; totalParts: number; size: number }[] {
  const chunkSize = chunkSizeMB * 1024 * 1024;
  const totalParts = Math.ceil(file.size / chunkSize);
  const parts = [];
  for (let i = 0; i < totalParts; i++) {
    parts.push({
      name: `${file.name} (parte ${i + 1}/${totalParts})`,
      partNumber: i + 1,
      totalParts,
      size: Math.min(chunkSize, file.size - i * chunkSize),
    });
  }
  return parts;
}

// ─── Mock Analysis ──────────────────────────────────────────────────────────

function generateAnalysis(fileName: string, polo: UserPolo): AnalysisResult {
  const isContract = /contrato|acordo|termo/i.test(fileName);
  const isPetition = /peti[cç][aã]o|inicial|recurso/i.test(fileName);
  const isSentence = /senten[cç]a|ac[oó]rd[aã]o|decis[aã]o/i.test(fileName);

  const poloLabel = polo === 'autor' ? 'Autor' : polo === 'reu' ? 'Réu' : 'Terceiro Interessado';

  const entities: AnalysisEntity[] = [
    { type: 'party', label: 'Autor', value: 'Maria Silva Santos' },
    { type: 'party', label: 'Réu', value: 'Empresa XYZ Ltda' },
    { type: 'lawyer', label: 'Advogado Autor', value: 'Dr. Carlos Mendes - OAB/SP 123.456' },
    { type: 'date', label: 'Data', value: '15/03/2025' },
    { type: 'value', label: 'Valor da Causa', value: 'R$ 150.000,00' },
    { type: 'law', label: 'Legislação', value: 'CPC Art. 300, Art. 489 §1º' },
  ];

  if (isSentence) {
    entities.push({ type: 'judge', label: 'Magistrado', value: 'Dr. Roberto Andrade - 3ª Vara Cível' });
  }

  const clauses: AnalysisClause[] = isContract ? [
    { id: 'c1', title: 'Objeto do Contrato', summary: 'Escopo bem delimitado e dentro dos padrões legais.', risk: 'low' },
    { id: 'c2', title: 'Honorários', summary: 'Valor de 20% sobre êxito. Dentro da tabela OAB.', risk: 'low' },
    { id: 'c3', title: 'Confidencialidade', summary: 'Multa de R$ 100.000 por violação pode ser excessiva.', risk: 'medium' },
    { id: 'c4', title: 'Rescisão Unilateral', summary: 'Permite rescisão apenas pela contratante. Desequilíbrio contratual.', risk: 'high' },
    { id: 'c5', title: 'Foro de Eleição', summary: 'Foro de SP pode ser prejudicial em relação de consumo.', risk: 'medium' },
  ] : [];

  const strategy: StrategyAnalysis = polo === 'autor' ? {
    recommendation: `Como representante do polo ATIVO (${poloLabel}), a estratégia recomendada é ofensiva com foco na comprovação dos fatos constitutivos do direito alegado.`,
    strengths: [
      'Documentação robusta que comprova os fatos alegados',
      'Jurisprudência consolidada favorável no STJ (Tema 988)',
      'Valor da causa compatível com os danos demonstrados',
      'Provas documentais pré-constituídas',
    ],
    weaknesses: [
      'Possível alegação de prescrição parcial pelo réu',
      'Necessidade de prova pericial pode alongar o processo',
      'Risco de impugnação do valor da causa',
    ],
    nextSteps: [
      '1. Reunir e organizar toda documentação comprobatória',
      '2. Elaborar petição inicial com fundamentação robusta',
      '3. Requerer tutela de urgência se houver risco de dano',
      '4. Preparar rol de testemunhas e quesitos periciais',
      '5. Monitorar prazos processuais com rigor',
    ],
    riskLevel: 'medium',
    estimatedSuccessRate: 72,
  } : {
    recommendation: `Como representante do polo PASSIVO (${poloLabel}), a estratégia recomendada é defensiva com foco na desconstituição das provas e teses adversárias.`,
    strengths: [
      'Possibilidade de arguir preliminares processuais',
      'Documentação interna pode contradizer alegações do autor',
      'Valor pedido pode ser considerado excessivo',
      'Há divergência jurisprudencial sobre o tema',
    ],
    weaknesses: [
      'Ônus da prova pode recair sobre o réu em pontos específicos',
      'Jurisprudência majoritária favorável ao autor neste tipo de ação',
      'Risco de tutela de urgência deferida liminarmente',
    ],
    nextSteps: [
      '1. Analisar possibilidade de acordo pré-processual',
      '2. Preparar contestação impugnando fatos e fundamentos',
      '3. Arguir preliminares (prescrição, incompetência, ilegitimidade)',
      '4. Requerer provas que desconstituam as alegações adversárias',
      '5. Avaliar cabimento de reconvenção',
    ],
    riskLevel: 'high',
    estimatedSuccessRate: 45,
  };

  const summary = isPetition
    ? `Petição analisada sob a perspectiva do ${poloLabel}. O documento apresenta demanda ${isPetition ? 'cível' : 'judicial'} com valor de R$ 150.000,00. A análise identificou ${entities.length} entidades, ${clauses.length} cláusulas relevantes e gerou recomendação estratégica personalizada para o polo representado.`
    : isContract
    ? `Contrato analisado sob a perspectiva do ${poloLabel}. Identificadas ${clauses.length} cláusulas, sendo ${clauses.filter(c => c.risk === 'high').length} de alto risco e ${clauses.filter(c => c.risk === 'medium').length} de risco moderado. Recomendações estratégicas incluídas.`
    : `Documento judicial analisado sob a perspectiva do ${poloLabel}. Análise completa com extração de entidades, classificação e estratégia processual personalizada.`;

  return {
    summary,
    docType: isContract ? 'Contrato' : isPetition ? 'Petição' : isSentence ? 'Decisão Judicial' : 'Documento Jurídico',
    legalArea: 'Cível / Consumidor',
    complexity: isPetition ? 7 : isContract ? 6 : 8,
    entities,
    clauses,
    strategy,
  };
}

function generateChatResponse(message: string, analysis: AnalysisResult | null): string {
  const lower = message.toLowerCase();

  if (lower.includes('prazo') || lower.includes('tempo')) {
    return 'Com base na análise do documento, os prazos relevantes são:\n\n• **Contestação**: 15 dias úteis (art. 335, CPC)\n• **Réplica**: 15 dias úteis (art. 351, CPC)\n• **Recurso de Apelação**: 15 dias úteis\n\nRecomendo atenção especial ao prazo de contestação que é o mais urgente.';
  }
  if (lower.includes('risco') || lower.includes('chance')) {
    const rate = analysis?.strategy.estimatedSuccessRate || 50;
    return `A análise indica uma probabilidade de êxito de **${rate}%** com base nos elementos identificados no documento.\n\nFatores de risco:\n${analysis?.strategy.weaknesses.map(w => `• ${w}`).join('\n') || '• Análise pendente'}\n\nRecomendo fortalecer os pontos fracos identificados antes de prosseguir.`;
  }
  if (lower.includes('estratég') || lower.includes('recomen')) {
    return `**Estratégia Recomendada:**\n\n${analysis?.strategy.recommendation || 'Análise pendente.'}\n\n**Próximos passos:**\n${analysis?.strategy.nextSteps.map(s => `${s}`).join('\n') || '• Aguardando análise'}`;
  }
  if (lower.includes('cláusula') || lower.includes('clausula') || lower.includes('contrato')) {
    if (analysis?.clauses.length) {
      return `**Análise de Cláusulas:**\n\n${analysis.clauses.map(c => `• **${c.title}** (Risco: ${c.risk === 'high' ? '🔴 Alto' : c.risk === 'medium' ? '🟡 Médio' : '🟢 Baixo'}): ${c.summary}`).join('\n\n')}`;
    }
    return 'Não foram identificadas cláusulas específicas neste tipo de documento. Envie um contrato para análise detalhada de cláusulas.';
  }
  if (lower.includes('jurisprud') || lower.includes('precedent')) {
    return '**Precedentes Relevantes:**\n\n• **REsp 1.696.396/MT** (Tema 988, STJ) — Taxatividade mitigada do art. 1.015 do CPC\n• **Súmula 385/STJ** — Inscricao indevida em cadastro de inadimplentes\n• **RE 1.234.567/SP** — Quantum de dano moral em relações de consumo\n\nEstes precedentes podem fundamentar a tese identificada na análise.';
  }
  if (lower.includes('peça') || lower.includes('petição') || lower.includes('minutar')) {
    return 'Posso ajudar a direcionar a elaboração de peças. Com base na análise:\n\n1. **Petição Inicial / Contestação**: Use o Gerador de Petições em /legal/generator\n2. **Tutela de Urgência**: Recomendada se houver risco de dano iminente\n3. **Embargos**: Se houver omissão na decisão analisada\n\nDeseja que eu detalhe alguma dessas opções?';
  }

  return `Entendi sua pergunta sobre "${message.slice(0, 50)}...".\n\nCom base na análise do documento, posso informar que:\n\n• O documento foi classificado como **${analysis?.docType || 'Documento Jurídico'}**\n• Área: **${analysis?.legalArea || 'Cível'}**\n• Complexidade: **${analysis?.complexity || 5}/10**\n• Taxa de êxito estimada: **${analysis?.strategy.estimatedSuccessRate || 50}%**\n\nPosso detalhar sobre **estratégia**, **riscos**, **prazos**, **cláusulas**, **jurisprudência** ou **elaboração de peças**. O que precisa?`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [phase, setPhase] = useState<AnalysisPhase>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [fileParts, setFileParts] = useState<{ name: string; partNumber: number; totalParts: number }[]>([]);
  const [wasSplit, setWasSplit] = useState(false);
  const [polo, setPolo] = useState<UserPolo>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    const file = uploadedFiles[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const parts = splitLargeFile(file);
      setFileParts(parts);
      setWasSplit(true);
    } else {
      setFileParts([]);
      setWasSplit(false);
    }

    setFiles(uploadedFiles);
    setPhase('polo_question');
  }, []);

  const handlePoloSelect = (selectedPolo: UserPolo) => {
    setPolo(selectedPolo);
    startAnalysis(selectedPolo);
  };

  const startAnalysis = async (selectedPolo: UserPolo) => {
    setPhase('analyzing');
    setAnalyzing(true);

    const steps = [
      { label: 'Orquestrador acionado — distribuindo tarefas...', progress: 10 },
      { label: 'Leitor Processual — extraindo dados do documento...', progress: 25 },
      { label: 'Analista Processual — identificando vícios e nulidades...', progress: 40 },
      { label: 'Pesquisador Jurisprudencial — buscando precedentes...', progress: 55 },
      { label: 'Analista Legislativo — mapeando legislação aplicável...', progress: 70 },
      { label: 'Estrategista Jurídico — definindo estratégia para o polo ' + (selectedPolo === 'autor' ? 'ativo' : 'passivo') + '...', progress: 85 },
      { label: 'Revisor Jurídico — consolidando análise final...', progress: 95 },
      { label: 'Análise completa!', progress: 100 },
    ];

    for (const step of steps) {
      setAnalyzeStep(step.label);
      setAnalyzeProgress(step.progress);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    }

    const result = generateAnalysis(files[0]?.name || 'documento.pdf', selectedPolo);
    setAnalysis(result);
    setAnalyzing(false);
    setPhase('results');

    setMessages([{
      id: 'system-1',
      role: 'system',
      content: `Documento "${files[0]?.name}" analisado com sucesso sob a perspectiva do ${selectedPolo === 'autor' ? 'polo ativo (Autor)' : selectedPolo === 'reu' ? 'polo passivo (Réu)' : 'terceiro interessado'}.`,
      timestamp: new Date().toISOString(),
    }, {
      id: 'assistant-1',
      role: 'assistant',
      content: `Análise concluída! Identifiquei ${result.entities.length} entidades, ${result.clauses.length} cláusulas e gerei uma estratégia processual personalizada.\n\nA taxa estimada de êxito é de **${result.strategy.estimatedSuccessRate}%**.\n\nVocê pode:\n• Perguntar sobre **estratégia**, **riscos**, **prazos**, **cláusulas** ou **jurisprudência**\n• Enviar **documentos adicionais** para complementar a análise\n• Solicitar **minutas de peças** com base na análise\n\nComo posso ajudar?`,
      timestamp: new Date().toISOString(),
    }]);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateChatResponse(chatInput, analysis);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleAdditionalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles(prev => [...prev, file]);

    const userMsg: ChatMessage = {
      id: `user-file-${Date.now()}`,
      role: 'user',
      content: `Documento adicional enviado para análise.`,
      timestamp: new Date().toISOString(),
      attachments: [{ name: file.name, size: file.size }],
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `assistant-file-${Date.now()}`,
        role: 'assistant',
        content: `Recebi o documento **"${file.name}"** (${(file.size / 1024).toFixed(0)} KB). Analisando em conjunto com os documentos anteriores...\n\nO novo documento complementa a análise anterior. Identifiquei elementos adicionais que podem fortalecer a tese.\n\nDeseja que eu atualize a **estratégia processual** considerando este novo documento?`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 2000);
  };

  const goToChat = () => setPhase('chat');

  const riskColor = (risk: string) =>
    risk === 'high' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    risk === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
    'text-green-400 bg-green-500/10 border-green-500/20';

  const riskLabel = (risk: string) =>
    risk === 'high' ? 'Alto' : risk === 'medium' ? 'Médio' : 'Baixo';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a2332] bg-[#0d1320] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <FileSearch className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Análise Inteligente de Documentos</h1>
              <p className="text-xs text-[#6b7a8d]">
                {phase === 'upload' && 'Envie um documento para análise completa pelo squad de agentes'}
                {phase === 'polo_question' && 'Identifique o polo que você representa'}
                {phase === 'analyzing' && 'Agentes analisando o documento...'}
                {phase === 'results' && 'Análise concluída — revise os resultados'}
                {phase === 'chat' && 'Converse com a IA sobre o documento analisado'}
              </p>
            </div>
          </div>
          {analysis && phase !== 'chat' && (
            <button onClick={goToChat} className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
              <MessageSquare className="h-4 w-4" /> Abrir Chat
            </button>
          )}
          {phase === 'chat' && (
            <button onClick={() => setPhase('results')} className="flex items-center gap-2 rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#8899aa] hover:text-white transition-colors">
              Ver Resultados
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* PHASE: Upload */}
        {phase === 'upload' && (
          <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="rounded-xl border-2 border-dashed border-[#1a2332] bg-[#0d1320] p-8 text-center hover:border-amber-500/30 transition-colors">
              <Upload className="h-12 w-12 text-[#2a3342] mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Arraste um documento ou clique para selecionar</p>
              <p className="text-xs text-[#6b7a8d] mb-4">PDF, DOC, DOCX — Arquivos maiores que 10MB serão divididos automaticamente</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload([file]);
                }}
              />
              <label htmlFor="file-upload" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-amber-400 cursor-pointer transition-colors">
                <Upload className="h-4 w-4" /> Selecionar Documento
              </label>
            </div>

            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <h3 className="text-sm font-medium text-white mb-3">O que a análise faz:</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {['Extrai partes, advogados, valores, leis citadas', 'Classifica o tipo e área do documento', 'Identifica cláusulas com nível de risco', 'Gera estratégia processual personalizada', 'Busca precedentes relevantes', 'Permite chat interativo pós-análise'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[#8899aa]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE: Polo Question */}
        {phase === 'polo_question' && (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            {wasSplit && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
                <Scissors className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Arquivo grande — dividido automaticamente</p>
                  <p className="text-xs text-[#8899aa] mt-1">
                    O arquivo "{files[0]?.name}" ({(files[0]?.size / 1024 / 1024).toFixed(1)} MB) foi dividido em {fileParts.length} partes para análise otimizada.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fileParts.map((p) => (
                      <span key={p.partNumber} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400">
                        Parte {p.partNumber}/{p.totalParts}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <Scale className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Qual polo você representa?</h2>
              <p className="text-sm text-[#8899aa] mb-6">
                Esta informação é essencial para direcionar a análise estratégica e as recomendações de forma personalizada ao seu caso.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg mx-auto">
                <button onClick={() => handlePoloSelect('autor')}
                  className="rounded-xl border-2 border-green-500/20 bg-green-500/5 p-4 hover:border-green-500/50 hover:bg-green-500/10 transition-all">
                  <p className="text-green-400 font-bold text-lg">AUTOR</p>
                  <p className="text-[10px] text-[#6b7a8d] mt-1">Polo Ativo</p>
                </button>
                <button onClick={() => handlePoloSelect('reu')}
                  className="rounded-xl border-2 border-red-500/20 bg-red-500/5 p-4 hover:border-red-500/50 hover:bg-red-500/10 transition-all">
                  <p className="text-red-400 font-bold text-lg">RÉU</p>
                  <p className="text-[10px] text-[#6b7a8d] mt-1">Polo Passivo</p>
                </button>
                <button onClick={() => handlePoloSelect('terceiro')}
                  className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all">
                  <p className="text-blue-400 font-bold text-lg">TERCEIRO</p>
                  <p className="text-[10px] text-[#6b7a8d] mt-1">Interessado</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE: Analyzing */}
        {phase === 'analyzing' && (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-8">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-white text-center mb-2">Squad de Análise em Ação</h2>
              <p className="text-sm text-amber-400 text-center mb-6">{analyzeStep}</p>

              <div className="w-full bg-[#1a2332] rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analyzeProgress}%` }} />
              </div>
              <p className="text-xs text-[#4a5568] text-center">{analyzeProgress}% concluído</p>

              <div className="mt-6 space-y-2">
                {['Orquestrador', 'Leitor Processual', 'Analista Processual', 'Pesquisador Jurisprudencial', 'Analista Legislativo', 'Estrategista Jurídico', 'Revisor Jurídico'].map((agent, i) => (
                  <div key={agent} className="flex items-center gap-2 text-xs">
                    {analyzeProgress > (i + 1) * 13 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    ) : analyzeProgress > i * 13 ? (
                      <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-[#2a3342]" />
                    )}
                    <span className={analyzeProgress > i * 13 ? 'text-white' : 'text-[#4a5568]'}>{agent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE: Results */}
        {phase === 'results' && analysis && (
          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Tipo</p>
                <p className="text-lg font-bold text-white mt-1">{analysis.docType}</p>
              </div>
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Complexidade</p>
                <p className="text-lg font-bold text-white mt-1">{analysis.complexity}/10</p>
              </div>
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Risco</p>
                <p className={`text-lg font-bold mt-1 ${analysis.strategy.riskLevel === 'high' ? 'text-red-400' : analysis.strategy.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {riskLabel(analysis.strategy.riskLevel)}
                </p>
              </div>
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Êxito Estimado</p>
                <p className="text-lg font-bold text-amber-400 mt-1">{analysis.strategy.estimatedSuccessRate}%</p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Resumo da Análise</h3>
              <p className="text-sm text-[#c0ccda] leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Strategy */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Estratégia Processual ({polo === 'autor' ? 'Polo Ativo' : 'Polo Passivo'})
              </h3>
              <p className="text-sm text-[#c0ccda] mb-4">{analysis.strategy.recommendation}</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-green-400 mb-2">Pontos Fortes</p>
                  {analysis.strategy.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-[#8899aa] mb-1 flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" /> {s}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-red-400 mb-2">Pontos de Atenção</p>
                  {analysis.strategy.weaknesses.map((w, i) => (
                    <p key={i} className="text-xs text-[#8899aa] mb-1 flex items-start gap-1.5">
                      <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-amber-500/10">
                <p className="text-xs font-medium text-amber-400 mb-2">Próximos Passos</p>
                {analysis.strategy.nextSteps.map((s, i) => (
                  <p key={i} className="text-xs text-[#c0ccda] mb-1">{s}</p>
                ))}
              </div>
            </div>

            {/* Entities */}
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Entidades Identificadas</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.entities.map((e, i) => (
                  <span key={i} className="inline-flex items-center rounded-full px-3 py-1 text-xs border border-[#1a2332] bg-[#0a0f1a]">
                    <span className="text-[#6b7a8d] mr-1.5">{e.label}:</span>
                    <span className="text-white">{e.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Clauses */}
            {analysis.clauses.length > 0 && (
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Cláusulas Identificadas</h3>
                <div className="space-y-2">
                  {analysis.clauses.map((c) => (
                    <div key={c.id} className={`rounded-lg border p-3 ${riskColor(c.risk)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{c.title}</span>
                        <span className="text-[10px] uppercase tracking-wider">Risco {riskLabel(c.risk)}</span>
                      </div>
                      <p className="text-xs opacity-80">{c.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={goToChat} className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
              <MessageSquare className="h-4 w-4" /> Continuar no Chat — Fazer perguntas sobre a análise
            </button>
          </div>
        )}

        {/* PHASE: Chat */}
        {phase === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 ${
                    msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/20' :
                    msg.role === 'system' ? 'bg-[#1a2332] border border-[#2a3342]' :
                    'bg-[#0d1320] border border-amber-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.role === 'assistant' && <Bot className="h-3.5 w-3.5 text-amber-400" />}
                      {msg.role === 'user' && <User className="h-3.5 w-3.5 text-blue-400" />}
                      {msg.role === 'system' && <Sparkles className="h-3.5 w-3.5 text-[#6b7a8d]" />}
                      <span className="text-[10px] text-[#4a5568]">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.attachments && msg.attachments.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs">
                        <Upload className="h-3 w-3 text-amber-400" />
                        <span className="text-white">{a.name}</span>
                        <span className="text-[#4a5568]">({(a.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    ))}
                    <div className="text-sm text-[#c0ccda] whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-[#0d1320] border border-amber-500/20 p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5 text-amber-400" />
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex-shrink-0 border-t border-[#1a2332] bg-[#0d1320] p-4">
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx"
                  onChange={handleAdditionalFile} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center rounded-lg border border-[#1a2332] px-3 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors"
                  title="Enviar documento adicional">
                  <Upload className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  placeholder="Pergunte sobre estratégia, riscos, prazos, cláusulas, jurisprudência..."
                  className="flex-1 rounded-lg border border-[#1a2332] bg-[#0a0f1a] py-2.5 px-4 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button onClick={sendMessage} disabled={!chatInput.trim()}
                  className="flex items-center justify-center rounded-lg bg-amber-500 px-4 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-[#4a5568] mt-2 text-center">
                Envie documentos adicionais clicando no ícone de upload | Pergunte sobre qualquer aspecto da análise
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
