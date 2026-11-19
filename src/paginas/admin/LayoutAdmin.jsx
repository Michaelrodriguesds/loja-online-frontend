// Moldura do SEU painel (desenvolvedor)
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, sessao } from '../../api';

export default function LayoutAdmin() {
  const navegar = useNavigate();
  const [resumo, setResumo] = useState(null);
  useEffect(() => { api('/admin/resumo').then(setResumo).catch(() => {}); }, []);
  const pendencias = (resumo?.produtosEmAnalise || 0) + (resumo?.denunciasNovas || 0);
  return (
    <>
      <header className="topo-painel">
        <div className="interno">
          <span className="marca-painel">🛡️ Admin · Lojas Online</span>
          <button className="btn btn-texto pequeno" onClick={() => { sessao.sair(); navegar('/entrar'); }}>Sair</button>
        </div>
        <nav className="abas" aria-label="Seções do admin">
          <NavLink to="/admin" end>Lojas</NavLink>
          <NavLink to="/admin/moderacao">Moderação{pendencias ? <span className="contador">{pendencias}</span> : null}</NavLink>
          <NavLink to="/admin/aviso">Avisos</NavLink>
        </nav>
      </header>
      <main className="conteudo pilha"><Outlet context={{ resumo }} /></main>
    </>
  );
}
