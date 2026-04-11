'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export interface OabComplianceCheckProps {
  isCompliant: boolean;
  issues?: string[];
}

export function OabComplianceCheck({ isCompliant, issues = [] }: OabComplianceCheckProps) {
  const [expanded, setExpanded] = useState(false);

  if (isCompliant) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-green-500/10 border border-green-500/20">
        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
        <span className="text-xs font-medium text-green-400">OAB Conforme</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs font-medium text-red-400 flex-1 text-left">
          OAB: {issues.length} pendencia{issues.length !== 1 ? 's' : ''}
        </span>
        {issues.length > 0 && (
          expanded ? (
            <ChevronUp className="h-3 w-3 text-red-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-red-400" />
          )
        )}
      </button>

      {expanded && issues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {issues.map((issue, idx) => (
            <li key={idx} className="text-[11px] text-red-300 pl-5 relative">
              <span className="absolute left-2 top-1.5 w-1 h-1 rounded-full bg-red-400" />
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
