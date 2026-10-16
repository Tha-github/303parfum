/**
 * Otimiza as FOTOS REAIS do site.
 *
 * 1. Foto do hero: substitua src/assets/img/banneroficial.png (quanto maior
 *    melhor). É convertida sozinha a cada build (npm run build) e por este
 *    script, sem recorte.
 *    Fotos dos produtos (JPG/PNG/WebP/TIFF, quanto maior melhor) em:
 *      images-src/produtos/<slug>.jpg        → mesmo slug do products.json
 * 2. Rode:  npm run images
 *
 * Produtos: SEM recorte (fotos mais estreitas que 4:5 ganham margem na cor
 * do fundo), AVIF/WebP/JPG em 400/800/1200w, ≤ 150 KB por arquivo.
 * Hero (banneroficial.png): proporção original, AVIF/WebP/JPG em
 * 480/800/1200/1600w, ≤ 200 KB. Nunca amplia; remove metadados EXIF.
 *
 *   node scripts/optimize-images.mjs --banner   → só o hero, e só se o
 *   banneroficial.png for mais novo que as variantes (é o que o prebuild usa)
 */
import { access, readdir, stat } from 'node:fs/promises';
import { extname, parse, resolve } from 'node:path';
import sharp from 'sharp';
import { BANNER_SOURCE, bannerWidths, IMG_DIR, KINDS, ROOT, writeVariants } from './lib/images.mjs';

const bannerOnly = process.argv.includes('--banner');

async function bannerIsStale() {
  try {
    await access(BANNER_SOURCE);
  } catch {
    console.error('✗ src/assets/img/banneroficial.png não encontrado (foto do hero).');
    process.exit(1);
  }
  const src = (await stat(BANNER_SOURCE)).mtimeMs;
  try {
    const widths = await bannerWidths();
    if (widths.length === 0) return true;
    const out = (await stat(resolve(IMG_DIR, 'hero', `banner-${widths.at(-1)}.avif`))).mtimeMs;
    return src > out;
  } catch {
    return true; // variantes ainda não existem
  }
}

const SRC = resolve(ROOT, 'images-src');
const INPUT_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);

let total = 0;
let over = 0;
const log = (results) => {
  total += results.length;
  for (const r of results) {
    if (r.overBudget) over += 1;
    console.log(`${r.overBudget ? '⚠' : '✓'} ${r.file}  ${r.kb} KB  (q${r.quality})${r.padded ? '  [margem lateral p/ 4:5]' : ''}`);
  }
};

// Hero (banneroficial.png)
if (!bannerOnly || (await bannerIsStale())) {
  const { width } = await sharp(BANNER_SOURCE).metadata();
  if (width < 1600) console.warn(`⚠ banneroficial.png tem ${width}px de largura; o ideal é ≥ 1600px (telas grandes vão ampliar a foto).`);
  log(await writeVariants(BANNER_SOURCE, 'banner', 'banner'));
} else {
  console.log('✓ hero: variantes do banneroficial.png já estão atualizadas');
}

for (const kind of bannerOnly ? [] : Object.keys(KINDS).filter((k) => k !== 'banner')) {
  let files = [];
  try {
    files = (await readdir(resolve(SRC, kind))).filter((f) => INPUT_EXT.has(extname(f).toLowerCase()));
  } catch {
    continue; // pasta ausente: nada a fazer para este tipo
  }

  for (const f of files) {
    const name = parse(f).name.toLowerCase();
    log(await writeVariants(resolve(SRC, kind, f), kind, name));
  }
}

if (total === 0) {
  if (!bannerOnly) console.log('Nenhuma foto encontrada em images-src/produtos/. Veja o README.');
} else {
  console.log(`\n${total} arquivos gerados${over ? `, ${over} acima do orçamento (use uma foto mais simples/menor)` : ', todos dentro do orçamento'}.`);
  if (over) process.exitCode = 1;
}
