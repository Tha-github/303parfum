/**
 * Ponto de entrada das páginas secundárias (política de privacidade, 404).
 */
import { initMotion } from './motion.js';
import { initFooterYear } from './site-links.js';
import { initWhatsAppLinks } from './whatsapp.js';

initFooterYear();
initWhatsAppLinks();
initMotion();
