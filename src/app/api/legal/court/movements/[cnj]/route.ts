import { NextResponse } from 'next/server';

// Mock movements for development
const MOCK_MOVEMENTS = [
  {
    id: 'mov-1',
    date: '2026-04-10T14:30:00Z',
    type: 'Despacho',
    description: 'Conclusos para despacho. Vistos. Defiro a tutela de urgencia requerida.',
    actor: 'Juiz Titular',
  },
  {
    id: 'mov-2',
    date: '2026-04-05T10:15:00Z',
    type: 'Peticao',
    description: 'Juntada de peticao intermediaria - Pedido de tutela de urgencia.',
    actor: 'Advogado do Autor',
  },
  {
    id: 'mov-3',
    date: '2026-03-28T09:00:00Z',
    type: 'Citacao',
    description: 'Citacao do reu efetuada via oficial de justica. Certidao positiva.',
    actor: 'Oficial de Justica',
  },
  {
    id: 'mov-4',
    date: '2026-03-20T16:45:00Z',
    type: 'Despacho',
    description: 'Cite-se o reu para contestar no prazo de 15 dias uteis.',
    actor: 'Juiz Titular',
  },
  {
    id: 'mov-5',
    date: '2026-03-15T11:30:00Z',
    type: 'Distribuicao',
    description: 'Distribuicao por sorteio. Processo distribuido a 2a Vara Civel.',
    actor: 'Sistema',
  },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnj: string }> }
) {
  const { cnj } = await params;

  if (!cnj) {
    return NextResponse.json({ error: 'CNJ parameter is required' }, { status: 400 });
  }

  // Validate CNJ format (basic check)
  const cnjPattern = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  const isValidFormat = cnjPattern.test(cnj);

  // In production, queries court system (PJe, eSAJ, eProc) for movements
  return NextResponse.json({
    cnj,
    validFormat: isValidFormat,
    movements: MOCK_MOVEMENTS,
    total: MOCK_MOVEMENTS.length,
    message: 'Mock movements returned for development. Movement tracking integration active in Phase 2.',
  });
}
