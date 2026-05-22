import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get('pillar');

  let query = supabase.from('selem_assessments').select('*').order('date', { ascending: false });
  if (pillar) query = query.eq('pillar', pillar);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assessments: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('selem_assessments').insert({
      pillar: body.pillar,
      score: body.score,
      notes: body.notes || '',
      date: body.date,
      action_items: body.actionItems || [],
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assessment: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
