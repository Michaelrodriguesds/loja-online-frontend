// Carrinho guardado no aparelho (um por loja)
import { useCallback, useEffect, useState } from 'react';

const chave = (slug) => `carrinho:${slug}`;
const ler = (slug) => { try { return JSON.parse(localStorage.getItem(chave(slug))) || []; } catch { return []; } };

export function useCarrinho(slug) {
  const [itens, setItens] = useState(() => ler(slug));
  useEffect(() => { setItens(ler(slug)); }, [slug]);
  const salvar = useCallback((novo) => {
    localStorage.setItem(chave(slug), JSON.stringify(novo));
    setItens(novo);
  }, [slug]);

  return {
    itens,
    quantidade: itens.reduce((t, i) => t + i.qtd, 0),
    adicionar(item) {
      const atual = ler(slug);
      const ex = atual.find((i) => i.varId === item.varId);
      if (ex) ex.qtd = Math.min(ex.qtd + item.qtd, item.estoque || 50);
      else atual.push(item);
      salvar(atual);
    },
    mudarQtd(varId, qtd) { salvar(ler(slug).map((i) => (i.varId === varId ? { ...i, qtd } : i)).filter((i) => i.qtd > 0)); },
    remover(varId) { salvar(ler(slug).filter((i) => i.varId !== varId)); },
    limpar() { salvar([]); },
  };
}
