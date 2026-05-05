import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      profit: 0,
      outstandingHonorarios: 0,
      pendingTaxes: 0,
    },
    message: 'Use client-side store in MVP. SQLite integration in Phase 2.',
  });
}
