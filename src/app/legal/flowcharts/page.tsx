'use client';

import { useState } from 'react';
import { GitBranch, Filter } from 'lucide-react';
import { ProcessFlowchart } from '@/components/legal/ProcessFlowchart';
import type { FlowchartStep } from '@/components/legal/ProcessFlowchart';

const AREAS: { value: string; label: string }[] = [
  { value: 'civel', label: 'Civel' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'penal', label: 'Penal' },
  { value: 'familia', label: 'Familia' },
];

const FLOWCHART_DATA: Record<string, FlowchartStep[]> = {
  civel: [
    {
      id: 'c1',
      title: 'Peticao Inicial',
      description:
        'O autor elabora e protocola a peticao inicial, apresentando os fatos, fundamentos juridicos e pedidos. Deve atender aos requisitos do art. 319 do CPC, incluindo qualificacao das partes, causa de pedir, pedido com especificacoes e valor da causa.',
      deadline: '15 dias (prazo prescricional varia)',
      articles: ['Art. 319 CPC', 'Art. 320 CPC', 'Art. 321 CPC'],
      status: 'completed',
    },
    {
      id: 'c2',
      title: 'Analise e Despacho Inicial',
      description:
        'O juiz analisa a peticao inicial e pode: deferir, determinar emenda (prazo de 15 dias) ou indeferir liminarmente. Se deferida, determina a citacao do reu.',
      deadline: '15 dias para emenda',
      articles: ['Art. 321 CPC', 'Art. 330 CPC', 'Art. 331 CPC'],
      status: 'completed',
    },
    {
      id: 'c3',
      title: 'Citacao do Reu',
      description:
        'O reu e citado para tomar ciencia da acao e apresentar defesa. A citacao pode ser realizada por correio, oficial de justica, edital ou meio eletronico.',
      deadline: '5 dias (urgente)',
      articles: ['Art. 238 CPC', 'Art. 246 CPC', 'Art. 247 CPC'],
      status: 'completed',
    },
    {
      id: 'c4',
      title: 'Audiencia de Conciliacao/Mediacao',
      description:
        'Antes da contestacao, o juiz designa audiencia de conciliacao ou mediacao, que pode ser realizada por meio eletronico. As partes devem comparecer sob pena de multa.',
      deadline: '30 dias apos citacao',
      articles: ['Art. 334 CPC', 'Art. 165 CPC', 'Art. 166 CPC'],
      status: 'current',
    },
    {
      id: 'c5',
      title: 'Contestacao',
      description:
        'Nao havendo acordo na audiencia, o reu apresenta contestacao no prazo legal. Deve alegar toda materia de defesa, impugnar especificamente os fatos narrados e juntar documentos.',
      deadline: '15 dias apos audiencia',
      articles: ['Art. 335 CPC', 'Art. 336 CPC', 'Art. 337 CPC'],
      status: 'pending',
    },
    {
      id: 'c6',
      title: 'Replica',
      description:
        'O autor pode se manifestar sobre a contestacao, impugnando preliminares, documentos novos e fatos impeditivos, modificativos ou extintivos do direito.',
      deadline: '15 dias',
      articles: ['Art. 350 CPC', 'Art. 351 CPC'],
      status: 'pending',
    },
    {
      id: 'c7',
      title: 'Saneamento e Organizacao do Processo',
      description:
        'O juiz resolve questoes processuais pendentes, delimita as questoes de fato e de direito, especifica as provas a serem produzidas e define a distribuicao do onus da prova.',
      deadline: '10 dias para manifestacao',
      articles: ['Art. 357 CPC', 'Art. 358 CPC'],
      status: 'pending',
    },
    {
      id: 'c8',
      title: 'Fase Instrutoria (Provas)',
      description:
        'Producao de provas: pericial, testemunhal, documental, inspecao judicial. Inclui audiencia de instrucao e julgamento com oitiva de testemunhas e depoimento pessoal.',
      deadline: 'Variavel (30-90 dias)',
      articles: ['Art. 369 CPC', 'Art. 370 CPC', 'Art. 464 CPC'],
      status: 'pending',
    },
    {
      id: 'c9',
      title: 'Alegacoes Finais',
      description:
        'As partes apresentam suas razoes finais, resumindo os fatos, provas produzidas e argumentos juridicos para convencer o juiz.',
      deadline: '15 dias (sucessivos)',
      articles: ['Art. 364 CPC'],
      status: 'pending',
    },
    {
      id: 'c10',
      title: 'Sentenca',
      description:
        'O juiz profere sentenca decidindo o merito da causa, podendo julgar procedente, improcedente ou parcialmente procedente. Cabe recurso de apelacao no prazo de 15 dias.',
      deadline: '15 dias para recurso',
      articles: ['Art. 487 CPC', 'Art. 489 CPC', 'Art. 1.009 CPC'],
      status: 'pending',
    },
  ],
  trabalhista: [
    {
      id: 't1',
      title: 'Reclamacao Trabalhista',
      description:
        'O reclamante (empregado) ajuiza reclamacao trabalhista, podendo ser verbal ou escrita. Na Justica do Trabalho, o jus postulandi permite que a parte atue sem advogado em 1o e 2o grau.',
      deadline: '2 anos (prescricao)',
      articles: ['Art. 840 CLT', 'Art. 791 CLT', 'Art. 7, XXIX CF'],
      status: 'completed',
    },
    {
      id: 't2',
      title: 'Notificacao do Reclamado',
      description:
        'O reclamado (empregador) e notificado da audiencia, recebendo copia da peticao inicial. Na Justica do Trabalho, a notificacao e feita via postal (AR).',
      deadline: '5 dias (urgente)',
      articles: ['Art. 841 CLT', 'Art. 842 CLT'],
      status: 'completed',
    },
    {
      id: 't3',
      title: 'Audiencia Inaugural (Conciliacao)',
      description:
        'Primeira tentativa obrigatoria de conciliacao. O juiz propoe acordo entre as partes. A ausencia do reclamante gera arquivamento; a do reclamado, revelia e confissao ficta.',
      deadline: '20 dias apos distribuicao',
      articles: ['Art. 843 CLT', 'Art. 844 CLT', 'Art. 846 CLT'],
      status: 'current',
    },
    {
      id: 't4',
      title: 'Defesa (Contestacao)',
      description:
        'Nao havendo acordo, o reclamado apresenta defesa escrita ou oral em 20 minutos. Deve impugnar todos os pedidos e fatos narrados na inicial.',
      deadline: 'Na audiencia ou em 15 dias',
      articles: ['Art. 847 CLT', 'Art. 848 CLT'],
      status: 'pending',
    },
    {
      id: 't5',
      title: 'Fase Instrutoria',
      description:
        'Producao de provas: depoimento pessoal das partes, oitiva de testemunhas (maximo 3 por parte), prova documental e pericial quando necessaria.',
      deadline: '30-60 dias',
      articles: ['Art. 848 CLT', 'Art. 849 CLT', 'Art. 852-H CLT'],
      status: 'pending',
    },
    {
      id: 't6',
      title: 'Razoes Finais',
      description:
        'As partes apresentam razoes finais oralmente em 10 minutos cada ou por escrito quando designado prazo pelo juiz.',
      deadline: '10 minutos (oral) / 5 dias (escrito)',
      articles: ['Art. 850 CLT'],
      status: 'pending',
    },
    {
      id: 't7',
      title: 'Segunda Proposta de Conciliacao',
      description:
        'Nova tentativa obrigatoria de conciliacao antes do julgamento. O juiz renova a proposta de acordo entre as partes.',
      deadline: 'Na audiencia',
      articles: ['Art. 850 CLT'],
      status: 'pending',
    },
    {
      id: 't8',
      title: 'Sentenca',
      description:
        'O juiz profere sentenca, podendo ser na propria audiencia ou em ate 30 dias. Cabe recurso ordinario para o TRT no prazo de 8 dias.',
      deadline: '8 dias para recurso',
      articles: ['Art. 831 CLT', 'Art. 895 CLT'],
      status: 'pending',
    },
  ],
  tributario: [
    {
      id: 'tr1',
      title: 'Auto de Infracao / Lancamento',
      description:
        'A Fazenda Publica lavra auto de infracao ou realiza lancamento tributario, notificando o contribuinte do credito tributario constituido.',
      deadline: '5 anos (decadencia)',
      articles: ['Art. 142 CTN', 'Art. 173 CTN'],
      status: 'completed',
    },
    {
      id: 'tr2',
      title: 'Impugnacao Administrativa',
      description:
        'O contribuinte apresenta impugnacao administrativa ao lancamento, instaurando o processo administrativo fiscal. Suspende a exigibilidade do credito.',
      deadline: '30 dias',
      articles: ['Art. 145 CTN', 'Art. 151, III CTN', 'Dec. 70.235/72'],
      status: 'completed',
    },
    {
      id: 'tr3',
      title: 'Julgamento em 1a Instancia',
      description:
        'Delegacia de Julgamento (DRJ) julga a impugnacao. Pode manter, alterar ou cancelar o lancamento tributario.',
      deadline: '30-180 dias',
      articles: ['Dec. 70.235/72, Art. 25'],
      status: 'current',
    },
    {
      id: 'tr4',
      title: 'Recurso Voluntario / De Oficio',
      description:
        'Cabe recurso voluntario do contribuinte ou recurso de oficio da Fazenda ao CARF (Conselho Administrativo de Recursos Fiscais).',
      deadline: '30 dias',
      articles: ['Dec. 70.235/72, Art. 33'],
      status: 'pending',
    },
    {
      id: 'tr5',
      title: 'Julgamento no CARF',
      description:
        'O CARF julga o recurso em turma. Em caso de empate, aplica-se o voto de qualidade a favor do contribuinte (Lei 13.988/2020).',
      deadline: 'Variavel (6-24 meses)',
      articles: ['Art. 112 CTN', 'Lei 13.988/2020'],
      status: 'pending',
    },
    {
      id: 'tr6',
      title: 'Inscricao em Divida Ativa / Acao Judicial',
      description:
        'Esgotada a via administrativa, o credito e inscrito em Divida Ativa. O contribuinte pode ajuizar acao anulatoria, mandado de seguranca ou excecao de pre-executividade.',
      deadline: '5 anos (prescricao)',
      articles: ['Art. 174 CTN', 'Art. 204 CTN'],
      status: 'pending',
    },
  ],
  penal: [
    {
      id: 'pe1',
      title: 'Inquerito Policial / Investigacao',
      description:
        'A autoridade policial instaura inquerito policial para apurar a autoria e materialidade do delito. Pode ser iniciado de oficio, por requisicao ou por requerimento.',
      deadline: '10 dias (preso) / 30 dias (solto)',
      articles: ['Art. 4 CPP', 'Art. 5 CPP', 'Art. 10 CPP'],
      status: 'completed',
    },
    {
      id: 'pe2',
      title: 'Denuncia / Queixa',
      description:
        'O Ministerio Publico oferece denuncia (acao publica) ou o ofendido apresenta queixa-crime (acao privada), instaurando a acao penal.',
      deadline: '5 dias (preso) / 15 dias (solto)',
      articles: ['Art. 24 CPP', 'Art. 30 CPP', 'Art. 41 CPP'],
      status: 'completed',
    },
    {
      id: 'pe3',
      title: 'Recebimento da Denuncia',
      description:
        'O juiz analisa a denuncia e decide pelo recebimento ou rejeicao. O recebimento interrompe a prescricao e marca o inicio formal da acao penal.',
      deadline: '10 dias',
      articles: ['Art. 395 CPP', 'Art. 396 CPP', 'Art. 117, I CP'],
      status: 'current',
    },
    {
      id: 'pe4',
      title: 'Resposta a Acusacao',
      description:
        'O acusado apresenta resposta a acusacao, podendo arguir preliminares, juntar documentos e arrolar testemunhas.',
      deadline: '10 dias',
      articles: ['Art. 396 CPP', 'Art. 396-A CPP'],
      status: 'pending',
    },
    {
      id: 'pe5',
      title: 'Audiencia de Instrucao e Julgamento',
      description:
        'Oitiva de testemunhas da acusacao, da defesa, peritos, acareacoes e interrogatorio do reu (ultimo ato). Alegacoes finais orais ou por memorial.',
      deadline: '60 dias (preso) / 120 dias (solto)',
      articles: ['Art. 400 CPP', 'Art. 403 CPP'],
      status: 'pending',
    },
    {
      id: 'pe6',
      title: 'Sentenca',
      description:
        'O juiz profere sentenca condenatoria ou absolutoria. Cabe recurso de apelacao no prazo de 5 dias.',
      deadline: '5 dias para recurso',
      articles: ['Art. 381 CPP', 'Art. 593 CPP'],
      status: 'pending',
    },
  ],
  familia: [
    {
      id: 'f1',
      title: 'Peticao Inicial',
      description:
        'A parte autora ajuiza acao de familia (divorcio, alimentos, guarda, etc). Nas acoes de familia, todos os esforcos serao empreendidos para a solucao consensual.',
      deadline: 'Conforme prescricao aplicavel',
      articles: ['Art. 693 CPC', 'Art. 694 CPC'],
      status: 'completed',
    },
    {
      id: 'f2',
      title: 'Citacao e Audiencia de Mediacao',
      description:
        'O reu e citado para comparecer a audiencia de mediacao. O mandado de citacao nao contera copia da inicial para evitar acirramento de animos.',
      deadline: '15 dias apos citacao',
      articles: ['Art. 695 CPC', 'Art. 696 CPC'],
      status: 'completed',
    },
    {
      id: 'f3',
      title: 'Sessoes de Mediacao',
      description:
        'Podem ser realizadas tantas sessoes de mediacao quantas necessarias. O Ministerio Publico deve ser ouvido quando houver interesse de incapaz.',
      deadline: 'Sem limite de sessoes',
      articles: ['Art. 696 CPC', 'Art. 698 CPC'],
      status: 'current',
    },
    {
      id: 'f4',
      title: 'Contestacao',
      description:
        'Frustrada a mediacao, inicia-se o prazo para contestacao. Aplica-se o procedimento comum com as especificidades do rito de familia.',
      deadline: '15 dias',
      articles: ['Art. 697 CPC', 'Art. 335 CPC'],
      status: 'pending',
    },
    {
      id: 'f5',
      title: 'Instrucao Processual',
      description:
        'Producao de provas, incluindo estudo psicossocial quando envolve guarda ou visitacao de menores. Oitiva especializada de criancas quando necessario.',
      deadline: '30-90 dias',
      articles: ['Art. 699 CPC', 'Art. 12 ECA'],
      status: 'pending',
    },
    {
      id: 'f6',
      title: 'Sentenca',
      description:
        'O juiz profere sentenca levando em consideracao o melhor interesse da crianca (quando aplicavel) e os principios do direito de familia.',
      deadline: '15 dias para recurso',
      articles: ['Art. 487 CPC', 'Art. 1.583 CC', 'Art. 1.584 CC'],
      status: 'pending',
    },
  ],
};

export default function FlowchartsPage() {
  const [selectedArea, setSelectedArea] = useState('civel');

  const areaLabel = AREAS.find((a) => a.value === selectedArea)?.label || selectedArea;
  const steps = FLOWCHART_DATA[selectedArea] || [];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitBranch className="h-7 w-7 text-amber-400" />
          Fluxogramas Processuais
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Visualize o passo a passo dos procedimentos juridicos com prazos e artigos aplicaveis
        </p>
      </div>

      {/* Area Selector */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Selecione a Area</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {AREAS.map((a) => (
            <button
              key={a.value}
              onClick={() => setSelectedArea(a.value)}
              className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all ${
                selectedArea === a.value
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-[#1a2332] bg-[#0a0f1a] text-[#8899aa] hover:border-[#2a3342] hover:text-white'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3">
        <p className="text-sm text-amber-400">
          Clique em cada etapa para ver detalhes, prazos e artigos aplicaveis
        </p>
        <span className="text-xs text-[#6b7a8d]">{steps.length} etapas</span>
      </div>

      {/* Flowchart */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <ProcessFlowchart steps={steps} areaName={areaLabel} />
      </div>
    </div>
  );
}
