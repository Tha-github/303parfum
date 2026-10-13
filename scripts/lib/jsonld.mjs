/**
 * JSON-LD (schema.org) gerado no build e gravado no HTML (vite.config.js).
 *
 *   - Organization + WebSite.
 *   - Store (LocalBusiness) ×2: Recife e Garanhuns, com endereço, telefone,
 *     e-mail, horário e área atendida (config/site.mjs).
 *   - FAQPage: só perguntas cujas respostas não têm [CONFIRMAR].
 *   - ItemList com os produtos válidos de products.json. Com a promoção
 *     ativa (src/data/config.json), cada Product leva offers (preço, BRL,
 *     InStock); sem ela, sai sem offers.
 */
import { SITE } from '../../config/site.mjs';
import { TABS } from '../../src/data/tabs.js';

const isConfirmed = (...texts) => !texts.some((t) => String(t).includes('[CONFIRMAR'));
const e164 = (digits) => `+${digits}`;
const ORG_ID = `${SITE.url}/#organizacao`;
const TAB_LABEL = Object.fromEntries(TABS.map((t) => [t.slug, t.label]));

export function organization() {
  const org = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/apple-touch-icon.png`,
    description: SITE.description,
    areaServed: Object.values(SITE.places).map((p) => ({ '@type': 'City', name: p.city })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: e164(SITE.whatsapp.number),
      availableLanguage: 'Portuguese',
    },
  };
  if (isConfirmed(SITE.email)) org.email = SITE.email;
  if (isConfirmed(SITE.instagram.url)) org.sameAs = [SITE.instagram.url];
  return org;
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#site`,
    url: `${SITE.url}/`,
    name: SITE.name,
    inLanguage: 'pt-BR',
    publisher: { '@id': ORG_ID },
  };
}

/** Uma Store (LocalBusiness) por unidade. */
export function stores() {
  return Object.entries(SITE.places).map(([key, p]) => ({
    '@type': 'Store',
    '@id': `${SITE.url}/#loja-${key}`,
    name: `${SITE.name} — ${p.city}`,
    url: `${SITE.url}/#contato`,
    image: `${SITE.url}/og-image.jpg`,
    telephone: SITE.whatsapp.e164,
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${p.street} — ${p.district}`,
      addressLocality: p.city,
      addressRegion: p.region,
      addressCountry: 'BR',
    },
    openingHours: SITE.openingHours,
    areaServed: { '@type': 'City', name: p.city },
    parentOrganization: { '@id': ORG_ID },
  }));
}

export function faqPage(items) {
  const ready = items.filter((item) => isConfirmed(item.pergunta, ...item.resposta));
  if (ready.length === 0) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${SITE.url}/#faq`,
    mainEntity: ready.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: item.resposta.join('\n\n') },
    })),
  };
}

/**
 * @param {{ products: object[], promo: {por:number}|null }} catalog loadCatalogContext()
 * @param {(slug: string) => string | null} imageUrl imagem do produto → URL final (hash do build)
 */
export function productList({ products, promo }, imageUrl) {
  if (!products.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${SITE.url}/#colecao`,
    name: `Coleção ${SITE.name}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, index) => {
      const url = `${SITE.url}/?linha=${encodeURIComponent(p.categorias[0])}#colecao`;
      const product = {
        '@type': 'Product',
        name: p.nome,
        url,
        brand: { '@type': 'Brand', name: '303 Parfum' },
        category: p.categorias.map((c) => TAB_LABEL[c]).join(', '),
      };
      if (p.id !== null) product.sku = String(p.id);
      if (p.descricao) product.description = p.descricao;
      const image = p.imagem && imageUrl(p.imagem);
      if (image) product.image = new URL(image, SITE.url).href;
      if (promo) {
        product.offers = {
          '@type': 'Offer',
          price: promo.por.toFixed(2),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          url,
        };
      }
      return { '@type': 'ListItem', position: index + 1, item: product };
    }),
  };
}

/** <script type="application/ld+json"> com "<" escapado (um "</script>" nos dados não fecha a tag). */
export function jsonLdScript(nodes) {
  const graph = { '@context': 'https://schema.org', '@graph': nodes.flat().filter(Boolean) };
  const json = JSON.stringify(graph, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}
