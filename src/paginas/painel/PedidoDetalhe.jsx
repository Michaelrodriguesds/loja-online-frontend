// Detalhe do pedido: aprovar (com frete final), confirmar Pix, despachar, concluir ou recusar
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo, Carregando, Modal, Selo, useToast } from '../../componentes/ui';
import { FORMAS_ENTREGA, STATUS, dataHora, lerValor, linkWhatsapp, reais } from '../../utils';
import { usePainel } from './LayoutPainel';

export default function PedidoDetalhe() {
  const { id } = useParams();
  const { loja, recarregar, bloqueada } = usePainel();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState('');
  const [frete, setFrete] = useState('');
  const [entregaPor, setEntregaPor] = useState('proprio');
  const [prazo, setPrazo] = useState('');
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    api(`/painel/pedidos/${id}`).then((d) => {
      setP(d);
      setFrete(d.freteEstimado != null ? String(d.freteEstimado).replace('.', ',') : '');
      setPrazo(d.modo === 'entrega' ? loja.entrega.prazo : loja.entrega.prazoRetirada);
    }).catch((e) => setErro(e.message));
  }, [id, loja]);

  async function acao(rota, corpo, msg) {
    setErro('');
    setCarregando(rota);
    try {
      const novo = await api(`/painel/pedidos/${id}/${rota}`, { metodo: 'POST', corpo: corpo || {} });
      setP(novo);
      setRecusando(false);
      toast(msg);
      recarregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando('');
    }
  }

  function aprovar() {
    const corpo = { prazo };
    if (p.modo === 'entrega') {
      const v = lerValor(frete);
      if (!Number.isFinite(v) || v < 0) return setErro('Informe o valor do frete (ex.: 9,60).');
      corpo.freteFinal = v;
      corpo.entregaPor = entregaPor;
    }
    acao('aprovar', corpo, 'Pedido aprovado. O cliente foi avisado.');
  }

  if (erro && !p) return <Aviso tipo="erro">{erro}</Aviso>;
  if (!p) return <Carregando />;

  const freteDigitado = lerValor(frete);
  const freteMaior = p.modo === 'entrega' && Number.isFinite(freteDigitado) && (p.freteEstimado == null || freteDigitado > p.freteEstimado);
  const endereco = p.endereco ? `${p.endereco.rua}, ${p.endereco.numero}${p.endereco.complemento ? ` - ${p.endereco.complemento}` : ''} - ${p.endereco.bairro}, ${p.endereco.cidade}` : '';
  const abertos = ['aguardando_aprovacao', 'aguardando_cliente', 'aguardando_pagamento'];

  return (
    <div className="pilha">
      <Link to="/painel" className="pequeno">← Pedidos</Link>
      <div className="linha-entre"><h1>Pedido #{p.numero}</h1><Selo status={p.status} /></div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <section className="cartao pilha">
        {p.itens.map((i) => (
          <div key={`${i.varId}`} className="linha" style={{ flexWrap: 'nowrap' }}>
            {i.foto ? <img className="miniatura" src={i.foto} alt="" /> : <div className="miniatura" />}
            <div className="cresce"><strong>{i.qtd}× {i.nome}</strong><div className="pequeno suave">{[i.tamanho, i.cor].filter(Boolean).join(' · ')}</div></div>
            <span>{reais(i.preco * i.qtd)}</span>
          </div>
        ))}
        <div className="resumo-total">
          <div className="linha-entre suave"><span>Produtos</span><span>{reais(p.subtotal)}</span></div>
          {p.modo === 'entrega' ? <div className="linha-entre suave"><span>Frete {p.freteFinal == null ? '(estimado)' : ''}</span><span>{p.freteFinal != null ? reais(p.freteFinal) : p.freteEstimado != null ? reais(p.freteEstimado) : 'a combinar'}</span></div> : null}
          <div className="linha-entre total"><span>Total</span><span>{reais(p.total)}</span></div>
        </div>
        <span className="pequeno suave">Pagamento: {p.pagamento === 'pix' ? 'Pix pelo app' : `${FORMAS_ENTREGA[p.formaNaEntrega] || 'pessoalmente'} ${p.modo === 'entrega' ? 'na entrega' : 'na loja'}`}{p.pago ? ' · pago ✔' : ''}</span>
        {p.pagamento === 'na_entrega' && p.formaNaEntrega?.startsWith('cartao') && !p.pago ? <Aviso tipo="alerta">Leve a maquininha: {FORMAS_ENTREGA[p.formaNaEntrega].toLowerCase()} por aproximação.</Aviso> : null}
        {p.trocoPara ? <Aviso tipo="alerta">Cliente vai pagar com {reais(p.trocoPara)}{p.trocoPara > p.total ? ` — leve ${reais(p.trocoPara - p.total)} de troco` : ''}.</Aviso> : null}
      </section>

      <section className="cartao pilha">
        <strong>{p.comprador.nome} · {p.comprador.whatsapp}</strong>
        {p.modo === 'entrega' ? (
          <>
            <span className="suave">{endereco}{p.distanciaKm ? ` · ${String(p.distanciaKm).replace('.', ',')} km` : ''}</span>
            <span className="pequeno suave">CEP {p.endereco?.cep}</span>
          </>
        ) : <span className="suave">Vai retirar na loja</span>}
        <div className="grade-2">
          {p.modo === 'entrega' ? <a className="btn btn-contorno" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} target="_blank" rel="noreferrer">Abrir no mapa</a> : null}
          <a className="btn btn-contorno" href={linkWhatsapp(p.comprador.whatsapp, `Olá, ${p.comprador.nome}! Sobre o seu pedido #${p.numero} na ${loja.nome}:`)} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </section>

      {p.status === 'aguardando_aprovacao' && !bloqueada ? (
        <section className="cartao pilha" style={{ borderColor: 'var(--destaque)' }}>
          <h2>Antes de aprovar</h2>
          {p.modo === 'entrega' ? (
            <>
              <p className="suave pequeno">
                {p.freteEstimado != null ? `Frete mostrado ao cliente: ${reais(p.freteEstimado)}${p.distanciaKm ? ` (${String(p.distanciaKm).replace('.', ',')} km)` : ''}.` : 'Não foi possível calcular a distância: defina o frete.'}
              </p>
              <div className="pilha-p">
                <span className="pequeno suave">Quem vai entregar?</span>
                <div className="grade-2">
                  <button type="button" className="filtro" style={{ borderRadius: 12, minHeight: 46 }} aria-pressed={entregaPor === 'proprio'} onClick={() => setEntregaPor('proprio')}>Eu mesmo</button>
                  <button type="button" className="filtro" style={{ borderRadius: 12, minHeight: 46 }} aria-pressed={entregaPor === 'terceiro'} onClick={() => setEntregaPor('terceiro')}>Transporte terceiro</button>
                </div>
              </div>
              <Campo rotulo="Frete final (R$)"><input inputMode="decimal" value={frete} onChange={(e) => setFrete(e.target.value)} placeholder="0,00" /></Campo>
              {freteMaior ? <Aviso tipo="alerta">O frete ficou maior que o mostrado. O cliente vai precisar aceitar o novo valor antes de pagar.</Aviso> : null}
            </>
          ) : null}
          <Campo rotulo="Prazo para o cliente"><input value={prazo} onChange={(e) => setPrazo(e.target.value)} maxLength={80} /></Campo>
          <div className="grade-2">
            <button className="btn btn-contorno" onClick={() => setRecusando(true)}>Recusar</button>
            <Botao carregando={carregando === 'aprovar'} onClick={aprovar}>Aprovar</Botao>
          </div>
        </section>
      ) : null}

      {p.status === 'aguardando_cliente' ? <Aviso tipo="info">Esperando o cliente aceitar o frete de {reais(p.freteFinal)}. Ele foi avisado por e-mail; se quiser, chame no WhatsApp.</Aviso> : null}

      {p.status === 'aguardando_pagamento' ? (
        <section className="cartao pilha" style={{ borderColor: 'var(--destaque)' }}>
          <p className="suave">O cliente já tem o Pix copia e cola de <strong>{reais(p.total)}</strong>. Confira se o valor caiu na sua conta antes de confirmar.</p>
          <Botao carregando={carregando === 'confirmar-pagamento'} onClick={() => acao('confirmar-pagamento', null, 'Pagamento confirmado.')}>Confirmar Pix recebido</Botao>
        </section>
      ) : null}

      {p.status === 'em_preparo' ? (
        <Botao className="btn-primario btn-grande" carregando={carregando === 'despachar'} onClick={() => acao('despachar', null, 'Cliente avisado.')}>
          {p.modo === 'entrega' ? 'Marcar: saiu para entrega' : 'Marcar: pronto para retirada'}
        </Botao>
      ) : null}

      {['saiu_entrega', 'pronto_retirada'].includes(p.status) ? (
        <Botao className="btn-primario btn-grande" carregando={carregando === 'concluir'} onClick={() => acao('concluir', null, 'Pedido concluído.')}>
          {p.modo === 'entrega' ? 'Marcar como entregue' : 'Marcar como retirado'}
        </Botao>
      ) : null}

      {abertos.includes(p.status) && p.status !== 'aguardando_aprovacao' ? <button className="btn btn-texto" onClick={() => setRecusando(true)}>Recusar / cancelar pedido</button> : null}
      {p.motivo ? <Aviso tipo="erro">{p.motivo}</Aviso> : null}

      <section className="cartao pilha-p">
        <strong>Histórico</strong>
        {p.historico.map((h, i) => (
          <div key={i} className="linha-entre pequeno"><span>{STATUS[h.status]?.nome || h.status}{h.obs ? ` — ${h.obs}` : ''}</span><span className="suave">{dataHora(h.em)}</span></div>
        ))}
      </section>

      <Modal titulo="Recusar pedido" aberto={recusando} aoFechar={() => setRecusando(false)}>
        <p className="suave">O cliente vai ver o motivo e o estoque volta para a loja.</p>
        <Campo rotulo="Motivo">
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Escolha…</option>
            <option>Produto esgotado</option>
            <option>Fora da área de entrega</option>
            <option>Sem horário para entregar</option>
            <option>Pagamento não identificado</option>
            <option>Outro motivo — fale com a loja</option>
          </select>
        </Campo>
        <Botao className="btn-perigo btn-bloco" disabled={!motivo} carregando={carregando === 'recusar'} onClick={() => acao('recusar', { motivo }, 'Pedido recusado.')}>Confirmar recusa</Botao>
      </Modal>
    </div>
  );
}
