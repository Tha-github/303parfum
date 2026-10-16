/**
 * Modal de detalhes do produto — <dialog> nativo.
 *
 * showModal() já entrega: resto da página inerte, ESC fecha (evento
 * "cancel") e camada superior. Aqui acrescentamos: foco circulando só
 * dentro do diálogo, trava de rolagem, fechar no clique do backdrop e
 * devolver o foco explicitamente ao botão "Detalhes" de origem.
 *
 * A arte é um clone da <picture> do card (URLs já resolvidas no build);
 * os textos entram por textContent, vindos de products.json validado.
 */
import { formatBRL, promoFor, promoSpoken } from './price.js';
import { TIER_LABELS } from './product-schema.js';
import { lockScroll, unlockScroll } from './scroll-lock.js';
import { buildWhatsAppLink, MENSAGENS } from './whatsapp.js';

const MODAL_SIZES = '(min-width: 64em) 45vw, 100vw';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mostra o texto, ou esconde o elemento se vazio. */
function setText(el, value) {
  if (!el) return;
  el.textContent = value;
  el.hidden = !value;
}

/** Clona a arte do card para o modal: inteira, carregada já, maior. */
function cloneArt(cardMedia) {
  const art = cardMedia?.querySelector('picture, .product-card__placeholder');
  if (!art) return null;
  const clone = art.cloneNode(true);
  for (const source of clone.querySelectorAll('source')) source.sizes = MODAL_SIZES;
  const img = clone.querySelector('img');
  if (img) {
    img.className = 'product-modal__image';
    img.removeAttribute('data-foco');
    img.loading = 'eager';
    img.sizes = MODAL_SIZES;
  }
  return clone;
}

export function initProductModal(dialog, { promo = null } = {}) {
  if (!dialog || typeof dialog.showModal !== 'function') return null;

  const q = (selector) => dialog.querySelector(selector);
  let trigger = null;

  dialog.addEventListener('close', () => {
    unlockScroll();
    trigger?.focus();
    trigger = null;
  });

  // Clique fora do conteúdo (no ::backdrop) tem o próprio <dialog> como alvo
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  q('[data-modal-close]')?.addEventListener('click', () => dialog.close());

  // showModal() deixa o Tab sair para a interface do navegador; aqui o foco
  // circula apenas entre os elementos do diálogo.
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Preço: só os perfumes em promoção têm valor; os demais, sob consulta
  const price = q('[data-modal-price]');
  const ask = q('[data-modal-ask]');
  if (price && promo) {
    price.querySelector('[data-price-spoken]').textContent = `Preço: ${promoSpoken(promo)}`;
    price.querySelector('[data-price-from]').textContent = formatBRL(promo.de);
    price.querySelector('[data-price-to]').textContent = formatBRL(promo.por);
  }

  /**
   * @param {object} product produto normalizado (product-schema.js)
   * @param {HTMLElement} origin botão "Detalhes" (recebe o foco ao fechar)
   */
  function open(product, origin) {
    trigger = origin ?? null;

    const media = q('[data-modal-media]');
    const art = cloneArt(origin?.closest('.product-card')?.querySelector('.product-card__media'));
    media.replaceChildren(...(art ? [art] : []));

    q('[data-modal-name]').textContent = product.nome;
    setText(q('[data-modal-ref]'), product.referencia ? `Ref.: ${product.referencia}` : '');
    setText(q('[data-modal-family]'), product.familia);
    setText(q('[data-modal-desc]'), product.descricao);

    const productPromo = promoFor(product, promo);
    if (price) price.hidden = !productPromo;
    if (ask) ask.hidden = Boolean(productPromo);

    // Pirâmide olfativa: Topo / Corpo / Fundo
    const pyramid = q('[data-modal-pyramid]');
    pyramid.hidden = !product.temNotas;
    for (const tier of pyramid.querySelectorAll('[data-tier]')) {
      const list = product.notas[tier.dataset.tier] ?? [];
      tier.hidden = list.length === 0;
      tier.querySelector('dt').textContent = TIER_LABELS[tier.dataset.tier];
      tier.querySelector('dd').textContent = list.join(', ');
    }

    q('[data-modal-whatsapp]').href = buildWhatsAppLink(MENSAGENS.produto(product.nome, productPromo));
    q('[data-modal-resell]').href = buildWhatsAppLink(MENSAGENS.revendaProduto(product.nome));

    q('.product-modal__inner').scrollTop = 0;
    dialog.scrollTop = 0;
    lockScroll();
    dialog.showModal();
  }

  return { open, close: () => dialog.close() };
}
