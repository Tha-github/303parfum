/**
 * Dados do catálogo: lê src/data/products.json, valida cada campo e resolve
 * as imagens para URLs finais do build (hash do Vite).
 *
 * Nada aqui toca o DOM. O resto do site consome apenas o resultado
 * normalizado de getCatalogData(), nunca o JSON cru.
 */
import rawData from '../data/products.json';

const IMAGE_DIR = '/src/assets/img/produtos/';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GENEROS = new Set(['feminino', 'masculino', 'unissex']);
const TIERS = ['topo', 'coracao', 'fundo'];

// Todas as imagens de produto conhecidas pelo bundler: { 'arquivo.ext': url }
const imageModules = import.meta.glob('../assets/img/produtos/*.{avif,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const imageByFile = Object.fromEntries(
  Object.entries(imageModules).map(([path, url]) => [path.split('/').pop(), url]),
);

export const FALLBACK_IMAGE = Object.freeze({
  src: imageByFile['fallback.svg'],
  webpSrcset: '',
  avifSrcset: '',
  isFallback: true,
});

// ---- Validadores primitivos ----------------------------------------------
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const positiveNumber = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const textList = (v) => (Array.isArray(v) ? v.map((x) => text(x)).filter(Boolean) : []);

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converte o caminho do JSON (WebP 800) em src + srcsets AVIF/WebP
 * (480/800/1200w — nomes definidos em scripts/lib/images.mjs).
 * Qualquer caminho fora de IMAGE_DIR ou sem arquivo correspondente cai no fallback.
 */
export function resolveImage(path) {
  if (typeof path !== 'string' || !path.startsWith(IMAGE_DIR)) return FALLBACK_IMAGE;

  const stem = path.slice(IMAGE_DIR.length).replace(/\.(webp|avif|jpe?g|png)$/i, '');
  const webp800 = imageByFile[`${stem}.webp`];
  if (!webp800) return FALLBACK_IMAGE;

  const srcset = (ext) =>
    [
      [imageByFile[`${stem}-480.${ext}`], 480],
      [imageByFile[`${stem}.${ext}`], 800],
      [imageByFile[`${stem}-1200.${ext}`], 1200],
    ]
      .filter(([url]) => url)
      .map(([url, w]) => `${url} ${w}w`)
      .join(', ');

  return Object.freeze({
    src: webp800,
    webpSrcset: srcset('webp'),
    avifSrcset: srcset('avif'),
    isFallback: false,
  });
}

// ---- Normalização ---------------------------------------------------------
function normalizeCategories(raw) {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : []).flatMap((c) => {
    if (!isObject(c)) return [];
    const slug = text(c.slug);
    const nome = text(c.nome);
    if (!SLUG_RE.test(slug) || !nome || seen.has(slug)) return [];
    seen.add(slug);
    return [Object.freeze({ slug, nome })];
  });
}

function normalizeProduct(raw, index, categoryBySlug, usedSlugs) {
  if (!isObject(raw)) return null;

  const nome = text(raw.nome, 'Fragrância 303');
  let slug = text(raw.slug);
  if (!SLUG_RE.test(slug)) slug = slugify(nome) || `produto-${index + 1}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${index + 1}`;
  usedSlugs.add(slug);

  const categoria = categoryBySlug.has(raw.categoria) ? raw.categoria : null;
  const notasRaw = isObject(raw.notas) ? raw.notas : {};
  const notas = Object.freeze(
    Object.fromEntries(TIERS.map((tier) => [tier, Object.freeze(textList(notasRaw[tier]))])),
  );
  const preco = typeof raw.preco === 'number' && Number.isFinite(raw.preco) && raw.preco >= 0 ? raw.preco : null;

  return Object.freeze({
    id: text(raw.id, `303-${String(index + 1).padStart(3, '0')}`),
    slug,
    nome,
    categoria,
    categoriaNome: categoria ? categoryBySlug.get(categoria).nome : '',
    genero: GENEROS.has(raw.genero) ? raw.genero : null,
    descricao_curta: text(raw.descricao_curta),
    descricao: text(raw.descricao, text(raw.descricao_curta)),
    notas,
    temNotas: TIERS.some((tier) => notas[tier].length > 0),
    familia_olfativa: text(raw.familia_olfativa),
    volume_ml: positiveNumber(raw.volume_ml),
    preco,
    imagem: resolveImage(raw.imagem),
    imagem_alt: text(raw.imagem_alt, `Frasco do perfume ${nome}`),
    destaque: raw.destaque === true,
  });
}

let cache = null;

/**
 * @param {unknown} [raw] dados no formato de products.json (padrão: o arquivo do projeto)
 * @returns {{ categorias: ReadonlyArray<{slug:string,nome:string}>, produtos: ReadonlyArray<object> }}
 */
export function normalizeCatalog(raw) {
  const source = isObject(raw) ? raw : {};
  const categorias = normalizeCategories(source.categorias);
  const categoryBySlug = new Map(categorias.map((c) => [c.slug, c]));
  const usedSlugs = new Set();
  const produtos = (Array.isArray(source.produtos) ? source.produtos : [])
    .map((p, i) => normalizeProduct(p, i, categoryBySlug, usedSlugs))
    .filter(Boolean);

  if (import.meta.env.DEV) {
    const invalid = (Array.isArray(source.produtos) ? source.produtos : []).length - produtos.length;
    if (invalid > 0) console.warn(`[catálogo] ${invalid} produto(s) inválido(s) ignorado(s).`);
  }

  return Object.freeze({ categorias: Object.freeze(categorias), produtos: Object.freeze(produtos) });
}

export function getCatalogData() {
  cache ??= normalizeCatalog(rawData);
  return cache;
}

export const TIER_LABELS = Object.freeze({ topo: 'Topo', coracao: 'Coração', fundo: 'Fundo' });

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = (value) => (value === null ? '' : brl.format(value));
export const formatVolume = (ml) => (ml ? `${ml} ml` : '');
