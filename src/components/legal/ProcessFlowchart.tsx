'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, BookOpen, ArrowDown } from 'lucide-react';

export interface FlowchartStep {
  id: string;
  title: string;
  description: string;
  deadline: string;
  articles: string[];
  status: 'completed' | 'current' | 'pending';
}

export interface ProcessFlowchartProps {
  steps: FlowchartStep[];
  areaName: string;
}

export function ProcessFlowchart({ steps, areaName }: ProcessFlowchartProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  function getStepStyle(status: FlowchartStep['status']) {
    switch (status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'current':
        return 'border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/5';
      case 'pending':
        return 'border-[#1a2332] bg-[#0d1320]';
    }
  }

  function getStepDot(status: FlowchartStep['status']) {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-amber-500 animate-pulse';
      case 'pending':
        return 'bg-[#2a3342]';
    }
  }

  function getDeadlineBadge(deadline: string) {
    if (deadline.includes('urgente') || deadline.includes('5 dias')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    if (deadline.includes('15 dias') || deadline.includes('10 dias')) {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
    return 'bg-[#1a2332] text-[#6b7a8d] border-[#2a3342]';
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-[#6b7a8d] uppercase tracking-widest mb-4">
        Fluxograma - {areaName}
      </p>
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center">
          {/* Step Box */}
          <button
            onClick={() => toggleStep(step.id)}
            className={`w-full max-w-2xl rounded-xl border p-4 text-left transition-all duration-200 hover:border-amber-500/30 ${getStepStyle(
              step.status
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full flex-shrink-0 ${getStepDot(step.status)}`} />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {index + 1}. {step.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${getDeadlineBadge(
                        step.deadline
                      )}`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {step.deadline}
                    </span>
                  </div>
                </div>
              </div>
              {expandedStep === step.id ? (
                <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
              )}
            </div>

            {/* Expanded Details */}
            {expandedStep === step.id && (
              <div className="mt-4 pt-3 border-t border-[#1a2332] space-y-3">
                <p className="text-sm text-[#c0c8d4] leading-relaxed">
                  {step.description}
                </p>
                {step.articles.length > 0 && (
                  <div>
                    <p className="text-xs text-[#6b7a8d] mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" />
                      Artigos aplicaveis:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.articles.map((article, ai) => (
                        <span
                          key={ai}
                          className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400 font-medium"
                        >
                          {article}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </button>

          {/* Arrow between steps */}
          {index < steps.length - 1 && (
            <div className="flex flex-col items-center py-1">
              <div className="h-4 w-0.5 bg-[#2a3342]" />
              <ArrowDown className="h-4 w-4 text-[#2a3342]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
