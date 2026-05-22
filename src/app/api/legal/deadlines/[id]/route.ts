import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('deadlines')
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.dueDate !== undefined && { due_date: body.dueDate }),
      ...(body.reminderDays !== undefined && { reminder_days: body.reminderDays }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assignedTo !== undefined && { assigned_to: body.assignedTo }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deadline: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('deadlines').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
