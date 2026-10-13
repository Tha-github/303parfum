/**
 * Ativos de MARCA a partir do logotipo oficial (src/assets/img/logo.png):
 *
 *   src/assets/img/brand/logo-1x.{webp,png}   header/rodapé (48px de altura)
 *   src/assets/img/brand/logo-2x.{webp,png}   telas de alta densidade
 *   public/favicon-32.png                     ícone da aba (só o "303")
 *   public/apple-touch-icon.png               ícone do iOS (180×180)
 *   public/og-image.jpg                       compartilhamento (1200×630)
 *
 * O logo tem bom contraste sobre o preto (prateado claro), então não há
 * versão clara. Se o arquivo mudar, rode de novo:  npm run brand
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { IMG_DIR, ROOT } from './lib/images.mjs';

const SOURCE = resolve(IMG_DIR, 'logo.png');
const OUT = resolve(IMG_DIR, 'brand');
const PUBLIC = resolve(ROOT, 'public');
const BG = '#0a0a0a';

/** Caixa do conteúdo visível (alfa > 40), com uma pequena folga. */
async function contentBox(input, { maxX = Infinity, pad = 2 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < Math.min(info.width, maxX); x++) {
      if (data[(y * info.width + x) * 4 + 3] > 40) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    }
  }
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  return {
    left,
    top,
    width: Math.min(info.width, x1 + pad + 1) - left,
    height: Math.min(info.height, y1 + pad + 1) - top,
  };
}

/** Primeira coluna vazia depois do "303" (o espaço antes de "MAN"/"PARFUM"). */
async function numberEnd(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const filled = (x) => {
    for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * 4 + 3] > 40) return true;
    return false;
  };
  let x = 0;
  while (x < info.width && !filled(x)) x++;
  // pula os 3 dígitos; o vão entre palavras é o primeiro com 8+ colunas vazias
  for (let gap = 0; x < info.width; x++) {
    gap = filled(x) ? 0 : gap + 1;
    if (gap >= 8) return x - gap + 1;
  }
  return info.width;
}

await mkdir(OUT, { recursive: true });
const box = await contentBox(SOURCE);
const logo = await sharp(SOURCE).extract(box).png().toBuffer();
const logoH = box.height;

// ---- Logo para o header e o rodapé ------------------------------------------
// 1x = 48px de altura; 2x = 96px, limitado à resolução do original (sem ampliar)
const results = [];
for (const [suffix, target] of [['1x', 48], ['2x', 96]]) {
  const height = Math.min(target, logoH);
  const img = sharp(logo).resize({ height });
  const webp = resolve(OUT, `logo-${suffix}.webp`);
  const png = resolve(OUT, `logo-${suffix}.png`);
  const a = await img.clone().webp({ quality: 90, alphaQuality: 100 }).toFile(webp);
  const b = await img.clone().png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(png);
  results.push(`logo-${suffix}: ${a.width}×${a.height} (webp ${Math.round(a.size / 1024)} KB, png ${Math.round(b.size / 1024)} KB)`);
  if (height < target) results.push(`  ⚠ original com ${logoH}px de altura útil: o "2x" é ${(height / 48).toFixed(2)}x`);
}

// ---- Favicon e ícone do iOS: só o "303", sobre o preto ----------------------
const numberBox = await contentBox(SOURCE, { maxX: await numberEnd(SOURCE) });
const number = await sharp(SOURCE).extract(numberBox).png().toBuffer();

async function icon(size, fill, file) {
  const mark = await sharp(number).resize({ width: Math.round(size * fill), height: Math.round(size * fill), fit: 'inside' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}
await icon(32, 0.9, resolve(PUBLIC, 'favicon-32.png'));
await icon(180, 0.72, resolve(PUBLIC, 'apple-touch-icon.png'));

// ---- Compartilhamento (Open Graph 1200×630) ----------------------------------
const ogLogo = await sharp(logo).resize({ width: 560 }).toBuffer();
const ogText = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect x="560" y="392" width="80" height="1" fill="#c9a13b"/>
  <text x="600" y="456" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-style="italic" font-size="38" fill="#a8a29a">Alta perfumaria · Recife &amp; Garanhuns</text>
</svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: BG } })
  .composite([
    { input: ogLogo, top: 170, left: 320 },
    { input: ogText, top: 0, left: 0 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(resolve(PUBLIC, 'og-image.jpg'));

console.log(results.join('\n'));
console.log('✓ public/favicon-32.png  ✓ public/apple-touch-icon.png  ✓ public/og-image.jpg');
