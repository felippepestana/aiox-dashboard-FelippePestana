// =============================================================================
// Petition Template Engine - Advocacia Privada Brasileira
// Variable-substitution templates for common Brazilian legal documents
// =============================================================================

export type TemplateVariableType = 'text' | 'textarea' | 'date' | 'number' | 'select';

export interface TemplateVariable {
  name: string;       // key used in {{name}} placeholders
  label: string;      // Portuguese label shown in the form
  type: TemplateVariableType;
  required: boolean;
  defaultValue?: string;
  options?: string[]; // for 'select' type
  placeholder?: string;
}

export type TemplateCategory =
  | 'peticao_inicial'
  | 'defesa'
  | 'recurso'
  | 'urgencia'
  | 'constitucional'
  | 'execucao';

export interface PetitionTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  petitionType: string; // maps to PetitionType
  content: string;      // body with {{variable}} placeholders
  variables: TemplateVariable[];
}

// ─── Common variable definitions reused across templates ────────────────────

const COMMON_VARIABLES: Record<string, TemplateVariable> = {
  cliente_nome: {
    name: 'cliente_nome',
    label: 'Nome do Cliente (Requerente)',
    type: 'text',
    required: true,
    placeholder: 'Nome completo do cliente',
  },
  cliente_cpf: {
    name: 'cliente_cpf',
    label: 'CPF do Cliente',
    type: 'text',
    required: false,
    placeholder: '000.000.000-00',
  },
  cliente_rg: {
    name: 'cliente_rg',
    label: 'RG do Cliente',
    type: 'text',
    required: false,
    placeholder: '00.000.000-0',
  },
  cliente_profissao: {
    name: 'cliente_profissao',
    label: 'Profissão do Cliente',
    type: 'text',
    required: false,
    placeholder: 'Profissão',
  },
  cliente_endereco: {
    name: 'cliente_endereco',
    label: 'Endereço do Cliente',
    type: 'text',
    required: false,
    placeholder: 'Rua, número, bairro, cidade - Estado, CEP',
  },
  parte_contraria: {
    name: 'parte_contraria',
    label: 'Parte Contrária (Requerido)',
    type: 'text',
    required: true,
    placeholder: 'Nome completo ou razão social',
  },
  parte_contraria_cnpj: {
    name: 'parte_contraria_cnpj',
    label: 'CPF/CNPJ da Parte Contrária',
    type: 'text',
    required: false,
    placeholder: '00.000.000/0001-00',
  },
  numero_processo: {
    name: 'numero_processo',
    label: 'Número do Processo (CNJ)',
    type: 'text',
    required: false,
    placeholder: '0000000-00.0000.0.00.0000',
  },
  vara: {
    name: 'vara',
    label: 'Vara',
    type: 'text',
    required: true,
    placeholder: 'Ex: 3ª Vara Cível',
  },
  comarca: {
    name: 'comarca',
    label: 'Comarca',
    type: 'text',
    required: true,
    placeholder: 'Ex: São Paulo',
  },
  estado: {
    name: 'estado',
    label: 'Estado (UF)',
    type: 'text',
    required: true,
    placeholder: 'Ex: SP',
  },
  data: {
    name: 'data',
    label: 'Data',
    type: 'date',
    required: true,
    defaultValue: new Date().toLocaleDateString('pt-BR'),
  },
  valor_causa: {
    name: 'valor_causa',
    label: 'Valor da Causa (R$)',
    type: 'number',
    required: true,
    placeholder: '10.000,00',
  },
  advogado_nome: {
    name: 'advogado_nome',
    label: 'Nome do Advogado',
    type: 'text',
    required: true,
    placeholder: 'Dr./Dra. Nome Completo',
  },
  advogado_oab: {
    name: 'advogado_oab',
    label: 'OAB do Advogado',
    type: 'text',
    required: true,
    placeholder: 'OAB/SP 000.000',
  },
  fatos: {
    name: 'fatos',
    label: 'Narrativa dos Fatos',
    type: 'textarea',
    required: true,
    placeholder: 'Descreva os fatos de forma clara e cronológica...',
  },
  fundamentos: {
    name: 'fundamentos',
    label: 'Fundamentos Jurídicos',
    type: 'textarea',
    required: false,
    placeholder: 'Legislação, doutrina e jurisprudência aplicáveis...',
  },
  pedidos: {
    name: 'pedidos',
    label: 'Pedidos',
    type: 'textarea',
    required: true,
    placeholder: 'Liste todos os pedidos formulados...',
  },
};

// ─── Template Definitions ────────────────────────────────────────────────────

export const PETITION_TEMPLATES: PetitionTemplate[] = [
  // ── 1. Petição Inicial (Cível) ───────────────────────────────────────────
  {
    id: 'inicial-civel',
    name: 'Petição Inicial (Cível)',
    category: 'peticao_inicial',
    description: 'Petição inicial para ações cíveis em geral, com estrutura completa de qualificação, fatos, fundamentos e pedidos.',
    petitionType: 'inicial',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_rg,
      COMMON_VARIABLES.cliente_profissao,
      COMMON_VARIABLES.cliente_endereco,
      COMMON_VARIABLES.parte_contraria,
      COMMON_VARIABLES.parte_contraria_cnpj,
      COMMON_VARIABLES.fatos,
      COMMON_VARIABLES.fundamentos,
      COMMON_VARIABLES.pedidos,
      COMMON_VARIABLES.valor_causa,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

PETIÇÃO INICIAL

{{cliente_nome}}, {{cliente_profissao}}, portador(a) do RG n.º {{cliente_rg}} e inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, por seu(sua) advogado(a) que esta subscreve (instrumento de mandato anexo), vem, respeitosamente, à presença de Vossa Excelência, propor a presente

AÇÃO [TIPO DA AÇÃO]

em face de {{parte_contraria}}, inscrito(a) no CPF/CNPJ sob o n.º {{parte_contraria_cnpj}}, pelos fatos e fundamentos de direito a seguir expostos:

I – DOS FATOS

{{fatos}}

II – DO DIREITO

{{fundamentos}}

III – DOS PEDIDOS

Ante o exposto, requer a Vossa Excelência:

{{pedidos}}

a) A citação da parte Requerida, no endereço supra, para, querendo, contestar a presente ação, sob pena de revelia e confissão ficta;

b) A produção de todas as provas admitidas em direito, especialmente documental, testemunhal e pericial, que se fizerem necessárias;

c) A procedência total dos pedidos formulados;

d) A condenação da parte Requerida ao pagamento de custas processuais e honorários advocatícios, nos termos do art. 85 do CPC/2015.

Dá-se à causa o valor de R$ {{valor_causa}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 2. Contestação ───────────────────────────────────────────────────────
  {
    id: 'contestacao',
    name: 'Contestação',
    category: 'defesa',
    description: 'Resposta do réu com preliminares, impugnação ao mérito e pedidos de improcedência.',
    petitionType: 'contestacao',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'preliminares',
        label: 'Preliminares (se houver)',
        type: 'textarea',
        required: false,
        placeholder: 'Inépcia da inicial, falta de interesse processual, ilegitimidade de parte, etc.',
      },
      {
        name: 'impugnacao_merito',
        label: 'Impugnação ao Mérito',
        type: 'textarea',
        required: true,
        placeholder: 'Conteste ponto a ponto os fatos e fundamentos da petição inicial...',
      },
      COMMON_VARIABLES.fundamentos,
      COMMON_VARIABLES.valor_causa,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

Autos n.º {{numero_processo}}

CONTESTAÇÃO

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, Réu(Ré) nos autos da ação em referência, proposta por {{parte_contraria}}, por seu(sua) advogado(a) que esta subscreve, vem, tempestivamente e com fundamento no art. 335 do CPC/2015, apresentar

CONTESTAÇÃO

pelos motivos de fato e de direito a seguir aduzidos:

I – DAS PRELIMINARES

{{preliminares}}

II – DA IMPUGNAÇÃO AO MÉRITO

{{impugnacao_merito}}

III – DO DIREITO

{{fundamentos}}

IV – DOS PEDIDOS

Ante o exposto, requer a Vossa Excelência:

a) O acolhimento das preliminares arguidas, com a extinção do processo sem resolução do mérito, nos termos do art. 485 do CPC/2015;

b) No mérito, a total improcedência dos pedidos formulados na exordial;

c) A produção de todas as provas admitidas em direito;

d) A condenação da parte Autora ao pagamento de custas processuais e honorários advocatícios, na forma do art. 85 do CPC/2015.

Dá-se à contestação o valor de R$ {{valor_causa}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 3. Embargos de Declaração ────────────────────────────────────────────
  {
    id: 'embargos-declaracao',
    name: 'Embargos de Declaração',
    category: 'recurso',
    description: 'Recurso para sanar omissão, obscuridade, contradição ou erro material em decisão ou acórdão.',
    petitionType: 'embargo',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'tipo_decisao',
        label: 'Tipo da Decisão Embargada',
        type: 'select',
        required: true,
        options: ['sentença', 'acórdão', 'decisão interlocutória', 'despacho'],
      },
      {
        name: 'data_decisao',
        label: 'Data da Decisão Embargada',
        type: 'date',
        required: true,
      },
      {
        name: 'vicio',
        label: 'Vício a ser sanado',
        type: 'select',
        required: true,
        options: ['omissão', 'obscuridade', 'contradição', 'erro material'],
      },
      {
        name: 'fundamentacao_embargo',
        label: 'Fundamentação dos Embargos',
        type: 'textarea',
        required: true,
        placeholder: 'Aponte especificamente o vício da decisão e como ele deve ser corrigido...',
      },
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

Autos n.º {{numero_processo}}

EMBARGOS DE DECLARAÇÃO

{{cliente_nome}}, parte nos autos em referência, por seu(sua) advogado(a) infra-assinado(a), com fulcro no art. 1.022 do CPC/2015, vem, tempestivamente, opor os presentes

EMBARGOS DE DECLARAÇÃO

em face da {{tipo_decisao}} prolatada em {{data_decisao}}, nos autos da ação promovida em face de {{parte_contraria}}, pelos motivos que passa a expor:

I – DA TEMPESTIVIDADE

Os presentes embargos são tempestivos, eis que interpostos dentro do prazo legal de 5 (cinco) dias úteis, previsto no art. 1.023 do CPC/2015.

II – DA ADMISSIBILIDADE

Nos termos do art. 1.022 do CPC/2015, os Embargos de Declaração têm cabimento quando houver {{vicio}} na decisão embargada.

III – DA {{vicio}} A SER SANADA

{{fundamentacao_embargo}}

IV – DO PEDIDO

Ante o exposto, requer a Vossa Excelência o conhecimento e provimento dos presentes Embargos de Declaração, para que seja sanada a {{vicio}} apontada, com os efeitos previstos no art. 1.025 do CPC/2015.

Requer, outrossim, que os presentes embargos sejam recebidos com efeito infringente, dado que a omissão/obscuridade/contradição/erro material, se sanada, poderá alterar o resultado do julgamento.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 4. Recurso de Apelação ───────────────────────────────────────────────
  {
    id: 'apelacao',
    name: 'Recurso de Apelação',
    category: 'recurso',
    description: 'Recurso de apelação cível contra sentença de primeiro grau, com razões recursais completas.',
    petitionType: 'recurso',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'data_sentenca',
        label: 'Data da Sentença',
        type: 'date',
        required: true,
      },
      {
        name: 'data_intimacao',
        label: 'Data da Intimação',
        type: 'date',
        required: true,
      },
      {
        name: 'resumo_sentenca',
        label: 'Resumo da Sentença Recorrida',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o teor da sentença que está sendo impugnada...',
      },
      {
        name: 'razoes_recurso',
        label: 'Razões do Recurso',
        type: 'textarea',
        required: true,
        placeholder: 'Exponha os fundamentos de fato e de direito que justificam a reforma da sentença...',
      },
      {
        name: 'pedido_provimento',
        label: 'Pedido de Provimento',
        type: 'textarea',
        required: true,
        placeholder: 'Especifique o que pretende com o recurso (reforma total/parcial, anulação, etc.)...',
      },
      COMMON_VARIABLES.valor_causa,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

Autos n.º {{numero_processo}}

RECURSO DE APELAÇÃO

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, parte nos autos da ação em referência, por seu(sua) advogado(a) que esta subscreve, vem, tempestivamente, com fundamento nos arts. 1.009 e seguintes do CPC/2015, interpor o presente

RECURSO DE APELAÇÃO

em face da sentença prolatada em {{data_sentenca}}, da qual foi intimado(a) em {{data_intimacao}}, nos autos da ação ajuizada em face de {{parte_contraria}}, pelos fundamentos a seguir expostos.

I – DA TEMPESTIVIDADE E PREPARO

O presente recurso é tempestivo, eis que interposto dentro do prazo de 15 (quinze) dias úteis estabelecido no art. 1.003, § 5.º, do CPC/2015. O preparo recursal será recolhido na forma da lei.

II – DA SENTENÇA RECORRIDA

{{resumo_sentenca}}

III – DAS RAZÕES DO RECURSO

{{razoes_recurso}}

IV – DO PEDIDO

Ante o exposto, requer o recorrente a Vossa Excelência:

a) O recebimento e processamento do presente recurso, com a remessa dos autos ao Egrégio Tribunal de Justiça do Estado do(a) {{estado}};

{{pedido_provimento}}

b) A condenação da parte recorrida ao pagamento de custas e honorários advocatícios recursais, nos termos do art. 85, § 11, do CPC/2015.

Dá-se à causa o valor de R$ {{valor_causa}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 5. Tutela de Urgência ────────────────────────────────────────────────
  {
    id: 'tutela-urgencia',
    name: 'Tutela de Urgência (Antecipada/Cautelar)',
    category: 'urgencia',
    description: 'Pedido de tutela provisória de urgência, antecipada ou cautelar, com demonstração de fumus boni iuris e periculum in mora.',
    petitionType: 'tutela',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'tipo_tutela',
        label: 'Tipo de Tutela',
        type: 'select',
        required: true,
        options: ['antecipada', 'cautelar', 'antecipada em caráter antecedente', 'cautelar em caráter antecedente'],
      },
      {
        name: 'fumus_boni_iuris',
        label: 'Fumus Boni Iuris (Probabilidade do Direito)',
        type: 'textarea',
        required: true,
        placeholder: 'Demonstre a probabilidade do direito pleiteado com base nos fatos e no direito...',
      },
      {
        name: 'periculum_in_mora',
        label: 'Periculum in Mora (Perigo de Dano)',
        type: 'textarea',
        required: true,
        placeholder: 'Demonstre o perigo de dano ou risco ao resultado útil do processo...',
      },
      {
        name: 'pedido_tutela',
        label: 'Medida Urgente Pleiteada',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva de forma precisa a medida urgente que está sendo requerida...',
      },
      COMMON_VARIABLES.fatos,
      COMMON_VARIABLES.fundamentos,
      COMMON_VARIABLES.pedidos,
      COMMON_VARIABLES.valor_causa,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

AÇÃO [TIPO DA AÇÃO] COM PEDIDO DE TUTELA {{tipo_tutela}} DE URGÊNCIA

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, por seu(sua) advogado(a) que esta subscreve, vem propor a presente ação em face de {{parte_contraria}}, requerendo, de plano, a concessão de tutela provisória {{tipo_tutela}} de urgência, nos termos dos arts. 294 e seguintes do CPC/2015.

I – DOS FATOS

{{fatos}}

II – DA TUTELA DE URGÊNCIA

O pleito de urgência deve ser deferido pela presença dos requisitos legais:

2.1. Da Probabilidade do Direito (Fumus Boni Iuris)

{{fumus_boni_iuris}}

2.2. Do Perigo de Dano ou Risco ao Resultado Útil do Processo (Periculum in Mora)

{{periculum_in_mora}}

2.3. Da Medida Urgente

{{pedido_tutela}}

III – DO DIREITO

{{fundamentos}}

IV – DOS PEDIDOS

Ante o exposto, requer a Vossa Excelência:

a) DE PLANO, a concessão da tutela provisória {{tipo_tutela}} de urgência, inaudita altera parte, nos termos do art. 300 do CPC/2015, para:

{{pedido_tutela}}

b) A citação da parte Requerida para, querendo, contestar a presente ação;

{{pedidos}}

c) A procedência dos pedidos ao final;

d) A condenação da parte Requerida ao pagamento de custas e honorários advocatícios.

Dá-se à causa o valor de R$ {{valor_causa}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 6. Mandado de Segurança ──────────────────────────────────────────────
  {
    id: 'mandado-seguranca',
    name: 'Mandado de Segurança',
    category: 'constitucional',
    description: 'Ação constitucional para proteção de direito líquido e certo contra ato de autoridade pública.',
    petitionType: 'mandado_seguranca',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      {
        name: 'autoridade_coatora',
        label: 'Autoridade Coatora',
        type: 'text',
        required: true,
        placeholder: 'Ex: Secretário de Estado de Saúde, Diretor de...',
      },
      {
        name: 'orgao_autoridade',
        label: 'Órgão / Entidade da Autoridade',
        type: 'text',
        required: true,
        placeholder: 'Ex: Secretaria de Estado de Saúde de SP',
      },
      {
        name: 'ato_coator',
        label: 'Ato Coator',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o ato ilegal ou abusivo praticado pela autoridade coatora...',
      },
      {
        name: 'direito_liquido_certo',
        label: 'Direito Líquido e Certo',
        type: 'textarea',
        required: true,
        placeholder: 'Demonstre o direito subjetivo claro e comprovado documentalmente...',
      },
      COMMON_VARIABLES.fatos,
      COMMON_VARIABLES.fundamentos,
      {
        name: 'pedido_liminar',
        label: 'Pedido Liminar (se houver)',
        type: 'textarea',
        required: false,
        placeholder: 'Fundamente o pedido de medida liminar inaudita altera parte...',
      },
      COMMON_VARIABLES.pedidos,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

MANDADO DE SEGURANÇA COM PEDIDO DE MEDIDA LIMINAR

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, por seu(sua) advogado(a) que esta subscreve, com fundamento no art. 5.º, LXIX e LXX, da Constituição Federal, e na Lei n.º 12.016/2009, vem impetrar o presente

MANDADO DE SEGURANÇA

contra ato ilegal e abusivo praticado por {{autoridade_coatora}}, do(a) {{orgao_autoridade}}, pelas razões de fato e de direito a seguir expostas:

I – DA LEGITIMIDADE E COMPETÊNCIA

O(A) impetrante é parte legítima para a impetração do presente writ, eis que é diretamente prejudicado(a) pelo ato coator ora impugnado.

II – DO ATO COATOR

{{ato_coator}}

III – DOS FATOS

{{fatos}}

IV – DO DIREITO LÍQUIDO E CERTO

{{direito_liquido_certo}}

V – DO DIREITO

{{fundamentos}}

Em especial, invoca-se o art. 5.º, LXIX, da Constituição Federal: "conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público."

VI – DA MEDIDA LIMINAR

{{pedido_liminar}}

Presentes os requisitos do fumus boni iuris e do periculum in mora, requer-se a concessão de medida liminar nos termos do art. 7.º, III, da Lei n.º 12.016/2009.

VII – DOS PEDIDOS

Ante o exposto, requer-se:

a) A concessão de medida liminar, inaudita altera parte, para suspender os efeitos do ato coator;

b) A notificação da autoridade coatora para prestação de informações no prazo legal;

c) A ouvida do representante do Ministério Público;

{{pedidos}}

d) A concessão definitiva da segurança, confirmando a liminar, para anular o ato ilegal ora impugnado;

e) A condenação da autoridade coatora às custas processuais.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 7. Habeas Corpus ─────────────────────────────────────────────────────
  {
    id: 'habeas-corpus',
    name: 'Habeas Corpus',
    category: 'constitucional',
    description: 'Ação constitucional para proteção da liberdade de locomoção contra coação ilegal.',
    petitionType: 'habeas_corpus',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      {
        name: 'paciente_nome',
        label: 'Nome do Paciente',
        type: 'text',
        required: true,
        placeholder: 'Nome completo do paciente (pode ser o próprio cliente)',
      },
      {
        name: 'paciente_cpf',
        label: 'CPF do Paciente',
        type: 'text',
        required: false,
        placeholder: '000.000.000-00',
      },
      {
        name: 'autoridade_coatora',
        label: 'Autoridade Coatora',
        type: 'text',
        required: true,
        placeholder: 'Ex: MM. Juiz da 5ª Vara Criminal, Delegado de...',
      },
      {
        name: 'tipo_constrangimento',
        label: 'Tipo de Constrangimento',
        type: 'select',
        required: true,
        options: ['prisão ilegal', 'ameaça à liberdade de locomoção', 'prisão preventiva ilegal', 'excesso de prazo', 'falta de fundamentação da prisão'],
      },
      {
        name: 'constrangimento_ilegal',
        label: 'Constrangimento Ilegal',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o constrangimento ilegal sofrido pelo paciente...',
      },
      COMMON_VARIABLES.fatos,
      COMMON_VARIABLES.fundamentos,
      {
        name: 'pedido_liminar_hc',
        label: 'Pedido de Liminar',
        type: 'textarea',
        required: false,
        placeholder: 'Fundamente o pedido de concessão de liminar...',
      },
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

HABEAS CORPUS COM PEDIDO DE LIMINAR

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, por seu(sua) advogado(a) que esta subscreve, com fundamento no art. 5.º, LXVIII, da Constituição Federal e nos arts. 647 e seguintes do Código de Processo Penal, vem impetrar o presente

HABEAS CORPUS COM PEDIDO DE LIMINAR

em favor de {{paciente_nome}}, CPF n.º {{paciente_cpf}}, em face de constrangimento ilegal praticado por {{autoridade_coatora}}, pelos motivos a seguir expostos:

I – DO PACIENTE E DO IMPETRANTE

O paciente {{paciente_nome}} está sofrendo {{tipo_constrangimento}}, conforme se demonstrará.

II – DOS FATOS

{{fatos}}

III – DO CONSTRANGIMENTO ILEGAL

{{constrangimento_ilegal}}

IV – DO DIREITO

{{fundamentos}}

Nos termos do art. 648 do CPP, a coação é considerada ilegal quando:
- não houver justa causa;
- alguém estiver preso por mais tempo do que determina a lei;
- quem ordenar a coação não tiver competência para fazê-lo;
- houver cessado o motivo que autorizou a coação;
- não for alguém admitido a prestar fiança, nos casos em que a lei a autoriza;
- o processo for manifestamente nulo;
- extinta a punibilidade.

V – DA LIMINAR

{{pedido_liminar_hc}}

Presentes os requisitos para a concessão liminar, requer-se que seja expedida ordem de soltura em favor do paciente ou suspensão dos efeitos do ato coator, até julgamento final do writ.

VI – DOS PEDIDOS

Ante o exposto, requer-se:

a) A concessão de medida liminar para fazer cessar imediatamente o constrangimento ilegal;

b) A notificação da autoridade coatora para prestação de informações;

c) A ouvida do representante do Ministério Público;

d) A concessão definitiva da ordem de habeas corpus, para que seja reconhecida a ilegalidade do ato coator, expedindo-se o competente alvará de soltura ou cessando o constrangimento;

e) A condenação nas custas processuais.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 8. Agravo de Instrumento ─────────────────────────────────────────────
  {
    id: 'agravo-instrumento',
    name: 'Agravo de Instrumento',
    category: 'recurso',
    description: 'Recurso contra decisões interlocutórias passíveis de agravo, com pedido de efeito suspensivo.',
    petitionType: 'agravo',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'data_decisao',
        label: 'Data da Decisão Agravada',
        type: 'date',
        required: true,
      },
      {
        name: 'data_intimacao',
        label: 'Data da Intimação',
        type: 'date',
        required: true,
      },
      {
        name: 'resumo_decisao',
        label: 'Resumo da Decisão Agravada',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o teor da decisão interlocutória que está sendo impugnada...',
      },
      {
        name: 'razoes_agravo',
        label: 'Razões do Agravo',
        type: 'textarea',
        required: true,
        placeholder: 'Fundamente por que a decisão deve ser reformada...',
      },
      {
        name: 'pedido_efeito_suspensivo',
        label: 'Pedido de Efeito Suspensivo / Antecipação de Tutela',
        type: 'textarea',
        required: false,
        placeholder: 'Fundamente o pedido de efeito suspensivo ou tutela recursal...',
      },
      COMMON_VARIABLES.valor_causa,
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EGRÉGIO TRIBUNAL DE JUSTIÇA DO ESTADO DO(A) {{estado}}

AGRAVO DE INSTRUMENTO

Agravante: {{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}
Agravado(a): {{parte_contraria}}
Origem: {{vara}} da Comarca de {{comarca}} - {{estado}}
Processo n.º: {{numero_processo}}

AGRAVO DE INSTRUMENTO

{{cliente_nome}}, por seu(sua) advogado(a) que esta subscreve, vem, com fundamento no art. 1.015 do CPC/2015, interpor o presente

AGRAVO DE INSTRUMENTO

contra a decisão interlocutória proferida em {{data_decisao}}, da qual foi intimado(a) em {{data_intimacao}}, pelo(a) MM.(a) Juiz(a) de Direito da {{vara}} da Comarca de {{comarca}}, nos autos do processo n.º {{numero_processo}}, ajuizado em face de {{parte_contraria}}.

I – DA TEMPESTIVIDADE E PREPARO

O presente agravo é tempestivo, eis que interposto dentro do prazo de 15 (quinze) dias úteis previsto no art. 1.003, § 5.º, do CPC/2015. O preparo será recolhido na forma da lei.

II – DA DECISÃO AGRAVADA

{{resumo_decisao}}

III – DAS RAZÕES DO AGRAVO

{{razoes_agravo}}

IV – DO PEDIDO DE EFEITO SUSPENSIVO / TUTELA RECURSAL

{{pedido_efeito_suspensivo}}

V – DOS PEDIDOS

Ante o exposto, requer-se:

a) O conhecimento e provimento do presente agravo de instrumento;

b) A concessão de efeito suspensivo ou tutela recursal, nos termos do art. 1.019, I, do CPC/2015;

c) A reforma da decisão agravada;

d) A intimação do(a) agravado(a) para, querendo, responder ao agravo no prazo legal;

e) A condenação do(a) agravado(a) ao pagamento de custas e honorários advocatícios recursais.

Dá-se ao recurso o valor de R$ {{valor_causa}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 9. Cumprimento de Sentença ───────────────────────────────────────────
  {
    id: 'cumprimento-sentenca',
    name: 'Cumprimento de Sentença',
    category: 'execucao',
    description: 'Requerimento de cumprimento de sentença condenatória ao pagamento de quantia certa.',
    petitionType: 'outro',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.numero_processo,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      COMMON_VARIABLES.parte_contraria,
      {
        name: 'data_sentenca',
        label: 'Data do Trânsito em Julgado',
        type: 'date',
        required: true,
      },
      {
        name: 'valor_principal',
        label: 'Valor Principal',
        type: 'number',
        required: true,
        placeholder: '10.000,00',
      },
      {
        name: 'valor_juros',
        label: 'Valor dos Juros',
        type: 'number',
        required: false,
        placeholder: '0,00',
      },
      {
        name: 'valor_correcao',
        label: 'Valor da Correção Monetária',
        type: 'number',
        required: false,
        placeholder: '0,00',
      },
      {
        name: 'valor_honorarios',
        label: 'Valor dos Honorários',
        type: 'number',
        required: false,
        placeholder: '0,00',
      },
      {
        name: 'valor_total',
        label: 'Valor Total Atualizado',
        type: 'number',
        required: true,
        placeholder: '12.500,00',
      },
      {
        name: 'bens_devedores',
        label: 'Bens do Devedor Conhecidos',
        type: 'textarea',
        required: false,
        placeholder: 'Indique bens do devedor passíveis de penhora (imóveis, veículos, saldos em contas, etc.)...',
      },
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

Autos n.º {{numero_processo}}

REQUERIMENTO DE CUMPRIMENTO DE SENTENÇA

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, exequente nos autos em referência, por seu(sua) advogado(a) que esta subscreve, vem, com fundamento nos arts. 523 e seguintes do CPC/2015, requerer o cumprimento da sentença prolatada nestes autos, que transitou em julgado em {{data_sentenca}}, em face de {{parte_contraria}}, executado(a).

I – DO DÉBITO ATUALIZADO

Para fins de cumprimento de sentença, apresenta-se o seguinte demonstrativo de débito:

• Valor principal: R$ {{valor_principal}}
• Juros: R$ {{valor_juros}}
• Correção monetária: R$ {{valor_correcao}}
• Honorários advocatícios: R$ {{valor_honorarios}}
• VALOR TOTAL ATUALIZADO: R$ {{valor_total}}

O valor acima foi apurado com base nos índices de atualização determinados na sentença exequenda.

II – DOS BENS DO EXECUTADO

{{bens_devedores}}

III – DOS PEDIDOS

Ante o exposto, requer-se:

a) A intimação do(a) executado(a) {{parte_contraria}} para pagar, no prazo de 15 (quinze) dias, o valor total de R$ {{valor_total}}, sob pena de multa de 10% e honorários advocatícios de 10%, nos termos do art. 523, § 1.º, do CPC/2015;

b) Em caso de inadimplemento, a expedição de mandado de penhora e avaliação dos bens indicados;

c) A realização de pesquisas nos sistemas BACENJUD (SISBAJUD), RENAJUD e INFOJUD para localização de bens do executado;

d) O prosseguimento da execução até final pagamento.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },

  // ── 10. Execução de Título Extrajudicial ─────────────────────────────────
  {
    id: 'execucao-extrajudicial',
    name: 'Execução de Título Extrajudicial',
    category: 'execucao',
    description: 'Ação de execução fundada em título extrajudicial (cheque, nota promissória, contrato, etc.).',
    petitionType: 'outro',
    variables: [
      COMMON_VARIABLES.vara,
      COMMON_VARIABLES.comarca,
      COMMON_VARIABLES.estado,
      COMMON_VARIABLES.cliente_nome,
      COMMON_VARIABLES.cliente_cpf,
      COMMON_VARIABLES.cliente_endereco,
      COMMON_VARIABLES.parte_contraria,
      COMMON_VARIABLES.parte_contraria_cnpj,
      {
        name: 'tipo_titulo',
        label: 'Tipo do Título Executivo',
        type: 'select',
        required: true,
        options: ['cheque', 'nota promissória', 'duplicata', 'cédula de crédito', 'contrato de mútuo', 'contrato de prestação de serviços', 'escritura pública', 'confissão de dívida'],
      },
      {
        name: 'descricao_titulo',
        label: 'Descrição do Título',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o título executivo: número, data de emissão, vencimento, etc...',
      },
      {
        name: 'valor_principal',
        label: 'Valor Principal',
        type: 'number',
        required: true,
        placeholder: '10.000,00',
      },
      {
        name: 'valor_total',
        label: 'Valor Total Atualizado',
        type: 'number',
        required: true,
        placeholder: '12.500,00',
      },
      {
        name: 'bens_devedores',
        label: 'Bens do Executado Conhecidos',
        type: 'textarea',
        required: false,
        placeholder: 'Indique bens do devedor passíveis de penhora...',
      },
      COMMON_VARIABLES.advogado_nome,
      COMMON_VARIABLES.advogado_oab,
      COMMON_VARIABLES.data,
    ],
    content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} DA COMARCA DE {{comarca}} - {{estado}}

AÇÃO DE EXECUÇÃO DE TÍTULO EXTRAJUDICIAL

{{cliente_nome}}, inscrito(a) no CPF/MF sob o n.º {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, por seu(sua) advogado(a) que esta subscreve, vem, com fundamento nos arts. 784 e seguintes do CPC/2015, propor a presente

AÇÃO DE EXECUÇÃO DE TÍTULO EXTRAJUDICIAL

em face de {{parte_contraria}}, inscrito(a) no CPF/CNPJ sob o n.º {{parte_contraria_cnpj}}, pelos motivos a seguir expostos:

I – DO TÍTULO EXECUTIVO EXTRAJUDICIAL

O crédito ora executado é fundado em {{tipo_titulo}}, título executivo extrajudicial, nos termos do art. 784 do CPC/2015, conforme se demonstra:

{{descricao_titulo}}

II – DO VALOR EXEQUENDO

• Valor principal: R$ {{valor_principal}}
• Valor total atualizado: R$ {{valor_total}}

III – DOS BENS DO EXECUTADO

{{bens_devedores}}

IV – DOS PEDIDOS

Ante o exposto, requer-se:

a) O recebimento da presente execução e a expedição de mandado de citação do(a) executado(a) {{parte_contraria}} para pagar a dívida no prazo de 3 (três) dias, ou nomear bens à penhora, nos termos do art. 829 do CPC/2015;

b) Em caso de não pagamento, a penhora e avaliação dos bens indicados;

c) A realização de pesquisas nos sistemas SISBAJUD (antigo BACENJUD), RENAJUD e INFOJUD;

d) A expedição de carta precatória ou rogatória, se necessário;

e) O prosseguimento da execução até o final pagamento, incluindo custas, honorários advocatícios e demais encargos.

Dá-se à causa o valor de R$ {{valor_total}}.

Termos em que,
Pede deferimento.

{{comarca}} - {{estado}}, {{data}}.

{{advogado_nome}}
{{advogado_oab}}`,
  },
];

// ─── Template Engine Functions ───────────────────────────────────────────────

/**
 * Replaces all {{variable}} placeholders in the template content with the
 * provided values. Unfilled required placeholders are left as-is so they
 * are visible in the preview.
 */
export function fillTemplate(
  template: PetitionTemplate,
  values: Record<string, string>
): string {
  let result = template.content;
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Returns all templates belonging to the given category.
 */
export function getTemplatesByCategory(category: TemplateCategory): PetitionTemplate[] {
  return PETITION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Validates that all required variables have non-empty values.
 * Returns an object with a `valid` flag and a list of missing field labels.
 */
export function validateTemplateVariables(
  template: PetitionTemplate,
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const variable of template.variables) {
    if (variable.required && !values[variable.name]?.trim()) {
      missing.push(variable.label);
    }
  }
  return { valid: missing.length === 0, missing };
}

/**
 * Returns a template by its id, or undefined if not found.
 */
export function getTemplateById(id: string): PetitionTemplate | undefined {
  return PETITION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Returns all distinct categories that have at least one template, with
 * Portuguese labels for display.
 */
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  peticao_inicial: 'Petição Inicial',
  defesa: 'Defesa',
  recurso: 'Recursos',
  urgencia: 'Tutela de Urgência',
  constitucional: 'Ações Constitucionais',
  execucao: 'Execução',
};
