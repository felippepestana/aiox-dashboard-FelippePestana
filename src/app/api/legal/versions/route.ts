// =============================================================================
// API Route — /api/legal/versions
// Handles petition document version history (GET, POST, PUT)
// =============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeDiff } from '@/lib/document-versioning';

// ─── Ensure table exists ─────────────────────────────────────────────────────
// The petition_versions table is expected to exist in Supabase with the schema:
//   id            uuid primary key default gen_random_uuid()
//   petition_id   text not null
//   version       integer not null
//   content       text not null default ''
//   created_at    timestamptz default now()
//   created_by    text not null default 'advogado'
//   change_description text not null default ''
//   diff          jsonb
//   UNIQUE(petition_id, version)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const petitionId = searchParams.get('petitionId');

  if (!petitionId) {
    return NextResponse.json({ error: 'petitionId query param required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('petition_versions')
    .select('*')
    .eq('petition_id', petitionId)
    .order('version', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      petitionId: string;
      content: string;
      description?: string;
      createdBy?: string;
    };

    const { petitionId, content, description = '', createdBy = 'advogado' } = body;

    if (!petitionId || content === undefined) {
      return NextResponse.json({ error: 'petitionId and content are required' }, { status: 400 });
    }

    // Determine next version number
    const { data: existing } = await supabase
      .from('petition_versions')
      .select('version, content')
      .eq('petition_id', petitionId)
      .order('version', { ascending: false })
      .limit(1);

    const prevVersion = existing?.[0] ?? null;
    const nextVersion = prevVersion ? (prevVersion.version as number) + 1 : 1;

    // Compute diff from previous version
    const diff = prevVersion
      ? computeDiff(prevVersion.content as string, content)
      : null;

    const { data, error } = await supabase
      .from('petition_versions')
      .insert({
        petition_id: petitionId,
        version: nextVersion,
        content,
        created_by: createdBy,
        change_description: description,
        diff: diff ? JSON.stringify(diff) : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ version: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { petitionId: string; version: number };
    const { petitionId, version } = body;

    if (!petitionId || version === undefined) {
      return NextResponse.json({ error: 'petitionId and version are required' }, { status: 400 });
    }

    // Get the target version's content
    const { data: target, error: fetchErr } = await supabase
      .from('petition_versions')
      .select('*')
      .eq('petition_id', petitionId)
      .eq('version', version)
      .single();

    if (fetchErr || !target) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Get current latest version to compute diff
    const { data: latest } = await supabase
      .from('petition_versions')
      .select('version, content')
      .eq('petition_id', petitionId)
      .order('version', { ascending: false })
      .limit(1);

    const latestVersion = latest?.[0] ?? null;
    const nextVersion = latestVersion ? (latestVersion.version as number) + 1 : 1;
    const diff = latestVersion
      ? computeDiff(latestVersion.content as string, target.content as string)
      : null;

    // Create a new version entry recording the restore
    const { data: restored, error: insertErr } = await supabase
      .from('petition_versions')
      .insert({
        petition_id: petitionId,
        version: nextVersion,
        content: target.content,
        created_by: 'advogado',
        change_description: `Restaurado da versão ${version}`,
        diff: diff ? JSON.stringify(diff) : null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Also update the petition's content to reflect the restore
    await supabase
      .from('petitions')
      .update({ content: target.content, updated_at: new Date().toISOString() })
      .eq('id', petitionId);

    return NextResponse.json({ version: restored });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
