import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('selem_assessments')
    .update({
      ...(body.pillar !== undefined && { pillar: body.pillar }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.date !== undefined && { date: body.date }),
      ...(body.actionItems !== undefined && { action_items: body.actionItems }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessment: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('selem_assessments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
