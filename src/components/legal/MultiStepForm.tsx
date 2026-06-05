'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface FormStep {
  id: string;
  label: string;
  icon: ReactNode;
  fields: ReactNode;
  validation?: (data: Record<string, unknown>) => boolean;
}

export interface MultiStepFormProps {
  steps: FormStep[];
  onComplete: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  persistKey?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MultiStepForm({ steps, onComplete, onCancel, persistKey }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [errors, setErrors] = useState<string[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`form_${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.data || {});
          setCurrentStep(parsed.step || 0);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [persistKey]);

  // Persist data on change
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(
        `form_${persistKey}`,
        JSON.stringify({ data: formData, step: currentStep })
      );
    }
  }, [formData, currentStep, persistKey]);

  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const validateCurrentStep = useCallback((): boolean => {
    if (currentStepData.validation) {
      const isValid = currentStepData.validation(formData);
      if (!isValid) {
        setErrors([currentStepData.id]);
        return false;
      }
    }
    setErrors([]);
    return true;
  }, [currentStepData, formData]);

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      // Clear persisted data on complete
      if (persistKey && typeof window !== 'undefined') {
        localStorage.removeItem(`form_${persistKey}`);
      }
      onComplete(formData);
    } else {
      setDirection('left');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('right');
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleCancel = () => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(`form_${persistKey}`);
    }
    onCancel?.();
  };

  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-xl overflow-hidden">
      {/* Progress bar - Desktop */}
      <div className="hidden md:flex items-center justify-center px-6 py-4 border-b border-[rgba(192,192,192,0.06)]">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-[#D4AF37] text-[#060d1a]',
                    isCurrent && 'border-2 border-[#D4AF37] text-[#D4AF37]',
                    !isCompleted && !isCurrent && 'border border-[#4A5568] text-[#4A5568]'
                  )}
                  style={
                    isCurrent
                      ? {
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs">{step.icon}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-[10px] uppercase tracking-wider',
                    isCurrent ? 'text-[#D4AF37]' : 'text-[#4A5568]'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-px mx-3 transition-colors duration-300',
                    index < currentStep ? 'bg-[#D4AF37]' : 'bg-[rgba(192,192,192,0.10)]'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar - Mobile */}
      <div className="md:hidden flex items-start gap-3 px-4 py-3 border-b border-[rgba(192,192,192,0.06)]">
        <div className="flex flex-col items-center gap-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-[#D4AF37] text-[#060d1a]',
                    isCurrent && 'border-2 border-[#D4AF37] text-[#D4AF37]',
                    !isCompleted && !isCurrent && 'border border-[#4A5568] text-[#4A5568]'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="text-[9px]">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-px h-4',
                      index < currentStep ? 'bg-[#D4AF37]' : 'bg-[rgba(192,192,192,0.10)]'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-medium text-white">{currentStepData.label}</p>
          <p className="text-[10px] text-[#718096]">
            Etapa {currentStep + 1} de {steps.length}
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="relative min-h-[300px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'p-6',
              errors.includes(currentStepData.id) && 'animate-shake'
            )}
          >
            {currentStepData.fields}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(192,192,192,0.06)] bg-[#0a1628]">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-[#718096] hover:text-white transition-colors"
            >
              Cancelar
            </button>
          )}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[rgba(192,192,192,0.15)] text-[#C0C0C0] rounded-lg hover:border-[rgba(192,192,192,0.25)] hover:bg-[rgba(192,192,192,0.05)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#4A5568]">
            {currentStep + 1} de {steps.length}
          </span>
          <button
            onClick={handleNext}
            className={cn(
              'inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-all',
              isLastStep
                ? 'bg-[#D4AF37] text-[#060d1a] hover:bg-[#E8D070]'
                : 'border border-[#D4AF37] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.08)]'
            )}
          >
            {isLastStep ? 'Concluir' : 'Proximo'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(212, 175, 55, 0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
