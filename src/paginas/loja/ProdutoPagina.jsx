// Página do produto: fotos, escolha de tamanho/cor, quantidade, adicionar ao carrinho
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Carregando } from '../../componentes/ui';
import { linkWhatsapp, reais } from '../../utils';
import { useLoja } from './LayoutLoja';

export default function ProdutoPagina() {
  const { id } = useParams();
  const { loja, slug, carrinho, denunciar } = useLoja();
  const navegar = useNavigate();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState('');
  const [foto, setFoto] = useState(0);
  const [tamanho, setTamanho] = useState(null);
  const [cor, setCor] = useState(null);
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    api(`/publico/lojas/${slug}/produtos/${id}`, { token: 'nenhum' }).then((d) => {
      setP(d);
      const tamanhos = [...new Set(d.variacoes.map((v) => v.tamanho))];
      const cores = [...new Set(d.variacoes.map((v) => v.cor).filter(Boolean))];
      if (tamanhos.length === 1) setTamanho(tamanhos[0]);
      if (cores.length === 1) setCor(cores[0]);
    }).catch((e) => setErro(e.message));
  }, [slug, id]);

  const tamanhos = useMemo(() => [...new Set((p?.variacoes || []).map((v) => v.tamanho))], [p]);
  const cores = useMemo(() => [...new Set((p?.variacoes || []).map((v) => v.cor).filter(Boolean))], [p]);

  if (erro) return <div className="pilha"><Aviso tipo="erro">{erro}</Aviso><Link to={`/loja/${slug}`}>← Voltar para a loja</Link></div>;
  if (!p) return <Carregando />;

  const temCor = cores.length > 0;
  const variacao = p.variacoes.find((v) => v.tamanho === tamanho && (!temCor || v.cor === cor));
  const estoqueDe = (t, c) => p.variacoes.filter((v) => (t == null || v.tamanho === t) && (c == null || v.cor === c)).reduce((s, v) => s + v.estoque, 0);
  const esgotado = !p.soNoLocal && p.variacoes.every((v) => v.estoque <= 0);
  const faltaEscolher = !tamanho ? 'Escolha o tamanho' : temCor && !cor ? 'Escolha a cor' : null;

  function adicionar() {
    if (!variacao || variacao.estoque <= 0) return;
    carrinho.adicionar({ produtoId: p._id, varId: variacao._id, nome: p.nome, tamanho: variacao.tamanho, cor: variacao.cor, preco: p.preco, foto: p.fotos[0] || '', qtd, estoque: variacao.estoque });
    navegar(`/loja/${slug}/carrinho`);
  }

  return (
    <div className="pilha">
      <Link to={`/loja/${slug}`} className="pequeno suave">← Voltar</Link>
      <div className="produto-grade">
        <div className="galeria">
          <div className="principal">{p.fotos[foto] ? <img src={p.fotos[foto]} alt={p.nome} /> : <div className="sem-foto">Sem foto</div>}</div>
          {p.fotos.length > 1 ? (
            <div className="miniaturas">
              {p.fotos.map((f, i) => <button key={f} aria-pressed={i === foto} aria-label={`Foto ${i + 1}`} onClick={() => setFoto(i)}><img src={f} alt="" /></button>)}
            </div>
          ) : null}
        </div>

        <div className="pilha">
          <div className="pilha-p">
            <h1 style={{ fontSize: '1.5rem' }}>{p.nome}</h1>
            <span className="preco-grande">{reais(p.preco)}</span>
            {p.descricao ? <p className="suave" style={{ whiteSpace: 'pre-line' }}>{p.descricao}</p> : null}
          </div>

          {p.soNoLocal ? (
            <div className="cartao pilha-p">
              <strong>Disponível só na loja</strong>
              <span className="suave pequeno">Este item não é vendido online. Peça pessoalmente{loja.endereco?.texto ? ` em ${loja.endereco.texto}` : ''}.</span>
              <a className="btn btn-contorno" style={{ marginTop: 8 }} href={linkWhatsapp(loja.whatsapp, `Olá! Vocês têm "${p.nome}" disponível?`)} target="_blank" rel="noreferrer">Perguntar no WhatsApp</a>
            </div>
          ) : esgotado ? (
            <Aviso tipo="alerta">Produto esgotado no momento.</Aviso>
          ) : (
            <>
              {tamanhos.length > 1 || tamanhos[0] !== 'Único' ? (
                <div className="pilha-p">
                  <span className="pequeno forte">Tamanho</span>
                  <div className="opcoes">
                    {tamanhos.map((t) => <button key={t} className="opcao" aria-pressed={tamanho === t} disabled={estoqueDe(t, temCor ? cor : null) <= 0} onClick={() => { setTamanho(t); setQtd(1); }}>{t}</button>)}
                  </div>
                </div>
              ) : null}
              {temCor ? (
                <div className="pilha-p">
                  <span className="pequeno forte">Cor</span>
                  <div className="opcoes">
                    {cores.map((c) => <button key={c} className="opcao" aria-pressed={cor === c} disabled={estoqueDe(tamanho, c) <= 0} onClick={() => { setCor(c); setQtd(1); }}>{c}</button>)}
                  </div>
                </div>
              ) : null}
              {variacao ? (
                <div className="linha">
                  <div className="qtd">
                    <button aria-label="Diminuir" onClick={() => setQtd(Math.max(1, qtd - 1))}>−</button>
                    <span>{qtd}</span>
                    <button aria-label="Aumentar" onClick={() => setQtd(Math.min(variacao.estoque, qtd + 1))}>+</button>
                  </div>
                  <span className="pequeno suave">{variacao.estoque <= 3 ? `Últimas ${variacao.estoque} unidades` : 'Em estoque'}</span>
                </div>
              ) : null}
              {faltaEscolher || !variacao ? (
                <button className="btn btn-contorno btn-grande" disabled>{faltaEscolher || 'Combinação indisponível'}</button>
              ) : (
                <button className="btn btn-primario btn-grande" disabled={!loja.aberta} onClick={adicionar}>{loja.aberta ? 'Adicionar ao carrinho' : 'Loja pausada'}</button>
              )}
            </>
          )}
          <button className="btn btn-texto pequeno suave" style={{ alignSelf: 'flex-start' }} onClick={() => denunciar({ produtoId: p._id, produtoNome: p.nome })}>Denunciar produto</button>
        </div>
      </div>
    </div>
  );
}
