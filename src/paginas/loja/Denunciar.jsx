// Visitante denuncia a loja ou um produto (vai para o seu /admin)
import { useState } from 'react';
import { Aviso, Botao, Campo, Modal } from '../../componentes/ui';
import { useLoja } from './LayoutLoja';

export default function Denunciar({ dados, aoFechar }) {
  const { apiComprador } = useLoja();
  const [motivo, setMotivo] = useState('proibido');
  const [texto, setTexto] = useState('');
  const [contato, setContato] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function fechar() { setMsg(''); setErro(''); setTexto(''); aoFechar(); }

  async function enviar() {
    setEnviando(true);
    setErro('');
    try {
      const r = await apiComprador('/denuncias', { metodo: 'POST', corpo: { motivo, texto, contato, produtoId: dados?.produtoId || null } });
      setMsg(r.mensagem);
    } catch (e) { setErro(e.message); } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={dados?.produtoNome ? `Denunciar “${dados.produtoNome}”` : 'Denunciar esta loja'} aberto={!!dados} aoFechar={fechar}>
      {msg ? <Aviso tipo="ok">{msg}</Aviso> : (
        <>
          <p className="suave pequeno">A denúncia vai para a equipe da plataforma, não para a loja.</p>
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          <Campo rotulo="Motivo">
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="proibido">Produto proibido</option>
              <option value="falsificado">Produto falsificado</option>
              <option value="golpe">Golpe / não entregou</option>
              <option value="ofensivo">Conteúdo ofensivo</option>
              <option value="outro">Outro</option>
            </select>
          </Campo>
          <Campo rotulo="Detalhes (opcional)"><textarea maxLength={500} value={texto} onChange={(e) => setTexto(e.target.value)} /></Campo>
          <Campo rotulo="Seu contato (opcional)"><input maxLength={100} value={contato} onChange={(e) => setContato(e.target.value)} /></Campo>
          <Botao carregando={enviando} className="btn-primario btn-bloco" onClick={enviar}>Enviar denúncia</Botao>
        </>
      )}
    </Modal>
  );
}
