/**
 * Gera imagens PROVISÓRIAS das linhas de produto (frascos estilizados em
 * SVG → AVIF/WebP), mais a imagem de compartilhamento e o ícone do iOS.
 * (Produtos e hero usam fotos reais: npm run images.)
 * (A foto do hero é a real: src/assets/img/banner.png.)
 * Substituir pelas fotos reais assim que disponíveis: veja
 * scripts/optimize-images.mjs (`npm run images`). [CONFIRMAR]
 *
 *   npm run placeholders
 */
import { resolve } from 'node:path';
import sharp from 'sharp';
import { ROOT as root, writeVariants } from './lib/images.mjs';

const CAP = `<linearGradient id="cap" x1="0" x2="1">
      <stop offset="0" stop-color="#5a4826"/><stop offset=".35" stop-color="#e4d5b0"/>
      <stop offset=".55" stop-color="#c9b37e"/><stop offset="1" stop-color="#4a3b1e"/>
    </linearGradient>`;

// Formatos de frasco, em coordenadas de uma tela 800×1000
const SHAPES = {
  square: (label) => `
  <rect x="318" y="250" width="164" height="168" fill="url(#cap)"/>
  <rect x="366" y="418" width="68" height="44" fill="#2a2418" opacity=".9"/>
  ${glass('<rect x="250" y="460" width="300" height="380" rx="18"/>')}
  <rect x="276" y="486" width="10" height="320" rx="5" fill="#fff" opacity=".18"/>
  ${labelText(label, 660)}`,
  soft: (label) => `
  <rect x="330" y="270" width="140" height="150" rx="70" fill="url(#cap)"/>
  <rect x="370" y="418" width="60" height="44" fill="#2a2418" opacity=".9"/>
  ${glass('<rect x="240" y="460" width="320" height="380" rx="90"/>')}
  <rect x="272" y="520" width="10" height="260" rx="5" fill="#fff" opacity=".18"/>
  ${labelText(label, 670)}`,
  round: (label) => `
  <rect x="372" y="200" width="56" height="230" rx="6" fill="url(#cap)"/>
  <circle cx="400" cy="196" r="34" fill="url(#cap)"/>
  <rect x="368" y="428" width="64" height="40" fill="#2a2418" opacity=".9"/>
  ${glass('<circle cx="400" cy="650" r="190"/>')}
  <path d="M262 600 a150 150 0 0 1 60 -100" stroke="#fff" stroke-opacity=".22" stroke-width="10" fill="none" stroke-linecap="round"/>
  ${labelText(label, 670)}`,
  tall: (label) => `
  <rect x="350" y="232" width="100" height="36" rx="4" fill="url(#cap)"/>
  <rect x="450" y="242" width="46" height="12" rx="3" fill="url(#cap)"/>
  <rect x="384" y="268" width="32" height="56" fill="url(#cap)"/>
  ${glass('<rect x="310" y="324" width="180" height="516" rx="22"/>')}
  <rect x="332" y="350" width="8" height="460" rx="4" fill="#fff" opacity=".18"/>
  ${labelText(label, 620, 52)}`,
  dropper: (label) => `
  <ellipse cx="400" cy="300" rx="38" ry="58" fill="#1a1a1a"/>
  <ellipse cx="388" cy="282" rx="8" ry="22" fill="#fff" opacity=".12"/>
  <rect x="352" y="350" width="96" height="130" rx="6" fill="url(#cap)"/>
  ${glass('<path d="M300 520 q0 -40 50 -40 h100 q50 0 50 40 v300 q0 20 -20 20 h-160 q-20 0 -20 -20 z"/>')}
  <rect x="320" y="540" width="8" height="270" rx="4" fill="#fff" opacity=".18"/>
  ${labelText(label, 690, 56)}`,
};

function glass(shape) {
  // mesma forma desenhada 3×: líquido, luz/sombra e contorno do vidro
  const fill = (attrs) => shape.replace('/>', ` ${attrs}/>`);
  return [
    fill('fill="url(#glass)"'),
    fill('fill="url(#shade)"'),
    fill('fill="none" stroke="#f6f4f0" stroke-opacity=".22"'),
  ].join('\n  ');
}

function labelText({ text, color }, y, size = 72) {
  return `<text x="400" y="${y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-style="italic" font-size="${size}" fill="${color}">303</text>
  <text x="400" y="${y + size * 0.55}" text-anchor="middle" font-family="Georgia, serif"
        font-size="${size * 0.22}" letter-spacing="${size * 0.12}" fill="${color}" opacity=".85">${text}</text>`;
}

function bottleSvg({ w, h, bg, spot, liquid, shape = 'square', labelColor = '#0a0a0a' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 800 1000">
  <defs>
    <radialGradient id="spot" cx="50%" cy="46%" r="70%">
      <stop offset="0" stop-color="${spot}"/><stop offset="1" stop-color="${bg}"/>
    </radialGradient>
    ${CAP}
    <linearGradient id="glass" x1="0" x2="1">
      <stop offset="0" stop-color="${liquid[0]}"/><stop offset=".45" stop-color="${liquid[1]}"/>
      <stop offset="1" stop-color="${liquid[0]}"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </linearGradient>
    <radialGradient id="floor">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#spot)"/>
  <ellipse cx="400" cy="842" rx="230" ry="26" fill="url(#floor)"/>
  ${SHAPES[shape]({ text: 'PARFUM', color: labelColor })}
</svg>`;
}

const report = (results) => results.forEach((r) => console.log(`${r.overBudget ? '⚠' : '✓'} ${r.file}  ${r.kb} KB`));
const svgBuffer = (opts) => Buffer.from(bottleSvg({ w: 1600, h: 2000, ...opts }));

// ---- Linhas de produto (cards em fundo escuro) ----------------------------
const LINES = {
  masculino: { shape: 'square', liquid: ['#2a1e0e', '#8a6232'], spot: '#262119', labelColor: '#e4d5b0' },
  feminino: { shape: 'soft', liquid: ['#3a1f22', '#c48a8a'], spot: '#2a2022' },
  nicho: { shape: 'square', liquid: ['#0d0d0d', '#3a3a3a'], spot: '#24221e', labelColor: '#c9b37e' },
  arabe: { shape: 'round', liquid: ['#4a3512', '#d9b25a'], spot: '#2b2416' },
  capilar: { shape: 'tall', liquid: ['#2e2a24', '#d8cbb0'], spot: '#24221f' },
  'oleo-corporal': { shape: 'dropper', liquid: ['#4a3010', '#e0a440'], spot: '#2b2215' },
};
for (const [slug, opts] of Object.entries(LINES)) {
  report(await writeVariants(svgBuffer({ bg: '#111111', ...opts }), 'linhas', slug));
}

// ---- Compartilhamento (Open Graph 1200×630) e ícone do iOS (180×180) -------
const brandSvg = (w, h, scale) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#0a0a0a"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
    <text x="50%" y="${h * (scale ? 0.62 : 0.5)}" font-style="italic" font-weight="300" font-size="${scale ? h * 0.42 : 180}" fill="#c9b37e">303</text>
    ${scale ? '' : `<text x="50%" y="${h * 0.5 + 70}" font-size="34" letter-spacing="18" fill="#f6f4f0">PARFUM</text>
    <rect x="${w / 2 - 40}" y="${h * 0.5 + 110}" width="80" height="1" fill="#c9b37e"/>
    <text x="50%" y="${h * 0.5 + 170}" font-style="italic" font-size="40" fill="#a8a29a">Alta perfumaria. Preço justo.</text>`}
  </g>
</svg>`);
await sharp(brandSvg(1200, 630, false)).jpeg({ quality: 82, mozjpeg: true }).toFile(resolve(root, 'public/og-image.jpg'));
await sharp(brandSvg(180, 180, true)).png({ compressionLevel: 9 }).toFile(resolve(root, 'public/apple-touch-icon.png'));
console.log('✓ public/og-image.jpg  ✓ public/apple-touch-icon.png');
