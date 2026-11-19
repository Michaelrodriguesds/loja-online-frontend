// Lista de lojas com situação do plano
import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, BotaoCopiar, Carregando, Vazio } from '../../componentes/ui';
import { SEGMENTOS, data } from '../../utils';

export const SITUACOES = {
  teste: ['Teste', 'azul'], ativo: ['Ativa', 'verde'], vencendo: ['Vencendo', 'ambar'], vencido: ['Vencida', 'vermelho'], bloqueada: ['Bloqueada', 'vermelho'],
};

export default function Lojas() {
  const { resumo } = useOutletContext();
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const linkCadastro = `${window.location.origin}/criar-loja`;

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/admin/lojas?${new URLSearchParams({ ...(filtro ? { situacao: filtro } : {}), ...(busca ? { busca } : {}) })}`).then(setLista).catch((e) => setErro(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filtro, busca]);

  return (
    <div className="pilha">
      <div className="cartao pilha-p">
        <strong>Link para novos lojistas</strong>
        <span className="pequeno suave">Mande para quem quiser criar uma loja (30 dias grátis).</span>
        <div className="linha" style={{ flexWrap: 'nowrap' }}><div className="pix-codigo cresce">{linkCadastro}</div><BotaoCopiar texto={linkCadastro} /></div>
      </div>
      {resumo ? (
        <div className="numeros">
          <div className="numero"><strong>{resumo.total}</strong><span>Lojas</span></div>
          <div className="numero"><strong>{resumo.ativo + resumo.vencendo}</strong><span>Pagantes</span></div>
          <div className="numero"><strong>{resumo.vencido + resumo.bloqueada}</strong><span>Fora do ar</span></div>
        </div>
      ) : null}
      <input className="busca" placeholder="Buscar loja pelo nome…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar loja" />
      <div className="filtros" role="group" aria-label="Filtrar por situação">
        <button className="filtro" aria-pressed={!filtro} onClick={() => setFiltro('')}>Todas</button>
        {Object.entries(SITUACOES).map(([id, [nome]]) => <button key={id} className="filtro" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome}{resumo?.[id] ? ` (${resumo[id]})` : ''}</button>)}
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!lista ? <Carregando /> : lista.length === 0 ? <Vazio titulo="Nenhuma loja aqui" /> : (
        <div className="lista">
          {lista.map((l) => {
            const [nome, cor] = SITUACOES[l.situacao];
            return (
              <Link key={l._id} to={`/admin/lojas/${l._id}`} className="item-lista">
                <div className="cresce pilha-p" style={{ gap: 2 }}>
                  <div className="linha-entre"><strong className="corta">{l.nome}</strong><span className={`selo selo-${cor}`}>{nome}</span></div>
                  <span className="pequeno suave corta">{l.dono?.nome} · {SEGMENTOS[l.segmento]} · {l.produtos} produtos · {l.pedidosMes} pedidos/30d</span>
                  <span className="pequeno suave">{l.licenca.ativa ? `Vence ${data(l.licenca.acessoAte)} (${l.licenca.diasRestantes}d)` : `Venceu ${data(l.licenca.acessoAte)}`}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
