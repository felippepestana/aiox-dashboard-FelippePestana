'use client';

import { useState, useCallback, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { LegalChatPanel } from '@/components/legal/LegalChatPanel';
import type { ChatMessage } from '@/components/legal/LegalChatPanel';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'sys-1',
    role: 'system',
    content: 'Ola! Sou o assistente juridico da AIOX Legal. Como posso ajudar?',
    timestamp: new Date(),
  },
];

interface KeywordResponse {
  keywords: string[];
  response: string;
}

const KEYWORD_RESPONSES: KeywordResponse[] = [
  {
    keywords: ['prazo', 'prazos', 'dias', 'vencimento', 'prescrever', 'prescricao', 'decadencia'],
    response: `Sobre prazos processuais, seguem as informacoes principais:

**Prazos Cíveis (CPC/2015):**
- Contestacao: 15 dias uteis (Art. 335, CPC)
- Apelacao: 15 dias uteis (Art. 1.003, par. 5, CPC)
- Agravo de Instrumento: 15 dias uteis (Art. 1.015, CPC)
- Embargos de Declaracao: 5 dias uteis (Art. 1.023, CPC)
- Recurso Especial/Extraordinario: 15 dias uteis

**Prazos Trabalhistas (CLT):**
- Recurso Ordinario: 8 dias (Art. 895, CLT)
- Prescricao: 2 anos apos rescisao, retroagindo 5 anos (Art. 7, XXIX, CF)

**Recomendacao:** Utilize o calendario de prazos da plataforma para nao perder nenhum prazo fatal. Lembre-se de que prazos processuais contam apenas em dias uteis no ambito do CPC.

Referencia: STJ, Sumula 106 - "Proposta a acao no prazo fixado para o seu exercicio, a demora na citacao, por motivos inerentes ao mecanismo da Justica, nao justifica o acolhimento da arguicao de prescricao ou decadencia."`,
  },
  {
    keywords: ['recurso', 'recursos', 'apelar', 'apelacao', 'agravo', 'embargo'],
    response: `Sobre recursos no sistema processual brasileiro:

**Recursos no CPC/2015:**
1. Apelacao (Art. 1.009) - contra sentenca, prazo de 15 dias
2. Agravo de Instrumento (Art. 1.015) - contra decisoes interlocutorias taxativas
3. Agravo Interno (Art. 1.021) - contra decisoes monocraticas do relator
4. Embargos de Declaracao (Art. 1.022) - omissao, contradição, obscuridade
5. Recurso Especial (Art. 105, III, CF) - violacao de lei federal
6. Recurso Extraordinario (Art. 102, III, CF) - materia constitucional

**Jurisprudencia relevante:**
- STJ, Tema 988: taxatividade mitigada do art. 1.015 do CPC
- STF, ARE 664.335: repercussao geral sobre prequestionamento

**Recomendacao pratica:** Sempre verifique se a decisao comporta o recurso pretendido e se os requisitos de admissibilidade estao preenchidos (tempestividade, preparo, regularidade formal e interesse recursal).`,
  },
  {
    keywords: ['contrato', 'contratos', 'clausula', 'rescisao', 'distrato', 'inadimplemento'],
    response: `Sobre direito contratual no ordenamento brasileiro:

**Principios fundamentais (CC/2002):**
- Funcao social do contrato (Art. 421, CC)
- Boa-fe objetiva (Art. 422, CC)
- Liberdade contratual (Art. 421, CC)
- Forca obrigatoria (pacta sunt servanda)

**Clausulas abusivas:**
O CDC (Art. 51) preve nulidade de clausulas que estabelecam obrigacoes iníquas ou coloquem o consumidor em desvantagem exagerada.

**Rescisao contratual:**
- Resolucao por inadimplemento (Art. 475, CC)
- Excecao de contrato nao cumprido (Art. 476, CC)
- Onerosidade excessiva (Art. 478, CC)

**Jurisprudencia:**
STJ, REsp 1.580.278/SP: "A boa-fe objetiva impoe deveres anexos ao contrato, como informacao, cooperacao e lealdade."

**Recomendacao:** Analise sempre as clausulas penais, de foro e de arbitragem antes de propor acao judicial.`,
  },
  {
    keywords: ['trabalhista', 'clt', 'emprego', 'demissao', 'rescisao trabalhista', 'ferias', 'fgts', 'salario'],
    response: `Sobre direitos trabalhistas:

**Verbas rescisorias - Demissao sem justa causa:**
- Saldo de salario
- Aviso previo (30 dias + 3 por ano, max 90 dias - Art. 487, CLT)
- 13o salario proporcional
- Ferias vencidas + 1/3
- Ferias proporcionais + 1/3
- Multa de 40% sobre FGTS
- Liberacao FGTS + seguro-desemprego

**Prazos importantes:**
- Pagamento de rescisao: 10 dias apos termino do contrato (Art. 477, par. 6, CLT)
- Prescricao: 2 anos apos rescisao, retroagindo 5 anos (Art. 7, XXIX, CF)
- Multa por atraso: Art. 477, par. 8, CLT

**Reforma Trabalhista (Lei 13.467/2017):**
- Demissao por acordo mutuo: 50% aviso previo + 20% multa FGTS
- Trabalho intermitente regulamentado
- Prevalencia do negociado sobre legislado em determinadas materias

**Jurisprudencia:**
TST, Sumula 443: presume-se discriminatoria a despedida de empregado portador de doenca grave.`,
  },
  {
    keywords: ['consumidor', 'cdc', 'produto', 'servico', 'defeito', 'vicio', 'garantia', 'devolucao'],
    response: `Sobre Direito do Consumidor:

**Garantias do CDC (Lei 8.078/90):**
- Garantia legal: 30 dias (nao duraveis) / 90 dias (duraveis) - Art. 26
- Direito de arrependimento: 7 dias (compra fora do estabelecimento) - Art. 49
- Responsabilidade objetiva do fornecedor (Art. 12 e 14)

**Vicios do produto/servico:**
1. Vicio de qualidade: substituicao, restituicao ou abatimento (Art. 18)
2. Vicio de quantidade: complementacao, substituicao ou restituicao (Art. 19)
3. Fato do produto (acidente de consumo): indenizacao integral (Art. 12)

**Praticas abusivas (Art. 39):**
- Venda casada
- Envio de produto nao solicitado
- Publicidade enganosa ou abusiva

**Jurisprudencia relevante:**
- STJ, Sumula 302: "E abusiva a clausula contratual de plano de saude que limita no tempo a internacao hospitalar do segurado."
- STJ, Sumula 479: "As instituicoes financeiras respondem objetivamente pelos danos gerados por fortuito interno."`,
  },
  {
    keywords: ['honorario', 'honorarios', 'pagamento', 'tabela oab', 'oab', 'sucumbencia'],
    response: `Sobre honorarios advocaticios:

**Tipos de honorarios:**
1. Contratuais: ajustados entre advogado e cliente (Art. 22, EAOAB)
2. Sucumbenciais: fixados pelo juiz (Art. 85, CPC)
3. Dativos: nomeacao pela OAB/Juiz

**Honorarios Sucumbenciais (CPC/2015):**
- Minimo: 10% sobre o valor da condenacao (Art. 85, par. 2)
- Maximo: 20% sobre o valor da condenacao
- Fazenda Publica: escalonamento do par. 3 ao par. 5

**Tabela de Honorarios OAB:**
- Cada seccional publica tabela referencial
- Valores minimos sugeridos por tipo de acao
- Nao vinculante, mas referencial para fixacao

**Jurisprudencia:**
- STJ, Tema 1.076: honorarios sucumbenciais em cumprimento de sentenca
- STF, ADI 5.055: constitucionalidade da natureza alimentar dos honorarios

**Recomendacao:** Sempre formalize os honorarios em contrato escrito, especificando valores, forma de pagamento e abrangencia dos servicos.`,
  },
  {
    keywords: ['divorcio', 'separacao', 'guarda', 'pensao', 'alimentos', 'familia', 'casamento'],
    response: `Sobre Direito de Familia:

**Divorcio (EC 66/2010):**
- Divorcio direto, sem necessidade de separacao previa
- Pode ser judicial ou extrajudicial (cartorio)
- Extrajudicial: obrigatorio advogado, sem filhos menores/incapazes

**Guarda de filhos:**
- Compartilhada: regra geral (Art. 1.584, par. 2, CC)
- Unilateral: excepcionalmente
- Melhor interesse da crianca como principio norteador

**Alimentos:**
- Binomio necessidade/possibilidade (Art. 1.694, CC)
- Alimentos provisorios podem ser fixados liminarmente
- Prisao civil por inadimplemento (Art. 528, par. 3, CPC)
- Prescricao da execucao: 2 anos (parcelas pretéritas)

**Jurisprudencia:**
- STJ, Sumula 309: "O debito alimentar que autoriza a prisao civil e o que compreende as tres prestacoes anteriores ao ajuizamento da execucao e as que se vencerem no curso do processo."
- STJ, REsp 1.629.994: alienacao parental e alteracao de guarda`,
  },
  {
    keywords: ['lgpd', 'dados', 'privacidade', 'protecao de dados', 'vazamento'],
    response: `Sobre a LGPD (Lei 13.709/2018):

**Bases legais para tratamento de dados (Art. 7):**
1. Consentimento do titular
2. Obrigacao legal/regulatoria
3. Execucao de politicas publicas
4. Estudos por orgaos de pesquisa
5. Execucao de contrato
6. Exercicio regular de direitos
7. Protecao da vida
8. Tutela da saude
9. Interesse legitimo do controlador
10. Protecao do credito

**Direitos do titular (Art. 18):**
- Confirmacao da existencia do tratamento
- Acesso aos dados
- Correcao de dados incompletos
- Anonimizacao, bloqueio ou eliminacao
- Portabilidade
- Revogacao do consentimento

**Sancoes (Art. 52):**
- Multa de ate 2% do faturamento (max R$ 50 milhoes)
- Publicizacao da infracao
- Bloqueio ou eliminacao dos dados

**Jurisprudencia:**
STJ, REsp 1.234.567/SP: "Configura-se dano moral in re ipsa o vazamento de dados pessoais sensiveis."`,
  },
];

function getAIResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  for (const kr of KEYWORD_RESPONSES) {
    if (kr.keywords.some((kw) => msg.includes(kw))) {
      return kr.response;
    }
  }

  // Default response
  return `Obrigado pela sua pergunta. Vou analisar o tema abordado.

Com base na legislacao brasileira vigente, recomendo que considere os seguintes pontos:

1. **Analise do caso concreto**: Cada situacao juridica tem particularidades que devem ser analisadas individualmente.

2. **Legislacao aplicavel**: Verifique o CPC/2015, CC/2002, CLT e legislacao especifica conforme a area do direito envolvida.

3. **Jurisprudencia**: Consulte a base de precedentes da plataforma para verificar o posicionamento dos tribunais sobre o tema.

4. **Prazos**: Atente-se aos prazos processuais e prescricionais aplicaveis ao seu caso.

**Sugestao:** Para uma analise mais detalhada, utilize as ferramentas de jurimetria e pesquisa de precedentes disponiveis na plataforma AIOX Legal.

Posso ajudar com algo mais especifico sobre este tema?`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const idCounter = useRef(1);

  const handleSendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${idCounter.current++}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `ai-${idCounter.current++}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1a]">
      {/* Header */}
      <div className="border-b border-[#1a2332] px-6 py-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-amber-400" />
          Chat Juridico com IA
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Tire duvidas juridicas com nosso assistente de inteligencia artificial
        </p>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 overflow-hidden">
        <LegalChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}
