import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import { CACHE, SECURITY_HEADERS } from './config/security-headers.mjs';
import { FAQ_DATA, loadSyncContext, PAGES, PARTIALS_DIR, SITE_CONFIG } from './scripts/lib/html-context.mjs';
import { syncHtml } from './scripts/lib/html-sync.mjs';

const root = import.meta.dirname;
const PRODUCTS_DATA = resolve(root, 'src/data/products.json');
const JSONLD_LIB = resolve(root, 'scripts/lib/jsonld.mjs');

/** Importa um módulo sempre fresco (no dev, edições aparecem sem reiniciar). */
const freshImport = (file) => import(`${pathToFileURL(file).href}?t=${Date.now()}`);

/**
 * Os HTML da raiz já são completos (abrem até com duplo clique). Este plugin
 * só garante que, no build e no dev, as regiões geradas (rodapé, FAQ,
 * contato, SEO), os dados da empresa (data-site) e a foto do hero estejam
 * em dia com config/site.mjs, src/data/faq.js e src/partials/ — a mesma
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
      if (!file.startsWith(PARTIALS_DIR) && ![FAQ_DATA, SITE_CONFIG].includes(file)) return;
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
 * JSON-LD na fase "post": aqui o bundle já existe, então dá para trocar o
 * caminho de cada imagem de produto pela URL final com hash.
 */
function jsonLd() {
  return {
    name: '303:jsonld',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        if (!html.includes('<!-- @jsonld -->')) return html;
        const { organization, website, faqPage, productList, jsonLdScript } = await freshImport(JSONLD_LIB);
        const { faqItems } = await freshImport(FAQ_DATA);
        const catalog = JSON.parse(await readFile(PRODUCTS_DATA, 'utf8'));

        const resolveImage = (srcPath) => {
          if (typeof srcPath !== 'string') return null;
          if (!ctx.bundle) return srcPath; // dev: caminho original funciona
          const wanted = srcPath.replace(/^\//, '');
          const asset = Object.values(ctx.bundle).find(
            (out) => out.type === 'asset' && (out.originalFileNames ?? []).some((n) => n.replace(/\\/g, '/').endsWith(wanted)),
          );
          return asset ? `/${asset.fileName}` : null;
        };

        const script = jsonLdScript([organization(), website(), faqPage(faqItems), productList(catalog, resolveImage)]);
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
