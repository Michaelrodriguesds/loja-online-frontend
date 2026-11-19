// Moldura da loja pública: aplica o tema do lojista, topo, carrinho e rodapé
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { api, sessaoComprador } from '../../api';
import { Carregando } from '../../componentes/ui';
import { useCarrinho } from '../../carrinho';
import { corTextoSobre, linkWhatsapp } from '../../utils';
import Denunciar from './Denunciar';

const LojaContexto = createContext(null);
export const useLoja = () => useContext(LojaContexto);

const IconeSacola = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);

export default function LayoutLoja() {
  const { slug } = useParams();
  const [loja, setLoja] = useState(null);
  const [erro, setErro] = useState(null);
  const [comprador, setComprador] = useState(() => sessaoComprador.ler(slug));
  const [denunciando, setDenunciando] = useState(null);
  const carrinho = useCarrinho(slug);

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

  const valor = useMemo(() => ({ loja, slug, comprador, entrar, sair, atualizarComprador, apiComprador, carrinho, denunciar: setDenunciando }),
    [loja, slug, comprador, entrar, sair, atualizarComprador, apiComprador, carrinho]);

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

  const estilo = { '--marca': loja.corPrimaria, '--marca-texto': corTextoSobre(loja.corPrimaria) };
  const base = `/loja/${slug}`;

  return (
    <LojaContexto.Provider value={valor}>
      <div className="loja" data-tema={loja.tema} style={estilo}>
        <header className="topo-loja">
          <div className="interno">
            <Link to={base} className="logo-loja">
              {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : <span className="inicial">{loja.nome.slice(0, 1).toUpperCase()}</span>}
              <strong className="corta">{loja.nome}</strong>
            </Link>
            <div className="linha" style={{ flexWrap: 'nowrap' }}>
              <nav className="links-topo" aria-label="Menu da loja">
                <Link to={`${base}/pedidos`}>Meus pedidos</Link>
                <Link to={comprador ? `${base}/conta` : `${base}/entrar`}>{comprador ? 'Minha conta' : 'Entrar'}</Link>
              </nav>
              <Link to={`${base}/carrinho`} className="botao-icone" aria-label={`Carrinho, ${carrinho.quantidade} itens`}>
                <IconeSacola />
                {carrinho.quantidade ? <span className="contador">{carrinho.quantidade}</span> : null}
              </Link>
            </div>
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
          <NavLink to={base} end>Loja</NavLink>
          <NavLink to={`${base}/carrinho`}>Carrinho{carrinho.quantidade ? <span className="contador">{carrinho.quantidade}</span> : null}</NavLink>
          <NavLink to={`${base}/pedidos`}>Pedidos</NavLink>
          <NavLink to={comprador ? `${base}/conta` : `${base}/entrar`}>{comprador ? 'Conta' : 'Entrar'}</NavLink>
        </nav>

        <Denunciar dados={denunciando} aoFechar={() => setDenunciando(null)} />
      </div>
    </LojaContexto.Provider>
  );
}
