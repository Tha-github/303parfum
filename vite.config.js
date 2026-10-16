import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import { CACHE, SECURITY_HEADERS } from './config/security-headers.mjs';
import { FAQ_DATA, loadCatalogContext, loadSyncContext, PAGES, PARTIALS_DIR, PRODUCTS_DATA, PROMO_CONFIG, SITE_CONFIG } from './scripts/lib/html-context.mjs';
import { syncHtml } from './scripts/lib/html-sync.mjs';

const root = import.meta.dirname;
const JSONLD_LIB = resolve(root, 'scripts/lib/jsonld.mjs');

/** Importa um módulo sempre fresco (no dev, edições aparecem sem reiniciar). */
const freshImport = (file) => import(`${pathToFileURL(file).href}?t=${Date.now()}`);

/**
 * Os HTML da raiz já são completos (abrem até com duplo clique). Este plugin
 * só garante que, no build e no dev, as regiões geradas (rodapé, FAQ,
 * contato, SEO, catálogo, promoção), os dados da empresa (data-site) e a
 * foto do hero estejam em dia com config/site.mjs, src/data/ (faq.js,
 * products.json, config.json) e src/partials/ — a mesma
 * lógica do `npm run sync` (scripts/lib/html-sync.mjs).
 */
function htmlSync() {
  return {
    name: '303:html-sync',
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        return syncHtml(html, await loadSyncContext());
      },
    },
    // No dev: editou dados/partials → regrava os HTML da raiz e recarrega
    async handleHotUpdate({ file, server }) {
      // o Vite entrega caminhos com "/"; resolve() no Windows usa "\"
      const norm = (p) => p.replace(/\\/g, '/');
      const watched = [FAQ_DATA, SITE_CONFIG, PRODUCTS_DATA, PROMO_CONFIG].map(norm);
      if (!norm(file).startsWith(norm(PARTIALS_DIR)) && !watched.includes(norm(file))) return;
      const ctx = await loadSyncContext();
      for (const page of PAGES) {
        const before = await readFile(page, 'utf8');
        const after = syncHtml(before, ctx);
        if (after !== before) await writeFile(page, after);
      }
      server.ws.send({ type: 'full-reload' });
    },
  };
}

/**
 * JSON-LD na fase "post": aqui o bundle já existe, então dá para trocar a
 * imagem de cada produto (variante JPG de 800px, ou a maior) pela URL final
 * com hash.
 */
function jsonLd() {
  return {
    name: '303:jsonld',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        if (!html.includes('<!-- @jsonld -->')) return html;
        const { organization, website, stores, faqPage, productList, jsonLdScript } = await freshImport(JSONLD_LIB);
        const { faqItems } = await freshImport(FAQ_DATA);
        const catalog = await loadCatalogContext();

        const imageUrl = (slug) => {
          const widths = catalog.images[slug]?.widths;
          if (!widths) return null;
          const file = `${slug}-${widths.includes(800) ? 800 : widths.at(-1)}.jpg`;
          if (!ctx.bundle) return `/src/assets/img/produtos/${file}`; // dev: caminho original
          const asset = Object.values(ctx.bundle).find(
            (out) => out.type === 'asset' && (out.originalFileNames ?? []).some((n) => n.replace(/\\/g, '/').endsWith(`produtos/${file}`)),
          );
          return asset ? `/${asset.fileName}` : null;
        };

        const script = jsonLdScript([organization(), website(), stores(), faqPage(faqItems), productList(catalog, imageUrl)]);
        return html.replace('<!-- @jsonld -->', script);
      },
    },
  };
}

// Páginas publicadas. styleguide.html é servido pelo `npm run dev` (Vite serve
// qualquer HTML da raiz), mas não é publicado.
export default defineConfig({
  plugins: [htmlSync(), jsonLd()],
  // `npm run preview` serve o build com os mesmos headers da produção
  // (CSP inclusa): violações aparecem no console antes do deploy.
  // Não vale para `npm run dev`, que precisa de script inline para o HMR.
  preview: {
    headers: { ...SECURITY_HEADERS, 'Cache-Control': CACHE.html },
  },
  build: {
    // Imagens nunca viram data: URI (srcset/picture precisam de arquivos reais)
    assetsInlineLimit: (file) => (/\.(avif|webp|jpe?g|png)$/i.test(file) ? false : undefined),
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        privacidade: resolve(root, 'politica-de-privacidade.html'),
        naoEncontrada: resolve(root, '404.html'),
      },
    },
  },
});
