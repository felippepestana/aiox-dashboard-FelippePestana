'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Phone,
  Building2,
  User,
  Briefcase,
  Mail,
  X,
  Save,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { ClientType, Address } from '@/types/legal';
import {
  PageHeader,
  StatCardGrid,
  FilterBar,
  EmptyState,
} from '@/components/legal/shared';
import type { FilterValues } from '@/components/legal/shared';

const EMPTY_ADDRESS: Address = { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' };

export default function ClientsPage() {
  const { clients, processes, addClient } = useLegalStore();

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    type: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'pf' as ClientType,
    name: '',
    cpfCnpj: '',
    email: '',
    phone: '',
    whatsapp: '',
    notes: '',
    leadSource: '',
    address: { ...EMPTY_ADDRESS },
  });

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filterValues.type && c.type !== filterValues.type) return false;
      if (filterValues.search) {
        const q = filterValues.search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !(c.cpfCnpj || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [clients, filterValues]);

  function getProcessCount(clientId: string): number {
    return processes.filter((p) => p.clientId === clientId).length;
  }

  const pfCount = useMemo(() => clients.filter((c) => c.type === 'pf').length, [clients]);
  const pjCount = useMemo(() => clients.filter((c) => c.type === 'pj').length, [clients]);
  const withActiveProcesses = useMemo(() => {
    const activeClientIds = new Set(
      processes.filter((p) => p.status === 'active').map((p) => p.clientId)
    );
    return clients.filter((c) => activeClientIds.has(c.id)).length;
  }, [clients, processes]);

  function formatCpfCnpj(value: string): string {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (digits.length === 14) {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      );
    }
    return value;
  }

  function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    addClient({
      type: form.type,
      name: form.name.trim(),
      cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      notes: form.notes.trim(),
      leadSource: form.leadSource,
      address: form.address,
    });
    setForm({
      type: 'pf',
      name: '',
      cpfCnpj: '',
      email: '',
      phone: '',
      whatsapp: '',
      notes: '',
      leadSource: '',
      address: { ...EMPTY_ADDRESS },
    });
    setSaving(false);
    setShowForm(false);
  }

  const inputClass = 'w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none';
  const labelClass = 'block text-xs font-medium text-[#6b7a8d] mb-1';

  const filterConfigs = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: 'Buscar por nome ou CPF/CNPJ...',
    },
    {
      type: 'select' as const,
      key: 'type',
      label: 'Todos os Tipos',
      options: [
        { value: 'pf', label: 'Pessoa Física' },
        { value: 'pj', label: 'Pessoa Jurídica' },
      ],
    },
  ];

  const statCards = [
    {
      label: 'Total Clientes',
      value: clients.length,
      icon: <Users className="h-5 w-5" />,
      color: '#D4AF37',
    },
    {
      label: 'Pessoa Física',
      value: pfCount,
      icon: <User className="h-5 w-5" />,
      color: '#60A5FA',
    },
    {
      label: 'Pessoa Jurídica',
      value: pjCount,
      icon: <Building2 className="h-5 w-5" />,
      color: '#A78BFA',
    },
    {
      label: 'Com Processos Ativos',
      value: withActiveProcesses,
      icon: <Briefcase className="h-5 w-5" />,
      color: '#34D399',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Clientes', href: '/legal/clients' },
        ]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </button>
        }
      />

      <StatCardGrid cards={statCards} />

      {/* New Client Form */}
      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Novo Cliente</h2>
            <button onClick={() => setShowForm(false)} className="text-[#6b7a8d] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, type: 'pf' }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    form.type === 'pf'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> PF
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, type: 'pj' }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    form.type === 'pj'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" /> PJ
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Nome {form.type === 'pj' ? '/ Razão Social' : 'Completo'} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={form.type === 'pf' ? 'Maria Silva Santos' : 'Empresa XYZ Ltda'}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{form.type === 'pf' ? 'CPF' : 'CNPJ'}</label>
              <input
                type="text"
                value={form.cpfCnpj}
                onChange={(e) => setForm(f => ({ ...f, cpfCnpj: e.target.value }))}
                placeholder={form.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas sobre o cliente..."
                rows={2}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1a2332]">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      <FilterBar
        filters={filterConfigs}
        values={filterValues}
        onFilterChange={(key, value) =>
          setFilterValues((prev) => ({ ...prev, [key]: value }))
        }
        onClear={() => setFilterValues({ search: '', type: '' })}
      />

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Nenhum cliente encontrado"
          description="Cadastre o primeiro cliente para começar."
          action={{ label: 'Cadastrar Cliente', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const processCount = getProcessCount(client.id);
            return (
              <Link
                key={client.id}
                href={`/legal/clients/${client.id}`}
                className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                      {client.type === 'pf' ? (
                        <User className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Building2 className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{client.name}</h3>
                      <p className="text-xs text-[#6b7a8d]">
                        {formatCpfCnpj(client.cpfCnpj || '')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      client.type === 'pf'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}
                  >
                    {client.type === 'pf' ? 'PF' : 'PJ'}
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-[#6b7a8d]">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>
                      {processCount} {processCount === 1 ? 'processo' : 'processos'}
                    </span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-[#6b7a8d]">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.whatsapp && (
                    <div className="flex items-center gap-2 text-xs text-[#6b7a8d]">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{client.whatsapp}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-[#6b7a8d]">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
