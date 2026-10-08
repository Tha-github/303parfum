/**
 * Gera os arquivos estáticos que dependem de configuração:
 *   - headers por hospedagem: public/_headers (Netlify), vercel.json,
 *     public/.htaccess (Apache/Hostinger)  ← config/security-headers.mjs
 *   - public/robots.txt, public/sitemap.xml,
 *     public/.well-known/security.txt       ← config/site.mjs
 * Roda sozinho antes de cada build (prebuild).
 *
 *   npm run static
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { APEX_HOST, CACHE, SECURITY_HEADERS } from '../config/security-headers.mjs';
import { SITE } from '../config/site.mjs';

const root = resolve(import.meta.dirname, '..');
const BANNER = 'Arquivo GERADO por scripts/generate-static.mjs — edite config/security-headers.mjs ou config/site.mjs';
const today = new Date().toISOString().slice(0, 10);

// ---- Netlify: public/_headers ------------------------------------------------
// Netlify junta regras que casam com o mesmo caminho; por isso Cache-Control
// fica só nas regras específicas (assets / HTML), nunca em "/*".
function netlify() {
  const block = (path, headers) =>
    `${path}\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;
  return [
    `# ${BANNER}`,
    block('/*', SECURITY_HEADERS),
    block('/assets/*', { 'Cache-Control': CACHE.immutable }),
    block('/', { 'Cache-Control': CACHE.html }),
    block('/*.html', { 'Cache-Control': CACHE.html }),
    block('/favicon.svg', { 'Cache-Control': CACHE.short }),
    block('/og-image.jpg', { 'Cache-Control': CACHE.short }),
    block('/apple-touch-icon.png', { 'Cache-Control': CACHE.short }),
    block('/.well-known/*', { 'Cache-Control': CACHE.short }),
    '',
  ].join('\n\n');
}

// ---- Vercel: vercel.json -----------------------------------------------------
// Quando várias regras casam, a última define o valor final do header.
function vercel() {
  const rule = (source, headers) => ({
    source,
    headers: Object.entries(headers).map(([key, value]) => ({ key, value })),
  });
  return `${JSON.stringify(
    {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      // ${BANNER}
      headers: [
        rule('/(.*)', { ...SECURITY_HEADERS, 'Cache-Control': CACHE.short }),
        rule('/', { 'Cache-Control': CACHE.html }),
        rule('/(.*)\\.html', { 'Cache-Control': CACHE.html }),
        rule('/assets/(.*)', { 'Cache-Control': CACHE.immutable }),
      ],
    },
    null,
    2,
  )}\n`;
}

// ---- Apache / Hostinger: public/.htaccess ------------------------------------
function htaccess() {
  const apexPattern = APEX_HOST.replace(/\./g, '\\.');
  const headerLines = Object.entries(SECURITY_HEADERS)
    .map(([k, v]) => `  Header always set ${k} "${v.replace(/"/g, '\\"')}"`)
    .join('\n');

  return `# ${BANNER}

# ---- Básico -------------------------------------------------------------------
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
ServerSignature Off

# Tipos que versões antigas do Apache não conhecem
<IfModule mod_mime.c>
  AddType image/avif .avif
  AddType image/webp .webp
  AddType image/svg+xml .svg
  AddType text/plain .txt
  AddCharset utf-8 .html .css .js .svg .txt
</IfModule>

# ---- Redirecionamentos (sempre HTTPS + domínio canônico www) ------------------
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Bloqueia arquivos/pastas ocultos (.env, .git, .htaccess…), exceto .well-known
  RewriteRule (^|/)\\.(?!well-known(/|$)) - [F,L]

  # HTTP → HTTPS (inclui proxies/CDN que terminam o TLS, como na Hostinger)
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

  # ${APEX_HOST} → www.${APEX_HOST}   [CONFIRMAR domínio canônico]
  RewriteCond %{HTTP_HOST} ^${apexPattern}$ [NC]
  RewriteRule ^ https://www.${APEX_HOST}%{REQUEST_URI} [R=301,L]
</IfModule>

# Defesa extra caso mod_rewrite esteja desligado
<FilesMatch "^\\.(?!well-known)">
  Require all denied
</FilesMatch>
<FilesMatch "\\.(env|git|log|bak|old|orig|sql|sqlite|ini|conf|lock|map|md|sh|ya?ml)$">
  Require all denied
</FilesMatch>

# ---- Headers de segurança -------------------------------------------------------
<IfModule mod_headers.c>
${headerLines}
  Header always unset X-Powered-By
  Header unset Server

  # Cache: assets com hash = 1 ano imutável; HTML = sempre revalida.
  # FilesMatch (e não <If>) para funcionar também no LiteSpeed da Hostinger.
  # O Vite nomeia os assets como nome-HASH8.ext (ex.: main-V0as6dbV.js).
  <FilesMatch "\\.html$">
    Header set Cache-Control "${CACHE.html}"
  </FilesMatch>
  <FilesMatch "-[A-Za-z0-9_-]{8}\\.(js|css|avif|webp|jpe?g|png|svg|woff2?)$">
    Header set Cache-Control "${CACHE.immutable}"
  </FilesMatch>
  <FilesMatch "^(favicon\\.svg|og-image\\.jpg|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml|security\\.txt)$">
    Header set Cache-Control "${CACHE.short}"
  </FilesMatch>
</IfModule>

# ---- Compressão ---------------------------------------------------------------
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
`;
}

// ---- SEO: robots.txt e sitemap.xml ---------------------------------------
function robots() {
  return `# ${BANNER}
User-agent: *
Allow: /
Disallow: /styleguide.html

Sitemap: ${SITE.url}/sitemap.xml
`;
}

function sitemap() {
  const pages = [
    { path: '/', priority: '1.0' },
    { path: '/politica-de-privacidade.html', priority: '0.3' },
  ];
  const urls = pages
    .map((p) => `  <url>\n    <loc>${SITE.url}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${BANNER} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// ---- security.txt (RFC 9116): validade renovada a cada build ----------------
function securityTxt() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  return `# ${BANNER}
# Política de divulgação de vulnerabilidades da ${SITE.name} (RFC 9116)
Contact: mailto:${SITE.email}
Expires: ${expires.toISOString().slice(0, 10)}T00:00:00.000Z
Preferred-Languages: pt, en
Canonical: ${SITE.url}/.well-known/security.txt
`;
}

await mkdir(resolve(root, 'public/.well-known'), { recursive: true });
await writeFile(resolve(root, 'public/_headers'), netlify());
await writeFile(resolve(root, 'vercel.json'), vercel());
await writeFile(resolve(root, 'public/.htaccess'), htaccess());
await writeFile(resolve(root, 'public/robots.txt'), robots());
await writeFile(resolve(root, 'public/sitemap.xml'), sitemap());
await writeFile(resolve(root, 'public/.well-known/security.txt'), securityTxt());
console.log('✓ _headers  ✓ vercel.json  ✓ .htaccess  ✓ robots.txt  ✓ sitemap.xml  ✓ security.txt');
