/**
 * DADOS DO SITE E DA EMPRESA — fonte única.
 *
 * Trocar aqui atualiza, no próximo build:
 *   - todos os HTML (via marcadores {{site.…}} — plugin em vite.config.js)
 *   - links e mensagens de WhatsApp (src/js/whatsapp.js)
 *   - mapa (src/js/map.js)
 *   - SEO: canonical, Open Graph, JSON-LD, sitemap.xml, robots.txt
 *   - segurança: headers, redirecionamento www, security.txt
 *
 * Arquivo importado também pelo navegador: só dados, nada de Node.
 * Itens com [CONFIRMAR] dependem da cliente.
 */
export const SITE = {
  name: '303 Parfum',
  // [DOMINIO] [CONFIRMAR] URL canônica, sem barra no final
  url: 'https://www.303parfum.com.br',
  description:
    'Alta perfumaria a preço justo: fragrâncias com rigor técnico, notas ricas e desempenho de padrão internacional. Recife e Garanhuns. Seja revendedor.',
  locale: 'pt_BR',

  whatsapp: {
    number: '5587992120334', // só dígitos, com DDI 55
    display: '(87) 99212-0334',
  },
  email: 'contato@303parfum.com.br', // [CONFIRMAR]
  instagram: {
    handle: '@303parfum', // [CONFIRMAR]
    url: 'https://www.instagram.com/303parfum/', // [CONFIRMAR]
  },

  hours: '[CONFIRMAR COM A CLIENTE] Seg. a sex., 9h às 18h · Sáb., 9h às 13h',

  // Endereços das unidades. `mapsQuery` é o que o mapa busca no Google:
  // troque pelo endereço completo quando confirmado.
  places: {
    recife: {
      label: 'Recife, PE',
      address: '[CONFIRMAR COM A CLIENTE: endereço]',
      mapsQuery: 'Recife, PE',
    },
    garanhuns: {
      label: 'Garanhuns, PE',
      address: '[CONFIRMAR COM A CLIENTE: endereço]',
      mapsQuery: 'Garanhuns, PE',
    },
  },

  legal: {
    companyName: '[CONFIRMAR: razão social]',
    cnpj: '[CONFIRMAR]',
  },
};

/** Host canônico (com www) e host sem www, derivados da URL. */
export const CANONICAL_HOST = new URL(SITE.url).host;
export const APEX_HOST = CANONICAL_HOST.replace(/^www\./, '');
