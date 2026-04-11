import { NextResponse } from 'next/server';

// Mock court search results for development
const MOCK_RESULTS = [
  {
    cnj: '1234567-89.2025.8.26.0100',
    title: 'Acao de Indenizacao por Dano Moral',
    court: 'TJSP',
    vara: '2a Vara Civel',
    comarca: 'Sao Paulo',
    status: 'Em andamento',
    lastMovement: 'Conclusos para despacho',
    source: 'esaj',
  },
  {
    cnj: '9876543-21.2025.8.26.0100',
    title: 'Acao Revisional de Contrato',
    court: 'TJSP',
    vara: '5a Vara Civel',
    comarca: 'Sao Paulo',
    status: 'Em andamento',
    lastMovement: 'Citacao efetuada',
    source: 'esaj',
  },
  {
    cnj: '5432109-87.2025.5.02.0012',
    title: 'Reclamacao Trabalhista',
    court: 'TRT2',
    vara: '12a Vara do Trabalho',
    comarca: 'Sao Paulo',
    status: 'Em andamento',
    lastMovement: 'Audiencia designada para 15/05/2026',
    source: 'pje',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const system = searchParams.get('system');
  const name = searchParams.get('name');
  const oab = searchParams.get('oab');

  if (!cnj && !name && !oab) {
    return NextResponse.json(
      { error: 'At least one search parameter is required: cnj, name, or oab' },
      { status: 400 }
    );
  }

  // Filter mock results based on query
  let results = MOCK_RESULTS;

  if (cnj) {
    results = results.filter((r) =>
      r.cnj.includes(cnj)
    );
  }

  if (system) {
    results = results.filter((r) => r.source === system);
  }

  // In production, uses CourtAdapter factory to search across PJe, eSAJ, eProc
  return NextResponse.json({
    results,
    query: { cnj, system, name, oab },
    total: results.length,
    message:
      results.length > 0
        ? 'Mock results returned for development.'
        : 'Court search integration active in Phase 2. Configure court credentials in settings.',
  });
}
