/**
 * Real-Time Transcription Service
 * WebSocket-based transcription using Web Speech API with Whisper fallback.
 * Provides speaker identification, confidence scoring, and session controls.
 */

import type { TranscriptEntry } from '@/types/legal';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface TranscriptionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  whisperEndpoint?: string;
  speakerLabels: boolean;
}

export interface TranscriptionCallbacks {
  onTranscript: (entry: TranscriptEntry) => void;
  onInterim: (text: string) => void;
  onError: (error: TranscriptionError) => void;
  onStatusChange: (status: TranscriptionStatus) => void;
}

export type TranscriptionStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface TranscriptionError {
  code: string;
  message: string;
  timestamp: string;
}

export interface TranscriptionService {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getStatus: () => TranscriptionStatus;
  setSpeaker: (speaker: 'lawyer' | 'client') => void;
  getTranscript: () => TranscriptEntry[];
  exportTranscript: () => string;
  destroy: () => void;
}

// ─── Default Configuration ──────────────────────────────────────────────────

const DEFAULT_CONFIG: TranscriptionConfig = {
  language: 'pt-BR',
  continuous: true,
  interimResults: true,
  speakerLabels: true,
};

// ─── Web Speech API Detection ───────────────────────────────────────────────

function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SR =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  return (SR as typeof SpeechRecognition) ?? null;
}

// ─── Whisper Fallback ───────────────────────────────────────────────────────

interface WhisperResponse {
  text: string;
  confidence: number;
  segments: Array<{ text: string; start: number; end: number }>;
}

async function transcribeWithWhisper(
  audioBlob: Blob,
  endpoint: string
): Promise<WhisperResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');
  formData.append('response_format', 'verbose_json');

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.status}`);
  }

  return response.json();
}

// ─── Unique ID Generator ────────────────────────────────────────────────────

let entryCounter = 0;
function generateEntryId(): string {
  entryCounter += 1;
  return `te-${Date.now()}-${entryCounter}`;
}

// ─── Create Transcription Service ───────────────────────────────────────────

export function createTranscriptionService(
  callbacks: TranscriptionCallbacks,
  config: Partial<TranscriptionConfig> = {}
): TranscriptionService {
  const cfg: TranscriptionConfig = { ...DEFAULT_CONFIG, ...config };
  let status: TranscriptionStatus = 'idle';
  let currentSpeaker: 'lawyer' | 'client' = 'lawyer';
  const transcript: TranscriptEntry[] = [];
  let recognition: SpeechRecognition | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let useWhisper = false;

  function setStatus(newStatus: TranscriptionStatus) {
    status = newStatus;
    callbacks.onStatusChange(newStatus);
  }

  function addEntry(text: string, confidence: number) {
    const entry: TranscriptEntry = {
      id: generateEntryId(),
      speaker: currentSpeaker,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      confidence,
    };
    transcript.push(entry);
    callbacks.onTranscript(entry);
  }

  // ── Web Speech API Setup ────────────────────────────────────────────────

  function startWebSpeech() {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      useWhisper = true;
      startWhisperFallback();
      return;
    }

    try {
      recognition = new SpeechRecognitionClass();
      recognition.lang = cfg.language;
      recognition.continuous = cfg.continuous;
      recognition.interimResults = cfg.interimResults;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript;
            const confidence = result[0].confidence;
            addEntry(text, confidence);
          } else {
            callbacks.onInterim(result[0].transcript);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          callbacks.onError({
            code: 'PERMISSION_DENIED',
            message: 'Permissao de microfone negada. Por favor, permita o acesso ao microfone.',
            timestamp: new Date().toISOString(),
          });
          setStatus('error');
          return;
        }

        if (event.error === 'no-speech') {
          // Silently restart, common with continuous mode
          return;
        }

        // Fallback to Whisper on other errors
        if (cfg.whisperEndpoint) {
          useWhisper = true;
          recognition?.stop();
          startWhisperFallback();
          return;
        }

        callbacks.onError({
          code: event.error,
          message: `Erro na transcricao: ${event.error}`,
          timestamp: new Date().toISOString(),
        });
      };

      recognition.onend = () => {
        // Auto-restart in continuous mode if still recording
        if (status === 'recording' && recognition && !useWhisper) {
          try {
            recognition.start();
          } catch {
            // Ignore start errors during restart
          }
        }
      };

      recognition.start();
      setStatus('recording');
    } catch (err) {
      callbacks.onError({
        code: 'INIT_FAILED',
        message: `Falha ao iniciar reconhecimento de voz: ${err}`,
        timestamp: new Date().toISOString(),
      });
      // Try Whisper fallback
      if (cfg.whisperEndpoint) {
        useWhisper = true;
        startWhisperFallback();
      } else {
        setStatus('error');
      }
    }
  }

  // ── Whisper Fallback Setup ──────────────────────────────────────────────

  async function startWhisperFallback() {
    if (!cfg.whisperEndpoint) {
      callbacks.onError({
        code: 'NO_WHISPER',
        message: 'Web Speech API indisponivel e nenhum endpoint Whisper configurado.',
        timestamp: new Date().toISOString(),
      });
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // Process every 5 seconds
      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) return;
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = [];

        try {
          const result = await transcribeWithWhisper(audioBlob, cfg.whisperEndpoint!);
          if (result.text.trim()) {
            addEntry(result.text, result.confidence);
          }
        } catch (err) {
          callbacks.onError({
            code: 'WHISPER_ERROR',
            message: `Erro no Whisper: ${err}`,
            timestamp: new Date().toISOString(),
          });
        }
      };

      mediaRecorder.start();
      setStatus('recording');

      // Segment every 5 seconds for near real-time
      const segmentInterval = setInterval(() => {
        if (status === 'recording' && mediaRecorder?.state === 'recording') {
          mediaRecorder.stop();
          setTimeout(() => {
            if (status === 'recording') {
              mediaRecorder?.start();
            }
          }, 100);
        } else {
          clearInterval(segmentInterval);
        }
      }, 5000);
    } catch (err) {
      callbacks.onError({
        code: 'MIC_ERROR',
        message: `Erro ao acessar microfone: ${err}`,
        timestamp: new Date().toISOString(),
      });
      setStatus('error');
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    start() {
      if (status === 'recording') return;
      startWebSpeech();
    },

    stop() {
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
        recognition = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
      }
      setStatus('stopped');
    },

    pause() {
      if (status !== 'recording') return;
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
      }
      setStatus('paused');
    },

    resume() {
      if (status !== 'paused') return;
      if (useWhisper && mediaRecorder) {
        mediaRecorder.resume();
        setStatus('recording');
      } else {
        startWebSpeech();
      }
    },

    getStatus() {
      return status;
    },

    setSpeaker(speaker: 'lawyer' | 'client') {
      currentSpeaker = speaker;
    },

    getTranscript() {
      return [...transcript];
    },

    exportTranscript(): string {
      return transcript
        .map((e) => {
          const speakerLabel = e.speaker === 'lawyer' ? 'Advogado' : e.speaker === 'client' ? 'Cliente' : 'Sistema';
          const time = new Date(e.timestamp).toLocaleTimeString('pt-BR');
          return `[${time}] ${speakerLabel}: ${e.text}`;
        })
        .join('\n');
    },

    destroy() {
      this.stop();
      transcript.length = 0;
    },
  };
}
