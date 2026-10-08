/**
 * JSON-LD (schema.org) gerado no build e gravado no HTML (vite.config.js).
 *
 * Publica só o que é verdadeiro e válido:
 *   - Organization + WebSite: sempre.
 *   - FAQPage: só perguntas cujas respostas não têm [CONFIRMAR].
 *   - ItemList de Product: só quando TODOS os produtos têm preço. Sem
 *     "offers", o Google acusa erro em cada Product (Rich Results Test);
 *     por isso, enquanto os preços não forem definidos, nada é publicado.
 */
import { SITE } from '../../config/site.mjs';

const isConfirmed = (...texts) => !texts.some((t) => String(t).includes('[CONFIRMAR'));
const e164 = (digits) => `+${digits}`;

export function organization() {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organizacao`,
    name: SITE.name,
    url: `${SITE.url}/`,
    description: SITE.description,
    areaServed: Object.values(SITE.places).map((p) => ({ '@type': 'City', name: p.label })),
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
    publisher: { '@id': `${SITE.url}/#organizacao` },
  };
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
 * @param {object} catalog products.json
 * @param {(path: string) => string | null} resolveImage caminho do JSON → URL final (hash do build)
 */
export function productList(catalog, resolveImage) {
  const produtos = Array.isArray(catalog?.produtos) ? catalog.produtos : [];
  const allPriced = produtos.length > 0 && produtos.every((p) => typeof p.preco === 'number' && p.preco >= 0);
  if (!allPriced) return null;

  const categoryName = Object.fromEntries((catalog.categorias ?? []).map((c) => [c.slug, c.nome]));
  return {
    '@type': 'ItemList',
    '@id': `${SITE.url}/#colecao`,
    name: `Coleção ${SITE.name}`,
    numberOfItems: produtos.length,
    itemListElement: produtos.map((p, index) => {
      const url = `${SITE.url}/?linha=${encodeURIComponent(p.categoria)}#produto-${encodeURIComponent(p.slug)}`;
      const image = resolveImage(p.imagem);
      const product = {
        '@type': 'Product',
        name: p.nome,
        sku: p.id,
        url,
        brand: { '@type': 'Brand', name: SITE.name },
        offers: {
          '@type': 'Offer',
          price: p.preco.toFixed(2),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock', // [CONFIRMAR] controle de estoque
          url,
        },
      };
      if (p.descricao) product.description = p.descricao;
      if (image) product.image = new URL(image, SITE.url).href;
      if (categoryName[p.categoria]) product.category = categoryName[p.categoria];
      return { '@type': 'ListItem', position: index + 1, item: product };
    }),
  };
}

/** <script type="application/ld+json"> com "<" escapado (um "</script>" nos dados não fecha a tag). */
export function jsonLdScript(nodes) {
  const graph = { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
  const json = JSON.stringify(graph, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}
