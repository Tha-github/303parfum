/**
 * HTML GERADO NO BUILD a partir dos dados (conteúdo indexável sem JS):
 *
 *   renderCatalog()  região "catalogo" do index.html — abas, painéis e cards
 *   renderHeroPromo() região "promocao" do hero — lê src/data/config.json
 *
 * Todo dado do JSON passa por escapeHtml. O navegador só alterna as abas e
 * preenche o modal (textContent): nunca monta HTML a partir dos dados.
 */
import { TABS } from '../../src/data/tabs.js';
import { formatBRL, promoSpoken } from '../../src/js/price.js';
import { pluralize, productAlt, productsInTab } from '../../src/js/product-schema.js';
import { MENSAGENS } from '../../src/js/whatsapp.js';

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const e = escapeHtml;
const IMG_DIR = './src/assets/img/produtos';
// 4 colunas (≥1280) · 3 (≥1024) · 2 (≥600 e no celular)
const CARD_SIZES = '(min-width: 80em) 19rem, (min-width: 64em) 31vw, 48vw';
const FORMATS = [
  ['avif', 'image/avif'],
  ['webp', 'image/webp'],
];

const indentBlock = (html, indent) =>
  html
    .split('\n')
    .map((line) => (line ? indent + line : line))
    .join('\n');

/** "Por tempo limitado" → "Por tempo limitado." */
const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

/** Preço da promoção: visual (riscado + destaque) e versão por extenso para leitor de tela. */
export function renderPrice(promo, className) {
  if (!promo) return '';
  return `<p class="price ${className}">
  <span class="sr-only">Preço: ${e(promoSpoken(promo))}</span>
  <s class="price__from" aria-hidden="true">${e(formatBRL(promo.de))}</s>
  <span class="price__to" aria-hidden="true">${e(formatBRL(promo.por))}</span>
</p>`;
}

function renderPicture(product, image) {
  const alt = e(productAlt(product));
  if (!image) {
    // sem foto: nome em Cormorant dourado sobre o preto (listado no relatório)
    return `<div class="product-card__placeholder" role="img" aria-label="${alt}">
  <span aria-hidden="true">${e(product.nome)}</span>
</div>`;
  }
  const { widths, size } = image;
  const set = (ext) => widths.map((w) => `${IMG_DIR}/${product.imagem}-${w}.${ext} ${w}w`).join(', ');
  const fallback = widths.find((w) => w >= 400) ?? widths.at(-1);
  const foco = product.foco ? ` data-foco="${e(product.foco)}"` : '';
  return `<picture>
${FORMATS.map(([ext, type]) => `  <source type="${type}" srcset="${set(ext)}" sizes="${CARD_SIZES}" />`).join('\n')}
  <img class="product-card__image" src="${IMG_DIR}/${product.imagem}-${fallback}.jpg" srcset="${set('jpg')}" sizes="${CARD_SIZES}" width="${size.width}" height="${size.height}" alt="${alt}"${foco} loading="lazy" decoding="async" />
</picture>`;
}

function renderCard(product, tab, { promo, images }) {
  const nameId = `pc-${tab}-${product.slug}`;
  const ref = product.referencia ? `\n      <p class="product-card__ref">Ref.: ${e(product.referencia)}</p>` : '';
  const family = product.familia ? `\n      <p class="product-card__family">${e(product.familia)}</p>` : '';
  const desc = product.descricao ? `\n      <p class="product-card__desc">${e(product.descricao)}</p>` : '';
  const badge = promo ? '\n      <span class="product-card__badge">Promoção</span>' : '';
  const price = promo ? `\n${indentBlock(renderPrice(promo, 'product-card__price'), '      ')}` : '';
  return `<li class="product-card" data-slug="${e(product.slug)}">
  <article class="product-card__inner" aria-labelledby="${nameId}">
    <div class="product-card__media">
${indentBlock(renderPicture(product, images[product.imagem]), '      ')}${badge}
    </div>
    <div class="product-card__body">${family}
      <h4 class="product-card__name" id="${nameId}">${e(product.nome)}</h4>${ref}${desc}${price}
      <div class="product-card__actions">
        <button class="btn btn--outline btn--on-dark btn--sm product-card__btn" type="button" aria-haspopup="dialog" data-action="details">Detalhes<span class="sr-only"> de ${e(product.nome)}</span></button>
        <a class="btn btn--primary btn--sm product-card__btn" href="https://wa.me/" data-whatsapp data-whatsapp-message="${e(MENSAGENS.produto(product.nome, promo))}" target="_blank" rel="noopener noreferrer">Pedir no WhatsApp<span class="sr-only">: ${e(product.nome)} (abre em nova aba)</span></a>
      </div>
    </div>
  </article>
</li>`;
}

/**
 * Abas WAI-ARIA + um painel por aba. Sem JS, a lista de abas fica oculta e
 * todos os painéis aparecem em sequência, cada um com o seu título; o
 * catalog.js mostra as abas e esconde os painéis inativos.
 *
 * @param {{ products: object[], promo: object|null, images: Record<string,{widths:number[],size:{width:number,height:number}}|undefined> }} data
 */
export function renderCatalog(data, indent = '          ') {
  const tabs = TABS.map(
    (t, i) =>
      `  <button class="catalog__tab" type="button" role="tab" id="tab-${t.slug}" aria-selected="${i === 0}" aria-controls="painel-${t.slug}" tabindex="${i === 0 ? 0 : -1}" data-tab="${t.slug}">${e(t.label)}</button>`,
  ).join('\n');

  const panels = TABS.map((t) => {
    const items = productsInTab(data.products, t.slug);
    const cards = items.map((p) => indentBlock(renderCard(p, t.slug, data), '    ')).join('\n');
    return `<section class="catalog__panel" id="painel-${t.slug}" role="tabpanel" aria-labelledby="tab-${t.slug}" tabindex="0" data-panel="${t.slug}">
  <header class="catalog__panel-head">
    <h3 class="catalog__panel-title">${e(t.label)}</h3>
    <p class="catalog__count"><span aria-hidden="true" data-count-visual="${items.length}">${pluralize(items.length)}</span><span class="sr-only">${pluralize(items.length)}</span></p>
    <p class="catalog__phrase">${e(t.frase)}</p>
  </header>
  <ul class="catalog__grid" role="list">
${cards}
  </ul>
</section>`;
  }).join('\n\n');

  const html = `<div class="catalog__tabs" role="tablist" aria-label="Linhas da coleção" data-catalog-tabs hidden>
${tabs}
</div>

${panels}`;
  return `\n${indentBlock(html, indent)}`;
}

/** Bloco de promoção do hero; vazio quando a promoção está desligada. */
export function renderHeroPromo(promo, indent = '            ') {
  if (!promo) return '\n';
  const note = promo.texto ? `${sentence(promo.texto)} Consulte pelo WhatsApp.` : 'Consulte pelo WhatsApp.';
  const html = `<div class="hero__promo">
  <p class="eyebrow hero__promo-eyebrow">Promoção</p>
  <p class="hero__promo-price">
    <span class="sr-only">Todos os perfumes ${e(promoSpoken(promo))}.</span>
    <span class="hero__promo-from" aria-hidden="true">Todos os perfumes de <s>${e(formatBRL(promo.de))}</s></span>
    <span class="hero__promo-to" aria-hidden="true">${e(formatBRL(promo.por))}</span>
  </p>
  <p class="hero__promo-note">${e(note)}</p>
  <a class="btn btn--primary hero__promo-cta" href="https://wa.me/" data-whatsapp data-whatsapp-message="${e(MENSAGENS.promocao(promo))}" target="_blank" rel="noopener noreferrer">Aproveitar a promoção<span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>
</div>`;
  return `\n${indentBlock(html, indent)}`;
}
