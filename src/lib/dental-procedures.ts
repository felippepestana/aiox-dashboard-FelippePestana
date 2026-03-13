// =============================================================================
// Dental Procedures Database - Sbarzi Odontologia e Saúde
// Comprehensive Brazilian dental procedures with CRO/TUSS codes
// =============================================================================

import {
  DentalProcedure,
  ProcedureCategory,
  ToothRegion,
} from '@/types/dental';

/**
 * Comprehensive database of common dental procedures used in Brazilian
 * dentistry, with proper TUSS/CRO codes, Brazilian Portuguese terminology,
 * and reference prices based on VRCO guidelines.
 *
 * Prices are stored in centavos (BRL × 100).
 */
export const DENTAL_PROCEDURES: DentalProcedure[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // PREVENTIVE (Prevenção)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prev-001',
    code: '81000030',
    name: 'Profilaxia Dentária (Limpeza)',
    description:
      'Remoção de placa bacteriana e tártaro supragengival com ultrassom e polimento coronário.',
    category: ProcedureCategory.PREVENTIVE,
    region: ToothRegion.FULL_MOUTH,
    images: [],
    videoUrl: null,
    estimatedDuration: 40,
    complexity: 1,
    contraindications: ['Hemofilia severa sem controle'],
    steps: [
      'Avaliação inicial da cavidade bucal',
      'Remoção de tártaro supragengival com ultrassom',
      'Raspagem manual com curetas quando necessário',
      'Polimento coronário com pasta profilática',
      'Aplicação de flúor',
      'Orientação de higiene bucal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 15000,
    toothNumbers: [ToothRegion.FULL_MOUTH],
  },
  {
    id: 'prev-002',
    code: '81000065',
    name: 'Aplicação Tópica de Flúor',
    description:
      'Aplicação de fluoreto em gel ou verniz para prevenção de cáries e fortalecimento do esmalte.',
    category: ProcedureCategory.PREVENTIVE,
    region: ToothRegion.FULL_MOUTH,
    images: [],
    videoUrl: null,
    estimatedDuration: 15,
    complexity: 1,
    contraindications: ['Alergia a compostos fluoretados'],
    steps: [
      'Profilaxia prévia',
      'Secagem dos dentes',
      'Aplicação do flúor com moldeira ou pincel',
      'Tempo de espera (1-4 minutos conforme produto)',
      'Remoção do excesso',
      'Orientação para não comer/beber por 30 minutos',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 8000,
    toothNumbers: [ToothRegion.FULL_MOUTH],
  },
  {
    id: 'prev-003',
    code: '81000049',
    name: 'Selante de Fissuras',
    description:
      'Aplicação de material resinoso nas fissuras e fossetas de pré-molares e molares para prevenção de cáries.',
    category: ProcedureCategory.PREVENTIVE,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 20,
    complexity: 1,
    contraindications: ['Cárie ativa no dente', 'Alergia a metacrilatos'],
    steps: [
      'Profilaxia do dente',
      'Isolamento relativo',
      'Condicionamento ácido do esmalte',
      'Lavagem e secagem',
      'Aplicação do selante',
      'Fotopolimerização',
      'Verificação de oclusão',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 7000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RESTORATIVE (Dentística Restauradora)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'rest-001',
    code: '82000034',
    name: 'Restauração em Resina Composta (1 face)',
    description:
      'Restauração direta com resina composta fotopolimerizável em uma face dentária.',
    category: ProcedureCategory.RESTORATIVE,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 40,
    complexity: 2,
    contraindications: ['Alergia a metacrilatos', 'Bruxismo severo sem tratamento (relativo)'],
    steps: [
      'Anestesia local',
      'Seleção de cor da resina',
      'Isolamento absoluto',
      'Remoção de tecido cariado',
      'Proteção do complexo dentino-pulpar',
      'Condicionamento ácido',
      'Aplicação de sistema adesivo',
      'Inserção incremental de resina',
      'Fotopolimerização',
      'Acabamento e polimento',
      'Verificação oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 18000,
    toothNumbers: [],
  },
  {
    id: 'rest-002',
    code: '82000042',
    name: 'Restauração em Resina Composta (2 faces)',
    description:
      'Restauração direta com resina composta envolvendo duas faces dentárias.',
    category: ProcedureCategory.RESTORATIVE,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 50,
    complexity: 2,
    contraindications: ['Alergia a metacrilatos'],
    steps: [
      'Anestesia local',
      'Seleção de cor da resina',
      'Isolamento absoluto',
      'Remoção de tecido cariado',
      'Colocação de matriz e cunha',
      'Proteção do complexo dentino-pulpar',
      'Condicionamento ácido e adesivo',
      'Inserção incremental de resina',
      'Fotopolimerização de cada incremento',
      'Remoção de matriz',
      'Acabamento, polimento e ajuste oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 22000,
    toothNumbers: [],
  },
  {
    id: 'rest-003',
    code: '82000050',
    name: 'Restauração em Resina Composta (3 faces)',
    description:
      'Restauração direta com resina composta envolvendo três ou mais faces dentárias.',
    category: ProcedureCategory.RESTORATIVE,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: ['Alergia a metacrilatos', 'Destruição coronária extensa (avaliar prótese)'],
    steps: [
      'Anestesia local',
      'Seleção de cor da resina',
      'Isolamento absoluto',
      'Remoção de tecido cariado',
      'Avaliação da necessidade de pino intrarradicular',
      'Proteção do complexo dentino-pulpar',
      'Condicionamento ácido e adesivo',
      'Reconstrução da anatomia com incrementos',
      'Fotopolimerização',
      'Acabamento, polimento e ajuste oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 28000,
    toothNumbers: [],
  },
  {
    id: 'rest-004',
    code: '82000069',
    name: 'Restauração em Amálgama (1 face)',
    description:
      'Restauração direta com amálgama de prata em uma face dentária.',
    category: ProcedureCategory.RESTORATIVE,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: ['Alergia a metais', 'Estética anterior'],
    steps: [
      'Anestesia local',
      'Isolamento relativo',
      'Remoção de tecido cariado',
      'Preparo cavitário',
      'Trituração do amálgama',
      'Condensação e escultura',
      'Brunidura',
      'Verificação oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 12000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ENDODONTICS (Endodontia)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'endo-001',
    code: '83000046',
    name: 'Tratamento Endodôntico Unirradicular',
    description:
      'Tratamento de canal em dente com uma raiz (incisivos, caninos). Inclui abertura, instrumentação, irrigação e obturação.',
    category: ProcedureCategory.ENDODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: ['Fratura radicular vertical', 'Reabsorção radicular extensa'],
    steps: [
      'Radiografia inicial',
      'Anestesia local',
      'Isolamento absoluto',
      'Abertura coronária',
      'Localização do canal',
      'Odontometria (localizador apical + radiografia)',
      'Instrumentação do canal (mecanizada/manual)',
      'Irrigação com hipoclorito de sódio',
      'Medicação intracanal (se necessário)',
      'Secagem do canal',
      'Obturação com guta-percha e cimento',
      'Radiografia final',
      'Restauração provisória',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 60000,
    toothNumbers: [],
  },
  {
    id: 'endo-002',
    code: '83000054',
    name: 'Tratamento Endodôntico Birradicular',
    description:
      'Tratamento de canal em dente com duas raízes (pré-molares). Inclui abertura, instrumentação, irrigação e obturação.',
    category: ProcedureCategory.ENDODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 90,
    complexity: 3,
    contraindications: ['Fratura radicular vertical', 'Perfuração de furca irreparável'],
    steps: [
      'Radiografia inicial',
      'Anestesia local',
      'Isolamento absoluto',
      'Abertura coronária',
      'Localização dos canais',
      'Odontometria de cada canal',
      'Instrumentação dos canais',
      'Irrigação abundante',
      'Medicação intracanal',
      'Obturação dos canais',
      'Radiografia final',
      'Restauração provisória',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 80000,
    toothNumbers: [],
  },
  {
    id: 'endo-003',
    code: '83000062',
    name: 'Tratamento Endodôntico Multirradicular',
    description:
      'Tratamento de canal em dente com três ou mais raízes (molares). Procedimento complexo com múltiplos canais.',
    category: ProcedureCategory.ENDODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 120,
    complexity: 4,
    contraindications: ['Fratura radicular vertical', 'Destruição óssea severa'],
    steps: [
      'Radiografia inicial (periapical e panorâmica)',
      'Anestesia local',
      'Isolamento absoluto',
      'Abertura coronária ampla',
      'Localização de todos os canais (microscopia quando necessário)',
      'Odontometria individual de cada canal',
      'Instrumentação mecanizada de cada canal',
      'Irrigação com hipoclorito e EDTA',
      'Medicação intracanal com hidróxido de cálcio',
      'Obturação termoplástica dos canais',
      'Radiografia final',
      'Restauração provisória',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 100000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PERIODONTICS (Periodontia)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'perio-001',
    code: '84000041',
    name: 'Raspagem Subgengival (por sextante)',
    description:
      'Raspagem e alisamento radicular subgengival para tratamento de doença periodontal.',
    category: ProcedureCategory.PERIODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 45,
    complexity: 3,
    contraindications: ['Distúrbios de coagulação não controlados'],
    steps: [
      'Sondagem periodontal',
      'Anestesia local',
      'Raspagem subgengival com curetas Gracey',
      'Alisamento radicular',
      'Irrigação subgengival',
      'Orientação de higiene',
      'Agendamento de reavaliação (30 dias)',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 20000,
    toothNumbers: [],
  },
  {
    id: 'perio-002',
    code: '84000076',
    name: 'Cirurgia Periodontal a Retalho',
    description:
      'Cirurgia periodontal com rebatimento de retalho mucoperiósteo para acesso direto às superfícies radiculares.',
    category: ProcedureCategory.PERIODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 90,
    complexity: 4,
    contraindications: [
      'Diabete descompensado',
      'Uso de bifosfonatos intravenosos',
      'Cardiopatias descompensadas',
    ],
    steps: [
      'Anestesia local infiltrativa/bloqueio',
      'Incisão intrasulcular',
      'Rebatimento de retalho mucoperiósteo',
      'Debridamento das superfícies radiculares',
      'Remoção de tecido de granulação',
      'Regularização óssea quando indicado',
      'Sutura (pontos simples ou colchoeiro)',
      'Cimento cirúrgico',
      'Prescrição medicamentosa',
      'Remoção de sutura em 7-10 dias',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 50000,
    toothNumbers: [],
  },
  {
    id: 'perio-003',
    code: '84000084',
    name: 'Enxerto Gengival Livre',
    description:
      'Enxerto de tecido gengival livre do palato para aumento de gengiva inserida ou recobrimento radicular.',
    category: ProcedureCategory.PERIODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 90,
    complexity: 4,
    contraindications: [
      'Discrasias sanguíneas',
      'Palato raso sem tecido doador suficiente',
    ],
    steps: [
      'Anestesia local na área receptora e doadora',
      'Preparo do leito receptor',
      'Remoção do enxerto do palato',
      'Adaptação e sutura do enxerto',
      'Sutura da área doadora',
      'Cimento cirúrgico',
      'Controle pós-operatório',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 80000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ORTHODONTICS (Ortodontia)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'orto-001',
    code: '85000047',
    name: 'Aparelho Ortodôntico Fixo Metálico (arcada)',
    description:
      'Instalação de aparelho ortodôntico fixo com braquetes metálicos convencionais em uma arcada.',
    category: ProcedureCategory.ORTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: [
      'Doença periodontal ativa',
      'Higiene bucal deficiente',
      'Cáries ativas não tratadas',
    ],
    steps: [
      'Moldagem e análise de modelos',
      'Documentação ortodôntica',
      'Profilaxia dos dentes',
      'Condicionamento ácido do esmalte',
      'Colagem dos braquetes',
      'Inserção do arco inicial',
      'Amarração com ligaduras',
      'Orientação de higiene e dieta',
      'Agendamento de manutenção mensal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 150000,
    toothNumbers: [],
  },
  {
    id: 'orto-002',
    code: '85000055',
    name: 'Manutenção Ortodôntica Mensal',
    description:
      'Consulta mensal para troca de arcos, ativação de dispositivos e acompanhamento do tratamento ortodôntico.',
    category: ProcedureCategory.ORTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: [],
    steps: [
      'Avaliação do progresso',
      'Remoção de ligaduras',
      'Troca de arco (quando indicado)',
      'Ativação de dispositivos auxiliares',
      'Novas ligaduras',
      'Orientação ao paciente',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 25000,
    toothNumbers: [],
  },
  {
    id: 'orto-003',
    code: '85000098',
    name: 'Alinhador Transparente (arcada)',
    description:
      'Tratamento ortodôntico com alinhadores transparentes removíveis para uma arcada. Inclui planejamento digital.',
    category: ProcedureCategory.ORTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 45,
    complexity: 3,
    contraindications: [
      'Más-oclusões esqueléticas severas',
      'Paciente não colaborador',
    ],
    steps: [
      'Escaneamento intraoral 3D',
      'Planejamento digital do tratamento',
      'Confecção dos alinhadores',
      'Entrega e instrução de uso (22h/dia)',
      'Trocas quinzenais de alinhadores',
      'Acompanhamento periódico',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 600000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SURGERY (Cirurgia)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'cir-001',
    code: '86000042',
    name: 'Exodontia Simples (Extração)',
    description:
      'Extração dentária simples de dente erupcionado com uso de fórceps e/ou alavancas.',
    category: ProcedureCategory.SURGERY,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: [
      'Uso de anticoagulantes sem controle',
      'Infecção aguda sem antibioticoterapia',
    ],
    steps: [
      'Radiografia periapical',
      'Anestesia local',
      'Sindesmotomia',
      'Luxação com alavanca',
      'Extração com fórceps',
      'Curetagem alveolar',
      'Hemostasia',
      'Sutura (quando necessário)',
      'Orientações pós-operatórias',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 20000,
    toothNumbers: [],
  },
  {
    id: 'cir-002',
    code: '86000050',
    name: 'Exodontia de Terceiro Molar Incluso',
    description:
      'Extração cirúrgica de dente do siso incluso ou semi-incluso, com retalho e osteotomia.',
    category: ProcedureCategory.SURGERY,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 4,
    contraindications: [
      'Proximidade com nervo alveolar inferior (avaliar TCFC)',
      'Coagulopatias não controladas',
      'Uso de bifosfonatos',
    ],
    steps: [
      'Radiografia panorâmica e/ou tomografia',
      'Anestesia local (bloqueio)',
      'Incisão e rebatimento de retalho',
      'Osteotomia com broca',
      'Odontossecção quando necessário',
      'Luxação e extração',
      'Curetagem e irrigação do alvéolo',
      'Sutura',
      'Prescrição: analgésico, anti-inflamatório, antibiótico',
      'Remoção de sutura em 7 dias',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 45000,
    toothNumbers: [],
  },
  {
    id: 'cir-003',
    code: '86000085',
    name: 'Frenectomia',
    description:
      'Remoção cirúrgica de freio labial ou lingual para correção de diastemas ou anquiloglossia.',
    category: ProcedureCategory.SURGERY,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: ['Distúrbios de coagulação não controlados'],
    steps: [
      'Anestesia local',
      'Pinçamento do freio',
      'Incisão e remoção do tecido',
      'Sutura',
      'Orientações pós-operatórias',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 30000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPLANTOLOGY (Implantodontia)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'impl-001',
    code: '87000048',
    name: 'Implante Dentário Unitário',
    description:
      'Instalação cirúrgica de implante osseointegrado de titânio em rebordo alveolar.',
    category: ProcedureCategory.IMPLANTOLOGY,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 4,
    contraindications: [
      'Diabete descompensado',
      'Radioterapia recente em região de cabeça e pescoço',
      'Uso de bifosfonatos intravenosos',
      'Insuficiência óssea sem enxerto prévio',
      'Tabagismo severo (relativo)',
    ],
    steps: [
      'Planejamento com tomografia e guia cirúrgico',
      'Anestesia local',
      'Incisão e rebatimento de retalho',
      'Perfuração óssea sequencial (brocas escalonadas)',
      'Instalação do implante com torque adequado',
      'Colocação de parafuso de cobertura ou cicatrizador',
      'Sutura',
      'Aguardar osseointegração (3-6 meses)',
      'Reabertura e moldagem',
      'Instalação da prótese sobre implante',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 350000,
    toothNumbers: [],
  },
  {
    id: 'impl-002',
    code: '87000056',
    name: 'Enxerto Ósseo Autógeno (intraoral)',
    description:
      'Enxerto ósseo com osso autógeno removido de área doadora intraoral (mento ou ramo) para reconstrução de rebordo.',
    category: ProcedureCategory.IMPLANTOLOGY,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 90,
    complexity: 5,
    contraindications: [
      'Área doadora insuficiente',
      'Distúrbios de coagulação',
      'Imunossupressão severa',
    ],
    steps: [
      'Planejamento tomográfico',
      'Anestesia local',
      'Acesso à área doadora',
      'Remoção do bloco ósseo',
      'Preparo do leito receptor',
      'Fixação do enxerto com parafusos de titânio',
      'Preenchimento de gaps com osso particulado',
      'Membrana de colágeno',
      'Sutura das áreas',
      'Aguardar maturação do enxerto (4-6 meses)',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 250000,
    toothNumbers: [],
  },
  {
    id: 'impl-003',
    code: '87000064',
    name: 'Levantamento de Seio Maxilar',
    description:
      'Cirurgia de elevação da membrana do seio maxilar com enxerto ósseo para viabilizar implantes em maxila posterior.',
    category: ProcedureCategory.IMPLANTOLOGY,
    region: ToothRegion.UPPER_ARCH,
    images: [],
    videoUrl: null,
    estimatedDuration: 120,
    complexity: 5,
    contraindications: [
      'Sinusite crônica ativa',
      'Patologias do seio maxilar',
      'Tabagismo severo',
    ],
    steps: [
      'Tomografia computadorizada pré-operatória',
      'Anestesia local',
      'Acesso lateral com janela óssea',
      'Elevação cuidadosa da membrana de Schneider',
      'Preenchimento com biomaterial',
      'Fechamento da janela com membrana',
      'Sutura',
      'Aguardar maturação (6-9 meses)',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 300000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PROSTHODONTICS (Prótese Dentária)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prot-001',
    code: '88000043',
    name: 'Coroa Total em Porcelana (Metal-free)',
    description:
      'Coroa protética unitária em cerâmica pura (dissilicato de lítio ou zircônia) sem infraestrutura metálica.',
    category: ProcedureCategory.PROSTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: ['Bruxismo severo (relativo para certos materiais)', 'Espaço protético insuficiente'],
    steps: [
      'Preparo do dente (desgaste)',
      'Moldagem de precisão (digital ou convencional)',
      'Seleção de cor',
      'Provisório',
      'Prova da infraestrutura',
      'Prova da cerâmica (biscoito)',
      'Cimentação adesiva',
      'Ajuste oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 200000,
    toothNumbers: [],
  },
  {
    id: 'prot-002',
    code: '88000051',
    name: 'Prótese Parcial Removível (PPR)',
    description:
      'Prótese parcial removível com estrutura metálica fundida (cromo-cobalto) e dentes de resina acrílica.',
    category: ProcedureCategory.PROSTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 45,
    complexity: 3,
    contraindications: ['Poucos dentes remanescentes (avaliar prótese total)', 'Doença periodontal ativa nos pilares'],
    steps: [
      'Moldagem anatômica',
      'Moldagem funcional com moldeira individual',
      'Registro oclusal',
      'Prova da estrutura metálica',
      'Prova dos dentes em cera',
      'Acrilização',
      'Instalação e ajustes',
      'Controles periódicos',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 180000,
    toothNumbers: [],
  },
  {
    id: 'prot-003',
    code: '88000060',
    name: 'Prótese Total (Dentadura)',
    description:
      'Prótese total mucossuportada em resina acrílica para reabilitação de arcada totalmente edêntula.',
    category: ProcedureCategory.PROSTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 45,
    complexity: 3,
    contraindications: ['Rebordo severamente reabsorvido (avaliar implantes)'],
    steps: [
      'Moldagem anatômica',
      'Moldagem funcional com moldeira individual',
      'Registro das relações intermaxilares',
      'Seleção de dentes (cor, tamanho, formato)',
      'Prova dos dentes em cera',
      'Acrilização e acabamento',
      'Instalação',
      'Ajustes e controles periódicos',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 150000,
    toothNumbers: [],
  },
  {
    id: 'prot-004',
    code: '88000078',
    name: 'Faceta em Porcelana (Laminado)',
    description:
      'Laminado cerâmico ultrafino cimentado na face vestibular do dente para correção estética.',
    category: ProcedureCategory.PROSTHODONTICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: [
      'Bruxismo severo',
      'Esmalte insuficiente para adesão',
      'Dente escurecido (relativo)',
    ],
    steps: [
      'Enceramento diagnóstico e mock-up',
      'Preparo mínimo do esmalte',
      'Moldagem de precisão',
      'Seleção de cor',
      'Provisório',
      'Prova do laminado',
      'Cimentação adesiva com cimento resinoso',
      'Remoção de excessos e polimento',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 250000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // AESTHETICS (Estética)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'est-001',
    code: '89000044',
    name: 'Clareamento Dental de Consultório',
    description:
      'Clareamento dentário profissional em consultório com peróxido de hidrogênio concentrado e fotoativação.',
    category: ProcedureCategory.AESTHETICS,
    region: ToothRegion.FULL_MOUTH,
    images: [],
    videoUrl: null,
    estimatedDuration: 90,
    complexity: 2,
    contraindications: [
      'Gestantes e lactantes',
      'Menores de 16 anos',
      'Hipersensibilidade dentária severa',
      'Restaurações extensas em dentes anteriores',
    ],
    steps: [
      'Registro de cor inicial',
      'Profilaxia prévia',
      'Proteção gengival com barreira',
      'Aplicação do gel clareador (3 aplicações de 15 min)',
      'Remoção e limpeza',
      'Registro de cor final',
      'Orientações (evitar alimentos pigmentantes 48h)',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 80000,
    toothNumbers: [ToothRegion.FULL_MOUTH],
  },
  {
    id: 'est-002',
    code: '89000052',
    name: 'Clareamento Dental Caseiro',
    description:
      'Clareamento dentário com moldeira individual e gel de peróxido de carbamida para uso domiciliar supervisionado.',
    category: ProcedureCategory.AESTHETICS,
    region: ToothRegion.FULL_MOUTH,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 1,
    contraindications: [
      'Gestantes e lactantes',
      'Menores de 16 anos',
      'Hipersensibilidade severa',
    ],
    steps: [
      'Moldagem para confecção de moldeira individual',
      'Entrega da moldeira e gel clareador',
      'Instrução de uso (2-4h/dia ou noturno)',
      'Acompanhamento semanal',
      'Duração média: 2-3 semanas',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 60000,
    toothNumbers: [ToothRegion.FULL_MOUTH],
  },
  {
    id: 'est-003',
    code: '89000060',
    name: 'Gengivoplastia (por sextante)',
    description:
      'Remodelação do contorno gengival para harmonização do sorriso gengival (gummy smile).',
    category: ProcedureCategory.AESTHETICS,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 60,
    complexity: 3,
    contraindications: [
      'Doença periodontal ativa',
      'Distúrbios de coagulação',
    ],
    steps: [
      'Planejamento digital do sorriso',
      'Anestesia local',
      'Demarcação dos pontos de referência',
      'Incisão com bisturi ou eletrocautério',
      'Remoção de tecido gengival excedente',
      'Osteoplastia quando necessário',
      'Cimento cirúrgico',
      'Controle pós-operatório',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 60000,
    toothNumbers: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PEDIATRIC (Odontopediatria)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'ped-001',
    code: '90000041',
    name: 'Pulpotomia em Dente Decíduo',
    description:
      'Remoção parcial da polpa coronária de dente de leite inflamado, mantendo a vitalidade pulpar radicular.',
    category: ProcedureCategory.PEDIATRIC,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 40,
    complexity: 3,
    contraindications: [
      'Necrose pulpar',
      'Reabsorção radicular avançada',
      'Mobilidade excessiva',
    ],
    steps: [
      'Radiografia inicial',
      'Anestesia local',
      'Isolamento absoluto',
      'Abertura coronária',
      'Remoção da polpa coronária',
      'Hemostasia',
      'Aplicação de material capeador (MTA ou formocresol)',
      'Restauração',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 25000,
    toothNumbers: [],
  },
  {
    id: 'ped-002',
    code: '90000050',
    name: 'Coroa de Aço em Dente Decíduo',
    description:
      'Restauração protética com coroa de aço pré-fabricada em dente decíduo com destruição coronária extensa.',
    category: ProcedureCategory.PEDIATRIC,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: [
      'Dente próximo à esfoliação',
      'Alergia a níquel',
    ],
    steps: [
      'Anestesia local',
      'Preparo do dente',
      'Seleção do tamanho da coroa',
      'Ajuste da coroa',
      'Cimentação com ionômero de vidro',
      'Verificação oclusal',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 20000,
    toothNumbers: [],
  },
  {
    id: 'ped-003',
    code: '90000068',
    name: 'Mantenedor de Espaço',
    description:
      'Dispositivo para manutenção do espaço após perda precoce de dente decíduo, prevenindo má-oclusão.',
    category: ProcedureCategory.PEDIATRIC,
    region: null,
    images: [],
    videoUrl: null,
    estimatedDuration: 30,
    complexity: 2,
    contraindications: [
      'Dente permanente próximo à erupção (radiograficamente)',
    ],
    steps: [
      'Radiografia para avaliar o estágio de erupção',
      'Moldagem',
      'Confecção do mantenedor (banda-alça ou arco lingual)',
      'Cimentação',
      'Controles periódicos',
    ],
    officialSource: 'https://cfo.org.br/servicos-e-consultas/tabela-de-valores/',
    price: 25000,
    toothNumbers: [],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a procedure by its TUSS/CRO code.
 */
export function getProcedureByCode(code: string): DentalProcedure | undefined {
  return DENTAL_PROCEDURES.find((p) => p.code === code);
}

/**
 * Get all procedures in a given category.
 */
export function getProceduresByCategory(
  category: ProcedureCategory
): DentalProcedure[] {
  return DENTAL_PROCEDURES.filter((p) => p.category === category);
}

/**
 * Search procedures by name, description, or code (case-insensitive).
 */
export function searchProcedures(query: string): DentalProcedure[] {
  const normalised = query.toLowerCase().trim();
  if (!normalised) return [];

  return DENTAL_PROCEDURES.filter(
    (p) =>
      p.name.toLowerCase().includes(normalised) ||
      p.description.toLowerCase().includes(normalised) ||
      p.code.includes(normalised)
  );
}

/**
 * Get a procedure by its internal ID.
 */
export function getProcedureById(id: string): DentalProcedure | undefined {
  return DENTAL_PROCEDURES.find((p) => p.id === id);
}

/**
 * Get all distinct categories that have at least one procedure.
 */
export function getAvailableCategories(): ProcedureCategory[] {
  return [...new Set(DENTAL_PROCEDURES.map((p) => p.category))];
}

/**
 * Human-readable category labels in Portuguese.
 */
export const CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  [ProcedureCategory.PREVENTIVE]: 'Prevenção',
  [ProcedureCategory.RESTORATIVE]: 'Dentística Restauradora',
  [ProcedureCategory.ENDODONTICS]: 'Endodontia',
  [ProcedureCategory.PERIODONTICS]: 'Periodontia',
  [ProcedureCategory.ORTHODONTICS]: 'Ortodontia',
  [ProcedureCategory.SURGERY]: 'Cirurgia',
  [ProcedureCategory.IMPLANTOLOGY]: 'Implantodontia',
  [ProcedureCategory.PROSTHODONTICS]: 'Prótese Dentária',
  [ProcedureCategory.AESTHETICS]: 'Estética',
  [ProcedureCategory.PEDIATRIC]: 'Odontopediatria',
};
