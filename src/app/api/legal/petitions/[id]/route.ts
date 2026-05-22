import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('petitions')
    .update({
      ...(body.type !== undefined && { type: body.type }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.templateId !== undefined && { template_id: body.templateId }),
      ...(body.filedAt !== undefined && { filed_at: body.filedAt }),
      ...(body.protocolNumber !== undefined && { protocol_number: body.protocolNumber }),
      ...(body.courtSystem !== undefined && { court_system: body.courtSystem }),
      ...(body.aiModel !== undefined && { ai_model: body.aiModel }),
      ...(body.aiCost !== undefined && { ai_cost: body.aiCost }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ petition: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('petitions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
