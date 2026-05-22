import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('honorarios')
    .update({
      ...(body.type !== undefined && { type: body.type }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.installments !== undefined && { installments: body.installments }),
      ...(body.paidInstallments !== undefined && { paid_installments: body.paidInstallments }),
      ...(body.contractDate !== undefined && { contract_date: body.contractDate }),
      ...(body.dueDay !== undefined && { due_day: body.dueDay }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ honorario: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('honorarios').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
