// Lojista pede o link de recuperação por e-mail
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo } from '../../componentes/ui';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const r = await api('/auth/esqueci-senha', { metodo: 'POST', corpo: { email }, token: 'nenhum' });
      setMsg(r.mensagem);
    } catch (err) { setErro(err.message); } finally { setCarregando(false); }
  }

  return (
    <div className="tela-centro">
      <form className="cartao pilha" style={{ width: '100%', maxWidth: 420 }} onSubmit={enviar}>
        <h1>Esqueci minha senha</h1>
        <p className="suave">Digite o e-mail da sua conta. Vamos mandar um link para criar uma nova senha.</p>
        {msg ? <Aviso tipo="ok">{msg}</Aviso> : null}
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Campo rotulo="E-mail"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
        <Botao carregando={carregando} className="btn-primario btn-bloco">Enviar link</Botao>
        <Link to="/entrar" className="btn btn-texto">Voltar para o login</Link>
      </form>
    </div>
  );
}
