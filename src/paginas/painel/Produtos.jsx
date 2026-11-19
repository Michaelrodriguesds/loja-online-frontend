// Lista de produtos do lojista
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Carregando, Vazio } from '../../componentes/ui';
import { reais } from '../../utils';

export default function Produtos() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => { api('/painel/produtos').then(setLista).catch((e) => setErro(e.message)); }, []);

  const filtrados = (lista || []).filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="pilha">
      <div className="linha-entre">
        <h1>Produtos</h1>
        <Link to="/painel/produtos/novo" className="btn btn-primario">+ Novo produto</Link>
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {lista?.length > 6 ? <input className="busca" placeholder="Buscar produto…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" /> : null}
      {!lista ? <Carregando /> : lista.length === 0 ? (
        <Vazio titulo="Nenhum produto ainda">Cadastre o primeiro produto com foto, preço, tamanhos e cores.</Vazio>
      ) : (
        <div className="lista">
          {filtrados.map((p) => {
            const estoque = p.variacoes.reduce((t, v) => t + v.estoque, 0);
            return (
              <Link key={p._id} to={`/painel/produtos/${p._id}`} className="item-lista">
                {p.fotos[0] ? <img className="miniatura" src={p.fotos[0]} alt="" /> : <div className="miniatura miniatura-vazia">sem foto</div>}
                <div className="cresce pilha-p" style={{ gap: 2 }}>
                  <strong className="corta">{p.nome}</strong>
                  <span className="pequeno suave">
                    {p.soNoLocal ? 'Só no local' : `${p.variacoes.length} ${p.variacoes.length === 1 ? 'opção' : 'opções'} · ${estoque} em estoque`}
                  </span>
                  <div className="linha" style={{ gap: 6 }}>
                    {p.status === 'analise' ? <span className="selo selo-ambar">Em análise</span> : null}
                    {p.status === 'oculto' ? <span className="selo selo-vermelho">Oculto pelo suporte</span> : null}
                    {!p.ativo ? <span className="selo selo-cinza">Pausado</span> : null}
                    {!p.soNoLocal && estoque === 0 ? <span className="selo selo-vermelho">Esgotado</span> : null}
                  </div>
                </div>
                <strong>{reais(p.preco)}</strong>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
