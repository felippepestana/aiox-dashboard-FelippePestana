import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const processId = searchParams.get('processId');

  let query = supabase.from('deadlines').select('*, processes(cnj, title)').order('due_date', { ascending: true });

  if (status) query = query.eq('status', status);
  if (processId) query = query.eq('process_id', processId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deadlines: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('deadlines').insert({
      process_id: body.processId,
      title: body.title,
      type: body.type,
      due_date: body.dueDate,
      reminder_days: body.reminderDays || [3, 1],
      status: 'pending',
      assigned_to: body.assignedTo || '',
      notes: body.notes || '',
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deadline: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
