/**
 * Catálogo (#colecao) — renderizado a partir de getCatalogData().
 *
 * Segurança: todo dado do JSON entra no DOM via textContent / atributos.
 * A marcação vem de <template> estáticos do index.html; nada de innerHTML.
 *
 * Filtro:
 *   - botões "Todos" + 6 linhas (aria-pressed)
 *   - evento global "filter:category" (vindo das Linhas de produto)
 *   - URL ?linha=<slug> via history.replaceState (links compartilháveis)
 */
import { formatPrice, formatVolume, getCatalogData, TIER_LABELS } from './catalog-data.js';
import { FILTER_CATEGORY, getRequestedCategory } from './events.js';
import { fillPicture } from './picture.js';
import { countTo, prefersReducedMotion } from './motion.js';
import { initProductModal } from './product-modal.js';
import { buildWhatsAppLink, MENSAGENS } from './whatsapp.js';

const ALL = 'todos';
const LEAVE_MS = 180; // saída da grade antes de trocar os cards
const URL_PARAM = 'linha';
const MAX_STAGGER = 8; // a partir do 9º card, todos entram juntos
const CARD_SIZES = '(min-width: 80em) 22vw, (min-width: 64em) 30vw, (min-width: 37.5em) 45vw, 40vw';

const pluralize = (n) => (n === 1 ? '1 fragrância' : `${n} fragrâncias`);

export function initCatalog(root = document.querySelector('[data-catalog]'), data = getCatalogData()) {
  if (!root) return null;

  const el = {
    count: root.querySelector('[data-catalog-count]'),
    countVisual: root.querySelector('[data-catalog-count-visual]'),
    filters: root.querySelector('[data-catalog-filters]'),
    grid: root.querySelector('[data-catalog-grid]'),
    empty: root.querySelector('[data-catalog-empty]'),
    emptyCategory: root.querySelector('[data-empty-category]'),
    emptyWhatsApp: root.querySelector('[data-empty-whatsapp]'),
    emptyReset: root.querySelector('[data-filter-reset]'),
    cardTpl: document.getElementById('tpl-product-card'),
  };
  if (!el.grid || !el.cardTpl) return null;

  const { categorias, produtos } = data;
  const validFilters = new Set([ALL, ...categorias.map((c) => c.slug)]);
  const modal = initProductModal(document.querySelector('[data-product-modal]'));

  // Um nó por produto, criado uma vez e reaproveitado a cada filtro
  const cards = new Map(produtos.map((p) => [p.slug, createCard(p, el.cardTpl)]));
  const filterButtons = createFilters(el.filters, categorias, produtos);

  let current = null;
  let shownCount = 0;
  let swapTimer = 0;

  function setFilter(requested, { animate = true, updateUrl = true } = {}) {
    const slug = validFilters.has(requested) ? requested : ALL;
    if (slug === current) return;
    current = slug;

    for (const btn of filterButtons) {
      const pressed = btn.dataset.filter === slug;
      btn.setAttribute('aria-pressed', String(pressed));
      // só quando o usuário troca (na carga, ler o layout da faixa custaria
      // um cálculo de layout forçado da página inteira)
      if (pressed && animate) revealInScroller(el.filters, btn);
    }

    const visible = slug === ALL ? produtos : produtos.filter((p) => p.categoria === slug);

    // Estado (botões, contagem, URL) muda na hora; só a grade faz a transição
    updateCount(visible.length, animate);
    if (updateUrl) syncUrl(slug);

    clearTimeout(swapTimer); // cliques rápidos: vale o último
    const canLeave = animate && !prefersReducedMotion() && !el.grid.hidden && el.grid.childElementCount > 0;
    if (canLeave) {
      el.grid.classList.add('is-leaving');
      swapTimer = setTimeout(() => renderGrid(slug, visible, true), LEAVE_MS);
    } else {
      renderGrid(slug, visible, animate);
    }
  }

  function renderGrid(slug, visible, animate) {
    const nodes = visible.map((p, i) => {
      const node = cards.get(p.slug);
      node.classList.toggle('is-entering', animate);
      node.style.setProperty('--i', String(Math.min(i, MAX_STAGGER)));
      return node;
    });
    // Reinserir os nós reinicia a animação de entrada
    el.grid.replaceChildren(...nodes);
    el.grid.classList.remove('is-leaving');
    el.grid.hidden = nodes.length === 0;
    renderEmpty(slug, nodes.length === 0);
  }

  function updateCount(n, animate) {
    if (el.count) el.count.textContent = pluralize(n); // leitor de tela: só o valor final
    if (el.countVisual) {
      if (animate) countTo(el.countVisual, n, { from: shownCount, duration: 600, format: pluralize });
      else el.countVisual.textContent = pluralize(n);
    }
    shownCount = n;
  }

  // Contagem sobe de 0 na primeira vez que o cabeçalho aparece
  if (el.countVisual && 'IntersectionObserver' in window && !prefersReducedMotion()) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      countTo(el.countVisual, shownCount, { from: 0, duration: 1200, format: pluralize });
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(el.countVisual);
  }

  function renderEmpty(slug, isEmpty) {
    if (!el.empty) return;
    el.empty.hidden = !isEmpty;
    if (!isEmpty) return;
    const nome = categorias.find((c) => c.slug === slug)?.nome ?? '';
    if (el.emptyCategory) el.emptyCategory.textContent = nome;
    if (el.emptyWhatsApp) el.emptyWhatsApp.href = buildWhatsAppLink(MENSAGENS.linha(nome));
  }

  // ---- Eventos ---------------------------------------------------------
  el.filters?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-filter]');
    if (btn) setFilter(btn.dataset.filter);
  });

  el.emptyReset?.addEventListener('click', () => {
    setFilter(ALL);
    filterButtons.find((b) => b.dataset.filter === ALL)?.focus();
  });

  el.grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="details"]');
    if (!trigger || !modal) return;
    const product = produtos.find((p) => p.slug === trigger.dataset.slug);
    if (product) modal.open(product, trigger);
  });

  document.addEventListener(FILTER_CATEGORY, (event) => setFilter(event.detail?.category));

  // ---- Estado inicial: URL > pedido pendente > Todos ------------------
  const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
  setFilter(fromUrl ?? getRequestedCategory() ?? ALL, { animate: false, updateUrl: false });
  // A contagem visual parte do zero; o observer acima a anima até o total
  if (el.countVisual && !prefersReducedMotion() && 'IntersectionObserver' in window) {
    el.countVisual.textContent = pluralize(0);
  }

  return { setFilter };
}

// ==========================================================================
// Construção de elementos
// ==========================================================================

function createFilters(container, categorias, produtos) {
  if (!container) return [];
  const countBy = (slug) => (slug === ALL ? produtos.length : produtos.filter((p) => p.categoria === slug).length);

  const buttons = [{ slug: ALL, nome: 'Todos' }, ...categorias].map(({ slug, nome }) => {
    const n = countBy(slug);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'catalog__filter';
    btn.dataset.filter = slug;
    btn.setAttribute('aria-pressed', 'false');

    const label = document.createElement('span');
    label.textContent = nome;
    const count = document.createElement('span');
    count.className = 'catalog__filter-count';
    count.setAttribute('aria-hidden', 'true');
    count.textContent = String(n);
    const srCount = document.createElement('span');
    srCount.className = 'sr-only';
    srCount.textContent = `, ${pluralize(n)}`;

    btn.append(label, count, srCount);
    return btn;
  });

  container.replaceChildren(...buttons);
  return buttons;
}

function createCard(product, template) {
  const node = template.content.firstElementChild.cloneNode(true);
  const q = (selector) => node.querySelector(selector);
  const nameId = `produto-${product.slug}-nome`;

  node.id = `produto-${product.slug}`;
  q('.product-card__inner').setAttribute('aria-labelledby', nameId);

  fillPicture(q('picture'), product, CARD_SIZES);
  q('.product-card__badge').hidden = !product.destaque;

  // Notas no hover
  const notes = q('.product-card__notes');
  if (product.temNotas) {
    for (const row of notes.querySelectorAll('[data-tier]')) {
      const list = product.notas[row.dataset.tier];
      row.hidden = list.length === 0;
      row.querySelector('dt').textContent = TIER_LABELS[row.dataset.tier];
      row.querySelector('dd').textContent = list.join(', ');
    }
  } else {
    notes.remove();
  }

  const category = q('.product-card__category');
  category.textContent = product.categoriaNome;
  category.hidden = !product.categoriaNome;

  const name = q('.product-card__name');
  name.id = nameId;
  name.textContent = product.nome;

  const meta = q('.product-card__meta');
  const metaParts = [product.familia_olfativa, formatVolume(product.volume_ml)].filter(Boolean);
  metaParts.forEach((part, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'product-card__sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '·';
      meta.append(sep);
    }
    const span = document.createElement('span');
    span.textContent = part;
    meta.append(span);
  });
  meta.hidden = metaParts.length === 0;

  const price = q('.product-card__price');
  price.textContent = formatPrice(product.preco);
  price.hidden = product.preco === null;

  const details = q('[data-action="details"]');
  details.dataset.slug = product.slug;
  details.querySelector('.sr-only').textContent = ` de ${product.nome}`;

  const whatsapp = q('[data-action="whatsapp"]');
  whatsapp.href = buildWhatsAppLink(MENSAGENS.produto(product.nome, product.volume_ml));
  whatsapp.querySelector('.sr-only').textContent = `: ${product.nome} (abre em nova aba)`;

  return node;
}

// ==========================================================================
// Utilitários
// ==========================================================================

function syncUrl(slug) {
  const url = new URL(window.location.href);
  if (slug === ALL) {
    url.searchParams.delete(URL_PARAM);
  } else {
    url.searchParams.set(URL_PARAM, slug);
    url.hash = 'colecao'; // link compartilhado abre direto no catálogo
  }
  history.replaceState(history.state, '', url);
}

/** Rola só a faixa de filtros (horizontal), sem mexer na rolagem da página. */
function revealInScroller(scroller, item) {
  if (scroller.scrollWidth <= scroller.clientWidth) return;
  const target = item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2;
  scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
}
