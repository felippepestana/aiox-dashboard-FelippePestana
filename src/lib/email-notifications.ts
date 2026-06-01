// =============================================================================
// Email Notification System — AIOX Legal Dashboard
// Provider-agnostic: Resend (preferred) or SMTP fallback
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
  to: string;
  from: string;
}

export interface DeadlineEmailItem {
  processTitle: string;
  processCnj?: string;
  deadlineTitle: string;
  type: string;
  dueDate: string; // ISO date string
  daysUntilDue: number;
}

export interface MovementEmailItem {
  processTitle: string;
  processCnj?: string;
  description: string;
  type: string;
  date: string; // ISO date string
}

export interface WeeklyDigestSummary {
  deadlinesDueSoon: number;
  overdueDeadlines: number;
  newMovements: number;
  totalRevenue: number;
  totalExpenses: number;
  outstandingHonorarios: number;
  pendingTasks: number;
}

// ---------------------------------------------------------------------------
// Branding helpers
// ---------------------------------------------------------------------------

const FROM_ADDRESS = process.env.NOTIFICATION_EMAIL || 'noreply@aiox.legal';

function getUrgencyColor(daysUntilDue: number): string {
  if (daysUntilDue < 0) return '#dc2626'; // red — overdue
  if (daysUntilDue <= 1) return '#ea580c'; // orange — critical
  if (daysUntilDue <= 3) return '#d97706'; // amber — urgent
  return '#2563eb'; // blue — upcoming
}

function getUrgencyLabel(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `Vencido (${Math.abs(daysUntilDue)} dias)`;
  if (daysUntilDue === 0) return 'Vence hoje';
  if (daysUntilDue === 1) return 'Vence amanhã';
  return `${daysUntilDue} dias restantes`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------------------------------------------------------------------------
// Shared HTML components
// ---------------------------------------------------------------------------

function htmlHeader(title: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <tr>
        <td style="background:#1e3a5f;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">AIOX Legal</span>
                <br/>
                <span style="color:#93c5fd;font-size:13px;">Sistema de Gestão Jurídica</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Body -->
      <tr><td style="padding:32px;">
`;
}

function htmlFooter(): string {
  const year = new Date().getFullYear();
  return `
      </td></tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            AIOX Legal Dashboard &mdash; ${year}<br/>
            Este é um email automático. Não responda a este endereço.<br/>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color:#2563eb;">Acessar o Dashboard</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// buildDeadlineAlertEmail
// ---------------------------------------------------------------------------

export function buildDeadlineAlertEmail(
  deadlines: DeadlineEmailItem[],
  recipientEmail: string
): EmailTemplate {
  const count = deadlines.length;
  const subject = `AIOX Legal — ${count} prazo${count !== 1 ? 's' : ''} vence${count !== 1 ? 'm' : ''} em breve`;

  // HTML body
  const rows = deadlines
    .map(
      (d) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;">
          <strong style="color:#1e293b;">${d.processTitle}</strong>
          ${d.processCnj ? `<br/><span style="color:#64748b;font-size:11px;">${d.processCnj}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">${d.deadlineTitle}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${d.type}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;">${formatDate(d.dueDate)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">
          <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;color:#ffffff;background:${getUrgencyColor(d.daysUntilDue)};">
            ${getUrgencyLabel(d.daysUntilDue)}
          </span>
        </td>
      </tr>`
    )
    .join('');

  const htmlBody = `
${htmlHeader(subject)}
<h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Alerta de Prazos</h2>
<p style="margin:0 0 24px;color:#64748b;font-size:14px;">
  Você tem <strong>${count} prazo${count !== 1 ? 's' : ''}</strong> que vence${count !== 1 ? 'm' : ''} em breve. Revise e tome as ações necessárias.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <thead>
    <tr style="background:#f8fafc;">
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Processo</th>
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Prazo</th>
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Tipo</th>
      <th style="padding:10px 8px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Vencimento</th>
      <th style="padding:10px 8px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Urgência</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
<div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:6px;border-left:4px solid #d97706;">
  <p style="margin:0;font-size:13px;color:#92400e;">
    <strong>Atenção:</strong> Prazos processuais têm consequências irreversíveis. Confirme as datas no sistema oficial antes de tomar qualquer ação.
  </p>
</div>
${htmlFooter()}
`;

  // Plain-text body
  const textRows = deadlines
    .map(
      (d, i) =>
        `${i + 1}. ${d.processTitle} | ${d.deadlineTitle} | ${d.type} | Vence: ${formatDate(d.dueDate)} | ${getUrgencyLabel(d.daysUntilDue)}`
    )
    .join('\n');

  const textBody = `
AIOX Legal — Alerta de Prazos

Você tem ${count} prazo(s) que vence(m) em breve:

${textRows}

Acesse o dashboard para mais detalhes: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

---
AIOX Legal Dashboard — Email automático.
`.trim();

  return { subject, htmlBody, textBody, to: recipientEmail, from: FROM_ADDRESS };
}

// ---------------------------------------------------------------------------
// buildMovementAlertEmail
// ---------------------------------------------------------------------------

export function buildMovementAlertEmail(
  movements: MovementEmailItem[],
  recipientEmail: string
): EmailTemplate {
  const count = movements.length;
  const subject = `AIOX Legal — ${count} nova${count !== 1 ? 's' : ''} movimentaç${count !== 1 ? 'ões' : 'ão'} processual${count !== 1 ? 'is' : ''}`;

  const rows = movements
    .map(
      (m) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;">
          <strong style="color:#1e293b;">${m.processTitle}</strong>
          ${m.processCnj ? `<br/><span style="color:#64748b;font-size:11px;">${m.processCnj}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${m.type || '—'}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">${m.description}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${formatDate(m.date)}</td>
      </tr>`
    )
    .join('');

  const htmlBody = `
${htmlHeader(subject)}
<h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Novas Movimentações Processuais</h2>
<p style="margin:0 0 24px;color:#64748b;font-size:14px;">
  Foram detectadas <strong>${count} nova${count !== 1 ? 's' : ''} movimentaç${count !== 1 ? 'ões' : 'ão'}</strong> em seus processos.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
  <thead>
    <tr style="background:#f8fafc;">
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Processo</th>
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Tipo</th>
      <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Descrição</th>
      <th style="padding:10px 8px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Data</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
${htmlFooter()}
`;

  const textRows = movements
    .map(
      (m, i) =>
        `${i + 1}. ${m.processTitle} | ${m.type || 'Sem tipo'} | ${m.description} | ${formatDate(m.date)}`
    )
    .join('\n');

  const textBody = `
AIOX Legal — Novas Movimentações Processuais

Foram detectadas ${count} nova(s) movimentação(ões) em seus processos:

${textRows}

Acesse o dashboard para mais detalhes: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

---
AIOX Legal Dashboard — Email automático.
`.trim();

  return { subject, htmlBody, textBody, to: recipientEmail, from: FROM_ADDRESS };
}

// ---------------------------------------------------------------------------
// buildWeeklyDigestEmail
// ---------------------------------------------------------------------------

export function buildWeeklyDigestEmail(
  summary: WeeklyDigestSummary,
  recipientEmail: string
): EmailTemplate {
  const subject = 'AIOX Legal — Resumo Semanal';

  const statCard = (label: string, value: string, color: string) => `
    <td style="padding:16px;text-align:center;border-right:1px solid #e2e8f0;">
      <div style="font-size:24px;font-weight:bold;color:${color};">${value}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">${label}</div>
    </td>`;

  const htmlBody = `
${htmlHeader(subject)}
<h2 style="margin:0 0 8px;font-size:20px;color:#1e293b;">Resumo Semanal</h2>
<p style="margin:0 0 24px;color:#64748b;font-size:14px;">
  Confira o resumo das atividades da semana no AIOX Legal Dashboard.
</p>

<!-- Stats grid -->
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;border-collapse:collapse;margin-bottom:24px;">
  <tr>
    ${statCard('Prazos Próximos', String(summary.deadlinesDueSoon), '#2563eb')}
    ${statCard('Prazos Vencidos', String(summary.overdueDeadlines), summary.overdueDeadlines > 0 ? '#dc2626' : '#16a34a')}
    ${statCard('Novas Movimentações', String(summary.newMovements), '#7c3aed')}
    ${statCard('Tarefas Pendentes', String(summary.pendingTasks), '#d97706')}
  </tr>
</table>

<!-- Financial summary -->
<h3 style="margin:0 0 12px;font-size:15px;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Resumo Financeiro</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">Receitas</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#16a34a;text-align:right;font-weight:600;">${formatCurrency(summary.totalRevenue)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">Despesas</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#dc2626;text-align:right;font-weight:600;">${formatCurrency(summary.totalExpenses)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">Resultado</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:${summary.totalRevenue - summary.totalExpenses >= 0 ? '#16a34a' : '#dc2626'};text-align:right;font-weight:700;">${formatCurrency(summary.totalRevenue - summary.totalExpenses)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;font-size:13px;color:#64748b;">Honorários a Receber</td>
    <td style="padding:10px 0;font-size:13px;color:#2563eb;text-align:right;font-weight:600;">${formatCurrency(summary.outstandingHonorarios)}</td>
  </tr>
</table>

<div style="text-align:center;">
  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display:inline-block;padding:12px 28px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
    Acessar Dashboard Completo
  </a>
</div>
${htmlFooter()}
`;

  const textBody = `
AIOX Legal — Resumo Semanal

PRAZOS & ATIVIDADES
- Prazos próximos: ${summary.deadlinesDueSoon}
- Prazos vencidos: ${summary.overdueDeadlines}
- Novas movimentações: ${summary.newMovements}
- Tarefas pendentes: ${summary.pendingTasks}

FINANCEIRO
- Receitas: ${formatCurrency(summary.totalRevenue)}
- Despesas: ${formatCurrency(summary.totalExpenses)}
- Resultado: ${formatCurrency(summary.totalRevenue - summary.totalExpenses)}
- Honorários a Receber: ${formatCurrency(summary.outstandingHonorarios)}

Acesse o dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

---
AIOX Legal Dashboard — Email automático.
`.trim();

  return { subject, htmlBody, textBody, to: recipientEmail, from: FROM_ADDRESS };
}

// ---------------------------------------------------------------------------
// sendEmail — provider-agnostic dispatcher
// ---------------------------------------------------------------------------

export interface SendEmailResult {
  success: boolean;
  provider?: string;
  error?: string;
}

export async function sendEmail(template: EmailTemplate): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  // --- Resend (preferred) ---
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: template.from,
          to: [template.to],
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[email-notifications] Resend error:', response.status, errorBody);
        return { success: false, provider: 'resend', error: `HTTP ${response.status}: ${errorBody}` };
      }

      return { success: true, provider: 'resend' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[email-notifications] Resend exception:', message);
      return { success: false, provider: 'resend', error: message };
    }
  }

  // --- SMTP fallback (via a simple POST to a self-hosted or third-party relay) ---
  if (smtpHost) {
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    try {
      // Build a minimal RFC-2822 payload for a generic SMTP relay HTTP endpoint
      // (e.g. MailHog, SendGrid SMTP relay, Mailgun SMTP bridge)
      const smtpEndpoint = `http://${smtpHost}:${smtpPort}/send`;
      const response = await fetch(smtpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: template.from,
          to: template.to,
          subject: template.subject,
          html: template.htmlBody,
          text: template.textBody,
          auth: { user: smtpUser, pass: smtpPass },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return { success: false, provider: 'smtp', error: `HTTP ${response.status}: ${errorBody}` };
      }

      return { success: true, provider: 'smtp' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[email-notifications] SMTP exception:', message);
      return { success: false, provider: 'smtp', error: message };
    }
  }

  // --- No provider configured ---
  console.warn(
    '[email-notifications] No email provider configured. ' +
      'Set RESEND_API_KEY or SMTP_HOST to enable email sending.'
  );
  return {
    success: false,
    error: 'No email provider configured. Set RESEND_API_KEY or SMTP_HOST environment variables.',
  };
}
