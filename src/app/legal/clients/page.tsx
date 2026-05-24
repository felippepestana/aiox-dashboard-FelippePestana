'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
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

const EMPTY_ADDRESS: Address = { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' };

export default function ClientsPage() {
  const { clients, processes, addClient } = useLegalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ClientType | ''>('');
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
      if (filterType && c.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !(c.cpfCnpj || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [clients, filterType, searchQuery]);

  function getProcessCount(clientId: string): number {
    return processes.filter((p) => p.clientId === clientId).length;
  }

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

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-400" />
            Clientes
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {clients.length} clientes cadastrados
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

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

      {/* Filters */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterType === ''
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('pf')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterType === 'pf'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Pessoa Fisica
          </button>
          <button
            onClick={() => setFilterType('pj')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterType === 'pj'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Pessoa Juridica
          </button>
        </div>
      </div>

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Users className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhum cliente encontrado</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
          >
            <Plus className="h-4 w-4" />
            Cadastrar primeiro cliente
          </button>
        </div>
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
