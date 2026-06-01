'use client';

// =============================================================================
// MobileBottomNav – Fixed bottom navigation bar for mobile screens (< 768 px)
// =============================================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Clock, MessageSquare, Menu } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/legal' },
  { label: 'Processos', icon: Briefcase, href: '/legal/processes' },
  { label: 'Prazos', icon: Clock, href: '/legal/deadlines' },
  { label: 'Chat IA', icon: MessageSquare, href: '/legal/chat' },
];

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Hide the nav when the virtual keyboard is open (viewport shrinks significantly)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const THRESHOLD = 0.75; // if viewport height drops to < 75% of window, assume keyboard

    function handleResize() {
      const ratio = vv!.height / window.innerHeight;
      setKeyboardOpen(ratio < THRESHOLD);
    }

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  if (keyboardOpen) return null;

  function isActive(href: string) {
    if (href === '/legal') return pathname === '/legal';
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-[#1a2d52]/60 bg-[#0a1628] md:hidden"
    >
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              active
                ? 'text-[#C0C0C0]'
                : 'text-[#4A5568] hover:text-[#A0AEC0] active:text-white'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
              strokeWidth={active ? 2.5 : 1.75}
            />
            <span>{label}</span>
            {active && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[#C0C0C0]" />
            )}
          </Link>
        );
      })}

      {/* "Mais" button opens the full sidebar */}
      <button
        onClick={onOpenSidebar}
        aria-label="Abrir menu completo"
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#4A5568] transition-colors hover:text-[#A0AEC0] active:text-white"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
        <span>Mais</span>
      </button>
    </nav>
  );
}
