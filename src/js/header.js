/**
 * Header: estado "rolado" + menu mobile acessível.
 *
 * - Fundo sempre preto (header.css). Passou de SCROLL_THRESHOLD px →
 *   .is-scrolled (barra mais baixa), mantida até voltar ao topo.
 * - Menu mobile: aria-expanded, trava de scroll, ESC fecha, clique em link
 *   fecha, foco preso no menu, resto da página `inert` enquanto aberto,
 *   foco devolvido ao botão ao fechar.
 */

import { lockScroll, unlockScroll } from './scroll-lock.js';

const SCROLL_THRESHOLD = 80; // liga a barra compacta
const TOP_THRESHOLD = 4; // desliga só (praticamente) no topo
const DESKTOP_QUERY = '(min-width: 64em)';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  initScrollState(header);
  initMobileMenu(header);
}

/**
 * Barra compacta: liga ao passar de SCROLL_THRESHOLD e só desliga ao
 * VOLTAR AO TOPO (histerese — não pisca entre 1 e 80 px). Verifica também
 * ao carregar (reload no meio da página), quando o navegador restaura a
 * rolagem e quando a página volta do cache (botão "voltar").
 */
function initScrollState(header) {
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (y > SCROLL_THRESHOLD) header.classList.add('is-scrolled');
    else if (y <= TOP_THRESHOLD) header.classList.remove('is-scrolled');
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );

  // Estado inicial no 'load' (não na execução do script: ler scrollY ali
  // forçaria o layout da página inteira no meio da inicialização). Reload no
  // meio da página e saltos para #âncora também disparam 'scroll'.
  if (document.readyState === 'complete') requestAnimationFrame(update);
  else window.addEventListener('load', update, { once: true });
  window.addEventListener('pageshow', update); // volta do cache (bfcache)
}

function initMobileMenu(header) {
  const toggle = header.querySelector('[data-nav-toggle]');
  const nav = header.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const label = toggle.querySelector('[data-nav-toggle-label]');
  const desktop = window.matchMedia(DESKTOP_QUERY);
  // Tudo que não é o header fica inerte com o menu aberto
  const outside = () => [...document.body.children].filter((el) => el !== header);

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  // Ordem do DOM: wordmark → links do menu → botão. Só o que está visível.
  const focusables = () =>
    [...header.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

  function open() {
    lockScroll();
    header.classList.add('is-menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Fechar menu';
    outside().forEach((el) => (el.inert = true));
    document.addEventListener('keydown', onKeydown);

    // Espera o menu ficar visível para mover o foco
    requestAnimationFrame(() => nav.querySelector(FOCUSABLE)?.focus());
  }

  function close({ restoreFocus = true } = {}) {
    unlockScroll();
    header.classList.remove('is-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Abrir menu';
    outside().forEach((el) => (el.inert = false));
    document.removeEventListener('keydown', onKeydown);
    if (restoreFocus) toggle.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];

    if (!header.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));

  // Clique em qualquer link do menu fecha (a âncora segue normalmente)
  nav.addEventListener('click', (event) => {
    if (isOpen() && event.target.closest('a')) close({ restoreFocus: false });
  });

  // Ao virar desktop com o menu aberto, desfaz tudo
  desktop.addEventListener('change', (event) => {
    if (event.matches && isOpen()) close({ restoreFocus: false });
  });
}
