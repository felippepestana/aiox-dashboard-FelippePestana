import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// =============================================================================
// GET /api/legal/alerts
// Returns deadlines grouped by urgency level:
//   critical  – overdue (due_date < today, status = pending)
//   warning   – today or tomorrow
//   upcoming  – 2–7 days out
// =============================================================================

function startOfDayISO(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

export async function GET() {
  const nowISO = startOfDayISO(0);
  const day2ISO = startOfDayISO(2);
  const day7ISO = startOfDayISO(8); // end of day 7 (exclusive start of day 8)

  // Fetch all pending deadlines within range (overdue + next 7 days)
  // We fetch overdue and upcoming in one query by filtering status = pending
  // and due_date <= end of day 7.
  const { data, error } = await supabase
    .from('deadlines')
    .select('*, processes(id, cnj, title)')
    .eq('status', 'pending')
    .lte('due_date', day7ISO)
    .order('due_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deadlines = data ?? [];

  const critical: typeof deadlines = [];
  const warning: typeof deadlines = [];
  const upcoming: typeof deadlines = [];

  for (const d of deadlines) {
    const dueISO = new Date(d.due_date).toISOString();
    if (dueISO < nowISO) {
      critical.push(d);
    } else if (dueISO < day2ISO) {
      // today or tomorrow
      warning.push(d);
    } else {
      upcoming.push(d);
    }
  }

  return NextResponse.json({
    summary: {
      critical: critical.length,
      warning: warning.length,
      upcoming: upcoming.length,
      total: deadlines.length,
    },
    deadlines: {
      critical,
      warning,
      upcoming,
    },
  });
}
