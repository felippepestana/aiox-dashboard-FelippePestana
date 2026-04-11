'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, DollarSign, Phone, Mail, MapPin } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getClientById, getProcessesByClient } = useLegalStore();
  const { getHonorariosByClient } = useLegalFinancialStore();

  const client = getClientById(id);
  const processes = client ? getProcessesByClient(id) : [];
  const honorarios = client ? getHonorariosByClient(id) : [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

  if (!client) {
    return (
      <div className="p-6">
        <Link href="/legal/clients" className="flex items-center gap-2 text-[#6b7a8d] hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
          <p className="text-[#6b7a8d]">Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  const totalHonorarios = honorarios.reduce((sum, h) => sum + h.amount, 0);
  const pendingHonorarios = honorarios
    .filter((h) => h.status === 'active')
    .reduce((sum, h) => {
      const remaining = h.installments - h.paidInstallments;
      return sum + (h.amount / h.installments) * remaining;
    }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/legal/clients" className="text-[#6b7a8d] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <User className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                client.type === 'pf' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
              }`}>
                {client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
              <span className="text-xs text-[#6b7a8d] font-mono">{client.cpfCnpj}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Processos</p>
          <p className="text-2xl font-bold text-white mt-1">{processes.length}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Honorários Contratados</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalHonorarios)}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">A Receber</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(pendingHonorarios)}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Contratos</p>
          <p className="text-2xl font-bold text-white mt-1">{honorarios.length}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Contato</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-[#8899aa]">
            <Phone className="h-4 w-4 text-[#4a5568]" />
            {client.phone || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8899aa]">
            <Mail className="h-4 w-4 text-[#4a5568]" />
            {client.email || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8899aa]">
            <MapPin className="h-4 w-4 text-[#4a5568]" />
            {client.address?.city ? `${client.address.city}/${client.address.state}` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Processes */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-amber-400" /> Processos ({processes.length})
          </h2>
        </div>
        {processes.length === 0 ? (
          <p className="text-xs text-[#4a5568]">Nenhum processo vinculado</p>
        ) : (
          <div className="space-y-2">
            {processes.map((p) => (
              <Link key={p.id} href={`/legal/processes/${p.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-transparent hover:border-[#1a2332] hover:bg-[#0a0f1a] transition-colors">
                <div>
                  <p className="text-sm text-white">{p.title}</p>
                  <p className="text-xs text-amber-400 font-mono">{p.cnj}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <h2 className="text-sm font-semibold text-white mb-2">Observações</h2>
          <p className="text-sm text-[#8899aa]">{client.notes}</p>
        </div>
      )}
    </div>
  );
}
