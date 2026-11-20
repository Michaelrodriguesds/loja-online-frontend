// Lista de pedidos do lojista
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Carregando, Selo, Vazio } from '../../componentes/ui';
import { FORMAS_ENTREGA, dataHora, reais } from '../../utils';
import { usePainel } from './LayoutPainel';

const GRUPOS = [['aguardando', 'Aguardando você'], ['andamento', 'Em andamento'], ['finalizados', 'Finalizados'], ['todos', 'Todos']];

export default function Pedidos() {
  const { resumo } = usePainel();
  const [grupo, setGrupo] = useState('aguardando');
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLista(null);
    api(`/painel/pedidos?grupo=${grupo}`).then((r) => setLista(r.itens)).catch((e) => setErro(e.message));
  }, [grupo]);

  return (
    <div className="pilha">
      {resumo ? (
        <div className="numeros">
          <div className="numero"><strong>{resumo.aguardandoVoce}</strong><span>Aguardando você</span></div>
          <div className="numero"><strong>{resumo.emAndamento}</strong><span>Em andamento</span></div>
          <div className="numero"><strong>{resumo.concluidos}</strong><span>Concluídos</span></div>
        </div>
      ) : null}
      <div className="filtros" role="group" aria-label="Filtrar pedidos">
        {GRUPOS.map(([id, nome]) => <button key={id} className="filtro" aria-pressed={grupo === id} onClick={() => setGrupo(id)}>{nome}</button>)}
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!lista ? <Carregando /> : lista.length === 0 ? (
        <Vazio titulo="Nenhum pedido aqui">Quando um cliente comprar, o pedido aparece nesta lista.</Vazio>
      ) : (
        <div className="lista">
          {lista.map((p) => (
            <Link key={p._id} to={`/painel/pedidos/${p._id}`} className="item-lista">
              <div className="cresce pilha-p" style={{ gap: 4 }}>
                <div className="linha-entre"><strong>#{p.numero} · {p.comprador?.nome}</strong><Selo status={p.status} /></div>
                <span className="pequeno suave corta">
                  {p.itens.reduce((t, i) => t + i.qtd, 0)} {p.itens.length === 1 && p.itens[0].qtd === 1 ? 'item' : 'itens'} · {p.modo === 'entrega' ? `Entrega · ${p.endereco?.bairro || ''}, ${p.endereco?.cidade || ''}${p.distanciaKm ? ` · ${String(p.distanciaKm).replace('.', ',')} km` : ''}` : 'Retirada'}
                </span>
                <div className="linha-entre pequeno"><span className="suave">{p.pagamento === 'pix' ? 'Pix' : FORMAS_ENTREGA[p.formaNaEntrega] || 'Paga na entrega'} · {dataHora(p.createdAt)}</span><strong>{reais(p.total)}</strong></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
