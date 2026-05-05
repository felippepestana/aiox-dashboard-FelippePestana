'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface WizardStep {
  title: string;
  description: string;
}

export interface PetitionWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  canAdvance: boolean;
  children: React.ReactNode;
}

export function PetitionWizard({
  steps,
  currentStep,
  onNext,
  onBack,
  canAdvance,
  children,
}: PetitionWizardProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : index === currentStep
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                    : 'border-[#2a3342] text-[#4a5568] bg-[#0a0f1a]'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? 'text-white' : 'text-[#4a5568]'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-[#6b7a8d]">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 rounded transition-colors duration-300 ${
                  index < currentStep ? 'bg-amber-500' : 'bg-[#1a2332]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full rounded-full bg-[#1a2332] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1a2332]">
        <button
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2 rounded-lg border border-[#2a3342] px-5 py-2.5 text-sm font-medium text-[#8899aa] hover:text-white hover:border-[#3a4352] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        {currentStep < steps.length - 1 && (
          <button
            onClick={onNext}
            disabled={!canAdvance}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proximo
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
