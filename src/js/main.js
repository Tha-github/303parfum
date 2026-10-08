/**
 * Ponto de entrada da home. Módulos ES são adiados por padrão, então o DOM
 * já está pronto quando este arquivo executa.
 */
import { initCatalog } from './catalog.js';
import { initContactForm } from './contact-form.js';
import { initFaq } from './faq.js';
import { initHeader } from './header.js';
import { initMap } from './map.js';
import { initMotion } from './motion.js';
import { initResellerForm } from './reseller-form.js';
import { initCategoryLinks, initFooterYear, initHashLanding, initSamePageLinks } from './site-links.js';
import { initWhatsAppLinks } from './whatsapp.js';

initHashLanding();
initHeader();
initSamePageLinks();
initCategoryLinks();
initCatalog();
initResellerForm();
initFaq();
initMap();
initContactForm();
initFooterYear();
initWhatsAppLinks();
// Por último: marca elementos já renderizados (catálogo, FAQ…)
initMotion();
