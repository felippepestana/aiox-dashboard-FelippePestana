'use client';

// =============================================================================
// MultiStepForm — Generic multi-step form with progress bar
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  validate?: () => boolean;
}

export interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: () => void;
  onCancel?: () => void;
  completeLabel?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiStepForm({
  steps,
  onComplete,
  onCancel,
  completeLabel = 'Concluir',
  className,
}: MultiStepFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const total = steps.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const currentStep = steps[currentIndex];

  // Fade transition helper
  const transition = useCallback(
    (nextFn: () => void) => {
      setVisible(false);
      const id = setTimeout(() => {
        nextFn();
        setVisible(true);
      }, 200);
      return () => clearTimeout(id);
    },
    []
  );

  const handleNext = () => {
    if (currentStep.validate && !currentStep.validate()) return;
    if (isLast) {
      onComplete();
      return;
    }
    transition(() => setCurrentIndex((i) => i + 1));
  };

  const handleBack = () => {
    if (isFirst) return;
    transition(() => setCurrentIndex((i) => i - 1));
  };

  return (
    <div className={cn('relative flex flex-col gap-6', className)}>
      {/* Cancel button */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className={cn(
            'absolute top-0 right-0 z-10',
            'flex items-center justify-center w-7 h-7 rounded-md',
            'text-[#718096] hover:text-[#A0AEC0]',
            'hover:bg-[rgba(192,192,192,0.06)] transition-colors duration-150 cursor-pointer'
          )}
        >
          <X size={15} />
        </button>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          const isNotLast = idx < steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'w-8 h-8 rounded-full transition-all duration-300',
                    isCompleted && 'bg-[#D4AF37] text-[#060d1a]',
                    isCurrent && [
                      'bg-transparent border-2 border-[#D4AF37] text-[#D4AF37]',
                      'animate-[pulse-ring_2s_ease-in-out_infinite]',
                    ],
                    isFuture && 'bg-[#4A5568] text-[#718096]'
                  )}
                  style={
                    isCurrent
                      ? {
                          boxShadow: '0 0 0 0 rgba(212,175,55,0.4)',
                          animation: 'pulseRing 2s ease-in-out infinite',
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider text-center leading-tight max-w-[64px]',
                    (isCompleted || isCurrent) && 'text-[#A0AEC0]',
                    isFuture && 'text-[#4A5568]'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {isNotLast && (
                <div
                  className={cn(
                    'flex-1 h-px mx-1 mt-[-14px] transition-all duration-300',
                    idx < currentIndex
                      ? 'bg-[#D4AF37]'
                      : 'bg-[rgba(192,192,192,0.10)]'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div
        className={cn(
          'min-h-[300px] transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {currentStep.content}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4">
        {/* Back */}
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm',
            'border border-[rgba(192,192,192,0.20)] text-[#A0AEC0]',
            'hover:bg-[rgba(192,192,192,0.06)] transition-colors duration-150 cursor-pointer',
            isFirst && 'invisible pointer-events-none'
          )}
        >
          <ChevronLeft size={14} />
          Voltar
        </button>

        {/* Center label */}
        <span className="text-xs text-[#718096] shrink-0">
          Etapa {currentIndex + 1} de {total}
        </span>

        {/* Next / Complete */}
        <button
          type="button"
          onClick={handleNext}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer',
            isLast
              ? 'bg-[#D4AF37] text-[#060d1a] font-medium hover:bg-[#c9a632]'
              : 'bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.20)]'
          )}
        >
          {isLast ? completeLabel : 'Próximo'}
          {!isLast && <ChevronRight size={14} />}
        </button>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(212,175,55,0); }
        }
      `}</style>
    </div>
  );
}
