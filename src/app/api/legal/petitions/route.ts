import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const processId = searchParams.get('processId');

  let query = supabase.from('petitions').select('*, processes(cnj, title)').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (processId) query = query.eq('process_id', processId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ petitions: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('petitions').insert({
      process_id: body.processId,
      type: body.type,
      title: body.title,
      status: body.status || 'draft',
      content: body.content || '',
      template_id: body.templateId,
      court_system: body.courtSystem,
      ai_model: body.aiModel,
      ai_cost: body.aiCost,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ petition: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
