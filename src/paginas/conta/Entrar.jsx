// Login do lojista e do admin
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, sessao } from '../../api';
import { Aviso, Botao, Campo } from '../../componentes/ui';

export default function Entrar() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const r = await api('/auth/login', { metodo: 'POST', corpo: { email, senha }, token: 'nenhum' });
      sessao.salvar(r);
      navegar(r.papel === 'admin' ? '/admin' : '/painel', { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="tela-centro">
      <form className="cartao pilha" style={{ width: '100%', maxWidth: 420 }} onSubmit={entrar}>
        <h1>Entrar no painel</h1>
        {params.get('expirou') ? <Aviso tipo="alerta">Sua sessão expirou. Entre de novo.</Aviso> : null}
        {params.get('senha') ? <Aviso tipo="ok">Senha alterada. Entre com a nova senha.</Aviso> : null}
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Campo rotulo="E-mail"><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
        <Campo rotulo="Senha"><input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
        <Botao carregando={carregando} className="btn-primario btn-bloco btn-grande">Entrar</Botao>
        <Link to="/esqueci-senha" className="btn btn-texto">Esqueci minha senha</Link>
        <p className="centro suave pequeno">Ainda não tem loja? <Link to="/criar-loja">Criar loja grátis</Link></p>
      </form>
    </div>
  );
}
