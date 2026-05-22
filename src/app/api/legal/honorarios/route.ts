import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');

  let query = supabase
    .from('honorarios')
    .select('*, clients(name), processes(cnj, title)')
    .order('created_at', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ honorarios: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('honorarios').insert({
      client_id: body.clientId,
      process_id: body.processId || null,
      type: body.type,
      amount: body.amount,
      installments: body.installments || 1,
      paid_installments: body.paidInstallments || 0,
      contract_date: body.contractDate || new Date().toISOString(),
      due_day: body.dueDay || 10,
      status: body.status || 'active',
      notes: body.notes || '',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ honorario: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
