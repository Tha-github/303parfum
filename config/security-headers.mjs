/**
 * Headers HTTP de segurança e cache — FONTE ÚNICA.
 *
 * Usado por:
 *   - scripts/generate-static.mjs → public/_headers (Netlify),
 *     vercel.json (Vercel) e public/.htaccess (Apache/Hostinger)
 *   - vite.config.js → `npm run preview` serve o build com os MESMOS
 *     headers, para testar a CSP localmente antes do deploy.
 *
 * Edite aqui e rode `npm run static` (o `npm run build` já faz isso).
 */

export { APEX_HOST, CANONICAL_HOST } from './site.mjs'; // domínio: editar em config/site.mjs

/**
 * Content-Security-Policy, ajustada ao que o site REALMENTE usa:
 *  - scripts: só módulos do próprio domínio (o build não gera script inline);
 *  - estilos e fontes: só do próprio domínio (fontes auto-hospedadas). Sem
 *    'unsafe-inline': o build não tem <style> nem atributo style; o JS altera
 *    estilos via CSSOM (el.style.setProperty), que a CSP não bloqueia;
 *  - imagens: próprias + data: (grão e fallback SVG embutidos no CSS/JS);
 *  - iframes: só o Google Maps, criado após clique (map.js);
 *  - conexões: nenhuma além do próprio domínio (não há fetch/endpoint);
 *  - form-action 'self': os formulários não são enviados para lugar
 *    nenhum — o JS abre o WhatsApp com window.open (navegação, não
 *    submissão), então wa.me não precisa constar aqui;
 *  - Trusted Types: o código nunca usa innerHTML & cia.; o navegador
 *    passa a recusar esses "sinks" com strings (defesa contra XSS DOM).
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'frame-src': ['https://www.google.com', 'https://maps.google.com'],
  'connect-src': ["'self'"], // + endpoint de formulário, se um dia existir
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'none'"],
  'require-trusted-types-for': ["'script'"],
  'upgrade-insecure-requests': [],
};

export const buildCsp = (directives = CSP_DIRECTIVES) =>
  Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');

/** Aplicados a todas as respostas. */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': buildCsp(),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/** Cache por tipo de arquivo. */
export const CACHE = {
  // Arquivos com hash no nome (gerados pelo Vite em /assets): nunca mudam
  immutable: 'public, max-age=31536000, immutable',
  // HTML: sempre revalida, para o deploy novo aparecer na hora
  html: 'no-cache',
  // Demais arquivos de public/ (favicon, security.txt): sem hash, cache curto
  short: 'public, max-age=86400',
};
