// Funções pequenas usadas em várias telas

export const reais = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

export const dataHora = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
export const data = (d) => new Date(d).toLocaleDateString('pt-BR');

// "R$ 12,50" / "12,5" → 12.5
export function lerValor(texto) {
  const n = Number(String(texto ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function linkWhatsapp(numero, texto = '') {
  const n = String(numero || '').replace(/\D/g, '');
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

export const SEGMENTOS = {
  moda: 'Moda e roupas', barbearia: 'Barbearia', beleza: 'Beleza e cosméticos', acessorios: 'Acessórios',
  calcados: 'Calçados', variedades: 'Variedades e presentes', alimentos: 'Alimentos', outro: 'Outro',
};

export const TEMAS = {
  urbano: { nome: 'Urbano', descricao: 'Escuro com destaque forte — barbearia, streetwear', cor: '#E8A33D' },
  clean: { nome: 'Clean', descricao: 'Branco e minimalista — moda, acessórios', cor: '#111111' },
  delicado: { nome: 'Delicado', descricao: 'Tons claros e suaves — beleza, cosméticos', cor: '#B5657A' },
  vibrante: { nome: 'Vibrante', descricao: 'Cores fortes — variedades, presentes', cor: '#E4572E' },
};

// Tema sugerido para cada segmento (o lojista pode trocar)
export const TEMA_DO_SEGMENTO = { barbearia: 'urbano', moda: 'clean', acessorios: 'clean', calcados: 'clean', beleza: 'delicado', variedades: 'vibrante', alimentos: 'vibrante', outro: 'clean' };

export const STATUS = {
  aguardando_aprovacao: { nome: 'Aguardando aprovação', cor: 'ambar' },
  aguardando_cliente: { nome: 'Aguardando cliente aceitar frete', cor: 'ambar' },
  aguardando_pagamento: { nome: 'Aguardando Pix', cor: 'ambar' },
  em_preparo: { nome: 'Em preparo', cor: 'verde' },
  saiu_entrega: { nome: 'Saiu para entrega', cor: 'azul' },
  pronto_retirada: { nome: 'Pronto para retirada', cor: 'azul' },
  concluido: { nome: 'Concluído', cor: 'cinza' },
  recusado: { nome: 'Recusado', cor: 'vermelho' },
  cancelado: { nome: 'Cancelado', cor: 'vermelho' },
};

// Cor do texto que fica legível sobre a cor da marca (preto ou branco)
export function corTextoSobre(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? '#111111' : '#ffffff';
}

// Reduz a foto no próprio celular antes de enviar (máx. 1200 px, ~600 KB)
export function comprimirImagem(arquivo, ladoMax = 1200) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith('image/')) return reject(new Error('Escolha um arquivo de imagem.'));
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      let qualidade = 0.82;
      let dados = canvas.toDataURL('image/webp', qualidade);
      if (!dados.startsWith('data:image/webp')) dados = canvas.toDataURL('image/jpeg', qualidade); // iPhone antigo
      while (dados.length > 850_000 && qualidade > 0.4) {
        qualidade -= 0.12;
        dados = canvas.toDataURL(dados.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg', qualidade);
      }
      resolve(dados);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler esta foto.')); };
    img.src = url;
  });
}

// Busca o endereço pelo CEP (ViaCEP, grátis)
export async function buscarCep(cep) {
  const n = String(cep).replace(/\D/g, '');
  if (n.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${n}/json/`, { signal: AbortSignal.timeout(6000) });
    const d = await r.json();
    if (d.erro) return null;
    return { rua: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', uf: d.uf || 'RJ' };
  } catch {
    return null;
  }
}
