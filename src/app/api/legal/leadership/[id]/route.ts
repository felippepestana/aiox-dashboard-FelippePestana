import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('leadership_pipeline')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.yearsExperience !== undefined && { years_experience: body.yearsExperience }),
      ...(body.skills !== undefined && { skills: body.skills }),
      ...(body.developmentGoals !== undefined && { development_goals: body.developmentGoals }),
      ...(body.targetHours !== undefined && { target_hours: body.targetHours }),
      ...(body.billedHours !== undefined && { billed_hours: body.billedHours }),
      ...(body.revenueGenerated !== undefined && { revenue_generated: body.revenueGenerated }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('leadership_pipeline').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
