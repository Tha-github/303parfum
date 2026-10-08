/**
 * Trava/destrava a rolagem da página (menu mobile, modal de produto).
 * A largura da barra de rolagem vira padding no body (base.css) para o
 * layout não "pular" quando ela some.
 */
const root = document.documentElement;

export function lockScroll() {
  root.style.setProperty('--scrollbar-width', `${window.innerWidth - root.clientWidth}px`);
  root.classList.add('is-scroll-locked');
}

export function unlockScroll() {
  root.classList.remove('is-scroll-locked');
}
