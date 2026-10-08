/**
 * Eventos globais entre módulos (desacoplados via CustomEvent no document).
 *
 * filter:category
 *   detail: { category: string, source: string }
 *   Disparado ao escolher uma linha de produto. O catálogo (#colecao)
 *   escuta e aplica o filtro:
 *
 *   document.addEventListener(FILTER_CATEGORY, (e) => aplicar(e.detail.category));
 */

export const FILTER_CATEGORY = 'filter:category';

let lastCategory = null;

/**
 * Pede ao catálogo que filtre por uma categoria.
 * @param {string} category slug de products.json → categorias
 * @param {string} [source] quem pediu (útil para analytics/debug)
 */
export function requestCategoryFilter(category, source = 'unknown') {
  lastCategory = category;
  document.dispatchEvent(
    new CustomEvent(FILTER_CATEGORY, { detail: { category, source } }),
  );
}

/**
 * Última categoria pedida — para o catálogo aplicar ao inicializar,
 * caso o clique aconteça antes de ele terminar de carregar os dados.
 * @returns {string | null}
 */
export function getRequestedCategory() {
  return lastCategory;
}
