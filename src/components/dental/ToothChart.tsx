'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToothCondition = 'healthy' | 'treated' | 'needs_treatment' | 'missing';

export interface ToothStatus {
  condition: ToothCondition;
  notes?: string;
  procedures?: string[];
}

export interface ToothChartProps {
  selectedTeeth?: number[];
  onToothSelect?: (toothNumber: number, selected: boolean) => void;
  toothStatus?: Record<number, ToothStatus>;
  className?: string;
  readOnly?: boolean;
}

const CONDITION_COLORS: Record<ToothCondition, { fill: string; stroke: string; label: string }> = {
  healthy: { fill: '#FFFFFF', stroke: '#9CA3AF', label: 'Saudável' },
  treated: { fill: '#DBEAFE', stroke: '#3B82F6', label: 'Tratado' },
  needs_treatment: { fill: '#FEE2E2', stroke: '#EF4444', label: 'Necessita Tratamento' },
  missing: { fill: '#E5E7EB', stroke: '#6B7280', label: 'Ausente' },
};

const QUADRANTS = [
  { label: 'Superior Direito', teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { label: 'Superior Esquerdo', teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { label: 'Inferior Esquerdo', teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
  { label: 'Inferior Direito', teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
];

const TOOTH_NAMES: Record<number, string> = {
  11: 'Incisivo Central Superior Direito',
  12: 'Incisivo Lateral Superior Direito',
  13: 'Canino Superior Direito',
  14: '1º Pré-Molar Superior Direito',
  15: '2º Pré-Molar Superior Direito',
  16: '1º Molar Superior Direito',
  17: '2º Molar Superior Direito',
  18: '3º Molar Superior Direito',
  21: 'Incisivo Central Superior Esquerdo',
  22: 'Incisivo Lateral Superior Esquerdo',
  23: 'Canino Superior Esquerdo',
  24: '1º Pré-Molar Superior Esquerdo',
  25: '2º Pré-Molar Superior Esquerdo',
  26: '1º Molar Superior Esquerdo',
  27: '2º Molar Superior Esquerdo',
  28: '3º Molar Superior Esquerdo',
  31: 'Incisivo Central Inferior Esquerdo',
  32: 'Incisivo Lateral Inferior Esquerdo',
  33: 'Canino Inferior Esquerdo',
  34: '1º Pré-Molar Inferior Esquerdo',
  35: '2º Pré-Molar Inferior Esquerdo',
  36: '1º Molar Inferior Esquerdo',
  37: '2º Molar Inferior Esquerdo',
  38: '3º Molar Inferior Esquerdo',
  41: 'Incisivo Central Inferior Direito',
  42: 'Incisivo Lateral Inferior Direito',
  43: 'Canino Inferior Direito',
  44: '1º Pré-Molar Inferior Direito',
  45: '2º Pré-Molar Inferior Direito',
  46: '1º Molar Inferior Direito',
  47: '2º Molar Inferior Direito',
  48: '3º Molar Inferior Direito',
};

function getToothType(num: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  const unit = num % 10;
  if (unit >= 6) return 'molar';
  if (unit >= 4) return 'premolar';
  if (unit === 3) return 'canine';
  return 'incisor';
}

interface ToothSVGProps {
  toothNumber: number;
  x: number;
  y: number;
  isSelected: boolean;
  condition: ToothCondition;
  onSelect: (num: number) => void;
  isUpper: boolean;
  readOnly: boolean;
}

function ToothSVG({ toothNumber, x, y, isSelected, condition, onSelect, isUpper, readOnly }: ToothSVGProps) {
  const [hovered, setHovered] = useState(false);
  const colors = CONDITION_COLORS[condition];
  const type = getToothType(toothNumber);

  const toothWidth = type === 'molar' ? 28 : type === 'premolar' ? 24 : type === 'canine' ? 20 : 18;
  const toothHeight = type === 'molar' ? 32 : type === 'premolar' ? 28 : type === 'canine' ? 30 : 26;

  const rootHeight = type === 'molar' ? 20 : type === 'premolar' ? 18 : type === 'canine' ? 22 : 16;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => !readOnly && onSelect(toothNumber)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {/* Root(s) */}
      {isUpper ? (
        <g>
          {type === 'molar' ? (
            <>
              <line x1={toothWidth * 0.25} y1={toothHeight * 0.5} x2={toothWidth * 0.2} y2={toothHeight * 0.5 + rootHeight} stroke={colors.stroke} strokeWidth={2} />
              <line x1={toothWidth * 0.5} y1={toothHeight * 0.5} x2={toothWidth * 0.5} y2={toothHeight * 0.5 + rootHeight + 4} stroke={colors.stroke} strokeWidth={2} />
              <line x1={toothWidth * 0.75} y1={toothHeight * 0.5} x2={toothWidth * 0.8} y2={toothHeight * 0.5 + rootHeight} stroke={colors.stroke} strokeWidth={2} />
            </>
          ) : type === 'premolar' ? (
            <>
              <line x1={toothWidth * 0.35} y1={toothHeight * 0.5} x2={toothWidth * 0.3} y2={toothHeight * 0.5 + rootHeight} stroke={colors.stroke} strokeWidth={2} />
              <line x1={toothWidth * 0.65} y1={toothHeight * 0.5} x2={toothWidth * 0.7} y2={toothHeight * 0.5 + rootHeight} stroke={colors.stroke} strokeWidth={2} />
            </>
          ) : (
            <line x1={toothWidth * 0.5} y1={toothHeight * 0.5} x2={toothWidth * 0.5} y2={toothHeight * 0.5 + rootHeight} stroke={colors.stroke} strokeWidth={2} />
          )}
        </g>
      ) : (
        <g>
          {type === 'molar' ? (
            <>
              <line x1={toothWidth * 0.3} y1={toothHeight * 0.5} x2={toothWidth * 0.25} y2={toothHeight * 0.5 - rootHeight} stroke={colors.stroke} strokeWidth={2} />
              <line x1={toothWidth * 0.7} y1={toothHeight * 0.5} x2={toothWidth * 0.75} y2={toothHeight * 0.5 - rootHeight} stroke={colors.stroke} strokeWidth={2} />
            </>
          ) : type === 'premolar' ? (
            <line x1={toothWidth * 0.5} y1={toothHeight * 0.5} x2={toothWidth * 0.5} y2={toothHeight * 0.5 - rootHeight} stroke={colors.stroke} strokeWidth={2} />
          ) : (
            <line x1={toothWidth * 0.5} y1={toothHeight * 0.5} x2={toothWidth * 0.5} y2={toothHeight * 0.5 - rootHeight} stroke={colors.stroke} strokeWidth={2} />
          )}
        </g>
      )}

      {/* Crown */}
      <rect
        x={0}
        y={0}
        width={toothWidth}
        height={toothHeight}
        rx={4}
        ry={4}
        fill={condition === 'missing' ? colors.fill : colors.fill}
        stroke={isSelected ? '#0D9488' : hovered ? '#0D9488' : colors.stroke}
        strokeWidth={isSelected ? 2.5 : hovered ? 2 : 1.5}
        opacity={condition === 'missing' ? 0.5 : 1}
      />

      {/* Cross pattern for missing teeth */}
      {condition === 'missing' && (
        <>
          <line x1={2} y1={2} x2={toothWidth - 2} y2={toothHeight - 2} stroke="#9CA3AF" strokeWidth={1.5} />
          <line x1={toothWidth - 2} y1={2} x2={2} y2={toothHeight - 2} stroke="#9CA3AF" strokeWidth={1.5} />
        </>
      )}

      {/* Selection ring */}
      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={toothWidth + 6}
          height={toothHeight + 6}
          rx={6}
          ry={6}
          fill="none"
          stroke="#0D9488"
          strokeWidth={2}
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Tooth number */}
      <text
        x={toothWidth / 2}
        y={isUpper ? -6 : toothHeight + 14}
        textAnchor="middle"
        fontSize={9}
        fontWeight={isSelected ? 700 : 500}
        fill={isSelected ? '#0D9488' : '#6B7280'}
      >
        {toothNumber}
      </text>

      {/* Tooltip */}
      {hovered && (
        <g>
          <rect
            x={-40}
            y={isUpper ? toothHeight + rootHeight + 10 : -rootHeight - 50}
            width={toothWidth + 80}
            height={38}
            rx={6}
            fill="#1F2937"
            opacity={0.95}
          />
          <text
            x={toothWidth / 2}
            y={isUpper ? toothHeight + rootHeight + 26 : -rootHeight - 38}
            textAnchor="middle"
            fontSize={9}
            fill="white"
            fontWeight={600}
          >
            {toothNumber} - {TOOTH_NAMES[toothNumber]?.split(' ').slice(0, 3).join(' ')}
          </text>
          <text
            x={toothWidth / 2}
            y={isUpper ? toothHeight + rootHeight + 40 : -rootHeight - 24}
            textAnchor="middle"
            fontSize={8}
            fill="#9CA3AF"
          >
            {CONDITION_COLORS[condition].label}
          </text>
        </g>
      )}
    </g>
  );
}

export function ToothChart({
  selectedTeeth = [],
  onToothSelect,
  toothStatus = {},
  className,
  readOnly = false,
}: ToothChartProps) {
  const [internalSelected, setInternalSelected] = useState<number[]>(selectedTeeth);

  const selected = onToothSelect ? selectedTeeth : internalSelected;

  const handleSelect = useCallback(
    (num: number) => {
      const isCurrentlySelected = selected.includes(num);
      if (onToothSelect) {
        onToothSelect(num, !isCurrentlySelected);
      } else {
        setInternalSelected((prev) =>
          isCurrentlySelected ? prev.filter((t) => t !== num) : [...prev, num]
        );
      }
    },
    [selected, onToothSelect]
  );

  const getCondition = useCallback(
    (num: number): ToothCondition => toothStatus[num]?.condition || 'healthy',
    [toothStatus]
  );

  const legend = useMemo(
    () =>
      Object.entries(CONDITION_COLORS).map(([key, val]) => ({
        key: key as ToothCondition,
        ...val,
      })),
    []
  );

  const svgWidth = 580;
  const svgHeight = 340;
  const teethPerRow = 16;
  const startXUpper = 20;
  const startYUpper = 70;
  const startYLower = 190;

  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <Info className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Odontograma</h3>
            <p className="text-xs text-gray-500">Mapa dental interativo - Notação FDI</p>
          </div>
        </div>
        {selected.length > 0 && (
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
            {selected.length} dente{selected.length > 1 ? 's' : ''} selecionado{selected.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="px-4 py-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[600px] mx-auto"
          style={{ minWidth: 400 }}
        >
          {/* Quadrant labels */}
          <text x={svgWidth * 0.25} y={22} textAnchor="middle" fontSize={10} fontWeight={600} fill="#6B7280">
            Superior Direito
          </text>
          <text x={svgWidth * 0.75} y={22} textAnchor="middle" fontSize={10} fontWeight={600} fill="#6B7280">
            Superior Esquerdo
          </text>
          <text x={svgWidth * 0.25} y={svgHeight - 8} textAnchor="middle" fontSize={10} fontWeight={600} fill="#6B7280">
            Inferior Direito
          </text>
          <text x={svgWidth * 0.75} y={svgHeight - 8} textAnchor="middle" fontSize={10} fontWeight={600} fill="#6B7280">
            Inferior Esquerdo
          </text>

          {/* Center divider lines */}
          <line x1={svgWidth / 2} y1={30} x2={svgWidth / 2} y2={svgHeight - 20} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 4" />
          <line x1={20} y1={(startYUpper + startYLower) / 2 + 16} x2={svgWidth - 20} y2={(startYUpper + startYLower) / 2 + 16} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 4" />

          {/* Upper teeth: Q1 (18-11) then Q2 (21-28) */}
          {QUADRANTS[0].teeth.map((tooth, i) => (
            <ToothSVG
              key={tooth}
              toothNumber={tooth}
              x={startXUpper + i * 34}
              y={startYUpper}
              isSelected={selected.includes(tooth)}
              condition={getCondition(tooth)}
              onSelect={handleSelect}
              isUpper={true}
              readOnly={readOnly}
            />
          ))}
          {QUADRANTS[1].teeth.map((tooth, i) => (
            <ToothSVG
              key={tooth}
              toothNumber={tooth}
              x={startXUpper + (8 + i) * 34}
              y={startYUpper}
              isSelected={selected.includes(tooth)}
              condition={getCondition(tooth)}
              onSelect={handleSelect}
              isUpper={true}
              readOnly={readOnly}
            />
          ))}

          {/* Lower teeth: Q4 (48-41) then Q3 (31-38) */}
          {QUADRANTS[3].teeth.map((tooth, i) => (
            <ToothSVG
              key={tooth}
              toothNumber={tooth}
              x={startXUpper + i * 34}
              y={startYLower}
              isSelected={selected.includes(tooth)}
              condition={getCondition(tooth)}
              onSelect={handleSelect}
              isUpper={false}
              readOnly={readOnly}
            />
          ))}
          {QUADRANTS[2].teeth.map((tooth, i) => (
            <ToothSVG
              key={tooth}
              toothNumber={tooth}
              x={startXUpper + (8 + i) * 34}
              y={startYLower}
              isSelected={selected.includes(tooth)}
              condition={getCondition(tooth)}
              onSelect={handleSelect}
              isUpper={false}
              readOnly={readOnly}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap items-center gap-4">
        {legend.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border"
              style={{ backgroundColor: item.fill, borderColor: item.stroke }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
