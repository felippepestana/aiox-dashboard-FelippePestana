import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  parsePaginationParams,
  buildPaginatedResult,
  pageToOffset,
} from '@/lib/pagination';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const processId = searchParams.get('processId');
  const search = searchParams.get('search');

  // Detect whether the caller wants paginated results
  const wantsPagination = searchParams.has('page') || searchParams.has('pageSize');

  if (!wantsPagination) {
    // ── Legacy path: return all results in { deadlines: [] } shape ──────────
    let query = supabase
      .from('deadlines')
      .select('*, processes(cnj, title)')
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status);
    if (processId) query = query.eq('process_id', processId);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,notes.ilike.%${search}%,assigned_to.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ deadlines: data || [] });
  }

  // ── Paginated path ─────────────────────────────────────────────────────────
  const params = parsePaginationParams(searchParams, {
    sortBy: 'due_date',
    sortOrder: 'asc',
  });

  const { page, pageSize, sortBy = 'due_date', sortOrder = 'asc' } = params;
  const offset = pageToOffset(page, pageSize);

  // Data query
  let dataQuery = supabase
    .from('deadlines')
    .select('*, processes(cnj, title)')
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  if (status) dataQuery = dataQuery.eq('status', status);
  if (processId) dataQuery = dataQuery.eq('process_id', processId);
  if (search) {
    dataQuery = dataQuery.or(
      `title.ilike.%${search}%,notes.ilike.%${search}%,assigned_to.ilike.%${search}%`
    );
  }

  // Count query
  let countQuery = supabase
    .from('deadlines')
    .select('*', { count: 'exact', head: true });

  if (status) countQuery = countQuery.eq('status', status);
  if (processId) countQuery = countQuery.eq('process_id', processId);
  if (search) {
    countQuery = countQuery.or(
      `title.ilike.%${search}%,notes.ilike.%${search}%,assigned_to.ilike.%${search}%`
    );
  }

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  if (dataResult.error) {
    return NextResponse.json({ error: dataResult.error.message }, { status: 500 });
  }
  if (countResult.error) {
    return NextResponse.json({ error: countResult.error.message }, { status: 500 });
  }

  const total = countResult.count ?? 0;
  const paginated = buildPaginatedResult(dataResult.data ?? [], total, params);

  return NextResponse.json(paginated);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('deadlines').insert({
      process_id: body.processId,
      title: body.title,
      type: body.type,
      due_date: body.dueDate,
      reminder_days: body.reminderDays || [3, 1],
      status: 'pending',
      assigned_to: body.assignedTo || '',
      notes: body.notes || '',
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deadline: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
