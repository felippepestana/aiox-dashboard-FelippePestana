'use client';

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { useLegalStore } from '@/stores/legal-store';
import {
  Upload,
  FileText,
  FileImage,
  File,
  Play,
  Clock,
  CheckCircle,
  Loader2,
  Briefcase,
  Sparkles,
  Grid3X3,
  List,
  X,
  AlertCircle,
  ChevronDown,
  Eye,
  LinkIcon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadedFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  processId: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  analysisStatus: 'idle' | 'analyzing' | 'done' | 'error';
  analysisResult?: AnalysisResult;
}

interface AnalysisResult {
  summary: string;
  extractedData: Record<string, string>;
  confidence: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function generateId() {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

function getFileTypeColor(type: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (type.includes('pdf') || ext === 'pdf') return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (type.includes('word') || ext === 'doc' || ext === 'docx') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (type.startsWith('image/')) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  if (ext === 'xlsx' || ext === 'xls') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

function FileTypeIcon({ type, name, className }: { type: string; name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (type.startsWith('image/')) return <FileImage className={className} />;
  if (type.includes('pdf') || ext === 'pdf') return <FileText className={className} />;
  return <File className={className} />;
}

const DEFAULT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// ─── Simulated AI Analysis ────────────────────────────────────────────────────

async function simulateAnalysis(file: UploadedFileRecord): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1500));
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (file.type.includes('pdf') || ext === 'pdf') {
    return {
      summary: `Documento jurídico identificado: ${file.name}. Contém cláusulas contratuais, partes identificadas e obrigações mútuas.`,
      extractedData: {
        'Tipo': 'Contrato',
        'Partes': 'Identificadas (2)',
        'Data': new Date().toLocaleDateString('pt-BR'),
        'Valor': 'R$ 50.000,00',
      },
      confidence: 87,
    };
  }
  return {
    summary: `Arquivo ${file.name} processado. Conteúdo extraído com sucesso.`,
    extractedData: { 'Tipo': getFileExtension(file.name), 'Tamanho': formatFileSize(file.size) },
    confidence: 72,
  };
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

function DropZone({ onFiles }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  }, [onFiles]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 cursor-pointer transition-all duration-300 ${
        dragOver
          ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
          : 'border-[#1a2332] bg-[#0d1320] hover:border-amber-500/40 hover:bg-[#0f1726]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={DEFAULT_ACCEPT}
        multiple
        onChange={handleChange}
        className="hidden"
      />

      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl mb-5 transition-all duration-300 ${
        dragOver ? 'bg-amber-500/30 shadow-lg shadow-amber-500/20' : 'bg-[#1a2332]'
      }`}>
        <Upload className={`h-10 w-10 transition-colors ${dragOver ? 'text-amber-400' : 'text-[#4a5568]'}`} />
      </div>

      <p className="text-lg font-semibold text-white mb-2">
        {dragOver ? 'Solte os arquivos aqui' : 'Arraste documentos ou clique para selecionar'}
      </p>
      <p className="text-sm text-[#6b7a8d] mb-4">
        PDF, DOCX, DOC, JPG, PNG, XLSX — Máximo {formatFileSize(MAX_SIZE)} por arquivo
      </p>

      {/* File type chips */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {[
          { label: 'PDF', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
          { label: 'DOCX', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
          { label: 'XLSX', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
          { label: 'JPG/PNG', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
        ].map((t) => (
          <span key={t.label} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Análise de IA
        </p>
        <span className="text-[10px] text-[#6b7a8d] border border-[#2a3444] rounded-full px-2 py-0.5">
          {result.confidence}% confiança
        </span>
      </div>
      <p className="text-xs text-[#c8d0dc]">{result.summary}</p>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(result.extractedData).map(([k, v]) => (
          <div key={k} className="rounded bg-[#0a0f1a] border border-[#1a2332] px-2 py-1">
            <p className="text-[9px] text-[#6b7a8d] uppercase">{k}</p>
            <p className="text-xs text-white font-medium">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── File Row (List View) ─────────────────────────────────────────────────────

interface FileRowProps {
  file: UploadedFileRecord;
  processes: { id: string; cnj: string; title: string }[];
  onLink: (fileId: string, processId: string) => void;
  onAnalyze: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

function FileRow({ file, processes, onLink, onAnalyze, onRemove }: FileRowProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const typeColor = getFileTypeColor(file.type, file.name);
  const linkedProcess = processes.find((p) => p.id === file.processId);

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border flex-shrink-0 ${typeColor}`}>
          <FileTypeIcon type={file.type} name={file.name} className="h-5 w-5" />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${typeColor}`}>
              {getFileExtension(file.name)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-[#6b7a8d]">{formatFileSize(file.size)}</span>
            <span className="text-xs text-[#4a5568]">·</span>
            <span className="text-xs text-[#6b7a8d]">
              {new Date(file.uploadedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            {linkedProcess && (
              <>
                <span className="text-xs text-[#4a5568]">·</span>
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {linkedProcess.cnj}
                </span>
              </>
            )}
          </div>

          {/* Progress bar */}
          {file.status === 'uploading' && (
            <div className="mt-1.5 h-1 rounded-full bg-[#1a2332] w-full">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex-shrink-0 w-24 text-center">
          {file.status === 'uploading' && (
            <span className="flex items-center gap-1 text-xs text-amber-400 justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {Math.round(file.progress)}%
            </span>
          )}
          {file.status === 'done' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 justify-center">
              <CheckCircle className="h-3.5 w-3.5" />
              Enviado
            </span>
          )}
          {file.status === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-400 justify-center">
              <AlertCircle className="h-3.5 w-3.5" />
              Erro
            </span>
          )}
        </div>

        {/* Actions */}
        {file.status === 'done' && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Link to process */}
            <div className="relative group">
              <select
                value={file.processId}
                onChange={(e) => onLink(file.id, e.target.value)}
                className="appearance-none rounded-lg bg-[#1a2332] border border-[#2a3444] pl-2 pr-6 py-1.5 text-xs text-[#8899aa] focus:outline-none focus:border-amber-500/50 cursor-pointer hover:border-amber-500/30 transition-colors"
                title="Vincular a processo"
              >
                <option value="">Vincular...</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>{p.cnj} — {p.title.slice(0, 25)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#6b7a8d] pointer-events-none" />
            </div>

            {/* AI analyze */}
            <button
              onClick={() => onAnalyze(file.id)}
              disabled={file.analysisStatus === 'analyzing'}
              title="Analisar com IA"
              className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {file.analysisStatus === 'analyzing' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {file.analysisStatus === 'analyzing' ? 'Analisando...' : 'Analisar com IA'}
            </button>

            {/* Toggle analysis */}
            {file.analysisStatus === 'done' && file.analysisResult && (
              <button
                onClick={() => setShowAnalysis((v) => !v)}
                className="flex items-center gap-1 rounded-lg bg-[#1a2332] px-2.5 py-1.5 text-xs text-[#8899aa] hover:text-white transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                {showAnalysis ? 'Ocultar' : 'Ver resultado'}
              </button>
            )}

            <button
              onClick={() => onRemove(file.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#4a5568] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Analysis result */}
      {showAnalysis && file.analysisResult && (
        <div className="px-4 pb-3">
          <AnalysisPanel result={file.analysisResult} />
        </div>
      )}
    </div>
  );
}

// ─── File Card (Grid View) ────────────────────────────────────────────────────

interface FileCardProps {
  file: UploadedFileRecord;
  processes: { id: string; cnj: string; title: string }[];
  onLink: (fileId: string, processId: string) => void;
  onAnalyze: (fileId: string) => void;
  onRemove: (fileId: string) => void;
}

function FileCard({ file, processes, onLink, onAnalyze, onRemove }: FileCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const typeColor = getFileTypeColor(file.type, file.name);
  const linkedProcess = processes.find((p) => p.id === file.processId);

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border flex-shrink-0 ${typeColor}`}>
          <FileTypeIcon type={file.type} name={file.name} className="h-6 w-6" />
        </div>
        <button
          onClick={() => onRemove(file.id)}
          className="text-[#4a5568] hover:text-red-400 transition-colors flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold ${typeColor}`}>
            {getFileExtension(file.name)}
          </span>
          <span className="text-xs text-[#6b7a8d]">{formatFileSize(file.size)}</span>
        </div>
        {linkedProcess && (
          <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <LinkIcon className="h-2.5 w-2.5" />
            {linkedProcess.cnj}
          </p>
        )}
      </div>

      {file.status === 'uploading' && (
        <div className="h-1 rounded-full bg-[#1a2332]">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${file.progress}%` }} />
        </div>
      )}

      {file.status === 'done' && (
        <div className="space-y-2 mt-auto">
          <div className="relative">
            <select
              value={file.processId}
              onChange={(e) => onLink(file.id, e.target.value)}
              className="w-full appearance-none rounded-lg bg-[#1a2332] border border-[#2a3444] pl-2 pr-6 py-1.5 text-xs text-[#8899aa] focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Vincular a processo...</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>{p.cnj}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#6b7a8d] pointer-events-none" />
          </div>
          <button
            onClick={() => onAnalyze(file.id)}
            disabled={file.analysisStatus === 'analyzing'}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {file.analysisStatus === 'analyzing' ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analisando...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" />Analisar com IA</>
            )}
          </button>
          {file.analysisStatus === 'done' && (
            <button
              onClick={() => setShowAnalysis((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#1a2332] py-1.5 text-xs text-[#8899aa] hover:text-white transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              {showAnalysis ? 'Ocultar análise' : 'Ver análise'}
            </button>
          )}
        </div>
      )}

      {showAnalysis && file.analysisResult && <AnalysisPanel result={file.analysisResult} />}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const processes = useLegalStore((s) => s.processes);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRecord[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterProcessId, setFilterProcessId] = useState('');

  const handleFiles = useCallback((incoming: File[]) => {
    const newRecords: UploadedFileRecord[] = incoming
      .filter((f) => f.size <= MAX_SIZE)
      .map((f) => ({
        id: generateId(),
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: new Date().toISOString(),
        processId: '',
        status: 'uploading',
        progress: 0,
        analysisStatus: 'idle',
      }));

    setUploadedFiles((prev) => [...newRecords, ...prev]);

    // Simulate upload progress per file
    newRecords.forEach((record) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) => f.id === record.id ? { ...f, progress: 100, status: 'done' } : f)
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => f.id === record.id ? { ...f, progress } : f)
          );
        }
      }, 150 + Math.random() * 200);
    });
  }, []);

  const handleLink = useCallback((fileId: string, processId: string) => {
    setUploadedFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, processId } : f));
  }, []);

  const handleAnalyze = useCallback(async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (!file) return;

    setUploadedFiles((prev) =>
      prev.map((f) => f.id === fileId ? { ...f, analysisStatus: 'analyzing' } : f)
    );

    try {
      const result = await simulateAnalysis(file);
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === fileId ? { ...f, analysisStatus: 'done', analysisResult: result } : f)
      );
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === fileId ? { ...f, analysisStatus: 'error' } : f)
      );
    }
  }, [uploadedFiles]);

  const handleRemove = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const filteredFiles = filterProcessId
    ? uploadedFiles.filter((f) => f.processId === filterProcessId)
    : uploadedFiles;

  const doneCount = uploadedFiles.filter((f) => f.status === 'done').length;
  const analyzedCount = uploadedFiles.filter((f) => f.analysisStatus === 'done').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Central de Documentos</h1>
            <p className="text-sm text-[#6b7a8d]">
              Envie, vincule e analise documentos jurídicos com IA
            </p>
          </div>
        </div>

        {/* Stats */}
        {uploadedFiles.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{doneCount}</p>
              <p className="text-[10px] text-[#6b7a8d] uppercase">Enviados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{analyzedCount}</p>
              <p className="text-[10px] text-[#6b7a8d] uppercase">Analisados</p>
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <DropZone onFiles={handleFiles} />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Documentos ({uploadedFiles.length})
              </h2>

              {/* Filter by process */}
              {processes.length > 0 && (
                <div className="relative">
                  <select
                    value={filterProcessId}
                    onChange={(e) => setFilterProcessId(e.target.value)}
                    className="appearance-none rounded-lg bg-[#0d1320] border border-[#1a2332] pl-3 pr-7 py-1.5 text-xs text-[#8899aa] focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Todos os processos</option>
                    {processes.map((p) => (
                      <option key={p.id} value={p.id}>{p.cnj} — {p.title.slice(0, 30)}</option>
                    ))}
                  </select>
                  <Briefcase className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4a5568] pointer-events-none" />
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-[#1a2332] bg-[#0d1320] p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-[#1a2332] text-white' : 'text-[#6b7a8d] hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-[#1a2332] text-white' : 'text-[#6b7a8d] hover:text-white'
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                Grade
              </button>
            </div>
          </div>

          {/* Files */}
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  processes={processes}
                  onLink={handleLink}
                  onAnalyze={handleAnalyze}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  processes={processes}
                  onLink={handleLink}
                  onAnalyze={handleAnalyze}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {filteredFiles.length === 0 && filterProcessId && (
            <div className="text-center py-8 rounded-xl border border-[#1a2332] bg-[#0d1320]">
              <p className="text-sm text-[#6b7a8d]">Nenhum documento vinculado a este processo.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {uploadedFiles.length === 0 && (
        <div className="text-center py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a2332] mx-auto mb-3">
            <FileText className="h-7 w-7 text-[#4a5568]" />
          </div>
          <p className="text-sm text-[#6b7a8d]">
            Nenhum arquivo enviado. Arraste documentos para a área acima ou clique para selecionar.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#4a5568]">
            <span className="flex items-center gap-1"><Play className="h-3 w-3 text-amber-500/50" /> Upload com progresso</span>
            <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3 text-amber-500/50" /> Vincule a processos</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500/50" /> Análise com IA</span>
          </div>
        </div>
      )}
    </div>
  );
}
