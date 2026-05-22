import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');

  let query = supabase.from('content_items').select('*').order('created_at', { ascending: false });
  if (channel) query = query.eq('channel', channel);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contentItems: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from('content_items').insert({
      title: body.title,
      description: body.description || '',
      area: body.area,
      channel: body.channel,
      status: body.status || 'idea',
      scheduled_date: body.scheduledDate || null,
      published_date: body.publishedDate || null,
      content: body.content || '',
      oab_compliant: body.oabCompliant ?? true,
      campaign_id: body.campaignId || null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contentItem: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
