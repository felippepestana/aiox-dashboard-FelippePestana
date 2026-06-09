import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da APEX Legal Performance — como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD (Lei 13.709/2018).',
  robots: { index: true, follow: true },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase tabular-nums">
          {number}
        </span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-[#A0AEC0] leading-relaxed text-sm">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 mb-3">
      <h3 className="text-sm font-semibold text-[#C0C0C0] mb-2">{title}</h3>
      <div className="space-y-3 text-sm text-[#A0AEC0] leading-relaxed">{children}</div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.07)] px-2.5 py-0.5 text-xs text-[#D4AF37] font-medium mr-1.5 mb-1.5">
      {children}
    </span>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[rgba(192,192,192,0.07)]">
      <td className="py-2.5 pr-6 text-xs font-medium text-[#C0C0C0] whitespace-nowrap align-top">
        {label}
      </td>
      <td className="py-2.5 text-xs text-[#A0AEC0] align-top">{value}</td>
    </tr>
  );
}

/* ─── Table of Contents ───────────────────────────────────────────────────── */

const TOC = [
  { n: '01', href: '#identificacao', label: 'Identificação do Controlador' },
  { n: '02', href: '#dados', label: 'Dados Coletados' },
  { n: '03', href: '#base-legal', label: 'Base Legal para Tratamento' },
  { n: '04', href: '#finalidades', label: 'Finalidades do Tratamento' },
  { n: '05', href: '#compartilhamento', label: 'Compartilhamento de Dados' },
  { n: '06', href: '#retencao', label: 'Retenção de Dados' },
  { n: '07', href: '#direitos', label: 'Direitos do Titular' },
  { n: '08', href: '#exercicio-direitos', label: 'Como Exercer seus Direitos' },
  { n: '09', href: '#cookies', label: 'Cookies e Tecnologias Similares' },
  { n: '10', href: '#seguranca', label: 'Segurança dos Dados' },
  { n: '11', href: '#dpo', label: 'Encarregado (DPO)' },
  { n: '12', href: '#alteracoes', label: 'Alterações desta Política' },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function PrivacyPage() {
  const effectiveDate = '09 de junho de 2026';
  const lastReview = '09 de junho de 2026';

  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      {/* Nav strip */}
      <header className="border-b border-[rgba(192,192,192,0.07)] bg-[#060d1a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-label="APEX Logo">
              <defs>
                <linearGradient id="apex-gold-priv" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#F0D060" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#B8941F" />
                </linearGradient>
              </defs>
              <path d="M20 4L36 34H4L20 4Z" fill="url(#apex-gold-priv)" />
              <rect x="12" y="23" width="16" height="2.5" rx="1.25" fill="#060d1a" />
            </svg>
            <div>
              <span className="text-sm font-bold tracking-wide text-white group-hover:text-[#D4AF37] transition-colors">
                APEX <span className="text-[#C0C0C0]">LEGAL</span>
              </span>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium text-[#A0AEC0] hover:text-white transition-colors px-4 py-2 rounded-lg border border-[rgba(192,192,192,0.12)] hover:border-[rgba(212,175,55,0.3)]"
          >
            Acessar Plataforma
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.06)] rounded-full px-3.5 py-1 text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold mb-5">
            LGPD — Lei 13.709/2018
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Política de Privacidade
          </h1>
          <p className="text-[#A0AEC0] text-base max-w-2xl leading-relaxed">
            Esta Política descreve como a <strong className="text-white">APEX Legal Performance</strong> coleta,
            utiliza, armazena e protege seus dados pessoais, em conformidade plena com a{' '}
            <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
          </p>
          <div className="flex flex-wrap gap-6 mt-6 text-xs text-[#4A5568]">
            <span>
              Vigência: <span className="text-[#A0AEC0] font-medium">{effectiveDate}</span>
            </span>
            <span>
              Última revisão: <span className="text-[#A0AEC0] font-medium">{lastReview}</span>
            </span>
            <span>
              Versão: <span className="text-[#A0AEC0] font-medium">1.0</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar — table of contents */}
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-20">
              <p className="text-[10px] font-semibold text-[#4A5568] tracking-widest uppercase mb-3">
                Sumário
              </p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 py-1.5 text-xs text-[#4A5568] hover:text-[#A0AEC0] transition-colors group"
                  >
                    <span className="text-[10px] tabular-nums font-bold text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors w-4">
                      {item.n}
                    </span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* 01 — Identificação do Controlador */}
            <Section id="identificacao" number="01" title="Identificação do Controlador">
              <p>
                O controlador dos dados pessoais tratados nesta plataforma é a{' '}
                <strong className="text-white">APEX Legal Performance</strong>, solução jurídica
                tecnológica de alta performance para escritórios de advocacia brasileiros.
              </p>

              <div className="mt-4 rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] overflow-hidden">
                <table className="w-full px-5 py-3">
                  <tbody className="divide-y divide-[rgba(192,192,192,0.07)]">
                    <tr className="border-b border-[rgba(192,192,192,0.07)]">
                      <td className="px-5 py-3 text-xs font-medium text-[#C0C0C0] whitespace-nowrap w-36 align-top">Denominação</td>
                      <td className="px-5 py-3 text-xs text-[#A0AEC0]">APEX Legal Performance</td>
                    </tr>
                    <tr className="border-b border-[rgba(192,192,192,0.07)]">
                      <td className="px-5 py-3 text-xs font-medium text-[#C0C0C0] whitespace-nowrap align-top">Segmento</td>
                      <td className="px-5 py-3 text-xs text-[#A0AEC0]">LegalTech — Software de Gestão Jurídica</td>
                    </tr>
                    <tr className="border-b border-[rgba(192,192,192,0.07)]">
                      <td className="px-5 py-3 text-xs font-medium text-[#C0C0C0] whitespace-nowrap align-top">País</td>
                      <td className="px-5 py-3 text-xs text-[#A0AEC0]">Brasil</td>
                    </tr>
                    <tr className="border-b border-[rgba(192,192,192,0.07)]">
                      <td className="px-5 py-3 text-xs font-medium text-[#C0C0C0] whitespace-nowrap align-top">Site</td>
                      <td className="px-5 py-3 text-xs text-[#A0AEC0]">https://apex.legal</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-xs font-medium text-[#C0C0C0] whitespace-nowrap align-top">Contato</td>
                      <td className="px-5 py-3 text-xs text-[#A0AEC0]">privacidade@apex.legal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 02 — Dados Coletados */}
            <Section id="dados" number="02" title="Dados Coletados">
              <p>
                Coletamos diferentes categorias de dados pessoais conforme a finalidade de cada
                funcionalidade da plataforma:
              </p>

              <SubSection title="2.1 Dados de Cadastro">
                <p>
                  Nome completo, CPF/CNPJ, endereço de e-mail, telefone, endereço postal e
                  informações de perfil fornecidas no momento do registro ou atualização da conta.
                </p>
              </SubSection>

              <SubSection title="2.2 Dados de Uso da Plataforma">
                <p>
                  Logs de acesso (IP, navegador, dispositivo, data e hora), páginas visitadas,
                  funcionalidades utilizadas, tempo de sessão e preferências de interface. Esses
                  dados são coletados automaticamente para garantir a segurança e melhorar a
                  experiência.
                </p>
              </SubSection>

              <SubSection title="2.3 Dados Processuais">
                <p>
                  Informações inseridas pelo usuário sobre processos judiciais, clientes do
                  escritório, partes contrárias, documentos processuais, peças jurídicas, prazos e
                  publicações do DJE. Esses dados são de responsabilidade do usuário — a APEX atua
                  como <strong className="text-white">operadora</strong> quando se tratar de dados
                  de clientes do escritório cadastrados na plataforma.
                </p>
              </SubSection>

              <SubSection title="2.4 Dados Financeiros">
                <p>
                  Informações sobre honorários advocatícios, faturamento, transações financeiras e
                  tributos lançados no módulo financeiro. Dados de pagamento de assinatura (cartão
                  de crédito, PIX) são processados diretamente pelo Mercado Pago — a APEX não
                  armazena números de cartão ou dados de pagamento completos.
                </p>
              </SubSection>

              <SubSection title="2.5 Dados de Inteligência Artificial">
                <p>
                  Consultas enviadas ao módulo de IA jurídica (chat, análise de documentos, geração
                  de peças). O conteúdo das mensagens pode ser processado pela API da Anthropic
                  para gerar as respostas — veja a seção 5 para detalhes de compartilhamento.
                </p>
              </SubSection>

              <SubSection title="2.6 Cookies e Dados Técnicos">
                <p>
                  Informações coletadas automaticamente por cookies essenciais, de desempenho e
                  analíticos. Veja a seção 9 para detalhes completos.
                </p>
              </SubSection>
            </Section>

            {/* 03 — Base Legal */}
            <Section id="base-legal" number="03" title="Base Legal para Tratamento">
              <p>
                Todo tratamento de dados pessoais realizado pela APEX Legal Performance possui base
                legal expressa no artigo 7° da LGPD. As bases aplicáveis são:
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    base: 'Consentimento (Art. 7°, I)',
                    desc: 'Tratamento de dados para comunicações de marketing, analytics opcionais e compartilhamento com terceiros não essenciais. O consentimento pode ser revogado a qualquer momento.',
                  },
                  {
                    base: 'Execução de Contrato (Art. 7°, V)',
                    desc: 'Tratamento necessário para a prestação dos serviços contratados: gestão de processos, geração de peças, controle financeiro e demais funcionalidades da plataforma.',
                  },
                  {
                    base: 'Legítimo Interesse (Art. 7°, IX)',
                    desc: 'Análise de logs para segurança da plataforma, prevenção a fraudes, melhoria de funcionalidades e suporte técnico, sempre observando o interesse razoável do titular.',
                  },
                  {
                    base: 'Obrigação Legal (Art. 7°, II)',
                    desc: 'Retenção de dados processuais e financeiros conforme prazos prescricionais do CPC (art. 206) e CTN (art. 174), e manutenção de registros de auditoria conforme LGPD art. 37.',
                  },
                  {
                    base: 'Proteção ao Crédito (Art. 7°, X)',
                    desc: 'Verificação de dados de pagamento para processamento de assinaturas.',
                  },
                ].map((item) => (
                  <div
                    key={item.base}
                    className="rounded-lg border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-4"
                  >
                    <p className="text-xs font-semibold text-[#D4AF37] mb-1.5">{item.base}</p>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 04 — Finalidades */}
            <Section id="finalidades" number="04" title="Finalidades do Tratamento">
              <p>Os dados coletados são utilizados exclusivamente para as seguintes finalidades:</p>
              <ul className="mt-3 space-y-2.5">
                {[
                  'Criar e gerenciar sua conta de usuário na plataforma',
                  'Prestar os serviços de gestão processual, financeira e de IA jurídica contratados',
                  'Enviar notificações sobre prazos, publicações e alertas configurados pelo usuário',
                  'Processar pagamentos de assinatura e emitir comprovantes',
                  'Garantir a segurança da plataforma e prevenir acessos não autorizados',
                  'Cumprir obrigações legais e regulatórias aplicáveis',
                  'Oferecer suporte técnico e atendimento ao cliente',
                  'Melhorar funcionalidades com base em padrões de uso agregados e anonimizados',
                  'Enviar comunicações de marketing (somente com consentimento expresso)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            {/* 05 — Compartilhamento */}
            <Section id="compartilhamento" number="05" title="Compartilhamento de Dados">
              <p>
                A APEX Legal Performance não vende dados pessoais. O compartilhamento com terceiros
                ocorre apenas para as finalidades abaixo, com fornecedores que oferecem garantias
                adequadas de proteção de dados:
              </p>

              <div className="mt-5 space-y-4">
                {[
                  {
                    name: 'Supabase',
                    role: 'Banco de dados e autenticação',
                    desc: 'Todos os dados da plataforma são armazenados em servidores Supabase com Row Level Security (RLS) ativado. Os dados em trânsito são protegidos por TLS 1.3 e em repouso por AES-256.',
                    link: 'https://supabase.com/privacy',
                    tags: ['Dados de conta', 'Dados processuais', 'Dados financeiros'],
                  },
                  {
                    name: 'Anthropic',
                    role: 'Processamento de IA (Claude)',
                    desc: 'As consultas enviadas ao assistente de IA jurídica são processadas pela API da Anthropic. A Anthropic não utiliza conteúdo enviado via API para treinar seus modelos por padrão. Recomendamos não incluir dados pessoais sensíveis de clientes em consultas de IA.',
                    link: 'https://www.anthropic.com/privacy',
                    tags: ['Consultas de IA', 'Textos de documentos'],
                  },
                  {
                    name: 'Mercado Pago',
                    role: 'Processamento de pagamentos',
                    desc: 'O processamento de pagamentos de assinatura é realizado pelo Mercado Pago. Dados de cartão de crédito são informados diretamente ao Mercado Pago e nunca armazenados nos servidores APEX.',
                    link: 'https://www.mercadopago.com.br/privacidade',
                    tags: ['Dados de pagamento', 'CPF/CNPJ', 'E-mail'],
                  },
                  {
                    name: 'Sentry',
                    role: 'Monitoramento de erros',
                    desc: 'Erros técnicos da plataforma são reportados ao Sentry para diagnóstico e correção. Os dados de erro são sanitizados para remover informações pessoais identificáveis antes do envio.',
                    link: 'https://sentry.io/privacy/',
                    tags: ['Logs de erro', 'Stack traces'],
                  },
                ].map((partner) => (
                  <div
                    key={partner.name}
                    className="rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{partner.name}</p>
                        <p className="text-xs text-[#D4AF37]">{partner.role}</p>
                      </div>
                      <a
                        href={partner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#4A5568] hover:text-[#A0AEC0] transition-colors shrink-0"
                      >
                        Política de Privacidade ↗
                      </a>
                    </div>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed mb-3">{partner.desc}</p>
                    <div className="flex flex-wrap">
                      {partner.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-[#4A5568]">
                Todos os fornecedores listados são contratados como operadores de dados conforme o
                Art. 39 da LGPD e estão sujeitos a obrigações contratuais de confidencialidade e
                segurança.
              </p>
            </Section>

            {/* 06 — Retenção */}
            <Section id="retencao" number="06" title="Retenção de Dados">
              <p>
                Os dados pessoais são retidos pelo menor período necessário para cumprir as
                finalidades descritas nesta política ou as obrigações legais aplicáveis:
              </p>

              <div className="mt-4 rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[rgba(192,192,192,0.10)] bg-[rgba(255,255,255,0.02)]">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#C0C0C0] tracking-wider uppercase">Tipo de Dado</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#C0C0C0] tracking-wider uppercase">Prazo</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#C0C0C0] tracking-wider uppercase hidden sm:table-cell">Base Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Dados cadastrais', '5 anos após encerramento', 'LGPD art. 16, I — obrigação legal'],
                      ['Dados processuais', '5 anos', 'CPC art. 206 — prescrição civil'],
                      ['Dados financeiros', '5 anos', 'CTN art. 174 — prescrição tributária'],
                      ['Peças jurídicas', '5 anos', 'CPC art. 206 — prescrição civil'],
                      ['Logs de auditoria', '2 anos', 'LGPD art. 37 — registros de operações'],
                      ['Registros de consentimento', '10 anos', 'LGPD art. 8 §5 — ônus da prova'],
                      ['Dados de pagamento', 'Conforme Mercado Pago', 'Política do operador'],
                    ].map(([tipo, prazo, base]) => (
                      <tr key={tipo} className="border-b border-[rgba(192,192,192,0.06)]">
                        <td className="px-5 py-3 text-[#C0C0C0]">{tipo}</td>
                        <td className="px-5 py-3 text-[#A0AEC0]">{prazo}</td>
                        <td className="px-5 py-3 text-[#4A5568] hidden sm:table-cell">{base}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4">
                Após o término do prazo de retenção, os dados são excluídos permanentemente ou
                anonimizados de forma irreversível, conforme o art. 15 da LGPD. Processos sujeitos
                a litígio pendente podem ter a retenção prorrogada até o trânsito em julgado.
              </p>
            </Section>

            {/* 07 — Direitos do Titular */}
            <Section id="direitos" number="07" title="Direitos do Titular">
              <p>
                Em conformidade com os arts. 17 a 22 da LGPD, você, como titular de dados pessoais,
                possui os seguintes direitos:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: '📋',
                    title: 'Acesso (Art. 18, II)',
                    desc: 'Obter confirmação da existência de tratamento e acesso aos dados que mantemos sobre você, incluindo exportação completa.',
                  },
                  {
                    icon: '✏️',
                    title: 'Correção (Art. 18, III)',
                    desc: 'Solicitar a correção de dados incompletos, inexatos ou desatualizados.',
                  },
                  {
                    icon: '🗑️',
                    title: 'Exclusão (Art. 18, VI)',
                    desc: 'Solicitar a exclusão ou anonimização dos dados tratados com base em consentimento, respeitados os prazos legais de retenção.',
                  },
                  {
                    icon: '📦',
                    title: 'Portabilidade (Art. 18, V)',
                    desc: 'Receber seus dados em formato estruturado (JSON) para transferência a outro fornecedor ou serviço.',
                  },
                  {
                    icon: '⛔',
                    title: 'Revogação (Art. 18, IX)',
                    desc: 'Revogar o consentimento a qualquer momento para os tratamentos baseados nessa base legal, sem prejuízo das atividades já realizadas.',
                  },
                  {
                    icon: '📄',
                    title: 'Informação (Art. 18, VII)',
                    desc: 'Ser informado sobre entidades públicas e privadas com as quais seus dados foram compartilhados.',
                  },
                  {
                    icon: '🔍',
                    title: 'Revisão (Art. 20)',
                    desc: 'Solicitar revisão de decisões automatizadas que produzam efeitos sobre você, incluindo perfis comportamentais.',
                  },
                  {
                    icon: '🚫',
                    title: 'Oposição (Art. 18, §2°)',
                    desc: 'Opor-se a tratamento realizado com base em legítimo interesse quando houver descumprimento desta Lei.',
                  },
                ].map((right) => (
                  <div
                    key={right.title}
                    className="rounded-lg border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-4"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base" role="img" aria-hidden="true">{right.icon}</span>
                      <p className="text-xs font-semibold text-[#C0C0C0]">{right.title}</p>
                    </div>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">{right.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 08 — Como Exercer */}
            <Section id="exercicio-direitos" number="08" title="Como Exercer seus Direitos">
              <p>
                Você pode exercer seus direitos LGPD diretamente pela plataforma ou por e-mail:
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.04)] p-5">
                  <p className="text-sm font-semibold text-[#D4AF37] mb-2">Pela Plataforma</p>
                  <p className="text-xs text-[#A0AEC0] mb-3">
                    Usuários autenticados podem acessar o painel de privacidade diretamente em:
                  </p>
                  <Link
                    href="/legal/settings"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AF37] hover:text-[#e0c040] transition-colors border border-[rgba(212,175,55,0.3)] rounded-lg px-4 py-2 hover:bg-[rgba(212,175,55,0.08)]"
                  >
                    Configurações de Privacidade →
                  </Link>
                </div>

                <div className="rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-5">
                  <p className="text-sm font-semibold text-[#C0C0C0] mb-2">Por E-mail</p>
                  <p className="text-xs text-[#A0AEC0] mb-2">
                    Envie sua solicitação para o nosso Encarregado de Proteção de Dados (DPO):
                  </p>
                  <a
                    href="mailto:privacidade@apex.legal"
                    className="text-xs font-medium text-[#D4AF37] hover:underline"
                  >
                    privacidade@apex.legal
                  </a>
                  <p className="text-xs text-[#4A5568] mt-3">
                    Prazo de resposta: até <strong className="text-[#A0AEC0]">15 dias corridos</strong> a
                    partir do recebimento, conforme art. 18, §5° da LGPD.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-[#4A5568]">
                Para confirmar sua identidade, podemos solicitar informações adicionais. O atendimento
                é gratuito para o titular, conforme art. 18, §5° da LGPD.
              </p>
            </Section>

            {/* 09 — Cookies */}
            <Section id="cookies" number="09" title="Cookies e Tecnologias Similares">
              <p>
                Utilizamos cookies e tecnologias similares para garantir o funcionamento da
                plataforma e melhorar sua experiência. Você pode gerenciar suas preferências a
                qualquer momento.
              </p>

              <div className="mt-4 space-y-3">
                {[
                  {
                    category: 'Essenciais',
                    required: true,
                    desc: 'Necessários para o funcionamento básico da plataforma: autenticação, segurança de sessão (token JWT), preferências de tema e estado da interface.',
                    examples: ['aiox_session', 'apex_theme', 'apex_cookie_consent'],
                  },
                  {
                    category: 'Desempenho',
                    required: false,
                    desc: 'Coletam informações sobre como a plataforma é usada para identificar erros e melhorar o desempenho. Os dados são agregados e anonimizados.',
                    examples: ['_sentry_session'],
                  },
                  {
                    category: 'Analíticos',
                    required: false,
                    desc: 'Utilizados para entender padrões de uso e melhorar funcionalidades. Ativados apenas com seu consentimento.',
                    examples: ['Somente com consentimento'],
                  },
                ].map((cookie) => (
                  <div
                    key={cookie.category}
                    className="rounded-lg border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-[#C0C0C0]">{cookie.category}</p>
                      {cookie.required ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] text-[#4ADE80]">
                          Obrigatório
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.07)] border border-[rgba(212,175,55,0.2)] text-[#D4AF37]">
                          Opcional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A0AEC0] mb-2">{cookie.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {cookie.examples.map((ex) => (
                        <code
                          key={ex}
                          className="text-[10px] px-2 py-0.5 rounded bg-[rgba(192,192,192,0.05)] border border-[rgba(192,192,192,0.08)] text-[#C0C0C0] font-mono"
                        >
                          {ex}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 10 — Segurança */}
            <Section id="seguranca" number="10" title="Segurança dos Dados">
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados
                pessoais contra acesso não autorizado, alteração, divulgação ou destruição:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Criptografia em Repouso',
                    desc: 'Dados sensíveis são cifrados com AES-256-GCM antes do armazenamento.',
                  },
                  {
                    title: 'Criptografia em Trânsito',
                    desc: 'Toda comunicação entre cliente e servidor utiliza TLS 1.3.',
                  },
                  {
                    title: 'Row Level Security (RLS)',
                    desc: 'Políticas de acesso em nível de linha garantem que usuários só acessam seus próprios dados no banco Supabase.',
                  },
                  {
                    title: 'Autenticação Segura',
                    desc: 'Tokens JWT com expiração curta, revogação de sessão e suporte a MFA (autenticação multifator).',
                  },
                  {
                    title: 'Auditoria de Acesso',
                    desc: 'Logs de todas as operações sensíveis, retidos por 2 anos conforme LGPD art. 37.',
                  },
                  {
                    title: 'Minimização de Dados',
                    desc: 'Coletamos apenas os dados estritamente necessários para cada finalidade, conforme o princípio da necessidade (LGPD art. 6°, III).',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-4"
                  >
                    <p className="text-xs font-semibold text-[#C0C0C0] mb-1.5">{item.title}</p>
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4">
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos
                titulares, a APEX notificará a ANPD e os titulares afetados no prazo de 72 horas, em
                conformidade com o art. 48 da LGPD.
              </p>
            </Section>

            {/* 11 — DPO */}
            <Section id="dpo" number="11" title="Encarregado de Proteção de Dados (DPO)">
              <p>
                A APEX Legal Performance designou um Encarregado de Proteção de Dados (DPO) conforme
                o art. 41 da LGPD, responsável por atender comunicações dos titulares e da Autoridade
                Nacional de Proteção de Dados (ANPD).
              </p>

              <div className="mt-4 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.03)] p-5">
                <div className="space-y-2">
                  {[
                    ['Cargo', 'Encarregado de Proteção de Dados (DPO)'],
                    ['E-mail', 'privacidade@apex.legal'],
                    ['Endereço', 'dpo@apex.legal (comunicações formais à ANPD)'],
                    ['Horário', 'Segunda a sexta, 9h às 18h (horário de Brasília)'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 text-xs">
                      <span className="text-[#4A5568] w-20 shrink-0">{label}</span>
                      <span className="text-[#A0AEC0]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* 12 — Alterações */}
            <Section id="alteracoes" number="12" title="Alterações desta Política">
              <p>
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir
                mudanças nas nossas práticas de dados, novas funcionalidades ou alterações legais.
              </p>
              <p>
                Quando fizermos alterações relevantes, notificaremos você por e-mail ou por aviso
                destacado na plataforma com antecedência mínima de 10 dias, conforme o princípio da
                transparência (LGPD art. 6°, VI).
              </p>
              <p>
                A data de &ldquo;Última revisão&rdquo; no topo desta página indica quando a versão atual entrou
                em vigor. O uso continuado da plataforma após a vigência das alterações constitui
                aceite dos novos termos para tratamentos baseados em legítimo interesse e obrigação
                legal. Para tratamentos baseados em consentimento, solicitaremos sua confirmação
                explícita.
              </p>
            </Section>

            {/* Bottom bar */}
            <div className="mt-16 pt-8 border-t border-[rgba(192,192,192,0.07)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-[#4A5568]">
                © {new Date().getFullYear()} APEX Legal Performance. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <Link href="/" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
                  Início
                </Link>
                <Link href="/legal/settings" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
                  Configurações de Privacidade
                </Link>
                <a href="mailto:privacidade@apex.legal" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
                  privacidade@apex.legal
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
