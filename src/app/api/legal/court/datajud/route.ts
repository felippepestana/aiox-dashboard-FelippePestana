import { NextResponse } from 'next/server';

// Mock DataJud results for development
const MOCK_DATAJUD_RESULTS = [
  {
    id: 'dj-1',
    cnj: '1234567-89.2025.8.26.0100',
    classe: 'Procedimento Comum Civel',
    assuntos: ['Indenizacao por Dano Moral', 'Responsabilidade Civil'],
    tribunal: 'TJSP',
    orgaoJulgador: '2a Vara Civel - Foro Central Civel',
    dataAjuizamento: '2025-03-15',
    ultimaAtualizacao: '2026-04-10',
    grau: 'G1',
    nivelSigilo: 0,
    formato: { nome: 'Eletronico' },
    movimentos: [
      { codigo: 11009, nome: 'Conclusos para Despacho', dataHora: '2026-04-10T14:30:00' },
      { codigo: 12112, nome: 'Juntada de Peticao', dataHora: '2026-04-05T10:15:00' },
    ],
  },
  {
    id: 'dj-2',
    cnj: '5432109-87.2025.5.02.0012',
    classe: 'Acao Trabalhista - Rito Ordinario',
    assuntos: ['Rescisao Indireta', 'Horas Extras', 'Dano Moral Trabalhista'],
    tribunal: 'TRT2',
    orgaoJulgador: '12a Vara do Trabalho de Sao Paulo',
    dataAjuizamento: '2025-06-20',
    ultimaAtualizacao: '2026-04-08',
    grau: 'G1',
    nivelSigilo: 0,
    formato: { nome: 'Eletronico' },
    movimentos: [
      { codigo: 970, nome: 'Audiencia Realizada', dataHora: '2026-04-08T14:00:00' },
      { codigo: 11009, nome: 'Conclusos para Sentenca', dataHora: '2026-04-08T16:30:00' },
    ],
  },
  {
    id: 'dj-3',
    cnj: '0012345-67.2025.4.03.6100',
    classe: 'Mandado de Seguranca Civel',
    assuntos: ['ICMS', 'Base de Calculo', 'PIS/COFINS'],
    tribunal: 'TRF3',
    orgaoJulgador: '1a Vara Federal Tributaria de Sao Paulo',
    dataAjuizamento: '2025-09-10',
    ultimaAtualizacao: '2026-03-25',
    grau: 'G1',
    nivelSigilo: 0,
    formato: { nome: 'Eletronico' },
    movimentos: [
      { codigo: 193, nome: 'Sentenca Proferida', dataHora: '2026-03-25T11:00:00' },
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const tribunal = searchParams.get('tribunal');
  const classe = searchParams.get('classe');
  const assunto = searchParams.get('assunto');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  let results = MOCK_DATAJUD_RESULTS;

  if (cnj) {
    results = results.filter((r) => r.cnj.includes(cnj));
  }

  if (tribunal) {
    results = results.filter((r) => r.tribunal === tribunal);
  }

  if (classe) {
    results = results.filter((r) =>
      r.classe.toLowerCase().includes(classe.toLowerCase())
    );
  }

  if (assunto) {
    results = results.filter((r) =>
      r.assuntos.some((a) => a.toLowerCase().includes(assunto.toLowerCase()))
    );
  }

  if (dataInicio) {
    results = results.filter((r) => r.dataAjuizamento >= dataInicio);
  }

  if (dataFim) {
    results = results.filter((r) => r.dataAjuizamento <= dataFim);
  }

  // In production, queries DataJud REST API with APIKey auth
  // Base URL: https://api-publica.datajud.cnj.jus.br/
  return NextResponse.json({
    results,
    query: { cnj, tribunal, classe, assunto, dataInicio, dataFim },
    total: results.length,
    message: 'Mock DataJud results returned for development. Configure API key in settings for production.',
  });
}
