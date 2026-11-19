// Cadastro do lojista: cria a conta e a loja, já com 30 dias grátis
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, sessao } from '../../api';
import { Aviso, Botao, Campo } from '../../componentes/ui';
import EscolherTema from '../../componentes/EscolherTema';
import { SEGMENTOS, TEMAS, TEMA_DO_SEGMENTO } from '../../utils';

export default function CriarLoja() {
  const navegar = useNavigate();
  const [segmentos, setSegmentos] = useState(Object.keys(SEGMENTOS).map((id) => ({ id, disponivel: id !== 'alimentos' })));
  const [f, setF] = useState({ nome: '', email: '', senha: '', whatsapp: '', nomeLoja: '', cidade: 'São Gonçalo', segmento: '', tema: 'clean', corPrimaria: TEMAS.clean.cor, aceitouTermos: false });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const mudar = (campo) => (e) => setF({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => { api('/publico/segmentos', { token: 'nenhum' }).then(setSegmentos).catch(() => {}); }, []);

  function escolherSegmento(id) {
    const tema = TEMA_DO_SEGMENTO[id] || 'clean';
    setF({ ...f, segmento: id, tema, corPrimaria: TEMAS[tema].cor });
  }

  async function criar(e) {
    e.preventDefault();
    setErro('');
    if (!f.segmento) return setErro('Escolha o tipo do seu negócio.');
    if (!f.aceitouTermos) return setErro('É preciso aceitar os Termos de Uso.');
    setCarregando(true);
    try {
      const r = await api('/auth/cadastro', { metodo: 'POST', corpo: f, token: 'nenhum' });
      sessao.salvar(r);
      navegar('/painel?nova=1', { replace: true });
    } catch (err) {
      setErro(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="conteudo conteudo-estreito" style={{ paddingTop: 28 }}>
      <form className="pilha" onSubmit={criar}>
        <Link to="/" className="pequeno">← Voltar</Link>
        <div className="pilha-p">
          <h1>Criar minha loja</h1>
          <p className="suave">30 dias grátis. Depois você combina o plano com o suporte.</p>
        </div>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

        <section className="cartao pilha">
          <h2>1. Sua loja</h2>
          <Campo rotulo="Nome da loja" ajuda="Aparece no topo da loja e no link"><input required maxLength={80} value={f.nomeLoja} onChange={mudar('nomeLoja')} placeholder="Ex.: Barbearia do Zé" /></Campo>
          <Campo rotulo="Cidade da loja"><input required maxLength={60} value={f.cidade} onChange={mudar('cidade')} /></Campo>
          <Campo rotulo="WhatsApp da loja" ajuda="Os clientes falam com você por aqui"><input type="tel" required value={f.whatsapp} onChange={mudar('whatsapp')} placeholder="(21) 9 0000-0000" /></Campo>
        </section>

        <section className="cartao pilha">
          <h2>2. Tipo do negócio</h2>
          <div className="grade-2">
            {segmentos.map((s) => (
              <button type="button" key={s.id} className="filtro" style={{ borderRadius: 12, minHeight: 48 }} disabled={!s.disponivel} aria-pressed={f.segmento === s.id} onClick={() => escolherSegmento(s.id)}>
                {SEGMENTOS[s.id]}{!s.disponivel ? ' (em breve)' : ''}
              </button>
            ))}
          </div>
        </section>

        <section className="cartao pilha">
          <h2>3. Estilo da loja</h2>
          <p className="suave pequeno">Dá para mudar depois, a qualquer momento.</p>
          <EscolherTema tema={f.tema} cor={f.corPrimaria} aoMudar={(v) => setF({ ...f, ...v })} />
        </section>

        <section className="cartao pilha">
          <h2>4. Seu acesso</h2>
          <Campo rotulo="Seu nome"><input required autoComplete="name" value={f.nome} onChange={mudar('nome')} /></Campo>
          <Campo rotulo="E-mail"><input type="email" required autoComplete="email" value={f.email} onChange={mudar('email')} /></Campo>
          <Campo rotulo="Senha" ajuda="Pelo menos 8 caracteres"><input type="password" required minLength={8} autoComplete="new-password" value={f.senha} onChange={mudar('senha')} /></Campo>
          <label className="caixa-marcar">
            <input type="checkbox" checked={f.aceitouTermos} onChange={mudar('aceitouTermos')} />
            <span>Li e aceito os <Link to="/termos" target="_blank">Termos de Uso</Link>, incluindo a lista de produtos proibidos.</span>
          </label>
        </section>

        <Botao carregando={carregando} className="btn-primario btn-bloco btn-grande">Criar minha loja</Botao>
        <p className="centro suave pequeno">Já tem loja? <Link to="/entrar">Entrar</Link></p>
      </form>
    </div>
  );
}
