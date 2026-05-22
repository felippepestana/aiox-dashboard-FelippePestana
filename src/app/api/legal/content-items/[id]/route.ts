import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.area !== undefined && { area: body.area }),
      ...(body.channel !== undefined && { channel: body.channel }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.scheduledDate !== undefined && { scheduled_date: body.scheduledDate }),
      ...(body.publishedDate !== undefined && { published_date: body.publishedDate }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.oabCompliant !== undefined && { oab_compliant: body.oabCompliant }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contentItem: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('content_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
