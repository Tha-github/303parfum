/**
 * Movimento do site — sem bibliotecas, só transform/opacity.
 *
 *   1. Revelação ao rolar (fade + 24px), uma vez por elemento, com
 *      escalonamento dentro de grupos (cards, pilares, passos…).
 *   2. Títulos H2 revelados linha a linha (máscara overflow:hidden).
 *   3. Linhas douradas que se "desenham" (scaleX 0 → 1).
 *   4. countTo(): contador numérico animado (usado pelo catálogo).
 *
 * Os seletores ficam aqui, não no HTML: o markup continua limpo e, sem JS
 * ou com prefers-reduced-motion, nada é escondido (a classe .has-motion
 * no <html> é o que ativa os estados iniciais no CSS — ver motion.css).
 */

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => reducedMotionQuery.matches;

// ---- O que anima ------------------------------------------------------------
const REVEAL = [
  'main .section .eyebrow',
  '.manifesto__text',
  '.lines__intro',
  '.catalog__count',
  '.catalog__filters',
  '.catalog__grid',
  '.resell__intro-text',
  '.signup__text',
  '.signup__privacy',
  '.signup__panel',
  '.split__text',
  '.faq__intro',
  '.split__subtitle',
  '.form-panel',
  '.map',
  '.site-footer__brand',
  '.site-footer__bottom',
  '.not-found__inner > :not(h1)',
].join(',');

/** Pais cujos filhos entram em cascata. */
const GROUPS = [
  '.pillars',
  '.lines__grid',
  '.steps',
  '.benefits',
  '.faq__list',
  '.contact__info',
  '.site-footer__nav',
].join(',');

/** Títulos revelados por linha. */
const SPLIT = [
  '.manifesto__title',
  '#linhas-title',
  '.resell__title',
  '.resell__block-title',
  '.signup__title',
  '.split__title',
  '.faq__title',
  '#contato-title',
].join(',');

/** Linhas finas que se desenham. */
const DRAW = ['.eyebrow--rule', '.steps', '.manifesto__signature', '.site-footer'].join(',');

const MAX_STAGGER = 6;

/** Grupos que viram carrossel horizontal no mobile (ver lines.css). */
const CAROUSELS = '.lines__grid';
const carouselQuery = window.matchMedia('(max-width: 47.999em)');

// ==========================================================================

export function initMotion() {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const targets = tagTargets();

  root.classList.add('has-motion');

  // O que já está na tela no carregamento aparece sem animação. Quem diz
  // isso é o 1º retorno do IntersectionObserver (calculado na renderização
  // normal) — sem getBoundingClientRect(), que forçaria o layout da página
  // inteira durante a inicialização. Exceção: linhas que desenham.
  let firstReport = true;

  // Escalonamento por LOTE: o que entra na tela no mesmo callback (ex.: uma
  // linha da grade) recebe atrasos 0, 1, 2… em ordem do documento. Assim a
  // 2ª linha de cards não herda o atraso acumulado da 1ª.
  const observer = new IntersectionObserver(
    (entries) => {
      const batch = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

      const instant = firstReport;
      firstReport = false;
      let i = 0;
      for (const el of batch) {
        observer.unobserve(el); // uma vez por elemento
        const targets = el.dataset.motionGroup !== undefined ? [...el.children] : [];
        targets.push(el);
        for (const t of targets) {
          // já visível no carregamento: aparece sem animar (linhas ainda desenham)
          if (instant && t.dataset.motion) t.classList.add('is-instant');
          reveal(t, i++);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0 },
  );

  for (const el of [...targets.reveal, ...targets.groups, ...targets.draw]) observer.observe(el);

  // Se o usuário ativar "reduzir movimento" com a página aberta
  reducedMotionQuery.addEventListener('change', (event) => {
    if (event.matches) root.classList.remove('has-motion');
  });

}

/** Fora do sistema: hero (tem entrada própria) e conteúdos que nascem
 *  ocultos e aparecem depois (modal, estado vazio, telas de sucesso). */
const EXCLUDED = '.hero, dialog, [hidden], .form-success, .catalog__empty';

function tagTargets() {
  const eligible = (el) => !el.closest(EXCLUDED);
  const reveal = new Set();
  const groups = [];

  document.querySelectorAll(REVEAL).forEach((el) => {
    if (!eligible(el)) return;
    el.dataset.motion = 'reveal';
    reveal.add(el);
  });

  document.querySelectorAll(GROUPS).forEach((group) => {
    if (!eligible(group)) return;
    // Carrossel (rolagem horizontal): filhos fora da tela nunca "entrariam"
    // pelo eixo vertical; o grupo inteiro vira o gatilho. Detectado por
    // media query (getComputedStyle forçaria cálculo de estilo na carga).
    const scrollsX = group.matches(CAROUSELS) && carouselQuery.matches;
    if (scrollsX) {
      group.dataset.motionGroup = '';
      groups.push(group);
    }
    for (const child of group.children) {
      child.dataset.motion = 'reveal';
      if (!scrollsX) reveal.add(child);
    }
  });

  document.querySelectorAll(SPLIT).forEach((title) => {
    if (!eligible(title)) return;
    splitWords(title);
    title.dataset.motion = 'split';
    reveal.add(title);
  });

  const draw = [...document.querySelectorAll(DRAW)];
  draw.forEach((el) => {
    el.dataset.draw = '';
  });

  return { reveal: [...reveal], draw, groups };
}

function reveal(el, index = 0) {
  if (el.dataset.draw !== undefined) el.classList.add('is-drawn');
  if (el.dataset.motion === 'split') assignLines(el);
  if (el.dataset.motion) {
    el.style.setProperty('--reveal-i', String(Math.min(index, MAX_STAGGER)));
    el.classList.add('is-revealed');
  }
}

// ==========================================================================
// Títulos linha a linha
// ==========================================================================

/**
 * Envolve cada palavra em <span class="split-word"><span class="split-word__inner">.
 * Preserva elementos internos (<em>…) e espaços. Leitores de tela continuam
 * lendo o texto normalmente (spans inline, sem aria extra).
 */
function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        continue;
      }
      const word = document.createElement('span');
      word.className = 'split-word';
      const inner = document.createElement('span');
      inner.className = 'split-word__inner';
      inner.textContent = part;
      word.append(inner);
      fragment.append(word);
    }
    node.replaceWith(fragment);
  }
}

/** Calcula a linha de cada palavra na largura atual (medido no momento da revelação). */
function assignLines(title) {
  let line = -1;
  let lastTop = null;
  for (const word of title.querySelectorAll('.split-word')) {
    const top = word.getBoundingClientRect().top;
    if (lastTop === null || top - lastTop > 4) {
      line += 1;
      lastTop = top;
    }
    word.style.setProperty('--line', String(line));
  }
}

// ==========================================================================
// Contador
// ==========================================================================

const running = new WeakMap();
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Anima o texto de `el` de `from` até `to`. Com reduced-motion, vai direto.
 * @param {HTMLElement} el
 * @param {number} to
 * @param {{ from?: number, duration?: number, format?: (n: number) => string }} [options]
 */
export function countTo(el, to, { from = 0, duration = 900, format = String } = {}) {
  cancelAnimationFrame(running.get(el));
  if (prefersReducedMotion() || from === to) {
    el.textContent = format(to);
    return;
  }

  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format(Math.round(from + (to - from) * easeOutCubic(t)));
    if (t < 1) running.set(el, requestAnimationFrame(step));
  };
  running.set(el, requestAnimationFrame(step));
}
