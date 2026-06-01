// =============================================================================
// PDF Export Utility - AIOX Legal
// Generates professional PDF documents for processes, deadlines, petitions
// =============================================================================

import type {
  LegalProcess,
  Deadline,
  Petition,
  ProcessMovement,
  LegalTransaction,
  DeadlineStatus,
  DeadlineType,
  PetitionStatus,
  PetitionType,
} from '@/types/legal';

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function now(): string {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

const areaLabels: Record<string, string> = {
  civil: 'Cível',
  trabalhista: 'Trabalhista',
  tributario: 'Tributário',
  penal: 'Penal',
  administrativo: 'Administrativo',
  consumidor: 'Consumidor',
  familia: 'Família',
  empresarial: 'Empresarial',
  previdenciario: 'Previdenciário',
  ambiental: 'Ambiental',
  digital: 'Digital',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
  suspended: 'Suspenso',
  closed: 'Encerrado',
  won: 'Ganho',
  lost: 'Perdido',
  settled: 'Acordo',
};

const deadlineTypeLabels: Record<DeadlineType, string> = {
  fatal: 'Fatal',
  judicial: 'Judicial',
  internal: 'Interno',
  hearing: 'Audiência',
  mediation: 'Mediação',
};

const deadlineStatusLabels: Record<DeadlineStatus, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  missed: 'Perdido',
  extended: 'Prorrogado',
};

const petitionTypeLabels: Record<PetitionType, string> = {
  inicial: 'Inicial',
  contestacao: 'Contestação',
  recurso: 'Recurso',
  embargo: 'Embargo',
  agravo: 'Agravo',
  tutela: 'Tutela',
  mandado_seguranca: 'Mandado de Segurança',
  habeas_corpus: 'Habeas Corpus',
  parecer: 'Parecer',
  contrarrazoes: 'Contrarrazões',
  recurso_especial: 'Recurso Especial',
  recurso_extraordinario: 'Recurso Extraordinário',
  outro: 'Outro',
};

const petitionStatusLabels: Record<PetitionStatus, string> = {
  draft: 'Rascunho',
  review: 'Em Revisão',
  approved: 'Aprovada',
  filed: 'Protocolada',
  rejected: 'Rejeitada',
};

// ─── PDF Builder Helpers ───────────────────────────────────────────────────────

type JsPDFInstance = import('jspdf').jsPDF;

// Amber accent colour used throughout (AIOX brand)
const AMBER = [245, 158, 11] as [number, number, number];
const DARK_BG = [10, 15, 26] as [number, number, number]; // decorative only; PDF is light
const HEADER_BG = [30, 40, 55] as [number, number, number];
const TEXT_DARK = [20, 30, 45] as [number, number, number];
const TEXT_MUTED = [100, 116, 139] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

function buildHeader(doc: JsPDFInstance, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark header background
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Amber accent strip on the left
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, 5, 40, 'F');

  // AIOX Legal brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('AIOX Legal', 14, 16);

  // Subtitle/tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...AMBER);
  doc.text('Plataforma Jurídica Inteligente', 14, 24);

  // Document title (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(title, pageWidth - 14, 16, { align: 'right' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...AMBER);
    doc.text(subtitle, pageWidth - 14, 24, { align: 'right' });
  }

  // Thin separator line
  doc.setDrawColor(...AMBER);
  doc.setLineWidth(0.5);
  doc.line(0, 40, pageWidth, 40);

  return 50; // y after header
}

function buildFooter(doc: JsPDFInstance): void {
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Gerado em: ${now()}`, 14, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    doc.text('AIOX Legal — Confidencial', pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
}

function sectionTitle(doc: JsPDFInstance, text: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AMBER);
  doc.rect(14, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(text, 20, y + 5);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, y + 8, pageWidth - 14, y + 8);
  return y + 14;
}

function labelValue(
  doc: JsPDFInstance,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth = 80
): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  const lines = doc.splitTextToSize(value || '--', maxWidth);
  doc.text(lines, x, y + 5);
}

function checkPageBreak(doc: JsPDFInstance, currentY: number, needed = 20): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + needed > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return currentY;
}

// ─── Export Functions ──────────────────────────────────────────────────────────

/**
 * Export a single process with all details
 */
export async function exportProcessPDF(
  process: LegalProcess,
  options?: {
    clientName?: string;
    movements?: ProcessMovement[];
    deadlines?: Deadline[];
    petitions?: Petition[];
  }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = buildHeader(doc, 'Processo Judicial', `CNJ: ${process.cnj}`);

  // ── Process Details ──
  y = sectionTitle(doc, 'Informações do Processo', y);

  labelValue(doc, 'Título', process.title, 14, y, 180);
  y += 14;

  labelValue(doc, 'Número CNJ', process.cnj, 14, y, 80);
  labelValue(doc, 'Status', statusLabels[process.status] || process.status, 105, y, 80);
  y += 14;

  labelValue(doc, 'Área Jurídica', areaLabels[process.area] || process.area, 14, y, 80);
  labelValue(doc, 'Urgência', process.urgency === 'critical' ? 'Crítico' : process.urgency === 'high' ? 'Alto' : process.urgency === 'medium' ? 'Médio' : 'Baixo', 105, y, 80);
  y += 14;

  labelValue(doc, 'Objeto', process.object || '--', 14, y, 180);
  y += 14;

  // ── Tribunal ──
  y = checkPageBreak(doc, y, 40);
  y = sectionTitle(doc, 'Tribunal', y);

  labelValue(doc, 'Tribunal', process.court || '--', 14, y, 80);
  labelValue(doc, 'Vara', process.vara || '--', 105, y, 80);
  y += 14;

  labelValue(doc, 'Comarca', process.comarca || '--', 14, y, 80);
  labelValue(doc, 'Estado', process.state || '--', 105, y, 40);
  y += 14;

  labelValue(doc, 'Juiz', process.judge || '--', 14, y, 80);
  labelValue(doc, 'Sistema', process.courtSystem || '--', 105, y, 40);
  y += 14;

  // ── Partes ──
  y = checkPageBreak(doc, y, 40);
  y = sectionTitle(doc, 'Partes', y);

  labelValue(doc, 'Cliente', options?.clientName || process.clientId, 14, y, 80);
  labelValue(doc, 'Parte Contrária', process.opposingParty || '--', 105, y, 80);
  y += 14;

  labelValue(doc, 'Advogado Contrário', process.opposingLawyer || '--', 14, y, 80);
  y += 14;

  // ── Financeiro ──
  y = checkPageBreak(doc, y, 40);
  y = sectionTitle(doc, 'Financeiro', y);

  const causeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.causeValue / 100);
  const feeFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.feeAmount / 100);
  labelValue(doc, 'Valor da Causa', causeFormatted, 14, y, 80);
  labelValue(doc, 'Honorários', feeFormatted, 105, y, 80);
  y += 14;

  labelValue(doc, 'Tipo de Honorário', process.feeType || '--', 14, y, 80);
  if (process.contingencyPct) {
    labelValue(doc, 'Contingência', `${process.contingencyPct}%`, 105, y, 40);
  }
  y += 14;

  // ── Tags ──
  if (process.tags && process.tags.length > 0) {
    y = checkPageBreak(doc, y, 20);
    labelValue(doc, 'Tags', process.tags.join(', '), 14, y, 180);
    y += 14;
  }

  // ── Movimentações ──
  if (options?.movements && options.movements.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionTitle(doc, `Movimentações (${options.movements.length})`, y);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Data', 'Descrição', 'Fonte']],
      body: options.movements.map((m) => [
        formatDateBR(m.date),
        m.description,
        m.source,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: { 0: { cellWidth: 25 }, 2: { cellWidth: 22 } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Prazos ──
  if (options?.deadlines && options.deadlines.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionTitle(doc, `Prazos (${options.deadlines.length})`, y);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Título', 'Tipo', 'Vencimento', 'Status']],
      body: options.deadlines.map((d) => [
        d.title,
        deadlineTypeLabels[d.type] || d.type,
        formatDateBR(d.dueDate),
        deadlineStatusLabels[d.status] || d.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Peças ──
  if (options?.petitions && options.petitions.length > 0) {
    y = checkPageBreak(doc, y, 30);
    y = sectionTitle(doc, `Peças Processuais (${options.petitions.length})`, y);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Título', 'Tipo', 'Status', 'Criado em']],
      body: options.petitions.map((p) => [
        p.title,
        petitionTypeLabels[p.type] || p.type,
        petitionStatusLabels[p.status] || p.status,
        formatDateBR(p.createdAt),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });
  }

  buildFooter(doc);

  const filename = `processo_${process.cnj.replace(/[^0-9]/g, '')}_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Export process list as a summary table
 */
export async function exportProcessListPDF(
  processes: LegalProcess[],
  options?: { title?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  buildHeader(doc, options?.title || 'Lista de Processos', `${processes.length} processo(s)`);

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [['CNJ', 'Título', 'Área', 'Status', 'Urgência', 'Tribunal', 'Comarca/UF', 'Valor da Causa']],
    body: processes.map((p) => [
      p.cnj,
      p.title,
      areaLabels[p.area] || p.area,
      statusLabels[p.status] || p.status,
      p.urgency === 'critical' ? 'Crítico' : p.urgency === 'high' ? 'Alto' : p.urgency === 'medium' ? 'Médio' : 'Baixo',
      p.court || '--',
      `${p.comarca}/${p.state}`,
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.causeValue / 100),
    ]),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
      7: { cellWidth: 28 },
    },
  });

  buildFooter(doc);

  doc.save(`processos_${Date.now()}.pdf`);
}

/**
 * Export deadlines list
 */
export async function exportDeadlinesPDF(
  deadlines: Deadline[],
  options?: { processMap?: Record<string, string>; title?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  buildHeader(doc, options?.title || 'Agenda de Prazos', `${deadlines.length} prazo(s)`);

  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [['Título', 'Tipo', 'Processo', 'Vencimento', 'Status', 'Responsável']],
    body: sorted.map((d) => [
      d.title,
      deadlineTypeLabels[d.type] || d.type,
      options?.processMap?.[d.processId] || d.processId || '--',
      formatDateBR(d.dueDate),
      deadlineStatusLabels[d.status] || d.status,
      d.assignedTo || '--',
    ]),
    styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 28 },
      4: { cellWidth: 25 },
      5: { cellWidth: 28 },
    },
    didDrawCell: (data) => {
      // Color-code the status column
      if (data.section === 'body' && data.column.index === 4) {
        const val = String(data.cell.raw);
        if (val === deadlineStatusLabels.missed) {
          doc.setTextColor(239, 68, 68);
        } else if (val === deadlineStatusLabels.completed) {
          doc.setTextColor(34, 197, 94);
        } else if (val === deadlineStatusLabels.pending) {
          doc.setTextColor(234, 179, 8);
        }
      }
    },
  });

  buildFooter(doc);

  doc.save(`prazos_${Date.now()}.pdf`);
}

/**
 * Export a single petition document
 */
export async function exportPetitionPDF(
  petition: Petition,
  options?: { processInfo?: string; clientName?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = buildHeader(
    doc,
    petitionTypeLabels[petition.type] || petition.type,
    petitionStatusLabels[petition.status] || petition.status
  );

  // Metadata block
  y = sectionTitle(doc, 'Identificação', y);

  labelValue(doc, 'Título', petition.title, 14, y, 180);
  y += 14;

  labelValue(doc, 'Tipo', petitionTypeLabels[petition.type] || petition.type, 14, y, 80);
  labelValue(doc, 'Status', petitionStatusLabels[petition.status] || petition.status, 105, y, 80);
  y += 14;

  if (options?.processInfo) {
    labelValue(doc, 'Processo', options.processInfo, 14, y, 180);
    y += 14;
  }

  if (options?.clientName) {
    labelValue(doc, 'Cliente', options.clientName, 14, y, 80);
    y += 14;
  }

  labelValue(doc, 'Criado em', formatDateBR(petition.createdAt), 14, y, 80);

  if (petition.filedAt) {
    labelValue(doc, 'Protocolado em', formatDateBR(petition.filedAt), 105, y, 80);
  }
  y += 14;

  if (petition.protocolNumber) {
    labelValue(doc, 'Número de Protocolo', petition.protocolNumber, 14, y, 180);
    y += 14;
  }

  if (petition.courtSystem) {
    labelValue(doc, 'Sistema de Protocolo', petition.courtSystem, 14, y, 80);
    y += 14;
  }

  // Content
  if (petition.content && petition.content.trim()) {
    y = checkPageBreak(doc, y, 30);
    y = sectionTitle(doc, 'Conteúdo da Peça', y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);

    const contentLines = doc.splitTextToSize(petition.content, pageWidth - 28);
    for (const line of contentLines) {
      y = checkPageBreak(doc, y, 6);
      doc.text(line, 14, y);
      y += 5;
    }
  }

  buildFooter(doc);

  const safeTitle = petition.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  doc.save(`peticao_${safeTitle}_${Date.now()}.pdf`);
}

/**
 * Export petitions list as a table
 */
export async function exportPetitionListPDF(
  petitions: Petition[],
  options?: { processMap?: Record<string, string>; title?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  buildHeader(doc, options?.title || 'Peças Processuais', `${petitions.length} peça(s)`);

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [['Título', 'Tipo', 'Processo', 'Status', 'Criado em', 'Protocolado em', 'Protocolo']],
    body: petitions.map((p) => [
      p.title,
      petitionTypeLabels[p.type] || p.type,
      options?.processMap?.[p.processId] || p.processId || '--',
      petitionStatusLabels[p.status] || p.status,
      formatDateBR(p.createdAt),
      p.filedAt ? formatDateBR(p.filedAt) : '--',
      p.protocolNumber || '--',
    ]),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 28 },
      4: { cellWidth: 25 },
      5: { cellWidth: 28 },
      6: { cellWidth: 30 },
    },
  });

  buildFooter(doc);

  doc.save(`pecas_processuais_${Date.now()}.pdf`);
}

// ─── Financial Report ──────────────────────────────────────────────────────────

export interface FinancialReportData {
  transactions: LegalTransaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period?: string;
}

export async function exportFinancialReportPDF(data: FinancialReportData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = buildHeader(
    doc,
    'Relatório Financeiro',
    data.period || `Gerado em ${now()}`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Summary cards
  y = sectionTitle(doc, 'Resumo', y);

  const cardW = (pageWidth - 28 - 10) / 3;
  const cards = [
    { label: 'Receitas', value: data.totalIncome, color: [34, 197, 94] as [number, number, number] },
    { label: 'Despesas', value: data.totalExpense, color: [239, 68, 68] as [number, number, number] },
    { label: 'Saldo', value: data.balance, color: data.balance >= 0 ? [34, 197, 94] as [number, number, number] : [239, 68, 68] as [number, number, number] },
  ];

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 5);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
    doc.setFillColor(...card.color);
    doc.roundedRect(x, y, 3, 22, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(card.label.toUpperCase(), x + 7, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...card.color);
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value / 100);
    doc.text(formatted, x + 7, y + 18);
  });

  y += 30;

  // Transactions table
  y = sectionTitle(doc, `Transações (${data.transactions.length})`, y);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
    body: data.transactions.map((t) => [
      formatDateBR(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category.replace(/_/g, ' '),
      t.description,
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount / 100),
    ]),
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: HEADER_BG, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      4: { cellWidth: 28, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        doc.setTextColor(val === 'Receita' ? 34 : 239, val === 'Receita' ? 197 : 68, val === 'Receita' ? 94 : 68);
      }
    },
  });

  buildFooter(doc);

  doc.save(`relatorio_financeiro_${Date.now()}.pdf`);
}
