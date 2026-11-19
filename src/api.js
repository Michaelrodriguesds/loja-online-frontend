// Comunicação com o backend, com tratamento de erros pensado para o Render
// (que, no plano grátis, "dorme" e demora até ~1 minuto para acordar).
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ErroApi extends Error {
  constructor(status, mensagem, dados = {}) {
    super(mensagem);
    this.status = status;
    this.dados = dados;
  }
}

const MENSAGENS = {
  400: 'Confira os dados informados.',
  401: 'Faça login para continuar.',
  403: 'Você não tem acesso a isso.',
  404: 'Não encontrado.',
  409: 'Não foi possível concluir. Atualize a página e tente de novo.',
  413: 'Arquivo muito grande.',
  429: 'Muitas tentativas seguidas. Aguarde alguns minutos.',
  500: 'Erro no servidor. Tente de novo em instantes.',
};

// ---- sessão do lojista / admin ----
export const sessao = {
  get token() { return localStorage.getItem('token'); },
  get papel() { return localStorage.getItem('papel'); },
  get nome() { return localStorage.getItem('nome'); },
  salvar({ token, papel, nome }) {
    localStorage.setItem('token', token);
    localStorage.setItem('papel', papel || '');
    localStorage.setItem('nome', nome || '');
  },
  sair() { ['token', 'papel', 'nome'].forEach((c) => localStorage.removeItem(c)); },
};

// ---- sessão do comprador (uma por loja) ----
export const sessaoComprador = {
  ler(slug) {
    try { return JSON.parse(localStorage.getItem(`comprador:${slug}`)) || null; } catch { return null; }
  },
  salvar(slug, dados) { localStorage.setItem(`comprador:${slug}`, JSON.stringify(dados)); },
  sair(slug) { localStorage.removeItem(`comprador:${slug}`); },
};

// ---- aviso "servidor acordando" ----
const ouvintes = new Set();
let pendentesLentas = 0;
export function aoServidorLento(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }
function avisarLento(delta) {
  pendentesLentas = Math.max(0, pendentesLentas + delta);
  ouvintes.forEach((fn) => fn(pendentesLentas > 0));
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chamada à API.
 *  - token: 'painel' (padrão, lojista/admin), 'nenhum', ou o token do comprador (string)
 *  - GET que falha por rede/502/503/504 tenta de novo por até 90s (servidor acordando)
 *  - POST/PUT nunca repete sozinho (evita pedido em dobro)
 */
export async function api(caminho, { metodo = 'GET', corpo, token = 'painel' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const valorToken = token === 'painel' ? sessao.token : token === 'nenhum' ? null : token;
  if (valorToken) headers.Authorization = `Bearer ${valorToken}`;

  const podeRepetir = metodo === 'GET';
  const inicio = Date.now();
  let lento = false;
  const timerLento = setTimeout(() => { lento = true; avisarLento(1); }, 4000);
  const fimLento = () => { clearTimeout(timerLento); if (lento) { lento = false; avisarLento(-1); } };

  try {
    for (;;) {
      let resposta;
      try {
        resposta = await fetch(API_URL + caminho, {
          method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined, signal: AbortSignal.timeout(75000),
        });
      } catch {
        if (!navigator.onLine) throw new ErroApi(0, 'Sem internet. Verifique sua conexão e tente de novo.');
        if (podeRepetir && Date.now() - inicio < 90000) { await esperar(3000); continue; }
        throw new ErroApi(0, 'Não foi possível falar com o servidor. Tente de novo em instantes.');
      }
      const texto = await resposta.text().catch(() => null);
      let dados = null;
      if (texto) { try { dados = JSON.parse(texto); } catch { dados = null; } }
      const valida = dados !== null && typeof dados === 'object';

      if (resposta.ok) {
        if (valida) return dados;
        if (podeRepetir && Date.now() - inicio < 90000) { await esperar(1500); continue; }
        throw new ErroApi(0, 'A conexão caiu antes da confirmação. Confira se deu certo antes de tentar de novo.');
      }
      if (!valida) dados = {};

      if (resposta.status === 503 && dados.manutencao) {
        window.dispatchEvent(new CustomEvent('manutencao', { detail: dados }));
        throw new ErroApi(503, dados.erro || 'Sistema em manutenção.', dados);
      }
      if ([502, 503, 504].includes(resposta.status) && podeRepetir && Date.now() - inicio < 90000) { await esperar(3000); continue; }

      if (resposta.status === 401 && token === 'painel' && sessao.token) {
        sessao.sair();
        window.location.assign('/entrar?expirou=1');
      }
      if (resposta.status === 402) window.dispatchEvent(new CustomEvent('loja-bloqueada', { detail: dados }));
      const detalhe = Array.isArray(dados.detalhes) && dados.detalhes[0]?.mensagem;
      throw new ErroApi(resposta.status, detalhe || dados.erro || MENSAGENS[resposta.status] || 'Algo deu errado.', dados);
    }
  } finally {
    fimLento();
  }
}

export function acordarServidor() { fetch(API_URL + '/health').catch(() => {}); }
