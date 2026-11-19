// Lista de pedidos do comprador nesta loja
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Aviso, Carregando, Selo, Vazio } from '../../componentes/ui';
import { dataHora, reais } from '../../utils';
import { useLoja } from './LayoutLoja';

export default function MeusPedidos() {
  const { slug, comprador, apiComprador } = useLoja();
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!comprador) return;
    apiComprador('/pedidos').then(setLista).catch((e) => setErro(e.message));
  }, [comprador, apiComprador]);

  if (!comprador) return <Navigate to={`/loja/${slug}/entrar`} replace />;

  return (
    <div className="pilha" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <h1>Meus pedidos</h1>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!lista ? <Carregando /> : lista.length === 0 ? <Vazio titulo="Nenhum pedido ainda">Quando você fizer um pedido, o andamento aparece aqui.</Vazio> : (
        <div className="lista">
          {lista.map((p) => (
            <Link key={p._id} to={`/loja/${slug}/pedidos/${p._id}`} className="cartao cartao-clicavel pilha-p">
              <div className="linha-entre"><strong>Pedido #{p.numero}</strong><Selo status={p.status} /></div>
              <div className="linha-entre pequeno suave"><span>{dataHora(p.createdAt)} · {p.modo === 'entrega' ? 'Entrega' : 'Retirada'}</span><strong style={{ color: 'var(--l-tinta)' }}>{reais(p.total)}</strong></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
