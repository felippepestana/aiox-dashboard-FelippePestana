// =============================================================================
// API Route — /api/legal/approvals
// Manages petition approval workflow transitions and history (GET, POST)
// =============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  TRANSITIONS,
  type ApprovalAction,
  type ApprovalStatus,
} from '@/lib/approval-workflow';

// ─── Table schema (petition_approval_history) ────────────────────────────────
//   id               uuid primary key default gen_random_uuid()
//   petition_id      text not null
//   user_id          text not null default 'advogado'
//   comment          text not null default ''
//   action           text not null
//   previous_status  text not null
//   new_status       text not null
//   created_at       timestamptz default now()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const petitionId = searchParams.get('petitionId');

  if (!petitionId) {
    return NextResponse.json({ error: 'petitionId query param required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('petition_approval_history')
    .select('*')
    .eq('petition_id', petitionId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      petitionId: string;
      action: ApprovalAction;
      userId?: string;
      comment?: string;
    };

    const { petitionId, action, userId = 'advogado', comment = '' } = body;

    if (!petitionId || !action) {
      return NextResponse.json({ error: 'petitionId and action are required' }, { status: 400 });
    }

    // Determine current status from the latest history entry
    const { data: history } = await supabase
      .from('petition_approval_history')
      .select('new_status')
      .eq('petition_id', petitionId)
      .order('created_at', { ascending: false })
      .limit(1);

    const currentStatus: ApprovalStatus =
      (history?.[0]?.new_status as ApprovalStatus | undefined) ?? 'draft';

    // Validate transition
    const nextStatus = TRANSITIONS[currentStatus]?.[action];
    if (!nextStatus) {
      return NextResponse.json(
        {
          error: `Transição inválida: "${action}" não é permitida no estado "${currentStatus}"`,
        },
        { status: 422 }
      );
    }

    // Persist the approval history entry
    const { data, error } = await supabase
      .from('petition_approval_history')
      .insert({
        petition_id: petitionId,
        user_id: userId,
        comment,
        action,
        previous_status: currentStatus,
        new_status: nextStatus,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mirror the approval status onto the petition record itself
    // We map approval statuses that have a petition status equivalent
    const petitionStatusMap: Partial<Record<ApprovalStatus, string>> = {
      draft: 'draft',
      pending_review: 'review',
      approved: 'approved',
      revision_requested: 'draft',
      final: 'approved',
    };

    const mappedPetitionStatus = petitionStatusMap[nextStatus];
    if (mappedPetitionStatus) {
      await supabase
        .from('petitions')
        .update({ status: mappedPetitionStatus, updated_at: new Date().toISOString() })
        .eq('id', petitionId);
    }

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
