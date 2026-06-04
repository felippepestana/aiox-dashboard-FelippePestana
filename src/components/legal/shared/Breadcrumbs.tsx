'use client';

// =============================================================================
// Breadcrumbs — Auto-detecting or explicit breadcrumb trail
// APEX Legal Performance — navy + silver + gold theme
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTE_LABELS } from '@/lib/navigation-config';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbsItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbsItem[];
  className?: string;
  /** Show only the last N levels on mobile (default: 2). */
  mobileDepth?: number;
}

// ─── Auto-detect from path ────────────────────────────────────────────────────

function buildAutoItems(pathname: string): BreadcrumbsItem[] {
  // Split and accumulate path segments
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbsItem[] = [];

  let accPath = '';
  for (const seg of segments) {
    accPath += `/${seg}`;
    const label = ROUTE_LABELS[accPath];

    if (!label) {
      // Dynamic segment (e.g., /legal/processes/[id]) — skip if no label
      // Could be shown as an ID truncated — we skip for now
      continue;
    }

    items.push({ label, href: accPath });
  }

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Breadcrumbs({ items, className, mobileDepth = 2 }: BreadcrumbsProps) {
  const pathname = usePathname();
  const resolved: BreadcrumbsItem[] = items ?? buildAutoItems(pathname);

  if (resolved.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center flex-wrap gap-0.5', className)}
    >
      {resolved.map((crumb, idx) => {
        const isLast = idx === resolved.length - 1;
        // On mobile, show only last `mobileDepth` items (always include first)
        const hideOnMobile = idx > 0 && idx < resolved.length - mobileDepth;

        return (
          <React.Fragment key={`${crumb.href ?? crumb.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight
                size={11}
                className={cn(
                  'flex-shrink-0 text-[#2D3748]',
                  hideOnMobile && 'hidden sm:block'
                )}
                aria-hidden
              />
            )}

            {isLast ? (
              // Current page — not clickable
              <span
                aria-current="page"
                className={cn(
                  'text-xs text-[#A0AEC0] select-none',
                  hideOnMobile && 'hidden sm:inline'
                )}
              >
                {crumb.label}
              </span>
            ) : crumb.href ? (
              <Link
                href={crumb.href}
                className={cn(
                  'flex items-center gap-0.5 text-xs text-[#4A5568] hover:text-[#C0C0C0] transition-colors duration-150',
                  hideOnMobile && 'hidden sm:flex'
                )}
              >
                {idx === 0 && <Home size={11} className="flex-shrink-0" aria-hidden />}
                <span>{crumb.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  'text-xs text-[#4A5568]',
                  hideOnMobile && 'hidden sm:inline'
                )}
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
