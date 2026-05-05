'use client';

import { useState, useCallback } from 'react';
import { FileSearch, Loader2, Sparkles } from 'lucide-react';
import { FileUpload } from '@/components/legal';
import { DocumentAnalysis, AnalysisResult, AnalysisEntity } from '@/components/legal/DocumentAnalysis';

// ─── Mock Analysis Generator ────────────────────────────────────────────────

function generateMockAnalysis(fileName: string): AnalysisResult {
  const isContract = /contrato|acordo|termo/i.test(fileName);
  const isPetition = /peti[cç][aã]o|inicial|recurso|apela[cç]/i.test(fileName);
  const isSentence = /senten[cç]a|ac[oó]rd[aã]o|decis[aã]o/i.test(fileName);

  const baseEntities: AnalysisEntity[] = [
    { type: 'party' as const, label: 'Autor', value: 'Maria Silva Santos' },
    { type: 'party' as const, label: 'Réu', value: 'Empresa XYZ Ltda' },
    { type: 'lawyer' as const, label: 'Advogado Autor', value: 'Dr. Carlos Mendes - OAB/SP 123.456' },
    { type: 'lawyer' as const, label: 'Advogado Réu', value: 'Dra. Ana Oliveira - OAB/SP 789.012' },
    { type: 'date' as const, label: 'Data do Documento', value: '15/03/2025' },
    { type: 'value' as const, label: 'Valor da Causa', value: 'R$ 150.000,00' },
    { type: 'law' as const, label: 'Lei Citada', value: 'CLT Art. 477' },
    { type: 'law' as const, label: 'Lei Citada', value: 'CF Art. 5o, XXXV' },
  ];

  if (isSentence) {
    baseEntities.push({ type: 'judge' as const, label: 'Magistrado', value: 'Dr. Roberto Andrade - 3a Vara Civel' });
  }

  const contractClauses = [
    { id: 'c1', title: 'Cláusula de Objeto', summary: 'Define o escopo do contrato de prestação de serviços advocatícios. Objeto bem delimitado e dentro dos padrões legais.', risk: 'low' as const },
    { id: 'c2', title: 'Cláusula de Honorários', summary: 'Estipula honorários contratuais de 20% sobre o êxito mais R$ 5.000 de entrada. Valor dentro da tabela OAB.', risk: 'low' as const },
    { id: 'c3', title: 'Cláusula de Confidencialidade', summary: 'Restrição de compartilhamento de informações por 5 anos após encerramento. Multa de R$ 100.000 por violação pode ser considerada excessiva.', risk: 'medium' as const },
    { id: 'c4', title: 'Cláusula de Rescisão', summary: 'Permite rescisão unilateral sem multa apenas pela contratante. Desequilíbrio contratual identificado que pode ser questionado judicialmente.', risk: 'high' as const },
    { id: 'c5', title: 'Cláusula de Foro', summary: 'Eleição do foro da comarca de São Paulo. Pode ser prejudicial ao consumidor em caso de relação de consumo.', risk: 'medium' as const },
    { id: 'c6', title: 'Cláusula de Prazo', summary: 'Contrato com duração de 12 meses com renovação automática. Prazo razoável e dentro das práticas de mercado.', risk: 'low' as const },
  ];

  let summary: string;
  let docType: string;
  let legalArea: string;
  let complexity: number;

  if (isContract) {
    summary = `Este documento é um contrato de prestação de serviços advocatícios firmado entre Maria Silva Santos (Contratante) e Empresa XYZ Ltda (Contratada).\n\nO contrato estabelece os termos para representação jurídica em demanda trabalhista, incluindo honorários, prazos, obrigações das partes e condições de rescisão.\n\nForam identificadas 6 cláusulas principais, sendo 1 com alto risco jurídico (cláusula de rescisão unilateral) e 2 com risco moderado (confidencialidade e foro).`;
    docType = 'Contrato de Prestação de Serviços';
    legalArea = 'Direito Contratual / Trabalhista';
    complexity = 6;
  } else if (isPetition) {
    summary = `Petição inicial de reclamação trabalhista movida por Maria Silva Santos contra Empresa XYZ Ltda.\n\nA peça alega rescisão indireta do contrato de trabalho por descumprimento de obrigações contratuais, incluindo atraso de salários, não recolhimento de FGTS e assédio moral.\n\nPede-se o pagamento de verbas rescisórias, FGTS + 40%, horas extras, danos morais e honorários advocatícios sucumbenciais. Valor da causa estimado em R$ 150.000,00.`;
    docType = 'Petição Inicial Trabalhista';
    legalArea = 'Direito do Trabalho';
    complexity = 7;
  } else if (isSentence) {
    summary = `Sentença proferida pelo Dr. Roberto Andrade, da 3a Vara Cível, julgando parcialmente procedente a ação.\n\nO magistrado reconheceu o direito do autor ao pagamento de verbas rescisórias e danos morais, fixados em R$ 20.000,00, mas rejeitou o pedido de horas extras por insuficiência probatória.\n\nA decisão está fundamentada nos artigos 477 e 483 da CLT, com referência à Súmula 331 do TST.`;
    docType = 'Sentença Judicial';
    legalArea = 'Direito do Trabalho';
    complexity = 8;
  } else {
    summary = `Documento jurídico identificado como peça processual genérica.\n\nO documento contém referências a partes envolvidas em litígio, citações de legislação aplicável e argumentação jurídica.\n\nRecomenda-se análise mais detalhada por profissional especializado na área identificada.`;
    docType = 'Documento Jurídico Genérico';
    legalArea = 'Direito Civil';
    complexity = 5;
  }

  return {
    summary,
    entities: baseEntities,
    classification: {
      documentType: docType,
      legalArea,
      complexityScore: complexity,
    },
    clauses: isContract ? contractClauses : [],
  };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setResult(null);
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!uploadedFile) return;
    setAnalyzing(true);
    // Simulate AI analysis delay
    setTimeout(() => {
      const analysis = generateMockAnalysis(uploadedFile.name);
      setResult(analysis);
      setAnalyzing(false);
    }, 2500);
  }, [uploadedFile]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
            <FileSearch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Análise de Documentos</h1>
            <p className="text-sm text-[#6b7a8d]">Análise multimodal com inteligência artificial</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Upload Area */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Upload de Documento</h2>
          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple={false}
          />
        </div>

        {/* Analyze Button */}
        {uploadedFile && !result && (
          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all ${
                analyzing
                  ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando documento...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analisar
                </>
              )}
            </button>
          </div>
        )}

        {/* Analysis Skeleton / Loading */}
        {analyzing && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/3 rounded bg-[#1a2332]" />
                  <div className="h-3 w-full rounded bg-[#1a2332]" />
                  <div className="h-3 w-2/3 rounded bg-[#1a2332]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && uploadedFile && (
          <DocumentAnalysis result={result} fileName={uploadedFile.name} />
        )}
      </div>
    </div>
  );
}
