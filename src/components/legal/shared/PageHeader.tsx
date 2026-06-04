'use client';

// =============================================================================
// PageHeader - Shared page header with breadcrumbs, title, subtitle, actions
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2 pb-4 mb-6 border-b border-border',
        className
      )}
    >
      {/* Breadcrumb trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 flex-wrap"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.href}>
                {isLast ? (
                  <span
                    className="text-xs text-muted-foreground"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-xs text-[#A0AEC0] hover:text-[#C0C0C0] transition-colors duration-150 underline-offset-2 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
                {!isLast && (
                  <ChevronRight
                    size={12}
                    className="text-muted-foreground flex-shrink-0"
                    aria-hidden
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Title row: title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-xl font-semibold text-white leading-tight tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#A0AEC0] leading-snug">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
