/**
 * Otimiza as FOTOS REAIS do site.
 *
 * 1. Foto do hero: substitua src/assets/img/banner.png (PNG com fundo
 *    transparente, a pessoa inteira, quanto maior melhor). É convertida
 *    sozinha a cada build (npm run build) e por este script.
 *    Demais fotos (JPG/PNG/WebP/TIFF, quanto maior melhor) em:
 *      images-src/linhas/<slug>.jpg          → masculino, feminino, nicho,
 *                                              arabe, capilar, oleo-corporal
 *      images-src/produtos/<slug>.jpg        → mesmo slug do products.json
 * 2. Rode:  npm run images
 *
 * Linhas/produtos: recorte 4:5 (foco automático no assunto), AVIF/WebP em
 * 480/800/1200w. Hero (banner.png): proporção original SEM recorte,
 * AVIF/WebP/PNG em 480/800/1200/1600w. Remove metadados EXIF e confere o
 * orçamento de peso (hero ≤ 200 KB por arquivo).
 *
 *   node scripts/optimize-images.mjs --banner   → só o hero, e só se o
 *   banner.png for mais novo que as variantes (é o que o prebuild usa)
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
    console.error('✗ src/assets/img/banner.png não encontrado (foto do hero).');
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
    console.log(`${r.overBudget ? '⚠' : '✓'} ${r.file}  ${r.kb} KB  (q${r.quality})`);
  }
};

// Hero (banner.png)
if (!bannerOnly || (await bannerIsStale())) {
  const { width } = await sharp(BANNER_SOURCE).metadata();
  if (width < 1600) console.warn(`⚠ banner.png tem ${width}px de largura; o ideal é ≥ 1600px (telas grandes vão ampliar a foto).`);
  log(await writeVariants(BANNER_SOURCE, 'banner', 'banner'));
} else {
  console.log('✓ hero: variantes do banner.png já estão atualizadas');
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
  if (!bannerOnly) console.log('Nenhuma foto encontrada em images-src/{linhas,produtos}/. Veja o README.');
} else {
  console.log(`\n${total} arquivos gerados${over ? `, ${over} acima do orçamento (use uma foto mais simples/menor)` : ', todos dentro do orçamento'}.`);
  if (over) process.exitCode = 1;
}
