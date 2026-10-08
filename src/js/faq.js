/**
 * FAQ: o acordeão é <details>/<summary> nativo (teclado e leitor de tela
 * sem JS). Aqui só abrimos o item quando um link aponta para ele (#faq-…).
 */
const FAQ_ID = /^faq-[a-z0-9-]{1,60}$/;

export function initFaq() {
  const openFromHash = () => {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return; // hash malformado (ex.: "#%E0") — ignora em vez de quebrar
    }
    if (!FAQ_ID.test(id)) return; // lista branca: só ids de FAQ
    const item = document.getElementById(id);
    if (item instanceof HTMLDetailsElement) item.open = true;
  };

  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}
