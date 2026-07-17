// =============================================================================
// Cron Job — Daily Deadline Alerts
// Schedule: 0 8 * * * (08:00 UTC every day) — triggered by the VPS crontab
// (see scripts/deploy.sh), or any scheduler sending the same request.
// Protected by CRON_SECRET: requires "Authorization: Bearer <CRON_SECRET>".
// =============================================================================

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  buildDeadlineAlertEmail,
  sendEmail,
  type DeadlineEmailItem,
} from '@/lib/email-notifications';

/** Returns the whole number of days from today until the given due date (negative if overdue). */
function daysUntilDue(dueDateIso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/cron/daily-alerts — Vercel cron endpoint (CRON_SECRET protected) that
 * finds pending deadlines due within 7 days or overdue and emails an alert digest.
 */
export async function GET(request: Request) {
  // ── Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` ─────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipientEmail = process.env.NOTIFICATION_EMAIL;
  if (!recipientEmail) {
    Sentry.captureMessage('[cron/daily-alerts] NOTIFICATION_EMAIL not set. Skipping email.', 'warning');
    console.warn('[cron/daily-alerts] NOTIFICATION_EMAIL not set. Skipping email.');
    return NextResponse.json({
      skipped: true,
      reason: 'NOTIFICATION_EMAIL environment variable is not set.',
    });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch overdue and upcoming deadlines (past due through 7 days ahead)
    const sevenDaysAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: rawDeadlines, error } = await supabase
      .from('deadlines')
      .select('*, processes(cnj, title)')
      .eq('status', 'pending')
      .lte('due_date', sevenDaysAhead.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      Sentry.captureMessage(`[cron/daily-alerts] Supabase error: ${error.message}`, 'error');
      console.error('[cron/daily-alerts] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rawDeadlines || rawDeadlines.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('[cron/daily-alerts] No upcoming/overdue deadlines. No email sent.');
      return NextResponse.json({ sent: false, reason: 'No deadlines require alerts today.' });
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

    if (result.success) {
      if (process.env.NODE_ENV === 'development') console.log(
        `[cron/daily-alerts] Alert email sent via ${result.provider} for ${deadlines.length} deadlines.`
      );
    } else {
      Sentry.captureMessage(`[cron/daily-alerts] Failed to send email: ${result.error}`, 'error');
      console.error('[cron/daily-alerts] Failed to send email:', result.error);
    }

    return NextResponse.json({
      sent: result.success,
      provider: result.provider,
      deadlinesFound: deadlines.length,
      error: result.error,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    Sentry.captureException(err);
    console.error('[cron/daily-alerts] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
