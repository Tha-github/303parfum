/**
 * Mantém os HTML da raiz COMPLETOS e sincronizados com a configuração.
 *
 * Os arquivos index.html, politica-de-privacidade.html e 404.html contêm o
 * conteúdo real (abrem completos até com duplo clique), e este módulo
 * reescreve só as partes que vêm de outra fonte:
 *
 *   <!-- @region nome --> … <!-- @endregion nome -->
 *       conteúdo gerado: footer, faq, contato, seo (de src/partials e src/data)
 *   <span data-site="email">…</span>
 *       texto = SITE.email (config/site.mjs)
 *   <a href="…" data-site-href="mailto:{email}">
 *       atributo href = modelo com {caminho} trocado pelo valor do SITE
 *   <span data-year>2026</span>
 *       ano atual
 *   data-hero-set="avif|webp|png" e data-hero-preload
 *       srcset/tamanho da foto do hero = variantes que existem em disco
 *
 * Usado por scripts/sync-html.mjs (grava nos arquivos) e pelo vite.config.js
 * (aplica no build, em memória). Todo valor é escapado.
 */

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const lookup = (site, path) => {
  const value = path.split('.').reduce((obj, key) => obj?.[key], site);
  if (value === undefined || typeof value === 'object') {
    throw new Error(`[303] "${path}" não existe em config/site.mjs`);
  }
  return value;
};

/** {{site.caminho}} → valor (usado dentro dos partials). */
export const renderTokens = (html, site) =>
  html.replace(/\{\{\s*site\.([\w.]+)\s*\}\}/g, (_m, path) => escapeHtml(lookup(site, path)));

export function renderFaq(items, indent = '            ') {
  return items
    .map(
      ({ id, pergunta, resposta }) => `
${indent}<details class="faq__item" id="faq-${escapeHtml(id)}">
${indent}  <summary class="faq__question">
${indent}    <span>${escapeHtml(pergunta)}</span>
${indent}    <span class="faq__icon" aria-hidden="true"></span>
${indent}  </summary>
${indent}  <div class="faq__answer">
${resposta.map((p) => `${indent}    <p>${escapeHtml(p)}</p>`).join('\n')}
${indent}  </div>
${indent}</details>`,
    )
    .join('');
}

function replaceRegions(html, regions) {
  return html.replace(
    /(<!--\s*@region\s+([\w-]+)\s*-->)[\s\S]*?(\s*<!--\s*@endregion\s+\2\s*-->)/g,
    (match, open, name, close) => (name in regions ? `${open}\n${regions[name].replace(/^\n+|\s+$/g, '')}${close}` : match),
  );
}

/** Atributos data-site-X="modelo {caminho}" → X="valor". */
function replaceSiteAttributes(html, site) {
  return html.replace(/<[a-z][^>]*\sdata-site-[\w-]+="[^"]*"[^>]*>/gi, (tag) => {
    let out = tag;
    for (const [, attr, template] of tag.matchAll(/\sdata-site-([\w-]+)="([^"]*)"/g)) {
      const value = escapeHtml(template.replace(/\{([\w.]+)\}/g, (_m, path) => lookup(site, path)));
      const re = new RegExp(`(\\s${attr}=)"[^"]*"`);
      out = re.test(out) ? out.replace(re, `$1"${value}"`) : out.replace(/^<([a-z][\w-]*)/i, `<$1 ${attr}="${value}"`);
    }
    return out;
  });
}

/** <tag data-site="caminho">texto</tag> → texto = valor. */
const replaceSiteText = (html, site) =>
  html.replace(/(<([a-z][\w-]*)\b[^>]*\sdata-site="([\w.]+)"[^>]*>)[^<]*(<\/\2>)/gi, (_m, open, _tag, path, close) => `${open}${escapeHtml(lookup(site, path))}${close}`);

/** srcset/src/tamanho da foto do hero a partir das larguras geradas. */
function replaceHero(html, { widths, size }) {
  if (!widths?.length) return html;
  const set = (ext) => widths.map((w) => `./src/assets/img/hero/banner-${w}.${ext} ${w}w`).join(', ');
  const largest = widths.at(-1);
  let out = html.replace(/<(source|img)\b[^>]*data-hero-set="(avif|webp|png)"[^>]*>/g, (tag, el, ext) => {
    let t = tag.replace(/\ssrcset="[^"]*"/, ` srcset="${set(ext)}"`);
    if (el === 'img') {
      t = t.replace(/\ssrc="[^"]*"/, ` src="./src/assets/img/hero/banner-${largest}.png"`);
      if (size) t = t.replace(/\swidth="\d+"/, ` width="${size.width}"`).replace(/\sheight="\d+"/, ` height="${size.height}"`);
    }
    return t;
  });
  out = out.replace(/<link\b[^>]*data-hero-preload[^>]*>/g, (tag) => tag.replace(/\simagesrcset="[^"]*"/, ` imagesrcset="${set('avif')}"`));
  return out;
}

/**
 * @param {string} html
 * @param {{ site: object, faqItems?: Array, partials: Record<string,string>, hero?: {widths:number[], size?:{width:number,height:number}} }} ctx
 */
export function syncHtml(html, { site, faqItems = [], partials = {}, hero }) {
  const regions = {};
  for (const [name, tpl] of Object.entries(partials)) regions[name] = renderTokens(tpl, site);
  if (faqItems.length) regions.faq = renderFaq(faqItems);

  let out = replaceRegions(html, regions);
  out = replaceSiteAttributes(out, site);
  out = replaceSiteText(out, site);
  out = renderTokens(out, site); // marcadores avulsos que ainda existam
  out = out.replace(/(<span data-year>)\d{4}(<\/span>)/g, `$1${new Date().getFullYear()}$2`);
  out = replaceHero(out, hero ?? {});
  return out;
}
