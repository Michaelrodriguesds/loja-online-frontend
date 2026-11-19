// Vitrine: banner, faixa de entrega, categorias e grade de produtos
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Carregando, Vazio } from '../../componentes/ui';
import { reais } from '../../utils';
import { useLoja } from './LayoutLoja';

const IconeMoto = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
);

export default function Vitrine() {
  const { loja, slug } = useLoja();
  const [produtos, setProdutos] = useState(null);
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => { api(`/publico/lojas/${slug}/produtos`, { token: 'nenhum' }).then(setProdutos).catch((e) => setErro(e.message)); }, [slug]);

  const categorias = useMemo(() => [...new Set((produtos || []).map((p) => p.categoria))], [produtos]);
  const visiveis = (produtos || []).filter((p) => !categoria || p.categoria === categoria);
  const { entrega } = loja;
  const textoEntrega = entrega.ativa
    ? `Entregamos em ${entrega.cidades.length ? entrega.cidades.join(', ') : `até ${entrega.raioMaxKm} km`}`
    : 'Retirada no local';

  return (
    <div className="pilha">
      {loja.bannerUrl ? <div className="banner-loja"><img src={loja.bannerUrl} alt="" /></div> : null}
      {loja.descricao ? <p className="suave">{loja.descricao}</p> : null}
      {!loja.aberta ? <Aviso tipo="alerta">A loja está pausada no momento e não está recebendo pedidos. Você pode olhar os produtos.</Aviso> : null}
      <div className="faixa-entrega">
        <IconeMoto />
        <div className="pilha-p" style={{ gap: 0 }}>
          <strong>{textoEntrega}</strong>
          <span className="suave pequeno">{entrega.ativa && entrega.retiradaAtiva ? 'Ou retire na loja sem pagar frete' : entrega.ativa ? `Frete a partir de ${reais(entrega.taxaMinima)}` : entrega.prazoRetirada}</span>
        </div>
      </div>

      {categorias.length > 1 ? (
        <div className="chips" role="group" aria-label="Categorias">
          <button className="chip" aria-pressed={!categoria} onClick={() => setCategoria('')}>Todos</button>
          {categorias.map((c) => <button key={c} className="chip" aria-pressed={categoria === c} onClick={() => setCategoria(c)}>{c}</button>)}
        </div>
      ) : null}

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!produtos ? <Carregando /> : visiveis.length === 0 ? <Vazio titulo="Nenhum produto por enquanto">Volte em breve!</Vazio> : (
        <div className="vitrine">
          {visiveis.map((p) => {
            const esgotado = !p.soNoLocal && p.variacoes.every((v) => v.estoque <= 0);
            return (
              <Link key={p._id} to={`/loja/${slug}/produto/${p._id}`} className="cartao-produto">
                <div className="foto">
                  {p.fotos[0] ? <img src={p.fotos[0]} alt="" loading="lazy" /> : <div className="sem-foto">Sem foto</div>}
                  {p.soNoLocal ? <span className="selo-foto">Só na loja</span> : esgotado ? <span className="selo-foto">Esgotado</span> : null}
                </div>
                <div className="info">
                  <span className="nome">{p.nome}</span>
                  <span className="preco">{reais(p.preco)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
