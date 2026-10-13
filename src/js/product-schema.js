/**
 * Validação dos produtos de src/data/products.json — funções puras, usadas
 * no build (cards e JSON-LD gerados no HTML) e no navegador (modal).
 *
 * Produto inválido (slug, nome ou categorias) é descartado. O campo interno
 * `confirmar` nunca sai daqui: só o relatório do build o lê, direto do JSON.
 */
import { TAB_SLUGS } from '../data/tabs.js';

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Enquadramento da foto no card (4:5). Padrão: center 35%.
 *   topo | base | esquerda | direita  → desloca o recorte
 *   inteiro                           → mostra a foto toda (contain)
 */
export const FOCOS = Object.freeze(['topo', 'base', 'esquerda', 'direita', 'inteiro']);

export const TIER_LABELS = Object.freeze({ topo: 'Topo', corpo: 'Corpo', fundo: 'Fundo' });
const TIERS = Object.keys(TIER_LABELS);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v, max = 600) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const textList = (v) => (Array.isArray(v) ? v.map((x) => text(x, 60)).filter(Boolean).slice(0, 12) : []);

/** Produto normalizado (congelado) ou null. */
export function normalizeProduct(raw) {
  if (!isObject(raw)) return null;
  const slug = text(raw.slug, 80);
  const nome = text(raw.nome, 80);
  if (!SLUG_RE.test(slug) || !nome) return null;

  const categorias = [...new Set(Array.isArray(raw.categorias) ? raw.categorias : [])].filter((c) => TAB_SLUGS.includes(c));
  if (categorias.length === 0) return null;

  const notasRaw = isObject(raw.notas) ? raw.notas : {};
  const notas = Object.freeze(Object.fromEntries(TIERS.map((t) => [t, Object.freeze(textList(notasRaw[t]))])));

  return Object.freeze({
    id: Number.isInteger(raw.id) ? raw.id : null,
    slug,
    nome,
    referencia: text(raw.referencia, 80),
    categorias: Object.freeze(categorias),
    familia: text(raw.familia, 80),
    descricao: text(raw.descricao),
    notas,
    temNotas: TIERS.some((t) => notas[t].length > 0),
    imagem: typeof raw.imagem === 'string' && SLUG_RE.test(raw.imagem) ? raw.imagem : null,
    foco: FOCOS.includes(raw.foco) ? raw.foco : null,
  });
}

/** Lista válida, sem slugs repetidos (vale o primeiro). */
export function normalizeProducts(raw) {
  const seen = new Set();
  return Object.freeze(
    (Array.isArray(raw) ? raw : []).map(normalizeProduct).filter((p) => p && !seen.has(p.slug) && seen.add(p.slug)),
  );
}

export const productsInTab = (products, tab) => products.filter((p) => p.categorias.includes(tab));

/** "Perfume Good Girl — família Oriental Floral — 303 Parfum" */
export const productAlt = (p) => (p.familia ? `Perfume ${p.nome} — família ${p.familia} — 303 Parfum` : `Perfume ${p.nome} — 303 Parfum`);

export const pluralize = (n) => (n === 1 ? '1 fragrância' : `${n} fragrâncias`);
