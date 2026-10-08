/**
 * Modal de detalhes do produto — <dialog> nativo.
 *
 * showModal() já entrega: resto da página inerte, ESC fecha (evento
 * "cancel") e camada superior. Aqui acrescentamos: foco circulando só
 * dentro do diálogo, trava de rolagem, fechar no clique do backdrop e
 * devolver o foco explicitamente ao botão "Detalhes" de origem.
 */
import { formatPrice, formatVolume, TIER_LABELS } from './catalog-data.js';
import { fillPicture } from './picture.js';
import { lockScroll, unlockScroll } from './scroll-lock.js';
import { buildWhatsAppLink, MENSAGENS } from './whatsapp.js';

const MODAL_SIZES = '(min-width: 64em) 30rem, 100vw';
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initProductModal(dialog) {
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

  function open(product, origin) {
    trigger = origin ?? null;

    fillPicture(q('picture'), product, MODAL_SIZES);
    q('[data-modal-badge]').hidden = !product.destaque;

    const category = q('[data-modal-category]');
    category.textContent = product.categoriaNome;
    category.hidden = !product.categoriaNome;

    q('[data-modal-name]').textContent = product.nome;

    const desc = q('[data-modal-desc]');
    desc.textContent = product.descricao;
    desc.hidden = !product.descricao;

    // Pirâmide olfativa
    const pyramid = q('[data-modal-pyramid]');
    pyramid.hidden = !product.temNotas;
    for (const tier of pyramid.querySelectorAll('[data-tier]')) {
      const list = product.notas[tier.dataset.tier];
      tier.querySelector('dt').textContent = TIER_LABELS[tier.dataset.tier];
      tier.querySelector('dd').textContent = list.length ? list.join(', ') : '—';
    }

    setSpec('family', product.familia_olfativa);
    setSpec('volume', formatVolume(product.volume_ml));
    setSpec('price', formatPrice(product.preco));

    q('[data-modal-whatsapp]').href = buildWhatsAppLink(
      MENSAGENS.produto(product.nome, product.volume_ml),
    );
    q('[data-modal-resell]').href = buildWhatsAppLink(MENSAGENS.revendaProduto(product.nome));

    q('.product-modal__content').scrollTop = 0;
    dialog.scrollTop = 0;
    lockScroll();
    dialog.showModal();
  }

  function setSpec(name, value) {
    const row = q(`[data-spec="${name}"]`);
    if (!row) return;
    row.hidden = !value;
    row.querySelector('dd').textContent = value;
  }

  return { open, close: () => dialog.close() };
}
