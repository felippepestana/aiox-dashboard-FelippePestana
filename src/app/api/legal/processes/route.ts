import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get('area');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase.from('processes').select('*, clients(name, cpf_cnpj)').order('created_at', { ascending: false });

  if (area) query = query.eq('area', area);
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`cnj.ilike.%${search}%,title.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ processes: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('processes').insert({
      cnj: body.cnj,
      title: body.title,
      area: body.area,
      court: body.court,
      judge: body.judge,
      vara: body.vara,
      comarca: body.comarca,
      state: body.state,
      client_id: body.clientId || null,
      opposing_party: body.opposingParty,
      opposing_lawyer: body.opposingLawyer,
      status: body.status || 'active',
      urgency: body.urgency || 'medium',
      court_system: body.courtSystem || 'manual',
      object: body.object,
      cause_value: body.causeValue || 0,
      fee_type: body.feeType || 'fixed',
      fee_amount: body.feeAmount || 0,
      contingency_pct: body.contingencyPct,
      tags: body.tags || [],
      datajud_linked: body.tags?.includes('datajud-vinculado') || false,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ process: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
