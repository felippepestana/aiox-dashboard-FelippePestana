'use client';

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  FileText,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in bytes, default 10MB
  multiple?: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  return FileText;
}

function generateId() {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FileUpload({
  onUpload,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      const validFiles: File[] = [];

      Array.from(incoming).forEach((file) => {
        const id = generateId();

        if (file.size > maxSize) {
          newFiles.push({
            file,
            id,
            progress: 0,
            status: 'error',
            error: `Arquivo excede ${formatFileSize(maxSize)}`,
          });
          return;
        }

        newFiles.push({ file, id, progress: 0, status: 'uploading' });
        validFiles.push(file);
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload progress for each valid file
      newFiles
        .filter((f) => f.status === 'uploading')
        .forEach((uploadFile) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30 + 10;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id
                    ? { ...f, progress: 100, status: 'done' }
                    : f
                )
              );
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress } : f
                )
              );
            }
          }, 200 + Math.random() * 300);
        });

      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [maxSize, onUpload]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-[#1a2332] bg-[#0a0f1a] hover:border-amber-500/30 hover:bg-[#0d1320]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl mb-4 transition-colors ${
            dragOver
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-[#1a2332] text-[#6b7a8d]'
          }`}
        >
          <Upload className="h-7 w-7" />
        </div>

        <p className="text-sm font-medium text-white mb-1">
          {dragOver
            ? 'Solte os arquivos aqui'
            : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-[#6b7a8d]">
          PDF, DOC, DOCX, JPG, PNG - Maximo {formatFileSize(maxSize)}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => {
            const Icon = getFileIcon(uploadedFile.file.type);
            return (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 rounded-lg bg-[#0d1320] border border-[#1a2332] px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a2332]">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#6b7a8d]">
                      {formatFileSize(uploadedFile.file.size)}
                    </span>

                    {uploadedFile.status === 'uploading' && (
                      <>
                        <div className="flex-1 h-1 rounded-full bg-[#1a2332] max-w-[120px]">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                        <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                      </>
                    )}

                    {uploadedFile.status === 'done' && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    )}

                    {uploadedFile.status === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {uploadedFile.error}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b7a8d] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
