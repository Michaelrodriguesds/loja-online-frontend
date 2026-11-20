// Carrinho e finalização: entrega ou retirada, frete estimado, forma de pagamento
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Aviso, Botao, Girando, Vazio } from '../../componentes/ui';
import { FORMAS_ENTREGA, lerValor, reais } from '../../utils';
import { useLoja } from './LayoutLoja';

export default function Carrinho() {
  const { loja, slug, comprador, carrinho, apiComprador } = useLoja();
  const navegar = useNavigate();
  const { entrega, pagamento } = loja;
  const [modo, setModo] = useState(entrega.ativa ? 'entrega' : 'retirada');
  const [forma, setForma] = useState(pagamento.pix ? 'pix' : 'na_entrega');
  const formasLoja = pagamento.formasNaEntrega || [];
  const [formaEntrega, setFormaEntrega] = useState(formasLoja.includes('cartao_credito') ? 'cartao_credito' : formasLoja[0] || '');
  const [troco, setTroco] = useState('');
  const [frete, setFrete] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const endereco = comprador?.comprador?.endereco;
  const temEndereco = Boolean(endereco?.cidade && endereco?.rua);

  useEffect(() => {
    if (modo !== 'entrega' || !comprador || !temEndereco) { setFrete(null); return; }
    setCalculando(true);
    apiComprador('/frete', { metodo: 'POST' }).then(setFrete).catch((e) => setFrete({ foraDaArea: true, motivo: e.message })).finally(() => setCalculando(false));
  }, [modo, comprador, temEndereco, apiComprador]);

  if (!carrinho.itens.length) {
    return <Vazio titulo="Seu carrinho está vazio"><Link to={`/loja/${slug}`} className="btn btn-primario" style={{ marginTop: 12 }}>Ver produtos</Link></Vazio>;
  }

  const subtotal = carrinho.itens.reduce((t, i) => t + Math.round(i.preco * 100) * i.qtd, 0) / 100;
  const valorFrete = modo === 'entrega' ? frete?.frete ?? 0 : 0;
  const total = (Math.round(subtotal * 100) + Math.round(valorFrete * 100)) / 100;
  const bloqueado = !loja.aberta || (modo === 'entrega' && (!temEndereco || frete?.foraDaArea || calculando)) || (forma === 'na_entrega' && !formaEntrega);

  async function finalizar() {
    setErro('');
    setEnviando(true);
    try {
      const p = await apiComprador('/pedidos', {
        metodo: 'POST',
        corpo: {
          itens: carrinho.itens.map((i) => ({ produtoId: i.produtoId, varId: i.varId, qtd: i.qtd })), modo, pagamento: forma,
          ...(forma === 'na_entrega' ? { formaNaEntrega: formaEntrega, trocoPara: formaEntrega === 'dinheiro' && Number.isFinite(lerValor(troco)) && lerValor(troco) > 0 ? lerValor(troco) : null } : {}),
        },
      });
      carrinho.limpar();
      navegar(`/loja/${slug}/pedidos/${p._id}?novo=1`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pilha" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <h1>Carrinho</h1>
      <div className="lista">
        {carrinho.itens.map((i) => (
          <div key={i.varId} className="cartao linha" style={{ flexWrap: 'nowrap', padding: 10 }}>
            {i.foto ? <img className="miniatura" src={i.foto} alt="" /> : <div className="miniatura" />}
            <div className="cresce pilha-p" style={{ gap: 2 }}>
              <strong className="corta">{i.nome}</strong>
              <span className="pequeno suave">{[i.tamanho !== 'Único' ? `Tam. ${i.tamanho}` : null, i.cor].filter(Boolean).join(' · ')}</span>
              <strong>{reais(i.preco * i.qtd)}</strong>
            </div>
            <div className="qtd">
              <button aria-label="Diminuir" onClick={() => carrinho.mudarQtd(i.varId, i.qtd - 1)}>−</button>
              <span>{i.qtd}</span>
              <button aria-label="Aumentar" onClick={() => carrinho.mudarQtd(i.varId, Math.min(i.qtd + 1, i.estoque || 50))}>+</button>
            </div>
          </div>
        ))}
      </div>

      {!comprador ? (
        <div className="cartao pilha">
          <strong>Para finalizar, entre na sua conta</strong>
          <p className="suave pequeno">É rápido: com a conta você acompanha o pedido e não precisa digitar o endereço de novo.</p>
          <Link className="btn btn-primario btn-grande" to={`/loja/${slug}/entrar?voltar=carrinho`}>Entrar ou criar conta</Link>
        </div>
      ) : (
        <>
          <div className="pilha-p">
            <strong>Como quer receber?</strong>
            <div className="grade-2">
              {entrega.ativa ? <button className="escolha" aria-pressed={modo === 'entrega'} onClick={() => setModo('entrega')}><strong>Entrega</strong><small>{entrega.prazo}</small></button> : null}
              {entrega.retiradaAtiva ? <button className="escolha" aria-pressed={modo === 'retirada'} onClick={() => setModo('retirada')}><strong>Retirar na loja</strong><small>Sem frete</small></button> : null}
            </div>
          </div>

          {modo === 'entrega' ? (
            <div className="cartao pilha-p">
              {temEndereco ? (
                <>
                  <div className="linha-entre">
                    <span className="pequeno suave">Entregar em</span>
                    <Link to={`/loja/${slug}/conta?voltar=carrinho`} className="pequeno">Trocar</Link>
                  </div>
                  <strong>{endereco.rua}, {endereco.numero}{endereco.complemento ? ` - ${endereco.complemento}` : ''}</strong>
                  <span className="pequeno suave">{endereco.bairro}, {endereco.cidade}</span>
                  <div style={{ borderTop: '1px solid var(--l-linha)', marginTop: 8, paddingTop: 8 }}>
                    {calculando ? <span className="linha pequeno"><Girando /> Calculando frete…</span>
                      : frete?.foraDaArea ? <Aviso tipo="alerta">{frete.motivo}</Aviso>
                        : frete?.aCombinar ? <span className="pequeno">Frete <strong>a combinar</strong>: a loja confirma o valor ao aprovar. Você só paga depois de aceitar.</span>
                          : frete ? <span className="pequeno">Distância estimada: <strong>{String(frete.distanciaKm).replace('.', ',')} km</strong> × {reais(entrega.valorKm)}/km. Valor estimado: a loja confirma ao aprovar.</span> : null}
                  </div>
                </>
              ) : (
                <>
                  <span>Cadastre seu endereço para calcular o frete.</span>
                  <Link className="btn btn-contorno" to={`/loja/${slug}/conta?voltar=carrinho`}>Cadastrar endereço</Link>
                </>
              )}
            </div>
          ) : (
            <div className="cartao pilha-p">
              <strong>Retirada na loja</strong>
              <span className="pequeno suave">{loja.endereco?.texto ? `${loja.endereco.texto}${loja.endereco.cidade ? ` - ${loja.endereco.cidade}` : ''}. ` : ''}{entrega.prazoRetirada}. Você recebe um aviso quando estiver pronto.</span>
            </div>
          )}

          <div className="pilha-p">
            <strong>Pagamento</strong>
            {pagamento.pix ? <button className="escolha" aria-pressed={forma === 'pix'} onClick={() => setForma('pix')}><strong>Pix</strong><small>O código aparece depois que a loja aprovar o pedido</small></button> : null}
            {pagamento.aceitaNaEntrega && formasLoja.length ? (
              <button className="escolha" aria-pressed={forma === 'na_entrega'} onClick={() => setForma('na_entrega')}>
                <strong>{modo === 'entrega' ? 'Pagar na entrega' : 'Pagar na loja'}</strong>
                <small>{formasLoja.map((f) => FORMAS_ENTREGA[f]).join(' · ')} — sujeito à aprovação da loja</small>
              </button>
            ) : null}
            {forma === 'na_entrega' ? (
              <div className="cartao pilha-p">
                <span className="pequeno forte">Como vai pagar {modo === 'entrega' ? 'na entrega' : 'na loja'}?</span>
                <div className="opcoes">
                  {formasLoja.map((f) => <button key={f} type="button" className="opcao" aria-pressed={formaEntrega === f} onClick={() => setFormaEntrega(f)}>{FORMAS_ENTREGA[f]}</button>)}
                </div>
                {formaEntrega.startsWith('cartao') ? <small className="suave">Pagamento por aproximação na maquininha.</small> : null}
                {formaEntrega === 'dinheiro' ? (
                  <label className="campo" style={{ marginTop: 4 }}>
                    <span>Precisa de troco para quanto? (opcional)</span>
                    <input inputMode="decimal" value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Ex.: 100" />
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="cartao resumo-total">
            <div className="linha-entre suave"><span>Produtos</span><span>{reais(subtotal)}</span></div>
            {modo === 'entrega' ? <div className="linha-entre suave"><span>Frete {frete?.aCombinar ? '' : 'estimado'}</span><span>{frete?.aCombinar ? 'a combinar' : frete?.frete != null ? reais(frete.frete) : '—'}</span></div> : null}
            <div className="linha-entre total"><span>Total</span><span>{reais(total)}</span></div>
          </div>

          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <Botao carregando={enviando} className="btn-primario btn-grande btn-bloco" disabled={bloqueado} onClick={finalizar}>Enviar pedido para aprovação</Botao>
          <p className="centro pequeno suave">Você ainda não paga nada agora. A loja confere o pedido e você acompanha tudo por aqui.</p>
        </>
      )}
    </div>
  );
}
