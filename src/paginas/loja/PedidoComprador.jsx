// Acompanhamento do pedido: etapas, Pix (QR + copia e cola), aceitar frete, cancelar
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { Aviso, Botao, BotaoCopiar, Carregando, useToast } from '../../componentes/ui';
import { linkWhatsapp, reais } from '../../utils';
import { useLoja } from './LayoutLoja';

function etapas(p) {
  const ent = p.modo === 'entrega';
  if (['recusado', 'cancelado'].includes(p.status)) return null;
  const lista = [['aguardando_aprovacao', 'Pedido enviado', 'A loja vai conferir disponibilidade, frete e horário. Você recebe um aviso quando aprovar.']];
  if (p.status === 'aguardando_cliente' || p.historico?.some((h) => h.status === 'aguardando_cliente')) lista.push(['aguardando_cliente', 'Aceitar o frete', 'A loja confirmou o valor do frete. Aceite para continuar.']);
  if (p.pagamento === 'pix') lista.push(['aguardando_pagamento', 'Aprovado — pague o Pix', 'Pague com o código abaixo. A loja confirma o recebimento.']);
  lista.push(['em_preparo', p.pagamento === 'pix' ? 'Pagamento confirmado — em preparo' : 'Aprovado — em preparo', 'Seu pedido está sendo separado.']);
  lista.push([ent ? 'saiu_entrega' : 'pronto_retirada', ent ? 'Saiu para entrega' : 'Pronto para retirada', ent ? 'O entregador está a caminho.' : 'Pode vir buscar na loja.']);
  lista.push(['concluido', ent ? 'Entregue' : 'Retirado', 'Obrigado pela compra!']);
  return lista;
}

export default function PedidoComprador() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { loja, slug, comprador, apiComprador } = useLoja();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [qr, setQr] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState('');

  const carregar = useCallback(() => apiComprador(`/pedidos/${id}`).then(setP).catch((e) => setErro(e.message)), [apiComprador, id]);
  useEffect(() => { if (comprador) carregar(); }, [comprador, carregar]);
  // Atualiza sozinho a cada 30s enquanto o pedido está em andamento
  useEffect(() => {
    if (!p || ['concluido', 'recusado', 'cancelado'].includes(p.status)) return undefined;
    const t = setInterval(() => { if (document.visibilityState === 'visible') carregar(); }, 30000);
    return () => clearInterval(t);
  }, [p, carregar]);
  useEffect(() => {
    if (p?.pixCopiaCola) QRCode.toDataURL(p.pixCopiaCola, { margin: 1, width: 400 }).then(setQr).catch(() => setQr(''));
    else setQr('');
  }, [p?.pixCopiaCola]);

  if (!comprador) return <Navigate to={`/loja/${slug}/entrar`} replace />;
  if (erro && !p) return <Aviso tipo="erro">{erro}</Aviso>;
  if (!p) return <Carregando />;

  async function acao(rota, msg) {
    setErro('');
    setCarregando(rota);
    try {
      setP(await apiComprador(`/pedidos/${id}/${rota}`, { metodo: 'POST', corpo: {} }));
      toast(msg);
    } catch (e) { setErro(e.message); } finally { setCarregando(''); }
  }

  const lista = etapas(p);
  const atual = lista ? lista.findIndex(([s]) => s === p.status) : -1;
  const podeCancelar = ['aguardando_aprovacao', 'aguardando_cliente', 'aguardando_pagamento'].includes(p.status);

  return (
    <div className="pilha" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <Link to={`/loja/${slug}/pedidos`} className="pequeno suave">← Meus pedidos</Link>
      {params.get('novo') ? <Aviso tipo="ok">Pedido enviado! A loja vai conferir e você acompanha tudo por aqui.</Aviso> : null}
      <div className="cartao linha-entre">
        <div className="pilha-p" style={{ gap: 0 }}>
          <strong>Pedido #{p.numero}</strong>
          <span className="pequeno suave">{p.itens.reduce((t, i) => t + i.qtd, 0)} itens · {p.modo === 'entrega' ? 'Entrega' : 'Retirada'} · {p.pagamento === 'pix' ? 'Pix' : 'Pagar na entrega/retirada'}</span>
        </div>
        <strong style={{ fontSize: 18 }}>{reais(p.total)}</strong>
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      {lista ? (
        <div className="passos-pedido">
          {lista.map(([s, titulo, texto], i) => (
            <div key={s} className={`passo${i < atual ? ' feito' : i === atual ? ' atual' : ''}`}>
              <div className="passo-trilho"><span className="passo-ponto" />{i < lista.length - 1 ? <span className="passo-linha" /> : null}</div>
              <div className="passo-texto pilha-p" style={{ gap: 2 }}>
                <strong>{titulo}</strong>
                {i === atual ? <span className="pequeno suave">{s === 'saiu_entrega' && p.prazo ? `Previsão: ${p.prazo}` : texto}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : <Aviso tipo="erro">{p.status === 'recusado' ? 'A loja não pôde aceitar o pedido.' : 'Pedido cancelado.'} {p.motivo}</Aviso>}

      {p.status === 'aguardando_cliente' ? (
        <div className="cartao pilha" style={{ borderColor: 'var(--marca)', borderWidth: 2 }}>
          <strong>A loja confirmou o frete: {reais(p.freteFinal)}</strong>
          <span className="suave pequeno">{p.freteEstimado != null ? `O valor estimado era ${reais(p.freteEstimado)}. ` : ''}Novo total: <strong>{reais(p.total)}</strong>{p.prazo ? ` · Prazo: ${p.prazo}` : ''}</span>
          <div className="grade-2">
            <Botao className="btn-contorno" carregando={carregando === 'cancelar'} onClick={() => window.confirm('Cancelar o pedido?') && acao('cancelar', 'Pedido cancelado.')}>Cancelar pedido</Botao>
            <Botao carregando={carregando === 'aceitar-frete'} onClick={() => acao('aceitar-frete', 'Frete aceito!')}>Aceitar frete</Botao>
          </div>
        </div>
      ) : null}

      {p.pixCopiaCola ? (
        <div className="cartao pilha" style={{ borderColor: 'var(--marca)', borderWidth: 2 }}>
          <strong>Pague com Pix: {reais(p.total)}</strong>
          {p.modo === 'entrega' ? <span className="pequeno suave">Frete confirmado pela loja: {reais(p.freteFinal)}{p.prazo ? ` · ${p.prazo}` : ''}</span> : null}
          {qr ? <img className="qr-pix" src={qr} alt="QR Code do Pix" /> : null}
          <div className="pix-codigo">{p.pixCopiaCola}</div>
          <BotaoCopiar texto={p.pixCopiaCola} rotulo="Copiar código Pix" className="btn-primario btn-grande" />
          <span className="pequeno suave">Depois de pagar, a loja confere na conta e confirma aqui. Se quiser, mande o comprovante no WhatsApp.</span>
        </div>
      ) : null}

      {p.status === 'em_preparo' && p.pagamento === 'na_entrega' ? <Aviso tipo="info">Pedido aprovado! Você paga {reais(p.total)} {p.modo === 'entrega' ? 'na entrega' : 'na retirada'}.</Aviso> : null}
      {p.modo === 'retirada' && p.retiradaEndereco && !['recusado', 'cancelado'].includes(p.status) ? <Aviso tipo="info">Retirada em: {p.retiradaEndereco}</Aviso> : null}

      <div className="cartao pilha-p">
        {p.itens.map((i) => (
          <div key={i.varId} className="linha-entre pequeno"><span>{i.qtd}× {i.nome}{[i.tamanho !== 'Único' ? i.tamanho : null, i.cor].filter(Boolean).length ? ` (${[i.tamanho !== 'Único' ? i.tamanho : null, i.cor].filter(Boolean).join(', ')})` : ''}</span><span>{reais(i.preco * i.qtd)}</span></div>
        ))}
        {p.modo === 'entrega' ? <div className="linha-entre pequeno suave"><span>Frete</span><span>{p.freteFinal != null ? reais(p.freteFinal) : p.freteEstimado != null ? `${reais(p.freteEstimado)} (estimado)` : 'a combinar'}</span></div> : null}
      </div>

      <a className="btn btn-contorno" href={linkWhatsapp(p.lojaWhatsapp || loja.whatsapp, `Olá! Sobre o meu pedido #${p.numero}:`)} target="_blank" rel="noreferrer">Falar com a loja no WhatsApp</a>
      {podeCancelar && p.status !== 'aguardando_cliente' ? <button className="btn btn-texto suave" onClick={() => window.confirm('Cancelar o pedido?') && acao('cancelar', 'Pedido cancelado.')}>Cancelar pedido</button> : null}
    </div>
  );
}
