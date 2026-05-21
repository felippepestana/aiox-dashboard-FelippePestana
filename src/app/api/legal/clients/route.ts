import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');

  let query = supabase.from('clients').select('*').order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);
  if (search) query = query.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('clients').insert({
      type: body.type,
      name: body.name,
      cpf_cnpj: body.cpfCnpj,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      address: body.address || {},
      notes: body.notes || '',
      lead_source: body.leadSource,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
