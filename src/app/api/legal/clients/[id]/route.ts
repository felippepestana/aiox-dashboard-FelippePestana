import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ client: data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('clients')
    .update({
      ...(body.type !== undefined && { type: body.type }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.cpfCnpj !== undefined && { cpf_cnpj: body.cpfCnpj }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.leadSource !== undefined && { lead_source: body.leadSource }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
