/**
 * Links compartilhados (rodapé) e atalhos de categoria.
 *
 * - Ano do rodapé: o build grava o ano atual; aqui atualizamos no cliente.
 * - Na home, links "/#secao" viram "#secao": só rolam, sem recarregar a
 *   página (o que perderia ?linha= e o estado do catálogo).
 * - Links [data-category] (cards de Linhas e rodapé) filtram o catálogo sem
 *   recarregar; o href real (/?linha=…#colecao) segue funcionando sem JS e
 *   nas outras páginas.
 */
import { requestCategoryFilter } from './events.js';

/**
 * Seções abaixo da dobra usam content-visibility:auto (motion.css): até
 * serem exibidas, o navegador estima o tamanho delas. Ao abrir a página já
 * em "/#secao", a rolagem cairia no lugar errado. Aqui: renderiza tudo uma
 * vez, rola até o alvo e devolve o modo econômico — com
 * contain-intrinsic-size:auto o navegador lembra os tamanhos reais, então
 * nada se desloca depois.
 */
export function initHashLanding() {
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  const target = id && document.getElementById(id);
  if (!target) return;

  const root = document.documentElement;
  root.classList.add('is-hash-landing');
  const land = () => {
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    requestAnimationFrame(() => root.classList.remove('is-hash-landing'));
  };
  if (document.readyState === 'complete') land();
  else window.addEventListener('load', land, { once: true });
}

export function initFooterYear(root = document) {
  const year = String(new Date().getFullYear());
  root.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
  });
}

export function initSamePageLinks() {
  if (!document.getElementById('colecao')) return; // só na home
  document.querySelectorAll('a[href^="/#"]').forEach((link) => {
    link.setAttribute('href', link.getAttribute('href').slice(1));
  });
}

export function initCategoryLinks() {
  const catalog = document.getElementById('colecao');
  if (!catalog) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-category]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    requestCategoryFilter(link.dataset.category, link.closest('footer') ? 'footer' : 'lines');
    // scroll-behavior e scroll-padding-top do CSS valem aqui também
    catalog.scrollIntoView({ block: 'start' });
  });
}
