import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('processes')
    .select('*, clients(name, cpf_cnpj)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ process: data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('processes')
    .update({
      ...(body.cnj !== undefined && { cnj: body.cnj }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.area !== undefined && { area: body.area }),
      ...(body.court !== undefined && { court: body.court }),
      ...(body.judge !== undefined && { judge: body.judge }),
      ...(body.vara !== undefined && { vara: body.vara }),
      ...(body.comarca !== undefined && { comarca: body.comarca }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.clientId !== undefined && { client_id: body.clientId }),
      ...(body.opposingParty !== undefined && { opposing_party: body.opposingParty }),
      ...(body.opposingLawyer !== undefined && { opposing_lawyer: body.opposingLawyer }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.urgency !== undefined && { urgency: body.urgency }),
      ...(body.object !== undefined && { object: body.object }),
      ...(body.causeValue !== undefined && { cause_value: body.causeValue }),
      ...(body.feeType !== undefined && { fee_type: body.feeType }),
      ...(body.feeAmount !== undefined && { fee_amount: body.feeAmount }),
      ...(body.contingencyPct !== undefined && { contingency_pct: body.contingencyPct }),
      ...(body.tags !== undefined && { tags: body.tags }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ process: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('processes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
