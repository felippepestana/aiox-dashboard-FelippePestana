'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

interface ParsedCommand {
  type: 'procedimento' | 'paciente' | 'agendar' | 'exame' | 'apresentacao' | 'unknown';
  value: string;
  raw: string;
  timestamp: Date;
}

interface VoiceCommandPanelProps {
  onCommand?: (command: ParsedCommand) => void;
  className?: string;
}

const COMMAND_PATTERNS: { type: ParsedCommand['type']; pattern: RegExp }[] = [
  { type: 'procedimento', pattern: /adicionar\s+procedimento\s+(.+)/i },
  { type: 'paciente', pattern: /paciente\s+(.+)/i },
  { type: 'agendar', pattern: /agendar\s+(.+)/i },
  { type: 'exame', pattern: /solicitar\s+exame\s+(.+)/i },
  { type: 'apresentacao', pattern: /gerar\s+apresenta[çc][aã]o/i },
];

function parseCommand(transcript: string): ParsedCommand {
  const normalized = transcript.trim().toLowerCase();

  for (const { type, pattern } of COMMAND_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        type,
        value: type === 'apresentacao' ? '' : (match[1] || '').trim(),
        raw: transcript,
        timestamp: new Date(),
      };
    }
  }

  return { type: 'unknown', value: transcript, raw: transcript, timestamp: new Date() };
}

const COMMAND_EXAMPLES = [
  { label: 'Adicionar procedimento', example: '"Adicionar procedimento restauração"' },
  { label: 'Buscar paciente', example: '"Paciente Maria Silva"' },
  { label: 'Agendar consulta', example: '"Agendar 15 de março"' },
  { label: 'Solicitar exame', example: '"Solicitar exame panorâmica"' },
  { label: 'Gerar apresentação', example: '"Gerar apresentação"' },
];

export function VoiceCommandPanel({ onCommand, className }: VoiceCommandPanelProps) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<ParsedCommand[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(4));

  const recognitionRef = useRef<any | null>(null);
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animateWaveform = useCallback(() => {
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(
        Array(24)
          .fill(0)
          .map(() => Math.random() * 28 + 4)
      );
    }, 100);
  }, []);

  const stopWaveform = useCallback(() => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
    setWaveformBars(Array(24).fill(4));
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopWaveform();
    setStatus('idle');
  }, [stopWaveform]);

  const startListening = useCallback(() => {
    const anyAPI =
      typeof window !== 'undefined'
        ? (window as unknown as Record<string, unknown>).any ||
          (window as unknown as Record<string, unknown>).webkitany
        : null;

    if (!anyAPI) {
      setStatus('error');
      setErrorMessage(
        'Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.'
      );
      return;
    }

    try {
      const recognition = new (anyAPI as new () => any)();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setStatus('listening');
        setErrorMessage('');
        animateWaveform();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setInterimTranscript(interim);

        if (final) {
          setTranscript(final);
          setStatus('processing');
          stopWaveform();

          const command = parseCommand(final);
          setCommandHistory((prev) => [command, ...prev].slice(0, 20));
          onCommand?.(command);

          setTimeout(() => {
            setStatus('idle');
            setTranscript('');
            setInterimTranscript('');
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        setStatus('error');
        stopWaveform();
        const messages: Record<string, string> = {
          'not-allowed': 'Permissão de microfone negada.',
          'no-speech': 'Nenhuma fala detectada. Tente novamente.',
          network: 'Erro de rede. Verifique sua conexão.',
        };
        setErrorMessage(messages[event.error] || `Erro: ${event.error}`);
      };

      recognition.onend = () => {
        if (status === 'listening') {
          setStatus('idle');
          stopWaveform();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setStatus('error');
      setErrorMessage('Erro ao inicializar reconhecimento de voz.');
    }
  }, [animateWaveform, stopWaveform, onCommand, status]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  const commandTypeLabel: Record<ParsedCommand['type'], string> = {
    procedimento: 'Procedimento',
    paciente: 'Paciente',
    agendar: 'Agendamento',
    exame: 'Exame',
    apresentacao: 'Apresentação',
    unknown: 'Não reconhecido',
  };

  const commandTypeColor: Record<ParsedCommand['type'], string> = {
    procedimento: 'bg-teal-100 text-teal-800',
    paciente: 'bg-blue-100 text-blue-800',
    agendar: 'bg-purple-100 text-purple-800',
    exame: 'bg-amber-100 text-amber-800',
    apresentacao: 'bg-emerald-100 text-emerald-800',
    unknown: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Comando de Voz</h3>
            <p className="text-xs text-gray-500">Controle por voz em português</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', {
              'bg-gray-100 text-gray-600': status === 'idle',
              'bg-green-100 text-green-700': status === 'listening',
              'bg-amber-100 text-amber-700': status === 'processing',
              'bg-red-100 text-red-700': status === 'error',
            })}
          >
            <span
              className={cn('w-1.5 h-1.5 rounded-full', {
                'bg-gray-400': status === 'idle',
                'bg-green-500 animate-pulse': status === 'listening',
                'bg-amber-500': status === 'processing',
                'bg-red-500': status === 'error',
              })}
            />
            {status === 'idle' && 'Pronto'}
            {status === 'listening' && 'Ouvindo...'}
            {status === 'processing' && 'Processando...'}
            {status === 'error' && 'Erro'}
          </span>
        </div>
      </div>

      {/* Mic Button & Waveform */}
      <div className="px-6 py-8 flex flex-col items-center gap-6">
        <button
          onClick={toggleListening}
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4',
            {
              'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl focus:ring-teal-200':
                status === 'idle',
              'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-200':
                status === 'listening',
              'bg-amber-500 text-white cursor-wait focus:ring-amber-200':
                status === 'processing',
              'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-200':
                status === 'error',
            }
          )}
          disabled={status === 'processing'}
          aria-label={status === 'listening' ? 'Parar de ouvir' : 'Começar a ouvir'}
        >
          {status === 'listening' && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-red-300 animate-pulse" />
            </>
          )}
          {status === 'processing' ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : status === 'listening' ? (
            <MicOff className="w-8 h-8 relative z-10" />
          ) : status === 'error' ? (
            <AlertCircle className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {/* Waveform */}
        <div className="flex items-end gap-0.5 h-8 w-full max-w-xs justify-center">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={cn('w-1.5 rounded-full transition-all duration-100', {
                'bg-teal-400': status === 'listening',
                'bg-gray-200': status !== 'listening',
              })}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        {/* Transcript */}
        <div className="w-full min-h-[48px] rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-center">
          {status === 'processing' && transcript ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-sm text-gray-800 font-medium">{transcript}</span>
            </div>
          ) : interimTranscript ? (
            <p className="text-sm text-gray-500 italic">{interimTranscript}</p>
          ) : (
            <p className="text-sm text-gray-400">
              {status === 'listening'
                ? 'Fale um comando...'
                : status === 'error'
                  ? errorMessage
                  : 'Pressione o microfone para começar'}
            </p>
          )}
        </div>
      </div>

      {/* Command Examples */}
      <div className="px-6 pb-2">
        <button
          onClick={() => setShowExamples((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full"
        >
          {showExamples ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          Comandos disponíveis
        </button>
        {showExamples && (
          <div className="mt-2 space-y-1.5">
            {COMMAND_EXAMPLES.map((cmd) => (
              <div
                key={cmd.label}
                className="flex items-start gap-2 text-xs text-gray-600 py-1"
              >
                <Mic className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">{cmd.label}:</span>{' '}
                  <span className="text-gray-500">{cmd.example}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Histórico de Comandos
            </h4>
            <button
              onClick={() => setCommandHistory([])}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commandHistory.map((cmd, i) => (
              <div
                key={`${cmd.timestamp.getTime()}-${i}`}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full font-medium shrink-0',
                    commandTypeColor[cmd.type]
                  )}
                >
                  {commandTypeLabel[cmd.type]}
                </span>
                <span className="text-gray-600 truncate">{cmd.raw}</span>
                <span className="text-gray-400 ml-auto shrink-0">
                  {cmd.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
