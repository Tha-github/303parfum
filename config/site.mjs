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
 */
export const SITE = {
  name: '303 Parfum',
  // [DOMINIO] URL canônica, sem barra no final
  url: 'https://www.303parfum.com.br',
  description:
    'Promoção: perfumes importados de R$ 250,00 por R$ 199,90 na 303 Parfum, em Recife e Garanhuns (PE). Femininos, masculinos, nicho e árabes. Seja revendedor.',
  locale: 'pt_BR',

  whatsapp: {
    number: '5587992120334', // só dígitos, com DDI 55
    display: '(87) 99212-0334',
    e164: '+55 87 99212-0334',
  },
  email: 'larissa.ifpe4@gmail.com',
  instagram: {
    handle: '@303parfum', // a confirmar com a cliente
    url: 'https://www.instagram.com/303parfum/',
  },

  hours: 'Seg. a sex., 9h às 18h · Sáb., 9h às 13h',
  // Mesmo horário no formato schema.org (JSON-LD)
  openingHours: ['Mo-Fr 09:00-18:00', 'Sa 09:00-13:00'],

  // Unidades. `mapsQuery` é o que o mapa busca no Google (após o clique).
  places: {
    recife: {
      label: 'Recife, PE',
      address: 'Rua Teixeira de Freitas, 135 — Várzea, Recife - PE',
      street: 'Rua Teixeira de Freitas, 135',
      district: 'Várzea',
      city: 'Recife',
      region: 'PE',
      mapsQuery: 'Rua Teixeira de Freitas, 135, Várzea, Recife - PE',
    },
    garanhuns: {
      label: 'Garanhuns, PE',
      address: 'Rua Ary Barroso, 135 — Magano, Garanhuns - PE',
      street: 'Rua Ary Barroso, 135',
      district: 'Magano',
      city: 'Garanhuns',
      region: 'PE',
      mapsQuery: 'Rua Ary Barroso, 135, Magano, Garanhuns - PE',
    },
  },
};

/** Host canônico (com www) e host sem www, derivados da URL. */
export const CANONICAL_HOST = new URL(SITE.url).host;
export const APEX_HOST = CANONICAL_HOST.replace(/^www\./, '');
