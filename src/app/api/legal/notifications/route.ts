import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  buildDeadlineAlertEmail,
  buildMovementAlertEmail,
  buildWeeklyDigestEmail,
  sendEmail,
  type DeadlineEmailItem,
  type MovementEmailItem,
  type WeeklyDigestSummary,
} from '@/lib/email-notifications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRecipientEmail(): string {
  return process.env.NOTIFICATION_EMAIL || '';
}

function daysUntilDue(dueDateIso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// GET — return notification preferences / status
// ---------------------------------------------------------------------------

export async function GET() {
  const recipientEmail = getRecipientEmail();

  return NextResponse.json({
    provider: process.env.RESEND_API_KEY
      ? 'resend'
      : process.env.SMTP_HOST
        ? 'smtp'
        : 'none',
    notificationEmail: recipientEmail || null,
    configured: Boolean(recipientEmail),
    actions: [
      'send-deadline-alerts',
      'send-movement-alerts',
      'weekly-digest',
    ],
  });
}

// ---------------------------------------------------------------------------
// POST — trigger notification actions
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body;
  if (!action) {
    return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
  }

  const recipientEmail = getRecipientEmail();
  if (!recipientEmail) {
    return NextResponse.json(
      { error: 'NOTIFICATION_EMAIL environment variable is not set.' },
      { status: 503 }
    );
  }

  // ─── send-deadline-alerts ───────────────────────────────────────────────
  if (action === 'send-deadline-alerts') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upcoming deadlines: overdue up to +7 days ahead, status pending
    const { data: rawDeadlines, error } = await supabase
      .from('deadlines')
      .select('*, processes(cnj, title)')
      .eq('status', 'pending')
      .lte('due_date', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rawDeadlines || rawDeadlines.length === 0) {
      return NextResponse.json({ message: 'No upcoming deadlines found. No email sent.' });
    }

    const deadlines: DeadlineEmailItem[] = rawDeadlines.map((d) => ({
      processTitle: (d.processes as { title?: string } | null)?.title ?? 'Processo desconhecido',
      processCnj: (d.processes as { cnj?: string } | null)?.cnj,
      deadlineTitle: d.title,
      type: d.type || '',
      dueDate: d.due_date,
      daysUntilDue: daysUntilDue(d.due_date),
    }));

    const template = buildDeadlineAlertEmail(deadlines, recipientEmail);
    const result = await sendEmail(template);

    return NextResponse.json({
      action,
      deadlinesFound: deadlines.length,
      emailSent: result.success,
      provider: result.provider,
      error: result.error,
    });
  }

  // ─── send-movement-alerts ───────────────────────────────────────────────
  if (action === 'send-movement-alerts') {
    const { data: rawMovements, error } = await supabase
      .from('movements')
      .select('*, processes(cnj, title)')
      .eq('is_read', false)
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rawMovements || rawMovements.length === 0) {
      return NextResponse.json({ message: 'No unread movements found. No email sent.' });
    }

    const movements: MovementEmailItem[] = rawMovements.map((m) => ({
      processTitle: (m.processes as { title?: string } | null)?.title ?? 'Processo desconhecido',
      processCnj: (m.processes as { cnj?: string } | null)?.cnj,
      description: m.description,
      type: m.type || '',
      date: m.date,
    }));

    const template = buildMovementAlertEmail(movements, recipientEmail);
    const result = await sendEmail(template);

    return NextResponse.json({
      action,
      movementsFound: movements.length,
      emailSent: result.success,
      provider: result.provider,
      error: result.error,
    });
  }

  // ─── weekly-digest ──────────────────────────────────────────────────────
  if (action === 'weekly-digest') {
    const today = new Date();
    const sevenDaysAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [deadlinesResult, movementsResult, financialResult] = await Promise.all([
      supabase
        .from('deadlines')
        .select('due_date, status')
        .eq('status', 'pending'),
      supabase
        .from('movements')
        .select('id, is_read')
        .eq('is_read', false),
      supabase
        .from('transactions')
        .select('type, amount')
        .order('date', { ascending: false })
        .limit(500),
    ]);

    const honorariosResult = await supabase
      .from('honorarios')
      .select('amount, installments, paid_installments, status');

    const deadlines = deadlinesResult.data || [];
    const movements = movementsResult.data || [];
    const transactions = financialResult.data || [];
    const honorarios = honorariosResult.data || [];

    const todayStr = today.toISOString();
    const sevenDaysAheadStr = sevenDaysAhead.toISOString();

    const summary: WeeklyDigestSummary = {
      deadlinesDueSoon: deadlines.filter(
        (d) => d.due_date >= todayStr && d.due_date <= sevenDaysAheadStr
      ).length,
      overdueDeadlines: deadlines.filter((d) => d.due_date < todayStr).length,
      newMovements: movements.length,
      totalRevenue: transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + (t.amount || 0), 0),
      totalExpenses: transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + (t.amount || 0), 0),
      outstandingHonorarios: honorarios
        .filter((h) => h.status === 'active')
        .reduce((s, h) => {
          const remaining = (h.installments || 1) - (h.paid_installments || 0);
          const perInstallment = (h.amount || 0) / (h.installments || 1);
          return s + remaining * perInstallment;
        }, 0),
      pendingTasks: deadlines.length,
    };

    const template = buildWeeklyDigestEmail(summary, recipientEmail);
    const result = await sendEmail(template);

    return NextResponse.json({
      action,
      summary,
      emailSent: result.success,
      provider: result.provider,
      error: result.error,
    });
  }

  // ─── unknown action ─────────────────────────────────────────────────────
  return NextResponse.json(
    {
      error: `Unknown action: "${action}". Valid actions: send-deadline-alerts, send-movement-alerts, weekly-digest`,
    },
    { status: 400 }
  );
}
