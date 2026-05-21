import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [honorarios, transactions] = await Promise.all([
    supabase.from('honorarios').select('*'),
    supabase.from('transactions').select('*').order('date', { ascending: false }).limit(50),
  ]);

  const allTxns = transactions.data || [];
  const income = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const outstanding = (honorarios.data || [])
    .filter(h => h.status === 'active')
    .reduce((s, h) => {
      const remaining = (h.installments || 1) - (h.paid_installments || 0);
      const perInstallment = (h.amount || 0) / (h.installments || 1);
      return s + remaining * perInstallment;
    }, 0);

  return NextResponse.json({
    summary: {
      totalRevenue: income,
      totalExpenses: expenses,
      profit: income - expenses,
      outstandingHonorarios: outstanding,
    },
    recentTransactions: allTxns.slice(0, 10),
    honorarios: honorarios.data || [],
  });
}
