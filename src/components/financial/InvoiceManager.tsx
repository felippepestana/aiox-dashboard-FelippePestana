'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Phone,
  Mail,
  X,
  DollarSign,
  Send,
  Filter,
} from 'lucide-react';

type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  patient: string;
  patientPhone: string;
  patientEmail: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  paymentDate?: string;
  paymentMethod?: string;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'FAT-2025-001',
    patient: 'Maria Silva',
    patientPhone: '(11) 99876-5432',
    patientEmail: 'maria.silva@email.com',
    date: '2025-06-01',
    dueDate: '2025-06-15',
    items: [
      { description: 'Limpeza Profilatica', quantity: 1, unitPrice: 250 },
      { description: 'Restauracao Classe II', quantity: 2, unitPrice: 380 },
      { description: 'Radiografia Panoramica', quantity: 1, unitPrice: 150 },
    ],
    status: 'paid',
    paymentDate: '2025-06-10',
    paymentMethod: 'Cartao de Credito',
  },
  {
    id: '2',
    number: 'FAT-2025-002',
    patient: 'Joao Santos',
    patientPhone: '(11) 98765-4321',
    patientEmail: 'joao.santos@email.com',
    date: '2025-06-05',
    dueDate: '2025-06-20',
    items: [
      { description: 'Consulta de Avaliacao', quantity: 1, unitPrice: 200 },
      { description: 'Tratamento de Canal', quantity: 1, unitPrice: 1200 },
      { description: 'Coroa em Porcelana', quantity: 1, unitPrice: 1800 },
    ],
    status: 'pending',
  },
  {
    id: '3',
    number: 'FAT-2025-003',
    patient: 'Ana Oliveira',
    patientPhone: '(11) 97654-3210',
    patientEmail: 'ana.oliveira@email.com',
    date: '2025-05-10',
    dueDate: '2025-05-25',
    items: [
      { description: 'Clareamento Dental', quantity: 1, unitPrice: 1500 },
      { description: 'Moldagem para Placa', quantity: 1, unitPrice: 350 },
    ],
    status: 'overdue',
  },
  {
    id: '4',
    number: 'FAT-2025-004',
    patient: 'Carlos Ferreira',
    patientPhone: '(11) 96543-2109',
    patientEmail: 'carlos.f@email.com',
    date: '2025-06-08',
    dueDate: '2025-06-22',
    items: [
      { description: 'Extracao Simples', quantity: 1, unitPrice: 300 },
      { description: 'Anestesia', quantity: 1, unitPrice: 50 },
    ],
    status: 'cancelled',
  },
  {
    id: '5',
    number: 'FAT-2025-005',
    patient: 'Lucia Mendes',
    patientPhone: '(11) 95432-1098',
    patientEmail: 'lucia.mendes@email.com',
    date: '2025-06-12',
    dueDate: '2025-06-26',
    items: [
      { description: 'Implante Dentario', quantity: 2, unitPrice: 3500 },
      { description: 'Enxerto Osseo', quantity: 1, unitPrice: 1200 },
      { description: 'Consulta Pre-Cirurgica', quantity: 1, unitPrice: 200 },
    ],
    status: 'pending',
  },
  {
    id: '6',
    number: 'FAT-2025-006',
    patient: 'Roberto Almeida',
    patientPhone: '(11) 94321-0987',
    patientEmail: 'roberto.a@email.com',
    date: '2025-05-20',
    dueDate: '2025-06-05',
    items: [
      { description: 'Aparelho Ortodontico', quantity: 1, unitPrice: 4500 },
      { description: 'Manutencao Mensal', quantity: 1, unitPrice: 250 },
    ],
    status: 'overdue',
  },
];

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> },
  paid: { label: 'Pago', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4" /> },
  overdue: { label: 'Vencido', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'text-gray-500', bg: 'bg-gray-100', icon: <XCircle className="w-4 h-4" /> },
};

type View = 'list' | 'detail' | 'create' | 'print';

export default function InvoiceManager() {
  const [view, setView] = useState<View>('list');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [newPatient, setNewPatient] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      inv.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTotal = (items: InvoiceItem[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const overdueCount = mockInvoices.filter((i) => i.status === 'overdue').length;

  const handleOpenDetail = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setView('detail');
  };

  const handlePrint = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setView('print');
  };

  const handleCreateSubmit = () => {
    setView('list');
    setNewPatient('');
    setNewPatientPhone('');
    setNewPatientEmail('');
    setNewDueDate('');
    setNewItems([{ description: '', quantity: 1, unitPrice: 0 }]);
  };

  const addLineItem = () => {
    setNewItems([...newItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...newItems];
    if (field === 'description') {
      updated[index].description = value as string;
    } else {
      updated[index][field] = Number(value);
    }
    setNewItems(updated);
  };

  // Print View
  if (view === 'print' && selectedInvoice) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => setView('list')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-0">
          {/* Clinic Header */}
          <div className="border-b-2 border-[#0D9488] pb-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0D9488]">Sbarzi Odontologia e Saude</h1>
                <p className="text-sm text-gray-500 mt-1">CNPJ: 12.345.678/0001-99</p>
                <p className="text-sm text-gray-500">Rua da Saude, 123 - Sao Paulo, SP</p>
                <p className="text-sm text-gray-500">Tel: (11) 3456-7890</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">{selectedInvoice.number}</p>
                <p className="text-sm text-gray-500">Emissao: {new Date(selectedInvoice.date).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-gray-500">Vencimento: {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Paciente</h3>
            <p className="text-sm text-gray-800 font-medium">{selectedInvoice.patient}</p>
            <p className="text-sm text-gray-500">{selectedInvoice.patientPhone}</p>
            <p className="text-sm text-gray-500">{selectedInvoice.patientEmail}</p>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 py-3">Descricao</th>
                <th className="text-center text-xs font-semibold text-gray-500 py-3">Qtd</th>
                <th className="text-right text-xs font-semibold text-gray-500 py-3">Valor Unit.</th>
                <th className="text-right text-xs font-semibold text-gray-500 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-800">{item.description}</td>
                  <td className="py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{formatBRL(item.unitPrice)}</td>
                  <td className="py-3 text-sm font-medium text-gray-800 text-right">
                    {formatBRL(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-t-2 border-[#0D9488]">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-base font-bold text-[#0D9488]">
                  {formatBRL(getTotal(selectedInvoice.items))}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {selectedInvoice.status === 'paid' && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">
                  Pago em {selectedInvoice.paymentDate ? new Date(selectedInvoice.paymentDate).toLocaleDateString('pt-BR') : '—'} via {selectedInvoice.paymentMethod}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Sbarzi Odontologia e Saude - Documento gerado eletronicamente
            </p>
          </div>

          {/* Print button */}
          <div className="mt-6 flex justify-center print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (view === 'detail' && selectedInvoice) {
    const total = getTotal(selectedInvoice.items);
    const cfg = statusConfig[selectedInvoice.status];
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => setView('list')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para lista
        </button>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedInvoice.number}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Emitida em {new Date(selectedInvoice.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <button
                  onClick={() => handlePrint(selectedInvoice)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Patient */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados do Paciente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-[#0D9488]" /> {selectedInvoice.patient}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-[#0D9488]" /> {selectedInvoice.patientPhone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-[#0D9488]" /> {selectedInvoice.patientEmail}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Itens da Fatura</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 py-2">Procedimento</th>
                  <th className="text-center text-xs font-semibold text-gray-500 py-2">Qtd</th>
                  <th className="text-right text-xs font-semibold text-gray-500 py-2">Unit.</th>
                  <th className="text-right text-xs font-semibold text-gray-500 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2.5 text-sm text-gray-800">{item.description}</td>
                    <td className="py-2.5 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="py-2.5 text-sm text-gray-600 text-right">{formatBRL(item.unitPrice)}</td>
                    <td className="py-2.5 text-sm font-medium text-gray-800 text-right">
                      {formatBRL(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
              <div className="text-right">
                <span className="text-sm text-gray-500 mr-4">Total:</span>
                <span className="text-xl font-bold text-[#0D9488]">{formatBRL(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment tracking */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pagamento</h3>
            {selectedInvoice.status === 'paid' ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Pagamento recebido em {selectedInvoice.paymentDate ? new Date(selectedInvoice.paymentDate).toLocaleDateString('pt-BR') : '—'}
                  </p>
                  <p className="text-xs text-emerald-600">Metodo: {selectedInvoice.paymentMethod}</p>
                </div>
              </div>
            ) : selectedInvoice.status === 'overdue' ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Fatura vencida desde {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-red-600">Entre em contato com o paciente para regularizar</p>
                </div>
              </div>
            ) : selectedInvoice.status === 'cancelled' ? (
              <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
                <p className="text-sm text-gray-600">Fatura cancelada</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Aguardando pagamento ate {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white rounded-md text-xs font-medium hover:bg-[#0D9488]/90 transition-colors">
                    <DollarSign className="w-3.5 h-3.5" /> Registrar Pagamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create View
  if (view === 'create') {
    const newTotal = newItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => setView('list')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Criar Nova Fatura</h2>

          {/* Patient Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados do Paciente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Paciente</label>
                <input
                  type="text"
                  value={newPatient}
                  onChange={(e) => setNewPatient(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                <input
                  type="text"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Procedimentos</h3>
            <div className="space-y-3">
              {newItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    placeholder="Descricao do procedimento"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                    min={1}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                    placeholder="Valor"
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLineItem}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0D9488] border border-dashed border-[#0D9488] rounded-lg hover:bg-[#0D9488]/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Item
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-6 pt-4 border-t border-gray-200">
            <div className="text-right">
              <span className="text-sm text-gray-500 mr-4">Total:</span>
              <span className="text-2xl font-bold text-[#0D9488]">{formatBRL(newTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
            >
              <Send className="w-4 h-4" /> Criar Fatura
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestao de Faturas</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Fatura
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {overdueCount} fatura{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600">Entre em contato com os pacientes para regularizar</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por paciente ou numero..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-[#0D9488] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          {(Object.keys(statusConfig) as InvoiceStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[#0D9488] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Fatura</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Paciente</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4 hidden sm:table-cell">Data</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4 hidden md:table-cell">Vencimento</th>
              <th className="text-right text-xs font-semibold text-gray-500 py-3 px-4">Valor</th>
              <th className="text-center text-xs font-semibold text-gray-500 py-3 px-4">Status</th>
              <th className="text-center text-xs font-semibold text-gray-500 py-3 px-4">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => {
              const cfg = statusConfig[inv.status];
              const total = getTotal(inv.items);
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-800">{inv.number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700">{inv.patient}</span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{new Date(inv.date).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-gray-800">{formatBRL(total)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenDetail(inv)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#0D9488] hover:bg-[#0D9488]/5 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(inv)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#0D9488] hover:bg-[#0D9488]/5 transition-colors"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma fatura encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
