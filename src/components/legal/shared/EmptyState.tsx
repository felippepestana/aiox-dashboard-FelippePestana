'use client';

// =============================================================================
// EmptyState - Centered empty state with icon, title, description, CTA
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6 gap-4',
        className
      )}
    >
      {/* Icon circle */}
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center',
            'h-16 w-16 rounded-full',
            'bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)]',
            'text-[#A0AEC0]'
          )}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-[#718096] leading-relaxed">{description}</p>
        )}
      </div>

      {/* CTA */}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium',
                'bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)]',
                'text-[#D4AF37] hover:bg-[rgba(212,175,55,0.20)]',
                'transition-colors duration-200'
              )}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium',
                'bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)]',
                'text-[#D4AF37] hover:bg-[rgba(212,175,55,0.20)]',
                'transition-colors duration-200 cursor-pointer'
              )}
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
