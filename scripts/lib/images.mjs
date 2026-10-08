/**
 * Regras de imagem do site — fonte única para:
 *   - scripts/optimize-images.mjs  (fotos reais → variantes otimizadas)
 *   - scripts/generate-placeholders.mjs (provisórias)
 *
 * Os nomes gerados são os que index.html e products.json esperam.
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

export const ROOT = resolve(import.meta.dirname, '../..');
export const IMG_DIR = resolve(ROOT, 'src/assets/img');

/** Qualidade: WebP/JPEG ~78. AVIF usa outra escala: 60 equivale visualmente.
 *  PNG: paleta quantizada (mantém a transparência, ~70% menor). */
export const QUALITY = { avif: 60, webp: 78, jpg: 78, png: 80 };

/** Foto do hero (fundo transparente) — sem recorte, proporção original. */
export const BANNER_SOURCE = resolve(IMG_DIR, 'banner.png');
export const BANNER_DIR = resolve(IMG_DIR, 'hero');

/**
 * Larguras do hero realmente geradas (lidas do disco), em ordem crescente.
 * Usado pelo build para montar o srcset — nunca anuncia um tamanho que não existe.
 */
export async function bannerWidths() {
  try {
    const files = await readdir(BANNER_DIR);
    return [...new Set(files.map((f) => /^banner-(\d+)\.avif$/.exec(f)?.[1]).filter(Boolean).map(Number))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export const KINDS = {
  // Hero: src/assets/img/banner.png → hero/banner-<w>.{avif,webp,png}
  banner: {
    dir: 'hero',
    widths: [480, 800, 1200, 1600], // limitadas ao tamanho real da foto (sem ampliar)
    formats: ['avif', 'webp', 'png'], // PNG = fallback que preserva a transparência
    file: (_name, w) => `banner-${w}`,
    budgetKB: 200, // teto por arquivo (meta de LCP)
    keepAspect: true, // NUNCA recortar: o corpo da modelo tem de aparecer inteiro
  },
  linhas: {
    dir: 'linhas',
    widths: [480, 800, 1200],
    formats: ['avif', 'webp'],
    file: (slug, w) => `${slug}-${w}`,
    budgetKB: 120,
  },
  produtos: {
    dir: 'produtos',
    widths: [480, 800, 1200],
    formats: ['avif', 'webp'],
    // products.json aponta para "<slug>.webp" (800); os demais têm sufixo
    file: (slug, w) => (w === 800 ? slug : `${slug}-${w}`),
    budgetKB: 120,
    keepAspect: true, // artes com texto: nunca recortar (o card usa object-fit: contain)
  },
};

const ASPECT = 4 / 5; // todas as fotos do site são 4:5 (retrato)

const encode = (pipeline, format, quality) => {
  if (format === 'avif') return pipeline.avif({ quality, effort: 6 });
  if (format === 'webp') return pipeline.webp({ quality, effort: 6, alphaQuality: 90 });
  if (format === 'png') return pipeline.png({ palette: true, quality, effort: 8, compressionLevel: 9 });
  return pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
};

/**
 * Gera todas as variantes de uma imagem.
 * Se um arquivo passar do orçamento, reduz a qualidade em passos de 6 (até 40).
 * @returns {Promise<Array<{file: string, kb: number, quality: number, overBudget: boolean}>>}
 */
export async function writeVariants(input, kind, name) {
  const spec = KINDS[kind];
  const results = [];

  let widths = spec.widths;
  if (spec.keepAspect) {
    // Nunca ampliar: só larguras ≤ a original, e a original se for menor que a maior
    const { width: original } = await sharp(input).metadata();
    widths = spec.widths.filter((w) => w <= original);
    if (original < Math.max(...spec.widths) && !widths.includes(original)) widths.push(original);
    // apaga variantes de uma foto anterior (ex.: maiores que a nova)
    const dir = resolve(IMG_DIR, spec.dir);
    await mkdir(dir, { recursive: true });
    for (const f of await readdir(dir)) {
      if (f.startsWith(spec.file(name, '')) ) await rm(resolve(dir, f));
    }
  }

  for (const w of widths) {
    // .rotate() aplica a orientação EXIF da câmera; o sharp NÃO copia
    // metadados para a saída por padrão (GPS, modelo da câmera… somem).
    const base = sharp(input, { failOn: 'error' }).rotate();
    if (spec.keepAspect) {
      base.resize({ width: w }); // proporção original, sem corte (srcset sempre completo)
    } else {
      base.resize(w, Math.round(w / ASPECT), { fit: 'cover', position: sharp.strategy.attention });
    }

    for (const format of spec.formats) {
      const out = resolve(IMG_DIR, spec.dir, `${spec.file(name, w)}.${format}`);
      await mkdir(dirname(out), { recursive: true });

      let quality = QUALITY[format];
      let kb;
      for (;;) {
        await encode(base.clone(), format, quality).toFile(out);
        kb = (await stat(out)).size / 1024;
        if (kb <= spec.budgetKB || quality <= 40) break;
        quality -= 6;
      }
      results.push({ file: out.replace(ROOT, '.'), kb: Math.round(kb * 10) / 10, quality, overBudget: kb > spec.budgetKB });
    }
  }
  return results;
}
