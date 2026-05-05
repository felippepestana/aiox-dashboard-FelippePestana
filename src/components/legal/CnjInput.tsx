'use client';

import React, { useCallback } from 'react';

export interface CnjInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * CNJ number input with auto-formatting.
 * Format: NNNNNNN-DD.YYYY.J.TR.OOOO
 * Total: 20 digits
 */
function formatCnjValue(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 20);
  let formatted = '';

  for (let i = 0; i < digits.length; i++) {
    if (i === 7) formatted += '-';
    if (i === 9) formatted += '.';
    if (i === 13) formatted += '.';
    if (i === 14) formatted += '.';
    if (i === 16) formatted += '.';
    formatted += digits[i];
  }

  return formatted;
}

export function CnjInput({ value, onChange, className = '' }: CnjInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCnjValue(e.target.value);
      onChange(formatted);
    },
    [onChange]
  );

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="NNNNNNN-DD.YYYY.J.TR.OOOO"
      maxLength={25}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors ${className}`}
    />
  );
}
