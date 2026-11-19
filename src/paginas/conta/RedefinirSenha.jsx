// Lojista cria a nova senha pelo link do e-mail
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { Aviso, Botao, Campo } from '../../componentes/ui';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await api('/auth/redefinir-senha', { metodo: 'POST', corpo: { token: params.get('token') || '', novaSenha: senha }, token: 'nenhum' });
      navegar('/entrar?senha=1', { replace: true });
    } catch (err) { setErro(err.message); } finally { setCarregando(false); }
  }

  return (
    <div className="tela-centro">
      <form className="cartao pilha" style={{ width: '100%', maxWidth: 420 }} onSubmit={salvar}>
        <h1>Nova senha</h1>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Campo rotulo="Nova senha" ajuda="Pelo menos 8 caracteres"><input type="password" autoComplete="new-password" minLength={8} required value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
        <Botao carregando={carregando} className="btn-primario btn-bloco">Salvar nova senha</Botao>
      </form>
    </div>
  );
}
