import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('aiox_session')?.value;
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await validateSession(sessionCookie);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, subscription_current_period_end')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }

  return NextResponse.json({
    plan: profile?.subscription_plan || 'starter',
    status: profile?.subscription_status || 'free',
    currentPeriodEnd: profile?.subscription_current_period_end || null,
  });
}
