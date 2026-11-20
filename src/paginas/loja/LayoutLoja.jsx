// Moldura da loja pública: aplica o tema do lojista, topo, carrinho e rodapé
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, sessaoComprador } from '../../api';
import { Carregando } from '../../componentes/ui';
import { useCarrinho } from '../../carrinho';
import { corTextoSobre, linkWhatsapp } from '../../utils';
import Denunciar from './Denunciar';

const LojaContexto = createContext(null);
export const useLoja = () => useContext(LojaContexto);

const Icone = ({ d, tamanho = 24 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const ICONES = {
  carrinho: <><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11h10.2l2-8H6.2" /></>,
  loja: <><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" /></>,
  pedidos: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  conta: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  busca: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
};

export default function LayoutLoja() {
  const { slug } = useParams();
  const [loja, setLoja] = useState(null);
  const [erro, setErro] = useState(null);
  const [comprador, setComprador] = useState(() => sessaoComprador.ler(slug));
  const [denunciando, setDenunciando] = useState(null);
  const [busca, setBusca] = useState('');
  const carrinho = useCarrinho(slug);
  const { pathname } = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    setLoja(null);
    setErro(null);
    setComprador(sessaoComprador.ler(slug));
    api(`/publico/lojas/${slug}`, { token: 'nenhum' })
      .then((l) => { setLoja(l); document.title = l.nome; })
      .catch((e) => setErro(e));
  }, [slug]);

  const entrar = useCallback((dados) => { sessaoComprador.salvar(slug, dados); setComprador(dados); }, [slug]);
  const sair = useCallback(() => { sessaoComprador.sair(slug); setComprador(null); }, [slug]);
  const atualizarComprador = useCallback((c) => {
    setComprador((atual) => { const novo = { ...atual, comprador: c }; sessaoComprador.salvar(slug, novo); return novo; });
  }, [slug]);

  // Chamada à API já com o login do comprador; se a sessão venceu, desloga
  const apiComprador = useCallback(async (caminho, opcoes = {}) => {
    try {
      return await api(`/publico/lojas/${slug}${caminho}`, { ...opcoes, token: comprador?.token || 'nenhum' });
    } catch (e) {
      if (e.status === 401) sair();
      throw e;
    }
  }, [slug, comprador, sair]);

  const valor = useMemo(() => ({ loja, slug, comprador, entrar, sair, atualizarComprador, apiComprador, carrinho, denunciar: setDenunciando, busca, setBusca }),
    [loja, slug, comprador, entrar, sair, atualizarComprador, apiComprador, carrinho, busca]);

  if (erro) {
    const indisponivel = erro.dados?.detalhes?.indisponivel;
    return (
      <div className="tela-centro">
        <div className="cartao pilha centro" style={{ maxWidth: 420 }}>
          <h1>{indisponivel ? erro.dados.detalhes.nome : 'Loja não encontrada'}</h1>
          <p className="suave">{indisponivel ? 'Esta loja está temporariamente indisponível. Tente de novo mais tarde.' : erro.message}</p>
        </div>
      </div>
    );
  }
  if (!loja) return <Carregando texto="Abrindo a loja…" />;

  const textoSobreMarca = corTextoSobre(loja.corPrimaria);
  const marcaClara = textoSobreMarca !== '#ffffff'; // cor clara (ex.: amarelo) não serve para texto sobre branco
  const estilo = {
    '--marca': loja.corPrimaria,
    '--marca-texto': textoSobreMarca,
    ...(marcaClara && loja.tema !== 'urbano' ? { '--l-ativo': '#1f1f1f', '--l-preco': loja.tema === 'vibrante' ? '#1f1f1f' : undefined } : {}),
  };
  const base = `/loja/${slug}`;
  function aoBuscar(texto) {
    setBusca(texto);
    if (pathname !== base) navegar(base);
  }

  return (
    <LojaContexto.Provider value={valor}>
      <div className="loja" data-tema={loja.tema} style={estilo}>
        <header className="topo-loja">
          <div className="interno">
            <div className="topo-linha">
              <Link to={base} className="logo-loja" onClick={() => setBusca('')}>
                {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <span className="inicial">{loja.nome.slice(0, 1).toUpperCase()}</span>}
                <strong className="corta">{loja.nome}</strong>
              </Link>
              <div className="linha" style={{ flexWrap: 'nowrap', gap: 4 }}>
                <nav className="links-topo" aria-label="Menu da loja">
                  <Link to={`${base}/pedidos`}>Meus pedidos</Link>
                  <Link to={comprador ? `${base}/conta` : `${base}/entrar`}>{comprador ? 'Minha conta' : 'Entrar'}</Link>
                </nav>
                <Link to={`${base}/carrinho`} className="botao-icone" aria-label={`Carrinho, ${carrinho.quantidade} itens`}>
                  <Icone d={ICONES.carrinho} tamanho={26} />
                  {carrinho.quantidade ? <span className="contador">{carrinho.quantidade}</span> : null}
                </Link>
              </div>
            </div>
            <form className="caixa-busca" role="search" onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('input').blur(); }}>
              <Icone d={ICONES.busca} tamanho={20} />
              <input type="search" value={busca} onChange={(e) => aoBuscar(e.target.value)} placeholder={`Buscar em ${loja.nome}`} aria-label="Buscar produtos" enterKeyHint="search" />
              {busca ? <button type="button" aria-label="Limpar busca" onClick={() => setBusca('')}>×</button> : null}
            </form>
          </div>
        </header>

        <main className="conteudo-loja"><Outlet /></main>

        <footer className="rodape-loja">
          <div className="linha" style={{ justifyContent: 'center' }}>
            <a href={linkWhatsapp(loja.whatsapp, `Olá! Vim pela loja online da ${loja.nome}.`)} target="_blank" rel="noreferrer">WhatsApp</a>
            {loja.instagram ? <a href={`https://instagram.com/${loja.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">Instagram</a> : null}
            <Link to="/termos">Termos</Link>
            <button className="btn btn-texto pequeno" style={{ minHeight: 0, color: 'inherit' }} onClick={() => setDenunciando({})}>Denunciar</button>
          </div>
          <span>{loja.nome}{loja.endereco?.cidade ? ` · ${loja.endereco.cidade}` : ''}</span>
        </footer>

        <nav className="barra-loja" aria-label="Navegação da loja">
          <NavLink to={base} end><Icone d={ICONES.loja} />Loja</NavLink>
          <NavLink to={`${base}/carrinho`}><Icone d={ICONES.carrinho} />Carrinho{carrinho.quantidade ? <span className="contador">{carrinho.quantidade}</span> : null}</NavLink>
          <NavLink to={`${base}/pedidos`}><Icone d={ICONES.pedidos} />Pedidos</NavLink>
          <NavLink to={comprador ? `${base}/conta` : `${base}/entrar`}><Icone d={ICONES.conta} />{comprador ? 'Conta' : 'Entrar'}</NavLink>
        </nav>

        <Denunciar dados={denunciando} aoFechar={() => setDenunciando(null)} />
      </div>
    </LojaContexto.Provider>
  );
}
