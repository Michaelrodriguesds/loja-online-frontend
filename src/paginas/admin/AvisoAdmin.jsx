// Aviso geral para os lojistas (ou todos) e modo manutenção
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Aviso, Botao, Campo, Carregando, Chave, useToast } from '../../componentes/ui';

const paraInput = (d) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const paraISO = (v) => (v ? new Date(v).toISOString() : null);

export default function AvisoAdmin() {
  const toast = useToast();
  const [a, setA] = useState(null);
  const [situacao, setSituacao] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api('/admin/aviso').then((d) => {
      setA({ ativo: false, tipo: 'informativo', mensagem: '', bloquear: false, mostrarPara: 'lojistas', ...d.aviso, inicio: paraInput(d.aviso.inicio), fim: paraInput(d.aviso.fim) });
      setSituacao(d.situacao);
    }).catch((e) => setErro(e.message));
  }, []);

  if (!a) return erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />;

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const d = await api('/admin/aviso', { metodo: 'PUT', corpo: { ativo: a.ativo, tipo: a.tipo, mensagem: a.mensagem, bloquear: a.bloquear, mostrarPara: a.mostrarPara, inicio: paraISO(a.inicio), fim: paraISO(a.fim) } });
      setSituacao(d.situacao);
      toast('Aviso salvo.');
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  }

  return (
    <form className="pilha" style={{ maxWidth: 640 }} onSubmit={salvar}>
      <h1>Avisos</h1>
      <p className="suave">Mensagem que aparece no topo do painel dos lojistas (ou para todos). Use para novidades, atualizações e manutenção.</p>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {situacao ? <Aviso tipo={situacao.bloqueando ? 'erro' : 'ok'}>{situacao.bloqueando ? 'Manutenção ATIVA: o sistema está travado para lojistas e clientes.' : situacao.situacao === 'programado' ? 'Aviso programado.' : 'Aviso no ar.'}</Aviso> : null}
      <section className="cartao pilha">
        <Chave ligado={a.ativo} aoMudar={(v) => setA({ ...a, ativo: v })} rotulo="Aviso ligado" />
        <Campo rotulo="Tipo">
          <select value={a.tipo} onChange={(e) => setA({ ...a, tipo: e.target.value })}>
            <option value="informativo">Informativo (novidade, atualização)</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </Campo>
        <Campo rotulo="Mensagem"><textarea maxLength={500} value={a.mensagem} onChange={(e) => setA({ ...a, mensagem: e.target.value })} placeholder="Ex.: Nova versão: agora você pode pausar produtos!" /></Campo>
        <Campo rotulo="Mostrar para">
          <select value={a.mostrarPara} onChange={(e) => setA({ ...a, mostrarPara: e.target.value })}>
            <option value="lojistas">Só lojistas (painel)</option>
            <option value="todos">Todos (lojas e clientes também)</option>
          </select>
        </Campo>
        <div className="grade-2 quebra">
          <Campo rotulo="Início (opcional)"><input type="datetime-local" value={a.inicio} onChange={(e) => setA({ ...a, inicio: e.target.value })} /></Campo>
          <Campo rotulo="Fim (opcional)" ajuda="Depois disso some sozinho"><input type="datetime-local" value={a.fim} onChange={(e) => setA({ ...a, fim: e.target.value })} /></Campo>
        </div>
        {a.tipo === 'manutencao' ? <Chave ligado={a.bloquear} aoMudar={(v) => setA({ ...a, bloquear: v })} rotulo="Travar o sistema durante a manutenção" descricao="Lojas e painéis ficam fora do ar. Você continua entrando no /admin." /> : null}
      </section>
      <Botao carregando={salvando} className="btn-primario btn-grande">Salvar aviso</Botao>
    </form>
  );
}
