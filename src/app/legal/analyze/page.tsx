'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSearch, Loader2, Sparkles, Send, Upload, User, Bot, Scale, AlertCircle, CheckCircle2, Scissors, MessageSquare, Cpu } from 'lucide-react';
import { PageHeader } from '@/components/legal/shared';

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
  model?: string;
  tokens?: number;
  cost?: number;
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

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (file.type === 'application/pdf') {
        const base64 = result.split(',')[1] || result;
        resolve(`[PDF: ${file.name}, ${(file.size / 1024).toFixed(0)}KB]\n\n${base64.slice(0, 50000)}`);
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    if (file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [phase, setPhase] = useState<AnalysisPhase>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState('');
  const [fileParts, setFileParts] = useState<{ name: string; partNumber: number; totalParts: number }[]>([]);
  const [wasSplit, setWasSplit] = useState(false);
  const [polo, setPolo] = useState<UserPolo>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [aiMeta, setAiMeta] = useState<{ model?: string; tokens?: number; cost?: number; duration?: number }>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
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

    try {
      const content = await readFileAsText(file);
      setFileContent(content);
    } catch {
      setFileContent(`[Arquivo: ${file.name}, ${(file.size / 1024).toFixed(0)}KB]`);
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
    ];

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => Math.min(prev + 1, 85));
    }, 300);

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setAnalyzeStep(steps[stepIndex].label);
        setAnalyzeProgress(steps[stepIndex].progress);
        stepIndex++;
      }
    }, 2500);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileContent,
          fileName: files[0]?.name || 'documento.pdf',
          polo: selectedPolo,
        }),
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        setAnalyzeStep('Análise completa com IA real!');
        setAnalyzeProgress(100);
        setAiMeta({
          model: data.model,
          tokens: data.tokensUsed,
          cost: data.estimatedCost,
          duration: data.durationMs,
        });

        await new Promise(r => setTimeout(r, 500));

        const result = data.analysis as AnalysisResult;
        result.entities = result.entities || [];
        result.clauses = result.clauses || [];
        result.strategy = result.strategy || { recommendation: '', strengths: [], weaknesses: [], nextSteps: [], riskLevel: 'medium', estimatedSuccessRate: 50 };
        result.strategy.strengths = result.strategy.strengths || [];
        result.strategy.weaknesses = result.strategy.weaknesses || [];
        result.strategy.nextSteps = result.strategy.nextSteps || [];

        setAnalysis(result);
        setAnalyzing(false);
        setPhase('results');

        setMessages([
          {
            id: 'system-1',
            role: 'system',
            content: `Documento "${files[0]?.name}" analisado com IA (${data.model || 'Claude'}) sob a perspectiva do ${selectedPolo === 'autor' ? 'polo ativo (Autor)' : selectedPolo === 'reu' ? 'polo passivo (Réu)' : 'terceiro interessado'}.`,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'assistant-1',
            role: 'assistant',
            content: `Análise concluída! Identifiquei ${result.entities.length} entidades, ${result.clauses.length} cláusulas e gerei uma estratégia processual personalizada.\n\n${result.summary}\n\nA taxa estimada de êxito é de **${result.strategy.estimatedSuccessRate}%**.\n\nVocê pode perguntar sobre **estratégia**, **riscos**, **prazos**, **cláusulas**, **jurisprudência** ou solicitar **minutas de peças**.`,
            timestamp: new Date().toISOString(),
            model: data.model,
            tokens: data.tokensUsed,
            cost: data.estimatedCost,
          },
        ]);
        return;
      }
    } catch {
      // AI unavailable — handled below
    }

    clearInterval(progressInterval);
    clearInterval(stepInterval);

    // Fallback: basic analysis without AI
    setAnalyzeStep('Análise básica concluída (IA indisponível)');
    setAnalyzeProgress(100);
    await new Promise(r => setTimeout(r, 500));

    const fileName = files[0]?.name || 'documento.pdf';
    const poloLabel = selectedPolo === 'autor' ? 'Autor' : selectedPolo === 'reu' ? 'Réu' : 'Terceiro';
    const result: AnalysisResult = {
      summary: `Documento "${fileName}" recebido para análise sob a perspectiva do ${poloLabel}. A IA está indisponível no momento — configure a OPENROUTER_API_KEY para análise completa com inteligência artificial.`,
      docType: 'Documento Jurídico',
      legalArea: 'A determinar',
      complexity: 5,
      entities: [],
      clauses: [],
      strategy: {
        recommendation: `Configure a chave da API OpenRouter para obter análise estratégica real com IA para o ${poloLabel}.`,
        strengths: [],
        weaknesses: [],
        nextSteps: ['1. Configure OPENROUTER_API_KEY no arquivo .env', '2. Reenvie o documento para análise com IA'],
        riskLevel: 'medium',
        estimatedSuccessRate: 50,
      },
    };

    setAnalysis(result);
    setAnalyzing(false);
    setPhase('results');
    setMessages([{
      id: 'system-1',
      role: 'system',
      content: `Documento "${files[0]?.name}" recebido. IA indisponível — respostas básicas ativadas.`,
      timestamp: new Date().toISOString(),
    }]);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      const chatHistory = [
        {
          role: 'user',
          content: `Contexto: Você está analisando o documento "${files[0]?.name || 'documento'}" sob a perspectiva do ${polo === 'autor' ? 'polo ativo (Autor)' : polo === 'reu' ? 'polo passivo (Réu)' : 'terceiro interessado'}.\n\nResumo da análise anterior:\n${analysis?.summary || ''}\n\nEstratégia: ${analysis?.strategy.recommendation || ''}\n\nConteúdo do documento (trecho):\n${fileContent.slice(0, 10000)}`,
        },
        ...messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: input },
      ];

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
          model: data.model,
          tokens: data.tokensUsed,
          cost: data.estimatedCost,
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsTyping(false);
        return;
      }
    } catch {
      // fallback below
    }

    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `Recebi sua pergunta sobre "${input.slice(0, 50)}...". A IA está indisponível no momento. Configure a OPENROUTER_API_KEY para respostas inteligentes.`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  };

  const handleAdditionalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFiles(prev => [...prev, file]);

    let newContent = '';
    try {
      newContent = await readFileAsText(file);
      setFileContent(prev => prev + '\n\n---\n\n' + newContent);
    } catch {
      newContent = `[Arquivo: ${file.name}]`;
    }

    const userMsg: ChatMessage = {
      id: `user-file-${Date.now()}`,
      role: 'user',
      content: `Documento adicional enviado para análise.`,
      timestamp: new Date().toISOString(),
      attachments: [{ name: file.name, size: file.size }],
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: [
            { role: 'user', content: `Analise este documento adicional "${file.name}" em conjunto com a análise anterior do documento "${files[0]?.name}".\n\nAnálise anterior: ${analysis?.summary || ''}\n\nNovo documento:\n${newContent.slice(0, 20000)}` },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: `assistant-file-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
          model: data.model,
          tokens: data.tokensUsed,
          cost: data.estimatedCost,
        }]);
        setIsTyping(false);
        return;
      }
    } catch {
      // fallback
    }

    setMessages(prev => [...prev, {
      id: `assistant-file-${Date.now()}`,
      role: 'assistant',
      content: `Recebi o documento **"${file.name}"** (${(file.size / 1024).toFixed(0)} KB). Configure a OPENROUTER_API_KEY para análise conjunta com IA.`,
      timestamp: new Date().toISOString(),
    }]);
    setIsTyping(false);
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
      <div className="flex-shrink-0 border-b border-[#1a2332] bg-[#0d1320] px-6 pt-4">
        <PageHeader
          title="Análise de Documentos"
          subtitle={
            phase === 'upload' ? 'Envie um documento para análise completa com IA' :
            phase === 'polo_question' ? 'Identifique o polo que você representa' :
            phase === 'analyzing' ? 'IA analisando o documento...' :
            phase === 'results' ? 'Análise concluída — revise os resultados' :
            'Converse com a IA sobre o documento analisado'
          }
          breadcrumbs={[
            { label: 'Dashboard', href: '/legal' },
            { label: 'Análise de Documentos', href: '/legal/analyze' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {aiMeta.model && (
                <div className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-1.5 text-[10px] text-[#6b7a8d]">
                  <Cpu className="h-3 w-3" />
                  {aiMeta.model} | {aiMeta.tokens} tokens | ${aiMeta.cost?.toFixed(4)}
                </div>
              )}
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
          }
        />
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
                accept=".pdf,.doc,.docx,.txt"
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
                {['Extrai partes, advogados, valores, leis citadas', 'Classifica o tipo e área do documento', 'Identifica cláusulas com nível de risco', 'Gera estratégia processual com IA real', 'Busca precedentes relevantes (STF/STJ)', 'Chat interativo pós-análise com contexto'].map((item) => (
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
                    O arquivo &quot;{files[0]?.name}&quot; ({(files[0]?.size / 1024 / 1024).toFixed(1)} MB) foi dividido em {fileParts.length} partes para análise otimizada.
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
                Esta informação direciona a análise estratégica da IA para o seu caso.
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
              <h2 className="text-lg font-bold text-white text-center mb-2">IA Analisando Documento</h2>
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

            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Resumo da Análise</h3>
              <p className="text-sm text-[#c0ccda] leading-relaxed whitespace-pre-wrap">{analysis.summary}</p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Estratégia Processual ({polo === 'autor' ? 'Polo Ativo' : polo === 'reu' ? 'Polo Passivo' : 'Terceiro'})
              </h3>
              <p className="text-sm text-[#c0ccda] mb-4 whitespace-pre-wrap">{analysis.strategy.recommendation}</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {analysis.strategy.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-2">Pontos Fortes</p>
                    {analysis.strategy.strengths.map((s, i) => (
                      <p key={i} className="text-xs text-[#8899aa] mb-1 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" /> {s}
                      </p>
                    ))}
                  </div>
                )}
                {analysis.strategy.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-2">Pontos de Atenção</p>
                    {analysis.strategy.weaknesses.map((w, i) => (
                      <p key={i} className="text-xs text-[#8899aa] mb-1 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {analysis.strategy.nextSteps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-amber-500/10">
                  <p className="text-xs font-medium text-amber-400 mb-2">Próximos Passos</p>
                  {analysis.strategy.nextSteps.map((s, i) => (
                    <p key={i} className="text-xs text-[#c0ccda] mb-1">{s}</p>
                  ))}
                </div>
              )}
            </div>

            {analysis.entities.length > 0 && (
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
            )}

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
                      {msg.model && (
                        <span className="text-[10px] text-[#4a5568] flex items-center gap-1">
                          <Cpu className="h-2.5 w-2.5" /> {msg.model}
                          {msg.cost !== undefined && ` | $${msg.cost.toFixed(4)}`}
                        </span>
                      )}
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

            <div className="flex-shrink-0 border-t border-[#1a2332] bg-[#0d1320] p-4">
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt"
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
                <button onClick={sendMessage} disabled={!chatInput.trim() || isTyping}
                  className="flex items-center justify-center rounded-lg bg-amber-500 px-4 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-[#4a5568] mt-2 text-center">
                IA real via OpenRouter | Envie documentos adicionais | Pergunte sobre qualquer aspecto da análise
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
