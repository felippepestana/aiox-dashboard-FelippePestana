import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('legal_canvas').select('*').limit(1).single();
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ canvas: data || null });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data: existing } = await supabase.from('legal_canvas').select('id').limit(1).single();

    if (existing) {
      const { data, error } = await supabase
        .from('legal_canvas')
        .update({
          firm_name: body.firmName || '',
          mission: body.mission || '',
          vision: body.vision || '',
          values: body.values || [],
          practice_areas: body.practiceAreas || [],
          target_clients: body.targetClients || [],
          channels: body.channels || [],
          revenue: body.revenue || [],
          costs: body.costs || [],
          partnerships: body.partnerships || [],
          competitive_advantage: body.competitiveAdvantage || [],
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ canvas: data });
    }

    const { data, error } = await supabase.from('legal_canvas').insert({
      firm_name: body.firmName || '',
      mission: body.mission || '',
      vision: body.vision || '',
      values: body.values || [],
      practice_areas: body.practiceAreas || [],
      target_clients: body.targetClients || [],
      channels: body.channels || [],
      revenue: body.revenue || [],
      costs: body.costs || [],
      partnerships: body.partnerships || [],
      competitive_advantage: body.competitiveAdvantage || [],
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ canvas: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
