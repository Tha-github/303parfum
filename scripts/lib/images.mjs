/**
 * Regras de imagem do site — fonte única para:
 *   - scripts/optimize-images.mjs  (fotos reais → variantes otimizadas)
 *   - scripts/lib/html-context.mjs (srcset montado com o que existe em disco)
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

export const ROOT = resolve(import.meta.dirname, '../..');
export const IMG_DIR = resolve(ROOT, 'src/assets/img');

/** Qualidade: WebP/JPEG ~78. AVIF usa outra escala: 60 equivale visualmente.
 *  PNG: paleta quantizada (mantém a transparência). */
export const QUALITY = { avif: 60, webp: 78, jpg: 78, png: 80 };

/** Foto do hero — sem recorte, proporção original. */
export const BANNER_SOURCE = resolve(IMG_DIR, 'banneroficial.png');
export const BANNER_DIR = resolve(IMG_DIR, 'hero');
export const PRODUCTS_DIR = resolve(IMG_DIR, 'produtos');

export const KINDS = {
  // Hero: src/assets/img/banneroficial.png → hero/banner-<w>.{avif,webp,jpg}
  banner: {
    dir: 'hero',
    widths: [480, 800, 1200, 1600], // limitadas ao tamanho real da foto (sem ampliar)
    formats: ['avif', 'webp', 'jpg'],
    file: (_name, w) => `banner-${w}`,
    budgetKB: 200, // teto por arquivo (meta de LCP)
    keepAspect: true, // NUNCA recortar a foto do hero
  },
  // Produtos: images-src/produtos/<slug>.* → produtos/<slug>-<w>.{avif,webp,jpg}
  produtos: {
    dir: 'produtos',
    widths: [400, 800, 1200],
    formats: ['avif', 'webp', 'jpg'], // JPG = fallback universal
    file: (slug, w) => `${slug}-${w}`,
    budgetKB: 150, // máx. 150 KB por arquivo (inclui o 800w)
    keepAspect: true,
    // fotos mais estreitas que 4:5 ganham margem lateral na cor do fundo:
    // o card (4:5, object-fit: cover) nunca corta o frasco
    padToAspect: 4 / 5,
  },
};

const ASPECT = 4 / 5; // tipos sem keepAspect: recorte 4:5

/** Larguras geradas de uma imagem (lidas do disco), em ordem crescente. */
export async function variantWidths(dir, name, ext = 'avif') {
  const re = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)\\.${ext}$`);
  try {
    const files = await readdir(dir);
    return [...new Set(files.map((f) => re.exec(f)?.[1]).filter(Boolean).map(Number))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export const bannerWidths = () => variantWidths(BANNER_DIR, 'banner');
export const productWidths = (slug) => variantWidths(PRODUCTS_DIR, slug);

const encode = (pipeline, format, quality, background) => {
  if (format === 'avif') return pipeline.avif({ quality, effort: 6 });
  if (format === 'webp') return pipeline.webp({ quality, effort: 6, alphaQuality: 90 });
  if (format === 'png') return pipeline.png({ palette: true, quality, effort: 8, compressionLevel: 9 });
  // JPG não tem transparência: achata sobre a cor do fundo (sem isso, fica preto)
  return pipeline.flatten({ background }).jpeg({ quality, mozjpeg: true, progressive: true });
};

/** Cor do canto superior esquerdo (fundo da foto), em hex. */
async function cornerColor(input) {
  const { data } = await sharp(input).rotate().flatten({ background: '#ffffff' }).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  return `#${[...data.subarray(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Margem lateral até a proporção mínima (ex.: 4:5) — nada da foto é cortado. */
async function padToAspect(input, aspect, background) {
  const meta = await sharp(input).rotate().metadata();
  const width = meta.autoOrient?.width ?? meta.width;
  const height = meta.autoOrient?.height ?? meta.height;
  const target = Math.round(height * aspect);
  if (width >= target) return { buffer: null, padded: false };
  const left = Math.floor((target - width) / 2);
  const buffer = await sharp(input)
    .rotate()
    .extend({ left, right: target - width - left, background })
    .toBuffer();
  return { buffer, padded: true };
}

/**
 * Gera todas as variantes de uma imagem.
 * Se um arquivo passar do orçamento, reduz a qualidade em passos de 6 (até 40).
 * @returns {Promise<Array<{file: string, kb: number, quality: number, overBudget: boolean, padded?: boolean}>>}
 */
export async function writeVariants(input, kind, name) {
  const spec = KINDS[kind];
  const results = [];
  const background = await cornerColor(input);

  let source = input;
  let padded = false;
  if (spec.padToAspect) {
    const pad = await padToAspect(input, spec.padToAspect, background);
    if (pad.buffer) {
      source = pad.buffer;
      padded = pad.padded;
    }
  }

  let widths = spec.widths;
  if (spec.keepAspect) {
    // Nunca ampliar: só larguras ≤ a original, e a original se for menor que a maior
    const { width: original } = await sharp(source).metadata();
    widths = spec.widths.filter((w) => w <= original);
    if (original < Math.max(...spec.widths) && !widths.includes(original)) widths.push(original);
    // apaga variantes anteriores DESTE nome (regex exata: "invictus" não pega "invictus-elixir")
    const dir = resolve(IMG_DIR, spec.dir);
    await mkdir(dir, { recursive: true });
    const mine = new RegExp(`^${spec.file(name, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+\\.(avif|webp|jpg|png)$`);
    for (const f of await readdir(dir)) if (mine.test(f)) await rm(resolve(dir, f));
  }

  for (const w of widths) {
    // .rotate() aplica a orientação EXIF; o sharp NÃO copia metadados (GPS etc.)
    const base = sharp(source, { failOn: 'error' }).rotate();
    if (spec.keepAspect) {
      base.resize({ width: w });
    } else {
      base.resize(w, Math.round(w / ASPECT), { fit: 'cover', position: sharp.strategy.attention });
    }

    for (const format of spec.formats) {
      const out = resolve(IMG_DIR, spec.dir, `${spec.file(name, w)}.${format}`);
      await mkdir(dirname(out), { recursive: true });

      let quality = QUALITY[format];
      let kb;
      for (;;) {
        await encode(base.clone(), format, quality, background).toFile(out);
        kb = (await stat(out)).size / 1024;
        if (kb <= spec.budgetKB || quality <= 40) break;
        quality -= 6;
      }
      results.push({ file: out.replace(ROOT, '.'), kb: Math.round(kb * 10) / 10, quality, overBudget: kb > spec.budgetKB, padded });
    }
  }
  return results;
}
