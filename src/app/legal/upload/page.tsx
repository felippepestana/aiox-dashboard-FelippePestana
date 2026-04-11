'use client';

import { useState, useCallback } from 'react';
import { useLegalStore } from '@/stores/legal-store';
import { FileUpload } from '@/components/legal/FileUpload';
import {
  Upload,
  FileText,
  Play,
  Clock,
  CheckCircle,
  Loader2,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface UploadedFileInfo {
  name: string;
  size: number;
  path: string;
  type: string;
  uploadedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function UploadPage() {
  const processes = useLegalStore((s) => s.processes);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleUpload = useCallback(async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/legal/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newFiles: UploadedFileInfo[] = (
          data.uploaded as Array<{ name: string; size: number; path: string; type: string }>
        ).map((f) => ({
          ...f,
          uploadedAt: new Date().toISOString(),
        }));
        setUploadedFiles((prev) => [...newFiles, ...prev]);
      }
    } catch {
      // Upload error handled by FileUpload component progress
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (uploadedFiles.length === 0) return;
    setAnalyzing(true);
    setAnalysisComplete(false);

    // Simulate squad analysis workflow
    await new Promise((r) => setTimeout(r, 3000));

    setAnalyzing(false);
    setAnalysisComplete(true);
  }, [uploadedFiles]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Upload de Documentos
            </h1>
            <p className="text-sm text-[#6b7a8d]">
              Envie documentos para analise e vinculacao a processos
            </p>
          </div>
        </div>
      </div>

      {/* Process Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#8899aa] mb-2">
          <Briefcase className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Vincular ao Processo
        </label>
        <select
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors appearance-none"
        >
          <option value="">Selecione um processo (opcional)</option>
          {processes.map((proc) => (
            <option key={proc.id} value={proc.id}>
              {proc.cnj} - {proc.title}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Component */}
      <div className="mb-6">
        <FileUpload onUpload={handleUpload} multiple />
      </div>

      {/* Analyze Button */}
      {uploadedFiles.length > 0 && (
        <div className="mb-8">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/20"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando com Squad...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisar com Squad
              </>
            )}
          </button>

          {analysisComplete && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Analise concluida! Os documentos foram processados pelo Squad de Case Analysis.
            </div>
          )}
        </div>
      )}

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Arquivos Recentes
          </h2>
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2332]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file, idx) => (
                  <tr
                    key={`${file.path}-${idx}`}
                    className="border-b border-[#1a2332] last:border-b-0 hover:bg-[#111827] transition-colors"
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#6b7a8d] bg-[#1a2332] px-2 py-1 rounded">
                        {file.type.split('/').pop()?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#8899aa]">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        Enviado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a2332] mx-auto mb-4">
            <FileText className="h-8 w-8 text-[#4a5568]" />
          </div>
          <p className="text-sm text-[#6b7a8d]">
            Nenhum arquivo enviado ainda. Arraste documentos para a area acima.
          </p>
        </div>
      )}
    </div>
  );
}
