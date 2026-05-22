import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const area = searchParams.get('area');

  let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (area) query = query.eq('area', area);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('campaigns').insert({
      name: body.name,
      type: body.type,
      channel: body.channel,
      area: body.area,
      status: body.status || 'draft',
      start_date: body.startDate,
      end_date: body.endDate || null,
      budget: body.budget || 0,
      oab_compliant: body.oabCompliant ?? true,
      metrics: body.metrics || { impressions: 0, clicks: 0, leads: 0, conversions: 0, roi: 0, engagement: 0 },
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
