import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('campaigns')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.channel !== undefined && { channel: body.channel }),
      ...(body.area !== undefined && { area: body.area }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.startDate !== undefined && { start_date: body.startDate }),
      ...(body.endDate !== undefined && { end_date: body.endDate }),
      ...(body.budget !== undefined && { budget: body.budget }),
      ...(body.oabCompliant !== undefined && { oab_compliant: body.oabCompliant }),
      ...(body.metrics !== undefined && { metrics: body.metrics }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
