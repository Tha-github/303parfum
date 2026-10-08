/**
 * Formulário "Seja Revendedor" (#cadastro).
 * Configuração sobre o motor genérico de forms.js.
 */
import { createForm, formatPhoneBR, rules } from './forms.js';

const CIDADES = ['Recife', 'Garanhuns', 'Outra'];

const fields = {
  nome: {
    label: 'Nome',
    maxLength: 80,
    rules: [rules.required('Informe seu nome.'), rules.minLength(3, 'Informe seu nome completo.'), rules.hasLetters('Informe um nome válido.')],
  },
  whatsapp: {
    label: 'WhatsApp',
    maxLength: 20,
    rules: [rules.required('Informe seu WhatsApp com DDD.'), rules.phoneBR()],
  },
  cidade: {
    label: 'Cidade',
    maxLength: 20,
    rules: [rules.required('Selecione sua cidade.'), rules.oneOf(CIDADES)],
  },
  cidade_outra: {
    label: 'Outra cidade',
    maxLength: 60,
    rules: [rules.required('Informe sua cidade.'), rules.hasLetters('Informe uma cidade válida.')],
  },
  ja_vende: { label: 'Já vende', maxLength: 120 },
  mensagem: {
    label: 'Mensagem',
    maxLength: 500,
    multiline: true,
    rules: [rules.maxLength(500)],
  },
  lgpd: {
    label: 'Consentimento',
    rules: [rules.required('Para continuar, aceite a Política de Privacidade.')],
  },
};

/** Mensagem estruturada (negrito do WhatsApp com *…*). */
function buildMessage(v) {
  const cidade = v.cidade === 'Outra' ? v.cidade_outra : v.cidade;
  const lines = [
    'Olá! Quero ser revendedor(a) 303 PARFUM.',
    '',
    '*Cadastro de revenda*',
    `Nome: ${v.nome}`,
    `WhatsApp: ${formatPhoneBR(v.whatsapp)}`,
    `Cidade: ${cidade}`,
  ];
  if (v.ja_vende) lines.push(`Já vende: ${v.ja_vende}`);
  if (v.mensagem) lines.push('', `Mensagem: ${v.mensagem}`);
  lines.push('', 'Aceito a Política de Privacidade.');
  return lines.join('\n');
}

export function initResellerForm() {
  const form = document.querySelector('[data-form="revenda"]');
  if (!form) return null;

  const api = createForm(form, {
    fields,
    honeypot: 'empresa',
    cooldownMs: 10_000,
    buildMessage,
    successEl: document.querySelector('[data-form-success="revenda"]'),
  });

  // "Outra" cidade → mostra o campo extra
  const cidade = form.elements.namedItem('cidade');
  const outra = form.querySelector('[data-field="cidade_outra"]');
  const syncCidade = () => {
    const show = cidade.value === 'Outra';
    outra.hidden = !show;
    if (!show) api.setError('cidade_outra', '');
  };
  cidade.addEventListener('change', syncCidade);
  form.addEventListener('form:reset', syncCidade);

  return api;
}
