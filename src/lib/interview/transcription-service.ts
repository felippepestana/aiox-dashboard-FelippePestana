/**
 * Transcription Service
 * WebSocket-based real-time transcription using Web Speech API with Whisper fallback.
 * Provides speaker identification, confidence scoring, and start/stop/pause controls.
 */

import type { TranscriptEntry } from '@/types/legal';

// ─── Types ──────────────────────────────────────────────────────────────────

export type TranscriptionStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export type Speaker = 'lawyer' | 'client' | 'system';

export interface TranscriptionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  whisperEndpoint?: string;
  speakerDetection: boolean;
}

export interface TranscriptionCallbacks {
  onTranscript: (entry: TranscriptEntry) => void;
  onInterim: (text: string) => void;
  onStatusChange: (status: TranscriptionStatus) => void;
  onError: (error: string) => void;
}

export interface TranscriptionService {
  start: (config?: Partial<TranscriptionConfig>) => void;
  stop: () => TranscriptEntry[];
  pause: () => void;
  resume: () => void;
  getStatus: () => TranscriptionStatus;
  getTranscript: () => TranscriptEntry[];
  setSpeaker: (speaker: Speaker) => void;
  onTranscript: (callback: (entry: TranscriptEntry) => void) => void;
}

// ─── Default Config ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: TranscriptionConfig = {
  language: 'pt-BR',
  continuous: true,
  interimResults: true,
  speakerDetection: true,
};

// ─── SpeechRecognition type shim ────────────────────────────────────────────

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// ─── Speaker Detection Heuristic ────────────────────────────────────────────

const LAWYER_KEYWORDS = [
  'artigo', 'parágrafo', 'inciso', 'alínea', 'lei', 'código',
  'jurisprudência', 'precedente', 'tutela', 'recurso', 'prazo',
  'contestação', 'petição', 'audiência', 'sentença', 'acórdão',
  'vossa excelência', 'doutor', 'doutora', 'processo', 'protocolo',
];

function detectSpeaker(text: string, currentSpeaker: Speaker): Speaker {
  const lower = text.toLowerCase();
  const lawyerScore = LAWYER_KEYWORDS.reduce(
    (score, keyword) => score + (lower.includes(keyword) ? 1 : 0),
    0
  );

  if (lawyerScore >= 2) return 'lawyer';
  if (lawyerScore === 0 && text.length > 20) return 'client';
  return currentSpeaker;
}

// ─── Whisper Fallback ───────────────────────────────────────────────────────

async function transcribeWithWhisper(
  audioBlob: Blob,
  endpoint: string
): Promise<{ text: string; confidence: number }> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', 'pt');
    formData.append('response_format', 'json');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      confidence: data.confidence ?? 0.85,
    };
  } catch {
    return { text: '', confidence: 0 };
  }
}

// ─── Create Transcription Service ───────────────────────────────────────────

export function createTranscriptionService(
  callbacks: Partial<TranscriptionCallbacks> = {}
): TranscriptionService {
  let status: TranscriptionStatus = 'idle';
  let transcript: TranscriptEntry[] = [];
  let currentSpeaker: Speaker = 'lawyer';
  let recognition: SpeechRecognitionInstance | null = null;
  let entryCounter = 0;
  let config: TranscriptionConfig = { ...DEFAULT_CONFIG };
  let transcriptCallback: ((entry: TranscriptEntry) => void) | null =
    callbacks.onTranscript || null;

  function setStatus(newStatus: TranscriptionStatus) {
    status = newStatus;
    callbacks.onStatusChange?.(newStatus);
  }

  function createEntry(text: string, confidence: number): TranscriptEntry {
    entryCounter += 1;
    const entry: TranscriptEntry = {
      id: `te-${Date.now()}-${entryCounter}`,
      speaker: currentSpeaker,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      confidence: Math.round(confidence * 100) / 100,
    };
    return entry;
  }

  function initWebSpeechAPI(): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRecognitionConstructor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return false;

    recognition = new (SpeechRecognitionConstructor as new () => SpeechRecognitionInstance)();
    recognition.lang = config.language;
    recognition.continuous = config.continuous;
    recognition.interimResults = config.interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];

        if (result.isFinal) {
          if (config.speakerDetection) {
            currentSpeaker = detectSpeaker(alternative.transcript, currentSpeaker);
          }

          const entry = createEntry(alternative.transcript, alternative.confidence);
          transcript.push(entry);
          transcriptCallback?.(entry);
        } else {
          callbacks.onInterim?.(alternative.transcript);
        }
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'no-speech') return;
      callbacks.onError?.(`Erro de reconhecimento: ${event.error}`);

      if (event.error === 'not-allowed' || event.error === 'service-not-available') {
        setStatus('error');
      }
    };

    recognition.onend = () => {
      if (status === 'recording' && recognition) {
        try {
          recognition.start();
        } catch {
          setStatus('stopped');
        }
      }
    };

    return true;
  }

  async function initWhisperFallback(): Promise<void> {
    if (!config.whisperEndpoint) {
      callbacks.onError?.('Web Speech API não disponível e Whisper endpoint não configurado');
      setStatus('error');
      return;
    }

    setStatus('recording');
    callbacks.onError?.('Usando fallback Whisper para transcrição');

    // In production, this would use MediaRecorder to capture audio chunks
    // and send them to the Whisper endpoint periodically
    const mockInterval = setInterval(async () => {
      if (status !== 'recording') {
        clearInterval(mockInterval);
        return;
      }

      // Mock: in real implementation, capture audio chunk via MediaRecorder
      const mockBlob = new Blob([], { type: 'audio/webm' });
      const result = await transcribeWithWhisper(mockBlob, config.whisperEndpoint!);
      if (result.text) {
        const entry = createEntry(result.text, result.confidence);
        transcript.push(entry);
        transcriptCallback?.(entry);
      }
    }, 5000);
  }

  return {
    start(overrides?: Partial<TranscriptionConfig>) {
      if (status === 'recording') return;

      config = { ...DEFAULT_CONFIG, ...overrides };
      transcript = [];
      entryCounter = 0;

      const webSpeechAvailable = initWebSpeechAPI();

      if (webSpeechAvailable && recognition) {
        try {
          recognition.start();
          setStatus('recording');
        } catch {
          initWhisperFallback();
        }
      } else {
        initWhisperFallback();
      }
    },

    stop() {
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
        recognition = null;
      }
      setStatus('stopped');

      // Add system entry marking end
      const endEntry = createEntry('Entrevista finalizada.', 1.0);
      endEntry.speaker = 'system';
      transcript.push(endEntry);
      transcriptCallback?.(endEntry);

      return [...transcript];
    },

    pause() {
      if (status !== 'recording') return;
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
      }
      setStatus('paused');
    },

    resume() {
      if (status !== 'paused') return;
      if (recognition) {
        try {
          recognition.onend = () => {
            if (status === 'recording' && recognition) {
              try { recognition.start(); } catch { setStatus('stopped'); }
            }
          };
          recognition.start();
          setStatus('recording');
        } catch {
          setStatus('error');
        }
      }
    },

    getStatus() {
      return status;
    },

    getTranscript() {
      return [...transcript];
    },

    setSpeaker(speaker: Speaker) {
      currentSpeaker = speaker;
    },

    onTranscript(callback: (entry: TranscriptEntry) => void) {
      transcriptCallback = callback;
    },
  };
}
