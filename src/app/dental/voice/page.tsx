'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Stethoscope,
  FileText,
  Calendar,
  Users,
  ClipboardList,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Wand2,
  Image as ImageIcon,
} from 'lucide-react';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface ParsedCommand {
  intent: string;
  entities: Record<string, string>;
  display: string;
  icon: typeof Mic;
  color: string;
}

const COMMAND_EXAMPLES = [
  { text: '"Adicionar procedimento restauração classe II no dente 36"', icon: Stethoscope },
  { text: '"Solicitar radiografia panorâmica para Maria Silva"', icon: FileText },
  { text: '"Agendar retorno para dia 20 às 14 horas"', icon: Calendar },
  { text: '"Gerar apresentação do tratamento"', icon: Sparkles },
  { text: '"Abrir ficha do paciente João Santos"', icon: Users },
  { text: '"Criar plano de tratamento completo"', icon: ClipboardList },
];

function parseCommand(transcript: string): ParsedCommand | null {
  const lower = transcript.toLowerCase().trim();

  if (lower.includes('procedimento') || lower.includes('restaura') || lower.includes('canal') || lower.includes('implante') || lower.includes('limpeza') || lower.includes('extração') || lower.includes('clareamento')) {
    const toothMatch = lower.match(/dente\s+(\d{2})/);
    return {
      intent: 'add_procedure',
      entities: { procedure: transcript, tooth: toothMatch?.[1] || '' },
      display: `Procedimento identificado: ${transcript}`,
      icon: Stethoscope,
      color: 'teal',
    };
  }

  if (lower.includes('exame') || lower.includes('radiografia') || lower.includes('panorâmica') || lower.includes('tomografia') || lower.includes('periapical')) {
    return {
      intent: 'request_exam',
      entities: { examType: transcript },
      display: `Solicitação de exame: ${transcript}`,
      icon: ImageIcon,
      color: 'amber',
    };
  }

  if (lower.includes('agendar') || lower.includes('consulta') || lower.includes('retorno') || lower.includes('horário')) {
    return {
      intent: 'schedule',
      entities: { details: transcript },
      display: `Agendamento: ${transcript}`,
      icon: Calendar,
      color: 'purple',
    };
  }

  if (lower.includes('paciente') || lower.includes('ficha') || lower.includes('cadastro')) {
    return {
      intent: 'patient',
      entities: { name: transcript },
      display: `Paciente: ${transcript}`,
      icon: Users,
      color: 'blue',
    };
  }

  if (lower.includes('apresentação') || lower.includes('tratamento') || lower.includes('plano')) {
    return {
      intent: 'presentation',
      entities: { details: transcript },
      display: `Apresentação: ${transcript}`,
      icon: Sparkles,
      color: 'gold',
    };
  }

  return null;
}

export default function VoiceCommandPage() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<ParsedCommand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ReturnType<typeof Object> | null>(null);
  const [wavePhase, setWavePhase] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'listening') {
      interval = setInterval(() => {
        setWavePhase((p) => (p + 1) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startListening = useCallback(() => {
    setError(null);
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.');
      setStatus('error');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionCtor as any)();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('listening');
      setTranscript('');
      setInterimTranscript('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalText) setTranscript(finalText);
      setInterimTranscript(interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setError(`Erro: ${event.error}`);
      setStatus('error');
    };

    recognition.onend = () => {
      setStatus('processing');
      const finalText = transcript || interimTranscript;
      if (finalText) {
        const parsed = parseCommand(finalText);
        if (parsed) {
          setCommandHistory((prev) => [parsed, ...prev].slice(0, 20));
          setStatus('success');
        } else {
          setStatus('success');
        }
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [transcript, interimTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const amplitude = status === 'listening'
      ? 20 + Math.sin((wavePhase + i * 15) * (Math.PI / 180)) * 20 + Math.random() * 10
      : 4;
    return amplitude;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4956A] to-[#A0784C] text-white">
            <Mic className="h-5 w-5 text-white" />
          </div>
          Assistente de Voz IA
        </h1>
        <p className="text-sm text-[#86868B] mt-2">
          Use comandos de voz para gerenciar procedimentos, exames e agendamentos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Voice Control */}
        <div className="col-span-2 space-y-6">
          {/* Voice Orb */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-8 flex flex-col items-center">
            {/* Microphone Button */}
            <button
              onClick={toggleListening}
              className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500 ${
                status === 'listening'
                  ? 'bg-gradient-to-br from-[#C4956A] to-[#A0784C] shadow-[0_0_60px_rgba(196,149,106,0.4)] scale-110'
                  : status === 'processing'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_0_40px_rgba(245,158,11,0.3)]'
                  : status === 'error'
                  ? 'bg-gradient-to-br from-[#D4848B] to-[#B06B75] shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                  : 'bg-gradient-to-br from-[#F0F0F2] to-[#E8E8ED] hover:from-[#A0784C] hover:to-[#8B6914] hover:shadow-[0_0_40px_rgba(196,149,106,0.2)]'
              }`}
            >
              {/* Pulsing rings */}
              {status === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-[#E8A0A0]/50 animate-ping" />
                  <span className="absolute inset-[-8px] rounded-full border border-[#F0C0C0]/30 animate-pulse" />
                  <span className="absolute inset-[-16px] rounded-full border border-[#F5D5D5]/20 animate-pulse delay-300" />
                </>
              )}
              {status === 'processing' ? (
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              ) : status === 'listening' ? (
                <MicOff className="h-12 w-12 text-white" />
              ) : (
                <Mic className="h-12 w-12 text-[#86868B]" />
              )}
            </button>

            <p className="mt-6 text-sm font-medium text-[#6E6E73]">
              {status === 'idle' && 'Toque para iniciar o reconhecimento de voz'}
              {status === 'listening' && 'Ouvindo... Fale seu comando'}
              {status === 'processing' && 'Processando comando...'}
              {status === 'success' && 'Comando reconhecido!'}
              {status === 'error' && 'Erro no reconhecimento'}
            </p>

            {/* Waveform */}
            <div className="flex items-center justify-center gap-[2px] h-16 mt-6 w-full max-w-md">
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    status === 'listening' ? 'bg-[#C4956A]' : 'bg-[#E5E5EA]'
                  }`}
                  style={{ height: `${height}px`, opacity: status === 'listening' ? 0.5 + Math.random() * 0.5 : 0.3 }}
                />
              ))}
            </div>

            {/* Transcript Display */}
            {(transcript || interimTranscript) && (
              <div className="mt-6 w-full max-w-lg rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-4">
                <p className="text-xs text-[#AEAEB2] mb-1 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Transcrição
                </p>
                <p className="text-sm text-[#1D1D1F]">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-[#AEAEB2] italic"> {interimTranscript}</span>
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#C4956A]" />
                Comandos Reconhecidos
              </h3>
              <div className="space-y-2">
                {commandHistory.map((cmd, i) => {
                  const Icon = cmd.icon;
                  const colorMap: Record<string, string> = {
                    teal: 'border-[#C4956A]/20 bg-[#C4956A]/5',
                    amber: 'border-amber-500/20 bg-amber-500/5',
                    purple: 'border-purple-500/20 bg-purple-500/5',
                    blue: 'border-blue-500/20 bg-blue-500/5',
                    gold: 'border-[#D4A76A]/20 bg-[#D4A76A]/5',
                  };
                  const iconColor: Record<string, string> = {
                    teal: 'text-[#C4956A]',
                    amber: 'text-amber-400',
                    purple: 'text-purple-400',
                    blue: 'text-blue-400',
                    gold: 'text-[#D4A76A]',
                  };
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${colorMap[cmd.color]}`}>
                      <Icon className={`h-4 w-4 ${iconColor[cmd.color]}`} />
                      <span className="text-sm text-[#48484A] flex-1">{cmd.display}</span>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Examples & Actions */}
        <div className="space-y-6">
          {/* Command Examples */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[#D4A76A]" />
              Exemplos de Comandos
            </h3>
            <div className="space-y-3">
              {COMMAND_EXAMPLES.map((ex, i) => {
                const Icon = ex.icon;
                return (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 hover:border-[#C4956A]/20 transition-colors cursor-pointer">
                    <Icon className="h-4 w-4 text-[#C4956A] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#6E6E73] leading-relaxed italic">{ex.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Features */}
          <div className="rounded-2xl bg-gradient-to-br from-[#C4956A]/8 to-[#D4A76A]/5 border border-[#C4956A]/15 p-6">
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C4956A]" />
              Recursos IA
            </h3>
            <ul className="space-y-2.5">
              {[
                'Reconhecimento de procedimentos odontológicos',
                'Identificação automática de dentes (FDI)',
                'Geração de apresentações interativas',
                'Solicitação inteligente de exames',
                'Agendamento por voz',
                'Integração com banco de procedimentos CFO',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#6E6E73]">
                  <ChevronRight className="h-3 w-3 text-[#C4956A] mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
