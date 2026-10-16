/**
 * Catálogo (#colecao) — abas WAI-ARIA sobre os painéis gerados no build.
 *
 * O HTML já traz as 4 abas e todos os cards (render-sections.mjs). Sem JS,
 * as abas ficam ocultas e os painéis aparecem em sequência; aqui:
 *   - mostra a lista de abas e esconde os painéis inativos;
 *   - teclado: ← → alternam (com volta), Home/End vão à primeira/última;
 *   - URL ?linha=<aba> (lista branca em src/data/tabs.js; inválido → feminino),
 *     atualizada com history.replaceState;
 *   - contador animado e entrada escalonada dos cards (CSS, respeita
 *     prefers-reduced-motion);
 *   - select() exposto para os links do menu e do rodapé (site-links.js);
 *   - botão "Detalhes" abre o modal com os dados validados do JSON.
 *
 * Nada de innerHTML: só atributos, hidden e textContent.
 */
import { DEFAULT_TAB, validTab } from '../data/tabs.js';
import { getCatalogData } from './catalog-data.js';
import { countTo, prefersReducedMotion } from './motion.js';
import { initProductModal } from './product-modal.js';
import { pluralize } from './product-schema.js';

const URL_PARAM = 'linha';

export function initCatalog(root = document.querySelector('[data-catalog]')) {
  const tablist = root?.querySelector('[data-catalog-tabs]');
  if (!root || !tablist) return null;

  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = new Map([...root.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p]));
  const { produtos, promo } = getCatalogData();
  const bySlug = new Map(produtos.map((p) => [p.slug, p]));
  const modal = initProductModal(document.querySelector('[data-product-modal]'), { promo });

  root.classList.add('has-tabs'); // CSS: títulos dos painéis viram sr-only
  tablist.hidden = false;

  let current = null;

  function select(requested, { animate = true, updateUrl = true, focus = false } = {}) {
    const slug = validTab(requested);
    if (slug === current) return;
    current = slug;

    for (const tab of tabs) {
      const on = tab.dataset.tab === slug;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
      // só quando o usuário troca (na carga, ler o layout custaria caro)
      if (on && animate) revealInScroller(tablist, tab);
    }
    for (const [key, panel] of panels) panel.hidden = key !== slug;

    // Entrada escalonada: as animações recomeçam quando o painel reaparece
    root.classList.toggle('is-switching', animate);
    const panel = panels.get(slug);
    if (animate) animateCount(panel);
    if (updateUrl) syncUrl(slug);
  }

  // ---- Teclado (padrão "tabs com ativação automática") --------------------
  tablist.addEventListener('keydown', (event) => {
    const i = tabs.findIndex((t) => t.dataset.tab === current);
    const next = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next].dataset.tab, { focus: true });
  });

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab.dataset.tab);
  });

  // ---- Detalhes → modal ---------------------------------------------------
  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="details"]');
    if (!trigger || !modal) return;
    const product = bySlug.get(trigger.closest('[data-slug]')?.dataset.slug);
    if (product) modal.open(product, trigger);
  });

  // ---- Estado inicial: URL > Feminino -------------------------------------
  const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
  select(fromUrl ?? DEFAULT_TAB, { animate: false, updateUrl: false });
  if (fromUrl !== null && fromUrl !== current) syncUrl(current); // ?linha= inválido
  countOnFirstView(panels.get(current));

  return { select };
}

// ==========================================================================
// Contador "11 fragrâncias"
// ==========================================================================

const counterOf = (panel) => panel?.querySelector('[data-count-visual]');

function animateCount(panel, { from = 0, duration = 700 } = {}) {
  const el = counterOf(panel);
  if (!el) return;
  const total = Number(el.dataset.countVisual) || 0;
  countTo(el, total, { from, duration, format: pluralize });
}

/** Na primeira vez que o catálogo aparece, a contagem sobe de 0. */
function countOnFirstView(panel) {
  const el = counterOf(panel);
  if (!el || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  el.textContent = pluralize(0);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      // a aba pode ter mudado antes de o catálogo aparecer
      const visible = el.closest('[data-panel]');
      if (visible && !visible.hidden) animateCount(visible, { duration: 1200 });
      else el.textContent = pluralize(Number(el.dataset.countVisual) || 0);
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  io.observe(el);
}

// ==========================================================================
// Utilitários
// ==========================================================================

function syncUrl(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM, slug);
  url.hash = 'colecao'; // link compartilhado abre direto no catálogo
  history.replaceState(history.state, '', url);
}

/** Rola só a faixa de abas (horizontal, no celular), sem mexer na página. */
function revealInScroller(scroller, item) {
  if (scroller.scrollWidth <= scroller.clientWidth) return;
  const target = item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2;
  scroller.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
