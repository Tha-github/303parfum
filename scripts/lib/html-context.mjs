/**
 * Reúne tudo o que a sincronização dos HTML precisa (sempre lido do disco,
 * sem cache: no dev, edições aparecem sem reiniciar).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { activePromo } from '../../src/js/price.js';
import { normalizeProducts } from '../../src/js/product-schema.js';
import { BANNER_SOURCE, bannerWidths, PRODUCTS_DIR, productWidths } from './images.mjs';
import { renderCatalog, renderHeroPromo } from './render-sections.mjs';

export const ROOT = resolve(import.meta.dirname, '../..');
export const PAGES = ['index.html', 'politica-de-privacidade.html', '404.html'].map((p) => resolve(ROOT, p));
export const PARTIALS_DIR = resolve(ROOT, 'src/partials');
export const SITE_CONFIG = resolve(ROOT, 'config/site.mjs');
export const FAQ_DATA = resolve(ROOT, 'src/data/faq.js');
export const PRODUCTS_DATA = resolve(ROOT, 'src/data/products.json');
export const PROMO_CONFIG = resolve(ROOT, 'src/data/config.json');

/** Regiões geradas e o partial de origem de cada uma. */
const PARTIALS = { footer: 'footer.html', contato: 'contact-info.html', seo: 'seo.html' };

const freshImport = (file) => import(`${pathToFileURL(file).href}?t=${Date.now()}`);
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

async function imageSize(file) {
  try {
    const { width, height } = await sharp(file).metadata();
    return { width, height };
  } catch {
    return undefined;
  }
}

/** Larguras e proporção (da maior variante) de cada foto de produto; ausente = undefined. */
export async function loadProductImages(products) {
  const images = {};
  for (const slug of new Set(products.map((p) => p.imagem).filter(Boolean))) {
    const widths = await productWidths(slug);
    if (!widths.length) continue;
    const size = await imageSize(resolve(PRODUCTS_DIR, `${slug}-${widths.at(-1)}.jpg`));
    if (size) images[slug] = { widths, size };
  }
  return images;
}

/** Produtos válidos, promoção ativa e fotos — o mesmo para HTML e JSON-LD. */
export async function loadCatalogContext() {
  const products = normalizeProducts(await readJson(PRODUCTS_DATA));
  const promo = activePromo(await readJson(PROMO_CONFIG));
  const images = await loadProductImages(products);
  return { products, promo, images };
}

export async function loadSyncContext() {
  const { SITE } = await freshImport(SITE_CONFIG);
  const { faqItems } = await freshImport(FAQ_DATA);
  const partials = {};
  for (const [name, file] of Object.entries(PARTIALS)) {
    partials[name] = await readFile(resolve(PARTIALS_DIR, file), 'utf8');
  }
  const catalog = await loadCatalogContext();
  const generated = {
    catalogo: renderCatalog(catalog),
    promocao: renderHeroPromo(catalog.promo),
  };
  return {
    site: SITE,
    faqItems,
    partials,
    generated,
    hero: { widths: await bannerWidths(), size: await imageSize(BANNER_SOURCE) },
  };
}
