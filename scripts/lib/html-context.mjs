/**
 * Reúne tudo o que a sincronização dos HTML precisa (sempre lido do disco,
 * sem cache: no dev, edições aparecem sem reiniciar).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { BANNER_SOURCE, bannerWidths } from './images.mjs';

export const ROOT = resolve(import.meta.dirname, '../..');
export const PAGES = ['index.html', 'politica-de-privacidade.html', '404.html'].map((p) => resolve(ROOT, p));
export const PARTIALS_DIR = resolve(ROOT, 'src/partials');
export const SITE_CONFIG = resolve(ROOT, 'config/site.mjs');
export const FAQ_DATA = resolve(ROOT, 'src/data/faq.js');

/** Regiões geradas e o partial de origem de cada uma. */
const PARTIALS = { footer: 'footer.html', contato: 'contact-info.html', seo: 'seo.html' };

const freshImport = (file) => import(`${pathToFileURL(file).href}?t=${Date.now()}`);

export async function loadSyncContext() {
  const { SITE } = await freshImport(SITE_CONFIG);
  const { faqItems } = await freshImport(FAQ_DATA);
  const partials = {};
  for (const [name, file] of Object.entries(PARTIALS)) {
    partials[name] = await readFile(resolve(PARTIALS_DIR, file), 'utf8');
  }
  let size;
  try {
    const { width, height } = await sharp(BANNER_SOURCE).metadata();
    size = { width, height };
  } catch {
    size = undefined;
  }
  return { site: SITE, faqItems, partials, hero: { widths: await bannerWidths(), size } };
}
