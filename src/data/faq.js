/**
 * Perguntas frequentes — fonte única.
 *
 * Usado em dois lugares:
 *   1. vite.config.js → gera o HTML do acordeão no build (<!-- @faq -->),
 *      então o conteúdo existe no HTML final (SEO, sem depender de JS).
 *   2. scripts/lib/jsonld.mjs → schema FAQPage gravado no HTML no build
 *      (só as respostas sem [CONFIRMAR]).
 *
 * Texto puro (sem HTML): cada item de `resposta` vira um parágrafo.
 */
export const faqItems = [
  {
    id: 'como-ser-revendedor',
    pergunta: 'Como faço para me tornar revendedor da 303 Parfum?',
    resposta: [
      'Preencha o cadastro na seção Seja Revendedor. Ao enviar, abrimos o WhatsApp com os seus dados prontos; é só tocar em enviar.',
      'Nossa equipe retorna pela conversa, apresenta as condições e as opções de kit e tira todas as suas dúvidas antes de qualquer compromisso.',
    ],
  },
  {
    id: 'experiencia',
    pergunta: 'Preciso ter experiência com vendas?',
    resposta: [
      'Não. Muitas pessoas começam do zero. Orientamos você sobre as fragrâncias, as famílias olfativas e como apresentar cada linha, e o suporte continua pelo WhatsApp sempre que precisar.',
    ],
  },
  {
    id: 'fixacao',
    pergunta: 'Quanto tempo o perfume dura na pele?',
    resposta: [
      'A fixação e a projeção variam conforme a composição, o tipo de pele, o clima e a forma de aplicação. Em geral, fragrâncias amadeiradas, ambaradas e orientais tendem a durar mais que as cítricas e aquáticas.',
      'Para aproveitar melhor: aplique na pele hidratada e nos pontos de pulsação (pescoço, pulsos, atrás das orelhas) e evite esfregar depois de borrifar.',
    ],
  },
  {
    id: 'regioes',
    pergunta: 'Quais regiões vocês atendem?',
    resposta: [
      'Atendemos em Recife e em Garanhuns, em Pernambuco. Para outras cidades, fale com a gente pelo WhatsApp e verificamos as possibilidades. [CONFIRMAR COM A CLIENTE: envio para outras cidades]',
    ],
  },
  {
    id: 'pagamento',
    pergunta: 'Quais são as formas de pagamento?',
    resposta: ['[CONFIRMAR COM A CLIENTE] Ex.: Pix, cartão de crédito e débito, dinheiro.'],
  },
  {
    id: 'entrega',
    pergunta: 'Qual é o prazo de entrega?',
    resposta: ['[CONFIRMAR COM A CLIENTE] Prazos para Recife, Garanhuns e demais cidades, e se há opção de retirada.'],
  },
  {
    id: 'nicho-arabe-capilar',
    pergunta: 'O que são perfumes de nicho, árabes e capilares?',
    resposta: [
      'Nicho: composições autorais, menos óbvias, feitas para quem busca uma assinatura olfativa singular.',
      'Árabes: inspirados na perfumaria do Oriente Médio, com oud, âmbar, resinas e especiarias. Costumam ser intensos e marcantes.',
      'Capilares: brumas leves, formuladas para perfumar os cabelos e deixar um rastro suave a cada movimento.',
    ],
  },
];
