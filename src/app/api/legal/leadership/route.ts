import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('leadership_pipeline')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('leadership_pipeline').insert({
      name: body.name,
      level: body.level,
      years_experience: body.yearsExperience || 0,
      skills: body.skills || [],
      development_goals: body.developmentGoals || [],
      target_hours: body.targetHours || 0,
      billed_hours: body.billedHours || 0,
      revenue_generated: body.revenueGenerated || 0,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
