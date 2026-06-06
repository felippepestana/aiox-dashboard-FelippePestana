'use client';

// =============================================================================
// ClientSelector — Autocomplete input for selecting clients
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from 'react';
import { Search, User, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientOption {
  id: string;
  name: string;
  type: 'pf' | 'pj';
  cpfCnpj: string;
  email?: string;
}

export interface ClientSelectorProps {
  clients: ClientOption[];
  value?: string;
  onChange: (clientId: string | null) => void;
  onCreate?: () => void;
  placeholder?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function filterClients(clients: ClientOption[], query: string): ClientOption[] {
  if (!query.trim()) return clients.slice(0, 50);
  const q = query.toLowerCase();
  return clients
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cpfCnpj.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (c.email && c.email.toLowerCase().includes(q))
    )
    .slice(0, 50);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientSelector({
  clients,
  value,
  onChange,
  onCreate,
  placeholder = 'Buscar cliente...',
  className,
}: ClientSelectorProps) {
  const selectedClient = value ? clients.find((c) => c.id === value) ?? null : null;

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = filterClients(clients, query);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  const openDropdown = () => {
    setIsOpen(true);
    setActiveIdx(-1);
  };

  const selectClient = useCallback(
    (client: ClientOption) => {
      onChange(client.id);
      setQuery('');
      setIsOpen(false);
      setActiveIdx(-1);
    },
    [onChange]
  );

  const clearSelection = () => {
    onChange(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && filtered[activeIdx]) {
          selectClient(filtered[activeIdx]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIdx(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input / selected display */}
      {selectedClient ? (
        /* Selected state */
        <div
          className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-md',
            'bg-[#0a1628] border border-[rgba(192,192,192,0.12)]',
            'cursor-pointer'
          )}
          onClick={clearSelection}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && clearSelection()}
          aria-label="Limpar seleção"
        >
          {/* Avatar */}
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full shrink-0',
              'bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-medium text-[10px]'
            )}
          >
            {getInitials(selectedClient.name)}
          </div>

          {/* Name */}
          <span className="flex-1 text-sm text-white truncate">
            {selectedClient.name}
          </span>

          {/* Type badge */}
          <span
            className={cn(
              'text-[10px] uppercase px-1.5 py-0.5 rounded font-medium shrink-0',
              selectedClient.type === 'pf'
                ? 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA]'
                : 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]'
            )}
          >
            {selectedClient.type}
          </span>

          {/* Clear */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            aria-label="Remover cliente selecionado"
            className="text-[#718096] hover:text-[#A0AEC0] transition-colors duration-150 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-3 text-[#4A5568] pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              openDropdown();
            }}
            onFocus={openDropdown}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className={cn(
              'w-full h-10 pl-9 pr-3 rounded-md text-sm text-white',
              'bg-[#0a1628] border border-[rgba(192,192,192,0.12)]',
              'placeholder:text-[#4A5568]',
              'outline-none focus:border-[rgba(192,192,192,0.35)]',
              'transition-colors duration-150'
            )}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedClient && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full mt-1 z-50',
            'bg-[#0d1f3c] border border-[rgba(192,192,192,0.15)]',
            'rounded-lg shadow-lg overflow-hidden'
          )}
        >
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(192,192,192,0.15)] scrollbar-track-transparent"
            role="listbox"
          >
            {filtered.length === 0 ? (
              <li className="py-4 text-center">
                <p className="text-sm text-[#718096]">Nenhum cliente encontrado</p>
                {onCreate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onCreate();
                    }}
                    className={cn(
                      'mt-2 inline-flex items-center gap-1 text-sm text-[#D4AF37]',
                      'hover:text-[#c9a632] transition-colors duration-150 cursor-pointer'
                    )}
                  >
                    <Plus size={13} />
                    Cadastrar novo cliente
                  </button>
                )}
              </li>
            ) : (
              <>
                {filtered.map((client, idx) => (
                  <li
                    key={client.id}
                    role="option"
                    aria-selected={idx === activeIdx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => selectClient(client)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-100',
                      'border-l-2',
                      idx === activeIdx
                        ? 'bg-[#121f36] border-[#D4AF37]'
                        : 'bg-transparent border-transparent hover:bg-[#121f36]'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                        'bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-medium text-xs'
                      )}
                    >
                      {getInitials(client.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{client.name}</p>
                      <p className="font-mono text-[10px] text-[#718096]">
                        {client.cpfCnpj}
                        {client.email && (
                          <span className="ml-2 text-[#4A5568] font-sans">
                            {client.email}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Type badge */}
                    <span
                      className={cn(
                        'text-[10px] uppercase px-1.5 py-0.5 rounded font-medium shrink-0',
                        client.type === 'pf'
                          ? 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA]'
                          : 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]'
                      )}
                    >
                      {client.type}
                    </span>
                  </li>
                ))}

                {/* Create option at bottom */}
                {onCreate && (
                  <li className="border-t border-[rgba(192,192,192,0.08)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onCreate();
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-sm',
                        'text-[#D4AF37] hover:bg-[#121f36]',
                        'transition-colors duration-100 cursor-pointer'
                      )}
                    >
                      <Plus size={13} />
                      Cadastrar novo cliente
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
