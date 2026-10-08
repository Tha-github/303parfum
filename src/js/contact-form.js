/**
 * Formulário de contato (#contato).
 * Configuração sobre o motor genérico de forms.js.
 */
import { createForm, formatPhoneBR, isPhoneBR, rules } from './forms.js';

const fields = {
  nome: {
    maxLength: 80,
    rules: [rules.required('Informe seu nome.'), rules.minLength(2, 'Informe seu nome.'), rules.hasLetters('Informe um nome válido.')],
  },
  contato: {
    maxLength: 100,
    rules: [rules.required('Informe seu WhatsApp ou e-mail.'), rules.phoneOrEmail()],
  },
  mensagem: {
    maxLength: 500,
    multiline: true,
    rules: [rules.required('Escreva sua mensagem.'), rules.minLength(5, 'Conte um pouco mais na mensagem.'), rules.maxLength(500)],
  },
  lgpd: {
    rules: [rules.required('Para continuar, aceite a Política de Privacidade.')],
  },
};

function buildMessage(v) {
  const contato = isPhoneBR(v.contato) ? `WhatsApp: ${formatPhoneBR(v.contato)}` : `E-mail para resposta: ${v.contato}`;
  return ['Olá! Vim pelo site da 303 Parfum.', '', '*Contato*', `Nome: ${v.nome}`, contato, '', v.mensagem].join('\n');
}

export function initContactForm() {
  const form = document.querySelector('[data-form="contato"]');
  if (!form) return null;

  return createForm(form, {
    fields,
    honeypot: 'empresa',
    cooldownMs: 10_000,
    buildMessage,
    successEl: document.querySelector('[data-form-success="contato"]'),
  });
}
