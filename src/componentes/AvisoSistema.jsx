// Faixa com o aviso geral que você escreve no /admin (e tela de manutenção)
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_URL } from '../api';
import { dataHora } from '../utils';

export default function AvisoSistema({ children }) {
  const [aviso, setAviso] = useState(null);
  const [fechado, setFechado] = useState(() => localStorage.getItem('aviso-fechado'));
  const [manutencao, setManutencao] = useState(null);
  const { pathname } = useLocation();
  const ehLojista = pathname.startsWith('/painel');
  const ehAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    fetch(`${API_URL}/status`).then((r) => r.json()).then((d) => setAviso(d.aviso)).catch(() => {});
    const aoManutencao = (e) => setManutencao(e.detail);
    window.addEventListener('manutencao', aoManutencao);
    return () => window.removeEventListener('manutencao', aoManutencao);
  }, []);

  if (manutencao && !ehAdmin) {
    return (
      <div className="tela-centro">
        <div className="cartao pilha centro" style={{ maxWidth: 420 }}>
          <h1>Em manutenção</h1>
          <p className="suave">{manutencao.erro}</p>
          {manutencao.fim ? <p className="pequeno">Previsão de volta: {dataHora(manutencao.fim)}</p> : null}
          <button className="btn btn-primario" onClick={() => window.location.reload()}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  const mostrar = aviso && !ehAdmin && (aviso.mostrarPara === 'todos' || ehLojista) && String(aviso.versao) !== fechado;
  return (
    <>
      {mostrar ? (
        <div className={`faixa-aviso ${aviso.tipo === 'manutencao' ? 'manutencao' : ''}`} role="status">
          <span>
            {aviso.situacao === 'programado' && aviso.inicio ? `Manutenção programada para ${dataHora(aviso.inicio)}: ` : ''}
            {aviso.mensagem}
          </span>
          <button className="btn btn-texto" onClick={() => { localStorage.setItem('aviso-fechado', String(aviso.versao)); setFechado(String(aviso.versao)); }}>Fechar</button>
        </div>
      ) : null}
      {children}
    </>
  );
}
