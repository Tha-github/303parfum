/**
 * Atualiza os HTML da raiz com os dados atuais (config/site.mjs, FAQ,
 * rodapé, contato, SEO e variantes da foto do hero). Roda sozinho antes do
 * `npm start`/`npm run dev` e do `npm run build`; rode à mão após editar
 * config/site.mjs, src/data/faq.js ou src/partials/*.html se quiser ver o
 * resultado abrindo o arquivo direto.
 *
 *   npm run sync
 */
import { readFile, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { syncHtml } from './lib/html-sync.mjs';
import { loadSyncContext, PAGES, ROOT } from './lib/html-context.mjs';

const ctx = await loadSyncContext();
for (const file of PAGES) {
  const before = await readFile(file, 'utf8');
  const after = syncHtml(before, ctx);
  if (after !== before) {
    await writeFile(file, after);
    console.log(`✓ ${relative(ROOT, file)} atualizado`);
  } else {
    console.log(`✓ ${relative(ROOT, file)} já estava em dia`);
  }
}
