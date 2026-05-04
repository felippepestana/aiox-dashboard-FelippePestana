'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Calculator,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  calculateDeadline,
  getNextBusinessDay,
  isHoliday,
  isCourtRecess,
} from '@/lib/deadline-calculator';

export interface DeadlineCalculatorProps {
  onResult?: (result: DeadlineCalcResult) => void;
}

export interface DeadlineCalcResult {
  startDate: Date;
  endDate: Date;
  days: number;
  type: 'uteis' | 'corridos';
  considerRecess: boolean;
}

interface Preset {
  label: string;
  days: number;
  type: 'uteis' | 'corridos';
  description: string;
}

const PRESETS: Preset[] = [
  { label: 'Contestacao', days: 15, type: 'uteis', description: 'CPC Art. 335' },
  { label: 'Apelacao', days: 15, type: 'uteis', description: 'CPC Art. 1.003' },
  { label: 'Embargos de Declaracao', days: 5, type: 'uteis', description: 'CPC Art. 1.023' },
  { label: 'Agravo de Instrumento', days: 15, type: 'uteis', description: 'CPC Art. 1.015' },
  { label: 'Recurso Trabalhista', days: 8, type: 'corridos', description: 'CLT Art. 895' },
  { label: 'Recurso Especial', days: 15, type: 'uteis', description: 'CPC Art. 1.029' },
  { label: 'Recurso Extraordinario', days: 15, type: 'uteis', description: 'CPC Art. 1.029' },
  { label: 'Impugnacao ao Cumprimento', days: 15, type: 'uteis', description: 'CPC Art. 525' },
];

export function DeadlineCalculator({ onResult }: DeadlineCalculatorProps) {
  const [startDateStr, setStartDateStr] = useState('');
  const [days, setDays] = useState(15);
  const [type, setType] = useState<'uteis' | 'corridos'>('uteis');
  const [considerRecess, setConsiderRecess] = useState(true);
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    if (!startDateStr || days <= 0) return null;

    const startDate = new Date(startDateStr + 'T12:00:00');
    if (isNaN(startDate.getTime())) return null;

    const endDate = calculateDeadline(startDate, days, type, considerRecess);
    return { startDate, endDate, days, type, considerRecess };
  }, [startDateStr, days, type, considerRecess]);

  function handleCalculate() {
    if (result) {
      setCalculated(true);
      onResult?.(result);
    }
  }

  function applyPreset(preset: Preset) {
    setDays(preset.days);
    setType(preset.type);
  }

  function formatDateFull(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatDateShort(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Build calendar visualization for the result
  const calendarDays = useMemo(() => {
    if (!result || !calculated) return [];

    const start = new Date(result.startDate);
    const end = new Date(result.endDate);
    const days: { date: Date; isStart: boolean; isEnd: boolean; isHoliday: boolean; isRecess: boolean; isWeekend: boolean; inRange: boolean }[] = [];

    // Show from start to end + a few buffer days
    const current = new Date(start);
    current.setDate(current.getDate() - 1); // show day before start
    const limit = new Date(end);
    limit.setDate(limit.getDate() + 2); // show 2 days after end

    while (current <= limit) {
      const d = new Date(current);
      const dow = d.getDay();
      days.push({
        date: d,
        isStart: d.toDateString() === start.toDateString(),
        isEnd: d.toDateString() === end.toDateString(),
        isHoliday: isHoliday(d),
        isRecess: isCourtRecess(d),
        isWeekend: dow === 0 || dow === 6,
        inRange: d >= start && d <= end,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [result, calculated]);

  return (
    <div className="space-y-6">
      {/* Preset Buttons */}
      <div>
        <h3 className="text-sm font-medium text-[#6b7a8d] mb-3">Presets de Prazos Comuns</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`text-left rounded-lg border p-3 transition-all ${
                days === preset.days && type === preset.type
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-[#1a2332] bg-[#0a0f1a] text-[#8899aa] hover:border-[#2a3342] hover:text-white'
              }`}
            >
              <span className="text-sm font-medium block">{preset.label}</span>
              <span className="text-xs text-[#6b7a8d] block mt-0.5">
                {preset.days} dias {preset.type} - {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">
            Data da Intimacao
          </label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => { setStartDateStr(e.target.value); setCalculated(false); }}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Days */}
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">
            Quantidade de Dias
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => { setDays(parseInt(e.target.value) || 1); setCalculated(false); }}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">
            Tipo de Contagem
          </label>
          <div className="flex gap-1 rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-1">
            <button
              onClick={() => { setType('uteis'); setCalculated(false); }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === 'uteis'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-[#6b7a8d] hover:text-white'
              }`}
            >
              Uteis
            </button>
            <button
              onClick={() => { setType('corridos'); setCalculated(false); }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === 'corridos'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-[#6b7a8d] hover:text-white'
              }`}
            >
              Corridos
            </button>
          </div>
        </div>

        {/* Calculate button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleCalculate}
            disabled={!startDateStr || days <= 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            <Calculator className="h-4 w-4" />
            Calcular
          </button>
        </div>
      </div>

      {/* Recess Checkbox */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={considerRecess}
            onChange={(e) => { setConsiderRecess(e.target.checked); setCalculated(false); }}
            className="h-4 w-4 rounded border-[#1a2332] bg-[#0a0f1a] text-amber-500 focus:ring-amber-500/20"
          />
          <span className="text-sm text-[#8899aa]">
            Considerar recesso forense (20/dez a 20/jan)
          </span>
        </label>
        <div className="flex items-center gap-1 text-xs text-[#6b7a8d]">
          <Info className="h-3 w-3" />
          <span>CPC Art. 220</span>
        </div>
      </div>

      {/* Result */}
      {calculated && result && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Resultado do Calculo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Data Inicial</p>
              <p className="text-sm font-medium text-white">{formatDateFull(result.startDate)}</p>
              <p className="text-xs text-[#6b7a8d] mt-1">{formatDateShort(result.startDate)}</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{result.days} dias {result.type}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Vencimento</p>
              <p className="text-lg font-bold text-amber-400">{formatDateFull(result.endDate)}</p>
              <p className="text-sm text-amber-300 mt-1">{formatDateShort(result.endDate)}</p>
            </div>
          </div>

          {/* Calendar strip visualization */}
          {calendarDays.length > 0 && calendarDays.length <= 120 && (
            <div>
              <h4 className="text-sm font-medium text-[#8899aa] mb-2">Visualizacao do Periodo</h4>
              <div className="flex flex-wrap gap-1">
                {calendarDays.map((day, idx) => {
                  let bgColor = 'bg-[#0a0f1a]';
                  let textColor = 'text-[#6b7a8d]';
                  let border = 'border-[#1a2332]';

                  if (day.isStart) {
                    bgColor = 'bg-blue-500/20';
                    textColor = 'text-blue-400';
                    border = 'border-blue-500/30';
                  } else if (day.isEnd) {
                    bgColor = 'bg-amber-500/20';
                    textColor = 'text-amber-400';
                    border = 'border-amber-500/40';
                  } else if (day.inRange && day.isHoliday) {
                    bgColor = 'bg-red-500/10';
                    textColor = 'text-red-400';
                    border = 'border-red-500/20';
                  } else if (day.inRange && day.isRecess && considerRecess) {
                    bgColor = 'bg-purple-500/10';
                    textColor = 'text-purple-400';
                    border = 'border-purple-500/20';
                  } else if (day.inRange && day.isWeekend) {
                    bgColor = 'bg-[#0d1320]';
                    textColor = 'text-[#4a5568]';
                  } else if (day.inRange) {
                    bgColor = 'bg-emerald-500/10';
                    textColor = 'text-emerald-400';
                    border = 'border-emerald-500/20';
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 flex items-center justify-center rounded border text-xs font-medium ${bgColor} ${textColor} ${border}`}
                      title={`${formatDateShort(day.date)}${day.isHoliday ? ' (Feriado)' : ''}${day.isRecess ? ' (Recesso)' : ''}${day.isWeekend ? ' (Fim de semana)' : ''}`}
                    >
                      {day.date.getDate()}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#6b7a8d]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30" /> Inicio
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" /> Vencimento
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20" /> Dia util
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500/10 border border-red-500/20" /> Feriado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-purple-500/10 border border-purple-500/20" /> Recesso
                </span>
              </div>
            </div>
          )}

          {/* Warning if near recess */}
          {considerRecess && result.endDate && isCourtRecess(result.endDate) && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-400">
                O prazo final recai no periodo de recesso forense. A contagem foi ajustada automaticamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
