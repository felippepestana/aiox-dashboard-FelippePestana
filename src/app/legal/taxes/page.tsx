'use client';

import { Building2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';

export default function TaxesPage() {
  const { taxObligations, payTaxObligation, getPendingTaxObligations } = useLegalFinancialStore();

  const pending = getPendingTaxObligations();

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

  const taxLabels: Record<string, string> = {
    irpj: 'IRPJ',
    csll: 'CSLL',
    iss: 'ISS',
    pis_cofins: 'PIS/COFINS',
  };

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    pending: { color: 'text-yellow-400', icon: Clock, label: 'Pendente' },
    paid: { color: 'text-green-400', icon: CheckCircle2, label: 'Pago' },
    overdue: { color: 'text-red-400', icon: AlertCircle, label: 'Vencido' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Obrigações Tributárias</h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Controle de impostos do escritório (IRPJ, CSLL, ISS, PIS/COFINS)</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Building2 className="h-5 w-5 text-amber-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Object.entries(taxLabels).map(([key, label]) => {
          const total = taxObligations
            .filter((t) => t.type === key && t.status === 'pending')
            .reduce((sum, t) => sum + t.amount, 0);
          return (
            <div key={key} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{label} Pendente</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Alert */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            Você tem <strong>{pending.length}</strong> obrigação(ões) tributária(s) pendente(s)
          </p>
        </div>
      )}

      {/* Tax Obligations List */}
      {taxObligations.length === 0 ? (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
          <Building2 className="h-12 w-12 text-[#2a3342] mx-auto mb-4" />
          <p className="text-[#6b7a8d]">Nenhuma obrigação tributária cadastrada</p>
          <p className="text-xs text-[#4a5568] mt-1">As obrigações serão geradas automaticamente com o fechamento mensal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxObligations
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((tax) => {
              const config = statusConfig[tax.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div key={tax.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                            {taxLabels[tax.type]}
                          </span>
                          <span className="text-sm text-white">{tax.period}</span>
                        </div>
                        <p className="text-xs text-[#6b7a8d] mt-1">
                          Vencimento: {tax.dueDate.split('T')[0]}
                          {tax.paidAt && ` | Pago em: ${tax.paidAt.split('T')[0]}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-white">{formatCurrency(tax.amount)}</p>
                      {tax.status === 'pending' && (
                        <button
                          onClick={() => payTaxObligation(tax.id)}
                          className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          Registrar Pagamento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
