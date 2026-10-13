/**
 * Links compartilhados (rodapé) e atalhos para as abas do catálogo.
 *
 * - Ano do rodapé: o build grava o ano atual; aqui atualizamos no cliente.
 * - Na home, links "/#secao" viram "#secao": só rolam, sem recarregar a
 *   página (o que perderia ?linha= e o estado do catálogo).
 * - Links [data-tab-link] (menu e rodapé) ativam a aba do
 *   catálogo sem recarregar; o href real (?linha=…#colecao) segue
 *   funcionando sem JS e nas outras páginas.
 */

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

/**
 * @param {(tab: string) => void} selectTab ativa a aba (catalog.js valida
 *   contra a lista branca e atualiza ?linha=)
 */
export function initTabLinks(selectTab) {
  const catalog = document.getElementById('colecao');
  if (!catalog || typeof selectTab !== 'function') return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-tab-link]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    selectTab(link.dataset.tabLink);
    // scroll-behavior e scroll-padding-top do CSS valem aqui também
    catalog.scrollIntoView({ block: 'start' });
  });
}
