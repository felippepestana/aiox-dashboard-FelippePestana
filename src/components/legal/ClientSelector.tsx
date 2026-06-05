'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, X, Plus, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface Client {
  id: string;
  name: string;
  type: 'pf' | 'pj';
  cpfCnpj: string;
  email?: string;
}

export interface ClientSelectorProps {
  clients: Client[];
  value?: string;
  onChange: (clientId: string) => void;
  onCreate?: () => void;
  placeholder?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatCpfCnpj(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ClientSelector({
  clients,
  value,
  onChange,
  onCreate,
  placeholder = 'Buscar cliente...',
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === value),
    [clients, value]
  );

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const searchLower = search.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchLower) ||
        client.cpfCnpj.includes(search) ||
        client.email?.toLowerCase().includes(searchLower)
    );
  }, [clients, search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (clientId: string) => {
    onChange(clientId);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input / Selected display */}
      {selectedClient ? (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0a1628] border border-[rgba(192,192,192,0.15)] rounded-lg">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.15)] text-[#D4AF37] flex items-center justify-center text-xs font-medium">
            {getInitials(selectedClient.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{selectedClient.name}</p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase',
                  selectedClient.type === 'pf'
                    ? 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA]'
                    : 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]'
                )}
              >
                {selectedClient.type === 'pf' ? (
                  <User className="w-2.5 h-2.5" />
                ) : (
                  <Building2 className="w-2.5 h-2.5" />
                )}
                {selectedClient.type.toUpperCase()}
              </span>
              <span className="text-[10px] text-[#718096] font-mono">
                {formatCpfCnpj(selectedClient.cpfCnpj)}
              </span>
            </div>
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-[rgba(192,192,192,0.08)] transition-colors"
          >
            <X className="w-4 h-4 text-[#718096]" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2.5 bg-[#0a1628] border border-[rgba(192,192,192,0.15)] rounded-lg cursor-text hover:border-[rgba(192,192,192,0.25)] transition-colors"
        >
          <Search className="w-4 h-4 text-[#4A5568]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#4A5568] outline-none"
          />
        </div>
      )}

      {/* Dropdown */}
      {open && !selectedClient && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#0d1f3c] border border-[rgba(192,192,192,0.15)] rounded-lg shadow-lg overflow-hidden">
          <Command className="bg-transparent" shouldFilter={false}>
            <Command.List className="max-h-[240px] overflow-y-auto scrollbar-refined">
              {filteredClients.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[#718096] mb-3">Nenhum cliente encontrado</p>
                  {onCreate && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        onCreate();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#D4AF37] border border-[#D4AF37] rounded hover:bg-[rgba(212,175,55,0.08)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar novo
                    </button>
                  )}
                </div>
              ) : (
                filteredClients.map((client) => (
                  <Command.Item
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client.id)}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#121f36] transition-colors data-[selected=true]:bg-[#121f36]"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.15)] text-[#D4AF37] flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {getInitials(client.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{client.name}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase',
                            client.type === 'pf'
                              ? 'bg-[rgba(96,165,250,0.12)] text-[#60A5FA]'
                              : 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]'
                          )}
                        >
                          {client.type === 'pf' ? (
                            <User className="w-2.5 h-2.5" />
                          ) : (
                            <Building2 className="w-2.5 h-2.5" />
                          )}
                          {client.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[#718096] font-mono">
                          {formatCpfCnpj(client.cpfCnpj)}
                        </span>
                      </div>
                      {client.email && (
                        <p className="text-xs text-[#4A5568] truncate mt-0.5">
                          {client.email}
                        </p>
                      )}
                    </div>
                  </Command.Item>
                ))
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
