// Detalhe de uma loja: renovar, vencer, bloquear, resetar senha, excluir
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo, Carregando, Modal, useToast } from '../../componentes/ui';
import { SEGMENTOS, data, linkWhatsapp } from '../../utils';
import { SITUACOES } from './Lojas';

export default function LojaDetalhe() {
  const { id } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const [l, setL] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState('');
  const [observacao, setObservacao] = useState('');
  const [modal, setModal] = useState('');
  const [texto, setTexto] = useState('');

  const carregar = useCallback(() => api(`/admin/lojas/${id}`).then(setL).catch((e) => setErro(e.message)), [id]);
  useEffect(() => { carregar(); }, [carregar]);

  async function acao(rota, corpo, msg) {
    setErro('');
    setCarregando(rota);
    try {
      await api(`/admin/lojas/${id}/${rota}`, { metodo: 'POST', corpo: corpo || {} });
      toast(msg);
      setModal(''); setTexto('');
      if (rota === 'excluir') return navegar('/admin');
      carregar();
    } catch (e) { setErro(e.message); } finally { setCarregando(''); }
  }

  if (erro && !l) return <Aviso tipo="erro">{erro}</Aviso>;
  if (!l) return <Carregando />;
  const [nomeSit, cor] = SITUACOES[l.situacao];

  return (
    <div className="pilha" style={{ maxWidth: 680 }}>
      <Link to="/admin" className="pequeno">← Lojas</Link>
      <div className="linha-entre"><h1>{l.nome}</h1><span className={`selo selo-${cor}`}>{nomeSit}</span></div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <section className="cartao pilha-p">
        <a href={l.link} target="_blank" rel="noreferrer" className="pequeno">{l.link}</a>
        <span>Dono: <strong>{l.dono?.nome}</strong> · {l.dono?.email}</span>
        <span className="suave">WhatsApp: {l.whatsapp} · {SEGMENTOS[l.segmento]} · desde {data(l.createdAt)}</span>
        <span className="suave">{l.produtos} produtos · {l.pedidosMes} pedidos nos últimos 30 dias{!l.aberta ? ' · loja pausada pelo lojista' : ''}</span>
        <a className="btn btn-contorno" style={{ marginTop: 8 }} href={linkWhatsapp(l.whatsapp)} target="_blank" rel="noreferrer">Chamar no WhatsApp</a>
      </section>

      <section className="cartao pilha">
        <h2>Plano</h2>
        <p>{l.licenca.plano === 'teste' ? 'Teste grátis' : 'Pago'} · {l.licenca.ativa ? `vence em ${data(l.licenca.acessoAte)} (${l.licenca.diasRestantes} dias)` : `venceu em ${data(l.licenca.acessoAte)}`}</p>
        {l.observacao ? <p className="pequeno suave">Obs.: {l.observacao}</p> : null}
        <Campo rotulo="Observação da renovação (opcional)"><input value={observacao} maxLength={200} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: Pix recebido 19/11" /></Campo>
        <div className="grade-3">
          {[30, 90, 365].map((d) => (
            <Botao key={d} className="btn-sucesso" carregando={carregando === 'renovar'} onClick={() => acao('renovar', { dias: d, observacao: observacao || undefined }, `Renovado: +${d} dias`)}>+{d} dias</Botao>
          ))}
        </div>
        {l.licenca.ativa ? <button className="btn btn-texto" onClick={() => window.confirm('Fazer o plano vencer agora? A loja sai do ar na hora.') && acao('vencer', null, 'Plano vencido.')}>Vencer plano agora</button> : null}
      </section>

      <section className="cartao pilha">
        <h2>Moderação</h2>
        {l.moderacao?.bloqueada ? (
          <>
            <Aviso tipo="erro">Bloqueada: {l.moderacao.motivo}</Aviso>
            <Botao className="btn-sucesso" carregando={carregando === 'moderar'} onClick={() => acao('moderar', { bloquear: false }, 'Loja desbloqueada.')}>Desbloquear loja</Botao>
          </>
        ) : <button className="btn btn-perigo" onClick={() => setModal('bloquear')}>Bloquear loja</button>}
        <Link className="btn btn-contorno" to={`/admin/moderacao?loja=${l._id}`}>Ver produtos desta loja</Link>
      </section>

      <section className="cartao pilha">
        <h2>Acesso e exclusão</h2>
        <button className="btn btn-contorno" onClick={() => setModal('senha')}>Definir nova senha do lojista</button>
        <button className="btn btn-perigo" onClick={() => setModal('excluir')}>Excluir loja e todos os dados</button>
      </section>

      <Modal titulo="Bloquear loja" aberto={modal === 'bloquear'} aoFechar={() => setModal('')}>
        <p className="suave">A loja sai do ar e o lojista vê o motivo. Os dados ficam guardados.</p>
        <Campo rotulo="Motivo"><input value={texto} maxLength={200} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: venda de produto proibido" /></Campo>
        <Botao className="btn-perigo btn-bloco" disabled={texto.trim().length < 3} carregando={carregando === 'moderar'} onClick={() => acao('moderar', { bloquear: true, motivo: texto }, 'Loja bloqueada.')}>Bloquear</Botao>
      </Modal>
      <Modal titulo="Nova senha do lojista" aberto={modal === 'senha'} aoFechar={() => setModal('')}>
        <Campo rotulo="Nova senha" ajuda="Passe para o lojista e peça para trocar depois"><input value={texto} minLength={8} onChange={(e) => setTexto(e.target.value)} /></Campo>
        <Botao className="btn-primario btn-bloco" disabled={texto.length < 8} carregando={carregando === 'resetar-senha'} onClick={() => acao('resetar-senha', { novaSenha: texto }, 'Senha definida.')}>Salvar senha</Botao>
      </Modal>
      <Modal titulo="Excluir loja" aberto={modal === 'excluir'} aoFechar={() => setModal('')}>
        <Aviso tipo="erro">Apaga a loja, produtos, fotos, pedidos, clientes e o login do lojista. Não tem volta.</Aviso>
        <Campo rotulo={`Digite o nome da loja: ${l.nome}`}><input value={texto} onChange={(e) => setTexto(e.target.value)} /></Campo>
        <Botao className="btn-perigo btn-bloco" disabled={texto.trim().toLowerCase() !== l.nome.toLowerCase()} carregando={carregando === 'excluir'} onClick={() => acao('excluir', { confirmacao: texto }, 'Loja excluída.')}>Excluir definitivamente</Botao>
      </Modal>
    </div>
  );
}
