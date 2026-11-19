// Moderação: produtos em análise/ocultos, denúncias e regras automáticas
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo, Carregando, Chave, Vazio, useToast } from '../../componentes/ui';
import { SEGMENTOS, dataHora, reais } from '../../utils';

const MOTIVOS = { proibido: 'Produto proibido', golpe: 'Golpe', falsificado: 'Falsificado', ofensivo: 'Ofensivo', outro: 'Outro' };

function Produtos() {
  const [params] = useSearchParams();
  const lojaId = params.get('loja');
  const [status, setStatus] = useState(lojaId ? '' : 'analise');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const toast = useToast();

  const carregar = useCallback(() => {
    setDados(null);
    const q = new URLSearchParams({ ...(status ? { status } : {}), ...(lojaId ? { lojaId } : {}) });
    api(`/admin/produtos?${q}`).then(setDados).catch((e) => setErro(e.message));
  }, [status, lojaId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function moderar(id, novo) {
    let motivo = '';
    if (novo === 'oculto') {
      motivo = window.prompt('Motivo (o lojista vai ver):', 'Produto proibido pelos Termos de Uso');
      if (motivo === null) return;
    }
    try {
      await api(`/admin/produtos/${id}/moderar`, { metodo: 'POST', corpo: { status: novo, motivo } });
      toast(novo === 'oculto' ? 'Produto ocultado.' : 'Produto liberado.');
      carregar();
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="pilha">
      {lojaId ? <Aviso tipo="info">Mostrando só uma loja. <Link to="/admin/moderacao">Ver todas</Link></Aviso> : null}
      <div className="filtros" role="group" aria-label="Filtrar produtos">
        {[['analise', 'Em análise'], ['oculto', 'Ocultos'], ['publicado', 'Publicados'], ['', 'Todos (recentes)']].map(([id, nome]) => (
          <button key={id} className="filtro" aria-pressed={status === id} onClick={() => setStatus(id)}>{nome}</button>
        ))}
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!dados ? <Carregando /> : dados.itens.length === 0 ? <Vazio titulo="Nada por aqui" /> : (
        <div className="lista">
          {dados.itens.map((p) => (
            <div key={p._id} className="item-lista" style={{ alignItems: 'flex-start' }}>
              {p.fotos[0] ? <img className="miniatura" src={p.fotos[0]} alt="" /> : <div className="miniatura miniatura-vazia">sem foto</div>}
              <div className="cresce pilha-p" style={{ gap: 4 }}>
                <strong>{p.nome} · {reais(p.preco)}</strong>
                <span className="pequeno suave">{p.lojaId?.nome} · {p.categoria} · {dataHora(p.updatedAt)}</span>
                {p.descricao ? <span className="pequeno">{p.descricao.slice(0, 160)}</span> : null}
                {p.motivoModeracao ? <span className="pequeno" style={{ color: 'var(--ambar-texto)' }}>{p.motivoModeracao}</span> : null}
                <div className="linha" style={{ gap: 6 }}>
                  {p.status !== 'publicado' ? <button className="btn btn-sucesso btn-pequeno" onClick={() => moderar(p._id, 'publicado')}>Liberar</button> : null}
                  {p.status !== 'oculto' ? <button className="btn btn-perigo btn-pequeno" onClick={() => moderar(p._id, 'oculto')}>Ocultar</button> : null}
                  {p.lojaId ? <Link className="btn btn-contorno btn-pequeno" to={`/admin/lojas/${p.lojaId._id}`}>Loja</Link> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Denuncias() {
  const [lista, setLista] = useState(null);
  const [status, setStatus] = useState('nova');
  const [erro, setErro] = useState('');
  const carregar = useCallback(() => { setLista(null); api(`/admin/denuncias?status=${status}`).then(setLista).catch((e) => setErro(e.message)); }, [status]);
  useEffect(() => { carregar(); }, [carregar]);
  async function marcar(id, novo) {
    try { await api(`/admin/denuncias/${id}`, { metodo: 'PATCH', corpo: { status: novo } }); carregar(); } catch (e) { setErro(e.message); }
  }
  return (
    <div className="pilha">
      <div className="filtros">
        {[['nova', 'Novas'], ['resolvida', 'Resolvidas'], ['descartada', 'Descartadas']].map(([id, nome]) => <button key={id} className="filtro" aria-pressed={status === id} onClick={() => setStatus(id)}>{nome}</button>)}
      </div>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {!lista ? <Carregando /> : lista.length === 0 ? <Vazio titulo="Nenhuma denúncia" /> : (
        <div className="lista">
          {lista.map((d) => (
            <div key={d._id} className="cartao pilha-p">
              <div className="linha-entre"><strong>{MOTIVOS[d.motivo]}</strong><span className="pequeno suave">{dataHora(d.createdAt)}</span></div>
              <span className="pequeno">Loja: {d.lojaId ? <Link to={`/admin/lojas/${d.lojaId._id}`}>{d.lojaId.nome}</Link> : '(excluída)'}{d.produtoId ? ` · Produto: ${d.produtoId.nome}` : ''}</span>
              {d.texto ? <p className="pequeno">“{d.texto}”</p> : null}
              {d.contato ? <span className="pequeno suave">Contato: {d.contato}</span> : null}
              {d.status === 'nova' ? (
                <div className="linha" style={{ marginTop: 6 }}>
                  <button className="btn btn-sucesso btn-pequeno" onClick={() => marcar(d._id, 'resolvida')}>Resolvida</button>
                  <button className="btn btn-contorno btn-pequeno" onClick={() => marcar(d._id, 'descartada')}>Descartar</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Regras() {
  const toast = useToast();
  const [r, setR] = useState(null);
  const [palavras, setPalavras] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { api('/admin/moderacao').then((d) => { setR(d); setPalavras(d.palavras.join('\n')); }).catch((e) => setErro(e.message)); }, []);
  if (!r) return erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />;

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      const lista = [...new Set(palavras.split(/[\n,]/).map((p) => p.trim()).filter((p) => p.length >= 2))];
      const d = await api('/admin/moderacao', { metodo: 'PUT', corpo: { palavras: lista, aprovacaoManual: r.aprovacaoManual, segmentosBloqueados: r.segmentosBloqueados } });
      setR({ ...r, ...d });
      setPalavras(d.palavras.join('\n'));
      toast('Regras salvas.');
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  }

  return (
    <div className="pilha" style={{ maxWidth: 640 }}>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      <section className="cartao pilha">
        <Chave ligado={r.aprovacaoManual} aoMudar={(v) => setR({ ...r, aprovacaoManual: v })} rotulo="Aprovar todo produto novo manualmente" descricao="Mais seguro, mas dá mais trabalho. Desligado: só os suspeitos vão para análise." />
      </section>
      <section className="cartao pilha">
        <Campo rotulo="Palavras suspeitas (uma por linha)" ajuda="Produto com alguma delas no nome, descrição ou categoria vai para análise">
          <textarea rows={10} value={palavras} onChange={(e) => setPalavras(e.target.value)} />
        </Campo>
      </section>
      <section className="cartao pilha">
        <strong>Segmentos liberados para novas lojas</strong>
        {Object.entries(SEGMENTOS).map(([id, nome]) => (
          <Chave key={id} ligado={!r.segmentosBloqueados.includes(id)} rotulo={nome}
            aoMudar={(liberado) => setR({ ...r, segmentosBloqueados: liberado ? r.segmentosBloqueados.filter((s) => s !== id) : [...r.segmentosBloqueados, id] })} />
        ))}
      </section>
      <Botao carregando={salvando} className="btn-primario btn-grande" onClick={salvar}>Salvar regras</Botao>
    </div>
  );
}

export default function Moderacao() {
  const [aba, setAba] = useState('produtos');
  return (
    <div className="pilha">
      <h1>Moderação</h1>
      <div className="filtros" role="tablist">
        {[['produtos', 'Produtos'], ['denuncias', 'Denúncias'], ['regras', 'Regras']].map(([id, nome]) => (
          <button key={id} role="tab" className="filtro" aria-pressed={aba === id} aria-selected={aba === id} onClick={() => setAba(id)}>{nome}</button>
        ))}
      </div>
      {aba === 'produtos' ? <Produtos /> : aba === 'denuncias' ? <Denuncias /> : <Regras />}
    </div>
  );
}
