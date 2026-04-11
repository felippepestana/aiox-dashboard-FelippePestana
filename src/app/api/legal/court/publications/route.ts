import { NextResponse } from 'next/server';

// Mock DJE publications for development
const MOCK_PUBLICATIONS = [
  {
    id: 'pub-1',
    date: '2026-04-11',
    journal: 'DJE - Caderno Judicial - 1a Instancia',
    court: 'TJSP',
    cnj: '1234567-89.2025.8.26.0100',
    content: 'INTIMACAO: Fica o advogado do autor intimado para manifestar-se sobre a contestacao apresentada, no prazo de 15 dias uteis.',
    type: 'intimacao',
    oab: 'SP123456',
  },
  {
    id: 'pub-2',
    date: '2026-04-11',
    journal: 'DJE - Caderno Judicial - 2a Instancia',
    court: 'TJSP',
    cnj: '9876543-21.2025.8.26.0100',
    content: 'PUBLICACAO DE ACORDAO: Recurso de apelacao parcialmente provido. Voto vencedor do relator.',
    type: 'acordao',
    oab: 'SP123456',
  },
  {
    id: 'pub-3',
    date: '2026-04-10',
    journal: 'DJE - Caderno Administrativo',
    court: 'TJSP',
    cnj: null,
    content: 'PORTARIA: Designacao de audiencias para o mes de maio de 2026 na 2a Vara Civel da Comarca de Sao Paulo.',
    type: 'portaria',
    oab: null,
  },
  {
    id: 'pub-4',
    date: '2026-04-09',
    journal: 'DJE - Caderno Judicial - 1a Instancia',
    court: 'TJRJ',
    cnj: '0012345-67.2025.8.19.0001',
    content: 'SENTENCA: Julgo procedente o pedido para condenar o reu ao pagamento de indenizacao por dano moral no valor de R$ 20.000,00.',
    type: 'sentenca',
    oab: 'RJ654321',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oab = searchParams.get('oab');
  const since = searchParams.get('since');
  const court = searchParams.get('court');
  const type = searchParams.get('type');

  let results = MOCK_PUBLICATIONS;

  if (oab) {
    results = results.filter((p) => p.oab === oab);
  }

  if (since) {
    results = results.filter((p) => p.date >= since);
  }

  if (court) {
    results = results.filter((p) => p.court === court);
  }

  if (type) {
    results = results.filter((p) => p.type === type);
  }

  // In production, monitors DJE across courts for OAB/CNJ matches
  return NextResponse.json({
    publications: results,
    query: { oab, since, court, type },
    total: results.length,
    message: 'Mock publications returned for development. DJE monitoring active in Phase 2.',
  });
}
