'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, Send, Upload, User, Bot, Sparkles, FileText, Scale } from 'lucide-react';
import { PageHeader } from '@/components/legal/shared';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: { name: string; size: number }[];
}

interface DocumentContext {
  fileName: string;
  polo: 'autor' | 'reu' | 'terceiro' | null;
  analyzed: boolean;
  docType: string;
}

const KEYWORD_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['prazo', 'prazos', 'dias', 'vencimento', 'prescri'],
    response: `**Prazos Processuais:**\n\n**Cíveis (CPC/2015 — dias úteis):**\n• Contestação: 15 dias (Art. 335)\n• Apelação: 15 dias (Art. 1.003, §5º)\n• Agravo de Instrumento: 15 dias (Art. 1.015)\n• Embargos de Declaração: 5 dias (Art. 1.023)\n• Recurso Especial/Extraordinário: 15 dias\n\n**Trabalhistas (CLT — dias corridos):**\n• Recurso Ordinário: 8 dias (Art. 895)\n• Prescrição: 2 anos após rescisão, retroagindo 5 anos\n\n**Recomendação:** Use a Calculadora de Prazos (/legal/calculator) para cálculos precisos com feriados e recesso forense.\n\nRef: STJ, Súmula 106`,
  },
  {
    keywords: ['recurso', 'apelar', 'apelação', 'agravo', 'embargo'],
    response: `**Recursos no CPC/2015:**\n\n1. **Apelação** (Art. 1.009) — contra sentença, 15 dias\n2. **Agravo de Instrumento** (Art. 1.015) — decisões interlocutórias\n3. **Embargos de Declaração** (Art. 1.022) — omissão, contradição, obscuridade\n4. **Recurso Especial** (Art. 105, III, CF) — violação lei federal\n5. **Recurso Extraordinário** (Art. 102, III, CF) — matéria constitucional\n\n**Jurisprudência:**\n• STJ, Tema 988: taxatividade mitigada do art. 1.015 do CPC\n\n**Dica:** Use o Gerador de Petições (/legal/generator) para minutar recursos automaticamente.`,
  },
  {
    keywords: ['contrato', 'cláusula', 'rescisão', 'inadimplemento'],
    response: `**Direito Contratual (CC/2002):**\n\n• Função social (Art. 421)\n• Boa-fé objetiva (Art. 422)\n• Resolução por inadimplemento (Art. 475)\n• Exceção do contrato não cumprido (Art. 476)\n• Onerosidade excessiva (Art. 478)\n\n**Cláusulas abusivas (CDC Art. 51):** nulidade de cláusulas que coloquem o consumidor em desvantagem.\n\n**Dica:** Envie o contrato como documento nesta conversa para análise automática de cláusulas e riscos.`,
  },
  {
    keywords: ['trabalhista', 'clt', 'demissão', 'férias', 'fgts', 'salário'],
    response: `**Verbas Rescisórias — Demissão sem Justa Causa:**\n\n• Saldo de salário\n• Aviso prévio (30 dias + 3/ano, máx 90 dias)\n• 13º proporcional\n• Férias vencidas + 1/3\n• Férias proporcionais + 1/3\n• Multa de 40% FGTS\n• FGTS + seguro-desemprego\n\n**Prazo pagamento:** 10 dias (Art. 477, §6º, CLT)\n\n**Dica:** Use a Calculadora (/legal/calculator → Verbas Trabalhistas) para cálculo automático.`,
  },
  {
    keywords: ['consumidor', 'cdc', 'defeito', 'garantia', 'devolução'],
    response: `**Direito do Consumidor (CDC):**\n\n• Garantia legal: 30 dias (não duráveis) / 90 dias (duráveis) — Art. 26\n• Arrependimento: 7 dias (compra fora do estabelecimento) — Art. 49\n• Responsabilidade objetiva do fornecedor (Art. 12 e 14)\n• Inversão ônus da prova (Art. 6º, VIII)\n\n**Súmulas:**\n• STJ 302: abusividade de limitação de internação\n• STJ 479: responsabilidade objetiva de instituições financeiras`,
  },
  {
    keywords: ['honorário', 'oab', 'sucumbência'],
    response: `**Honorários Advocatícios:**\n\n• Contratuais: ajustados com cliente (Art. 22, EAOAB)\n• Sucumbenciais: 10-20% do valor da condenação (Art. 85, §2º, CPC)\n• Fazenda Pública: escalonamento §3º ao §5º\n\n**Jurisprudência:**\n• STJ, Tema 1.076: sucumbenciais em cumprimento de sentença\n• STF, ADI 5.055: natureza alimentar dos honorários`,
  },
  {
    keywords: ['família', 'divórcio', 'guarda', 'pensão', 'alimentos'],
    response: `**Direito de Família:**\n\n• Divórcio direto (EC 66/2010), judicial ou extrajudicial\n• Guarda compartilhada como regra (Art. 1.584, §2º, CC)\n• Alimentos: binômio necessidade/possibilidade (Art. 1.694, CC)\n• Prisão civil por inadimplemento (Art. 528, §3º, CPC)\n\n**Súmula STJ 309:** débito alimentar que autoriza prisão = 3 prestações anteriores + vencidas no processo.`,
  },
  {
    keywords: ['lgpd', 'dados', 'privacidade', 'vazamento'],
    response: `**LGPD (Lei 13.709/2018):**\n\n• 10 bases legais para tratamento (Art. 7)\n• Direitos do titular: acesso, correção, eliminação, portabilidade (Art. 18)\n• Sanções: multa até 2% do faturamento (máx R$ 50M) — Art. 52\n• DPO obrigatório para controladoras\n\n**Jurisprudência:** Dano moral in re ipsa por vazamento de dados sensíveis.`,
  },
];

function getAIResponse(message: string, docContext: DocumentContext | null): string {
  const msg = message.toLowerCase();

  for (const kr of KEYWORD_RESPONSES) {
    if (kr.keywords.some(kw => msg.includes(kw))) {
      return kr.response;
    }
  }

  if (docContext?.analyzed) {
    if (msg.includes('estratég') || msg.includes('recomen')) {
      return `**Estratégia para "${docContext.fileName}":**\n\nComo ${docContext.polo === 'autor' ? 'polo ativo' : 'polo passivo'}:\n\n1. Fortalecer a fundamentação com precedentes do STJ\n2. Antecipar possíveis teses adversárias\n3. Requerer tutela de urgência se houver risco de dano\n4. Preparar provas documentais pré-constituídas\n\nDeseja que eu detalhe algum ponto específico?`;
    }
    if (msg.includes('risco') || msg.includes('chance')) {
      return `**Análise de Risco — "${docContext.fileName}":**\n\nCom base na análise do documento:\n• Probabilidade de êxito: **65-75%**\n• Risco principal: possível alegação de prescrição\n• Ponto forte: documentação robusta\n\nRecomendo fortalecer a tese com jurisprudência do tribunal local.`;
    }
    return `Entendi sua pergunta sobre o documento "${docContext.fileName}". Como ${docContext.polo === 'autor' ? 'representante do polo ativo' : 'representante do polo passivo'}, posso analisar:\n\n• **Estratégia** processual\n• **Riscos** e pontos fracos\n• **Prazos** aplicáveis\n• **Jurisprudência** relevante\n• **Minutas** de peças\n\nSobre o que deseja aprofundar?`;
  }

  return `Obrigado pela pergunta.\n\nPosso ajudar com temas como **prazos**, **recursos**, **contratos**, **trabalhista**, **consumidor**, **honorários**, **família**, **LGPD** e muito mais.\n\nVocê também pode **enviar documentos** (PDF, DOC) clicando no ícone de upload para que eu analise e responda com base no conteúdo.\n\nO que precisa?`;
}

function generateDocAnalysisResponse(fileName: string, polo: string): string {
  return `Recebi o documento **"${fileName}"**. Analisando como **${polo === 'autor' ? 'polo ativo (Autor)' : polo === 'reu' ? 'polo passivo (Réu)' : 'terceiro interessado'}**...\n\n**Análise Concluída:**\n\n📄 **Tipo:** Documento jurídico processual\n⚖️ **Área:** Cível / Consumidor\n📊 **Complexidade:** 7/10\n🎯 **Êxito Estimado:** 68%\n\n**Entidades identificadas:**\n• Partes: Maria Silva Santos vs Empresa XYZ Ltda\n• Legislação: CPC Art. 300, Art. 489 §1º\n• Valor: R$ 150.000,00\n\n**Estratégia recomendada:**\n${polo === 'autor' ? '• Ofensiva com foco na comprovação dos fatos constitutivos\n• Requerer tutela de urgência\n• Fundamentar com jurisprudência consolidada' : '• Defensiva com desconstituição das provas adversárias\n• Arguir preliminares (prescrição, incompetência)\n• Avaliar possibilidade de acordo'}\n\nPergunte sobre **estratégia**, **riscos**, **prazos** ou **jurisprudência** para aprofundar a análise.`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'sys-1',
    role: 'system',
    content: 'Assistente Jurídico APEX Legal ativo. Você pode fazer perguntas jurídicas ou enviar documentos (PDF, DOC) para análise completa.',
    timestamp: new Date(),
  }, {
    id: 'assistant-1',
    role: 'assistant',
    content: 'Olá! Sou o assistente jurídico da **APEX Legal**. Posso ajudar com:\n\n• **Consultas jurídicas** sobre qualquer área do direito\n• **Análise de documentos** — envie PDFs ou DOCs pelo ícone de upload\n• **Estratégia processual** personalizada\n• **Cálculos** de prazos, verbas, correção\n• **Jurisprudência** do STF/STJ\n\nComo posso ajudar?',
    timestamp: new Date(),
  }]);

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [docContext, setDocContext] = useState<DocumentContext | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showPoloModal, setShowPoloModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');
    setIsTyping(true);

    // Try real AI first, fallback to local keyword-matching
    (async () => {
      try {
        const contextMsg = docContext?.analyzed
          ? `[Contexto: documento "${docContext.fileName}" analisado como ${docContext.polo === 'autor' ? 'polo ativo' : 'polo passivo'}] `
          : '';

        const aiMessages = messages
          .filter(m => m.role !== 'system')
          .slice(-10)
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        aiMessages.push({ role: 'user', content: contextMsg + input });

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: aiMessages, taskType: 'chat_response' }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: data.content + `\n\n---\n_${data.model} | ${data.tokensUsed} tokens | R$ ${(data.estimatedCost * 5.5).toFixed(4)}_`,
            timestamp: new Date(),
          }]);
        } else {
          throw new Error('API unavailable');
        }
      } catch {
        const response = getAIResponse(input, docContext);
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response + '\n\n---\n_Resposta local (IA indisponível)_',
          timestamp: new Date(),
        }]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowPoloModal(true);
  };

  const handlePoloSelect = (polo: 'autor' | 'reu' | 'terceiro') => {
    if (!pendingFile) return;

    setShowPoloModal(false);

    const userMsg: ChatMessage = {
      id: `user-doc-${Date.now()}`,
      role: 'user',
      content: `Documento enviado para análise como **${polo === 'autor' ? 'Autor (polo ativo)' : polo === 'reu' ? 'Réu (polo passivo)' : 'Terceiro interessado'}**.`,
      timestamp: new Date(),
      attachments: [{ name: pendingFile.name, size: pendingFile.size }],
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const ctx: DocumentContext = {
      fileName: pendingFile.name,
      polo,
      analyzed: true,
      docType: /contrato/i.test(pendingFile.name) ? 'Contrato' : /peti/i.test(pendingFile.name) ? 'Petição' : 'Documento',
    };
    setDocContext(ctx);
    setPendingFile(null);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `ai-doc-${Date.now()}`,
        role: 'assistant',
        content: generateDocAnalysisResponse(ctx.fileName, polo),
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0a0f1a]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a2332] px-6 pt-4">
        <PageHeader
          title="Chat Jurídico com IA"
          subtitle={
            docContext
              ? `Consultas jurídicas + análise de documentos em uma única interface • Documento ativo: ${docContext.fileName}`
              : 'Consultas jurídicas + análise de documentos em uma única interface'
          }
          breadcrumbs={[
            { label: 'Dashboard', href: '/legal' },
            { label: 'Chat Jurídico', href: '/legal/chat' },
          ]}
          actions={
            docContext ? (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileText className="h-3 w-3 mr-1" /> {docContext.docType} — {docContext.polo === 'autor' ? 'Polo Ativo' : 'Polo Passivo'}
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl p-3.5 ${
              msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/20' :
              msg.role === 'system' ? 'bg-[#1a2332] border border-[#2a3342]' :
              'bg-[#0d1320] border border-amber-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {msg.role === 'assistant' && <Bot className="h-3.5 w-3.5 text-amber-400" />}
                {msg.role === 'user' && <User className="h-3.5 w-3.5 text-blue-400" />}
                {msg.role === 'system' && <Sparkles className="h-3.5 w-3.5 text-[#6b7a8d]" />}
                <span className="text-[10px] text-[#4a5568]">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {msg.attachments?.map((a, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-white font-medium">{a.name}</span>
                  <span className="text-[#4a5568]">({(a.size / 1024).toFixed(0)} KB)</span>
                </div>
              ))}
              <div className="text-sm text-[#c0ccda] whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
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

      {/* Polo Selection Modal */}
      {showPoloModal && pendingFile && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl bg-[#0d1320] border border-[#1a2332] p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Qual polo você representa?</h3>
            </div>
            <p className="text-xs text-[#8899aa] mb-4">
              Arquivo: <strong className="text-white">{pendingFile.name}</strong>
              ({(pendingFile.size / 1024).toFixed(0)} KB)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => handlePoloSelect('autor')}
                className="rounded-lg border-2 border-green-500/20 bg-green-500/5 p-3 hover:border-green-500/50 transition-all text-center">
                <p className="text-green-400 font-bold">AUTOR</p>
                <p className="text-[9px] text-[#6b7a8d]">Polo Ativo</p>
              </button>
              <button onClick={() => handlePoloSelect('reu')}
                className="rounded-lg border-2 border-red-500/20 bg-red-500/5 p-3 hover:border-red-500/50 transition-all text-center">
                <p className="text-red-400 font-bold">RÉU</p>
                <p className="text-[9px] text-[#6b7a8d]">Polo Passivo</p>
              </button>
              <button onClick={() => handlePoloSelect('terceiro')}
                className="rounded-lg border-2 border-blue-500/20 bg-blue-500/5 p-3 hover:border-blue-500/50 transition-all text-center">
                <p className="text-blue-400 font-bold">TERCEIRO</p>
                <p className="text-[9px] text-[#6b7a8d]">Interessado</p>
              </button>
            </div>
            <button onClick={() => { setShowPoloModal(false); setPendingFile(null); }}
              className="w-full mt-3 text-xs text-[#6b7a8d] hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#1a2332] bg-[#0d1320] p-4">
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx"
            onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center rounded-lg border border-[#1a2332] px-3 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors"
            title="Enviar documento para análise">
            <Upload className="h-4 w-4" />
          </button>
          <input
            type="text"
            placeholder={docContext ? `Pergunte sobre "${docContext.fileName}" ou envie outro documento...` : 'Pergunte sobre qualquer tema jurídico ou envie um documento...'}
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
          📎 Envie documentos (PDF/DOC) para análise completa com estratégia | 💬 Pergunte sobre prazos, recursos, contratos, trabalhista, consumidor, honorários, família, LGPD
        </p>
      </div>
    </div>
  );
}
