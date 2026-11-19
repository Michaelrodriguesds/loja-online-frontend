// Moldura do painel do lojista: topo, abas, aviso do plano e tela de bloqueio
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, sessao } from '../../api';
import { Aviso, BotaoCopiar, Carregando } from '../../componentes/ui';
import { data, linkWhatsapp } from '../../utils';

const PainelContexto = createContext(null);
export const usePainel = () => useContext(PainelContexto);

export default function LayoutPainel() {
  const [dados, setDados] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const navegar = useNavigate();

  const recarregar = useCallback(async () => {
    try {
      const [me, r] = await Promise.all([api('/painel/me'), api('/painel/resumo')]);
      setDados(me);
      setResumo(r);
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);
  useEffect(() => {
    const aoBloquear = () => recarregar();
    window.addEventListener('loja-bloqueada', aoBloquear);
    return () => window.removeEventListener('loja-bloqueada', aoBloquear);
  }, [recarregar]);

  if (erro && !dados) return <div className="conteudo"><Aviso tipo="erro">{erro}</Aviso></div>;
  if (!dados) return <Carregando />;

  const { loja, licenca, moderacao, link, suporteWhatsapp } = dados;
  const bloqueada = !licenca.ativa || moderacao.bloqueada;
  const telaLiberada = pathname === '/painel' || pathname.startsWith('/painel/pedidos') || pathname === '/painel/conta';
  const mensagemSuporte = `Olá! Quero renovar o plano da loja ${loja.nome} (${loja.slug}).`;

  return (
    <PainelContexto.Provider value={{ ...dados, resumo, recarregar, bloqueada }}>
      <header className="topo-painel">
        <div className="interno">
          <span className="marca-painel">
            {loja.logoUrl ? <img src={loja.logoUrl} alt="" /> : null}
            <span className="corta">{loja.nome}</span>
          </span>
          <div className="linha">
            {!bloqueada ? <a className="btn btn-contorno btn-pequeno" href={link} target="_blank" rel="noreferrer">Ver loja</a> : null}
            <button className="btn btn-texto pequeno" onClick={() => { sessao.sair(); navegar('/entrar'); }}>Sair</button>
          </div>
        </div>
        <nav className="abas" aria-label="Seções do painel">
          <NavLink to="/painel" end>Pedidos{resumo?.aguardandoVoce ? <span className="contador">{resumo.aguardandoVoce}</span> : null}</NavLink>
          {!bloqueada ? <NavLink to="/painel/produtos">Produtos</NavLink> : null}
          {!bloqueada ? <NavLink to="/painel/entrega">Entrega e Pix</NavLink> : null}
          {!bloqueada ? <NavLink to="/painel/aparencia">Aparência</NavLink> : null}
          <NavLink to="/painel/conta">Conta e plano</NavLink>
        </nav>
      </header>

      <main className="conteudo pilha">
        {params.get('nova') ? (
          <div className="cartao pilha">
            <h2>Sua loja está criada! 🎉</h2>
            <p className="suave">Próximos passos: cadastre seus produtos, a chave Pix e o endereço da loja (para o frete). Depois é só divulgar o link:</p>
            <div className="pix-codigo">{link}</div>
            <div className="linha">
              <BotaoCopiar texto={link} rotulo="Copiar link da loja" className="btn-primario" />
              <button className="btn btn-texto" onClick={() => setParams({})}>Fechar</button>
            </div>
          </div>
        ) : null}

        {bloqueada ? (
          <div className="cartao pilha" style={{ borderColor: 'var(--vermelho-texto)' }}>
            <h2>{moderacao.bloqueada ? '🚫 Sua loja foi bloqueada' : '🔒 Sua loja está pausada'}</h2>
            <p className="suave">
              {moderacao.bloqueada
                ? `Motivo: ${moderacao.motivo || 'descumprimento dos Termos de Uso'}. Fale com o suporte.`
                : `O plano venceu em ${data(licenca.acessoAte)}. A loja saiu do ar, mas seus produtos e pedidos estão guardados. Você ainda pode finalizar os pedidos em andamento.`}
            </p>
            {suporteWhatsapp ? <a className="btn btn-primario" href={linkWhatsapp(suporteWhatsapp, mensagemSuporte)} target="_blank" rel="noreferrer">Falar com o suporte no WhatsApp</a> : null}
          </div>
        ) : licenca.situacao === 'vencendo' || licenca.plano === 'teste' ? (
          <Aviso tipo={licenca.situacao === 'vencendo' ? 'alerta' : 'info'}>
            {licenca.plano === 'teste' ? 'Teste grátis: ' : 'Plano: '}
            {licenca.diasRestantes === 1 ? 'termina amanhã' : `faltam ${licenca.diasRestantes} dias`} ({data(licenca.acessoAte)}).{' '}
            {suporteWhatsapp ? <a href={linkWhatsapp(suporteWhatsapp, mensagemSuporte)} target="_blank" rel="noreferrer">Renovar pelo WhatsApp</a> : null}
          </Aviso>
        ) : null}

        {!loja.aberta && !bloqueada ? <Aviso tipo="alerta">Sua loja está <strong>pausada</strong>: os clientes veem os produtos, mas não conseguem fazer pedidos. Reabra em “Aparência”.</Aviso> : null}

        {bloqueada && !telaLiberada ? null : <Outlet />}
      </main>
    </PainelContexto.Provider>
  );
}
