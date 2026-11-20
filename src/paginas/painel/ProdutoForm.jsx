// Cadastrar / editar produto: fotos (câmera ou galeria), preço, variações com estoque
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo, Carregando, Chave, Girando, useToast } from '../../componentes/ui';
import { comprimirImagem, enviarFoto, lerValor } from '../../utils';

const novaVariacao = () => ({ tamanho: '', cor: '', estoque: '1' });
const produtoVazio = () => ({ nome: '', descricao: '', categoria: '', preco: '', fotos: [], soNoLocal: false, ativo: true, variacoes: [{ tamanho: 'Único', cor: '', estoque: '1' }] });

// Rascunho guardado no aparelho: se o celular fechar o navegador ao abrir a
// câmera (pouca memória), o formulário volta preenchido ao reabrir.
const chaveRascunho = (id) => `rascunho-produto:${id || 'novo'}`;
function lerRascunho(id) {
  try { return JSON.parse(sessionStorage.getItem(chaveRascunho(id))) || null; } catch { return null; }
}

export default function ProdutoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();
  const toast = useToast();
  const [p, setP] = useState(() => lerRascunho(id) || (editando ? null : produtoVazio()));
  const [recuperado] = useState(() => Boolean(lerRascunho(id)));
  const [status, setStatus] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [erro, setErro] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api('/painel/produtos').then((l) => setCategorias([...new Set(l.map((x) => x.categoria).filter(Boolean))])).catch(() => {});
    if (!editando) return;
    api(`/painel/produtos/${id}`).then((d) => {
      if (!lerRascunho(id)) setP({ ...d, preco: String(d.preco).replace('.', ','), variacoes: d.variacoes.map((v) => ({ ...v, estoque: String(v.estoque) })) });
      setStatus({ status: d.status, motivo: d.motivoModeracao });
    }).catch((e) => setErro(e.message));
  }, [id, editando]);

  useEffect(() => {
    if (p) { try { sessionStorage.setItem(chaveRascunho(id), JSON.stringify(p)); } catch { /* sem espaço: ignora */ } }
  }, [p, id]);
  const limparRascunho = () => sessionStorage.removeItem(chaveRascunho(id));

  if (erro && !p) return <Aviso tipo="erro">{erro}</Aviso>;
  if (!p) return <Carregando />;

  const mudar = (campo) => (e) => setP({ ...p, [campo]: e.target.value });
  const mudarVar = (i, campo, valor) => setP({ ...p, variacoes: p.variacoes.map((v, j) => (j === i ? { ...v, [campo]: valor } : v)) });

  async function adicionarFotos(e) {
    const arquivos = [...e.target.files].slice(0, 5 - p.fotos.length);
    e.target.value = '';
    if (!arquivos.length) return;
    setEnviandoFoto(true);
    setErro('');
    try {
      const novas = [];
      for (const arq of arquivos) {
        const dados = await comprimirImagem(arq);
        const r = await enviarFoto(api, dados);
        novas.push(r.url);
      }
      setP((atual) => ({ ...atual, fotos: [...atual.fotos, ...novas] }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const preco = lerValor(p.preco);
    if (!Number.isFinite(preco) || preco < 0) return setErro('Informe o preço (ex.: 79,90).');
    const variacoes = p.soNoLocal ? [] : p.variacoes.map((v) => ({ ...(v._id ? { _id: v._id } : {}), tamanho: v.tamanho.trim() || 'Único', cor: v.cor.trim(), estoque: Math.max(0, parseInt(v.estoque, 10) || 0) }));
    if (!p.soNoLocal && !variacoes.length) return setErro('Adicione pelo menos uma opção (tamanho/cor) com estoque.');
    setSalvando(true);
    try {
      const corpo = { nome: p.nome, descricao: p.descricao, categoria: p.categoria.trim() || 'Outros', preco, fotos: p.fotos, soNoLocal: p.soNoLocal, ativo: p.ativo, variacoes };
      const r = await api(editando ? `/painel/produtos/${id}` : '/painel/produtos', { metodo: editando ? 'PUT' : 'POST', corpo });
      limparRascunho();
      toast(r.status === 'analise' ? 'Salvo. O produto vai aparecer depois da análise do suporte.' : 'Produto salvo!');
      navegar('/painel/produtos');
    } catch (err) {
      setErro(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir "${p.nome}"? Não dá para desfazer.`)) return;
    try {
      await api(`/painel/produtos/${id}`, { metodo: 'DELETE' });
      limparRascunho();
      toast('Produto excluído.');
      navegar('/painel/produtos');
    } catch (err) { setErro(err.message); }
  }

  return (
    <form className="pilha" onSubmit={salvar} style={{ maxWidth: 640 }}>
      <button type="button" className="btn btn-texto" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => { limparRascunho(); navegar('/painel/produtos'); }}>← Produtos</button>
      <h1>{editando ? 'Editar produto' : 'Novo produto'}</h1>
      {status?.status === 'analise' ? <Aviso tipo="alerta">Em análise pelo suporte{status.motivo ? ` (${status.motivo})` : ''}. Ainda não aparece na loja.</Aviso> : null}
      {status?.status === 'oculto' ? <Aviso tipo="erro">Ocultado pelo suporte: {status.motivo}. Fale com o suporte para liberar.</Aviso> : null}
      {recuperado ? <Aviso tipo="info">Recuperamos o que você estava preenchendo.</Aviso> : null}
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <section className="cartao pilha">
        <span className="pequeno suave">Fotos (até 5) — a primeira é a capa. Se o celular travar na câmera, use “Galeria”.</span>
        <div className="fotos-produto">
          {p.fotos.map((f, i) => (
            <div key={f} className="foto-produto">
              <img src={f} alt={`Foto ${i + 1}`} />
              <button type="button" aria-label="Remover foto" onClick={() => setP({ ...p, fotos: p.fotos.filter((x) => x !== f) })}>×</button>
            </div>
          ))}
          {p.fotos.length < 5 ? (
            <>
              <label className="foto-adicionar" style={{ position: 'relative' }}>
                {enviandoFoto ? <Girando /> : <span>📷<br />Tirar foto</span>}
                <input type="file" accept="image/*" capture="environment" onChange={adicionarFotos} disabled={enviandoFoto} />
              </label>
              <label className="foto-adicionar" style={{ position: 'relative' }}>
                {enviandoFoto ? <Girando /> : <span>🖼️<br />Galeria / PC</span>}
                <input type="file" accept="image/*" multiple onChange={adicionarFotos} disabled={enviandoFoto} />
              </label>
            </>
          ) : null}
        </div>
      </section>

      <section className="cartao pilha">
        <Campo rotulo="Nome"><input required maxLength={100} value={p.nome} onChange={mudar('nome')} placeholder="Ex.: Camiseta Oversized" /></Campo>
        <div className="grade-2">
          <Campo rotulo="Categoria">
            <input list="categorias" maxLength={40} value={p.categoria} onChange={mudar('categoria')} placeholder="Ex.: Roupas" />
            <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
          </Campo>
          <Campo rotulo="Preço (R$)"><input required inputMode="decimal" value={p.preco} onChange={mudar('preco')} placeholder="0,00" /></Campo>
        </div>
        <Campo rotulo="Descrição"><textarea maxLength={1000} value={p.descricao} onChange={mudar('descricao')} placeholder="Material, medidas, detalhes" /></Campo>
        <Chave ligado={p.soNoLocal} aoMudar={(v) => setP({ ...p, soNoLocal: v })} rotulo="Vender só no local" descricao="Aparece na vitrine, mas sem botão de compra (ex.: bebida)" />
        <Chave ligado={p.ativo} aoMudar={(v) => setP({ ...p, ativo: v })} rotulo="Mostrar na loja" descricao="Desligue para esconder sem excluir" />
      </section>

      {!p.soNoLocal ? (
        <section className="cartao pilha">
          <div className="pilha-p">
            <strong>Opções e estoque</strong>
            <span className="pequeno suave">Uma linha para cada combinação. Sem tamanho? Deixe “Único”.</span>
          </div>
          <div className="tabela-variacoes">
            {p.variacoes.map((v, i) => (
              <div key={v._id || i} className="linha-variacao">
                <Campo rotulo={i === 0 ? 'Tamanho' : ''}><input value={v.tamanho} maxLength={20} onChange={(e) => mudarVar(i, 'tamanho', e.target.value)} placeholder="M" aria-label="Tamanho" /></Campo>
                <Campo rotulo={i === 0 ? 'Cor' : ''}><input value={v.cor} maxLength={30} onChange={(e) => mudarVar(i, 'cor', e.target.value)} placeholder="Preto" aria-label="Cor" /></Campo>
                <Campo rotulo={i === 0 ? 'Estoque' : ''}><input inputMode="numeric" value={v.estoque} onChange={(e) => mudarVar(i, 'estoque', e.target.value.replace(/\D/g, ''))} aria-label="Estoque" /></Campo>
                <button type="button" className="btn btn-contorno" style={{ padding: 0, minHeight: 42 }} aria-label="Remover opção" onClick={() => setP({ ...p, variacoes: p.variacoes.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-contorno" onClick={() => setP({ ...p, variacoes: [...p.variacoes, novaVariacao()] })}>+ Adicionar opção</button>
        </section>
      ) : null}

      <Botao carregando={salvando} className="btn-primario btn-grande">Salvar produto</Botao>
      {editando ? <button type="button" className="btn btn-texto" style={{ color: 'var(--vermelho-texto)' }} onClick={excluir}>Excluir produto</button> : null}
    </form>
  );
}
