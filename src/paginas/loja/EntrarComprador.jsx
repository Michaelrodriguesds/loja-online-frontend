// Comprador: entrar, criar conta (com endereço) ou pedir link de nova senha
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Botao, Campo } from '../../componentes/ui';
import FormEndereco, { enderecoVazio } from './FormEndereco';
import { useLoja } from './LayoutLoja';

export default function EntrarComprador() {
  const { loja, slug, entrar, apiComprador } = useLoja();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [modo, setModo] = useState('entrar'); // entrar | criar | esqueci
  const [f, setF] = useState({ nome: '', email: '', whatsapp: '', senha: '', aceitouTermos: false });
  const [endereco, setEndereco] = useState(enderecoVazio);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [carregando, setCarregando] = useState(false);
  const mudar = (c) => (e) => setF({ ...f, [c]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const destino = params.get('voltar') === 'carrinho' ? `/loja/${slug}/carrinho` : `/loja/${slug}`;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setMsg('');
    setCarregando(true);
    try {
      if (modo === 'esqueci') {
        const r = await apiComprador('/conta/esqueci-senha', { metodo: 'POST', corpo: { email: f.email } });
        setMsg(r.mensagem);
      } else {
        const corpo = modo === 'entrar' ? { email: f.email, senha: f.senha } : { ...f, endereco: loja.entrega.ativa ? endereco : undefined };
        if (modo === 'criar' && !f.aceitouTermos) throw new Error('É preciso aceitar os termos.');
        const r = await apiComprador(modo === 'entrar' ? '/conta/login' : '/conta/cadastro', { metodo: 'POST', corpo });
        entrar(r);
        navegar(destino, { replace: true });
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form className="pilha" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }} onSubmit={enviar}>
      <h1>{modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Esqueci minha senha'}</h1>
      <p className="suave pequeno">{modo === 'criar' ? `Sua conta vale para comprar na ${loja.nome}.` : modo === 'esqueci' ? 'Vamos mandar um link para o seu e-mail.' : `Entre com sua conta da ${loja.nome}.`}</p>
      {params.get('senha') ? <Aviso tipo="ok">Senha alterada! Entre com a nova senha.</Aviso> : null}
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {msg ? <Aviso tipo="ok">{msg}</Aviso> : null}

      {modo === 'criar' ? (
        <>
          <Campo rotulo="Nome completo"><input required maxLength={80} autoComplete="name" value={f.nome} onChange={mudar('nome')} /></Campo>
          <Campo rotulo="WhatsApp"><input type="tel" required autoComplete="tel" value={f.whatsapp} onChange={mudar('whatsapp')} placeholder="(21) 9 0000-0000" /></Campo>
        </>
      ) : null}
      <Campo rotulo="E-mail"><input type="email" required autoComplete="email" value={f.email} onChange={mudar('email')} /></Campo>
      {modo !== 'esqueci' ? (
        <Campo rotulo="Senha" ajuda={modo === 'criar' ? 'Pelo menos 8 caracteres' : null}>
          <input type="password" required minLength={modo === 'criar' ? 8 : 1} autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} value={f.senha} onChange={mudar('senha')} />
        </Campo>
      ) : null}
      {modo === 'criar' && loja.entrega.ativa ? (
        <div className="cartao pilha"><strong>Endereço de entrega</strong><FormEndereco valor={endereco} aoMudar={setEndereco} /></div>
      ) : null}
      {modo === 'criar' ? (
        <label className="caixa-marcar">
          <input type="checkbox" checked={f.aceitouTermos} onChange={mudar('aceitouTermos')} />
          <span>Li e aceito os <Link to="/termos" target="_blank">termos</Link> e autorizo o uso dos meus dados para entrega dos pedidos. Compras online podem ser canceladas em até 7 dias.</span>
        </label>
      ) : null}

      <Botao carregando={carregando} className="btn-primario btn-grande btn-bloco">{modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Enviar link'}</Botao>
      {modo === 'entrar' ? (
        <>
          <button type="button" className="btn btn-texto" onClick={() => setModo('esqueci')}>Esqueci minha senha</button>
          <button type="button" className="btn btn-contorno" onClick={() => setModo('criar')}>Criar conta nova</button>
        </>
      ) : <button type="button" className="btn btn-contorno" onClick={() => setModo('entrar')}>Já tenho conta</button>}
    </form>
  );
}
