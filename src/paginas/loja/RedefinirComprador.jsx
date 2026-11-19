// Comprador cria a nova senha pelo link do e-mail
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Botao, Campo } from '../../componentes/ui';
import { useLoja } from './LayoutLoja';

export default function RedefinirComprador() {
  const { slug, apiComprador } = useLoja();
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
      await apiComprador('/conta/redefinir-senha', { metodo: 'POST', corpo: { token: params.get('token') || '', novaSenha: senha } });
      navegar(`/loja/${slug}/entrar?senha=1`, { replace: true });
    } catch (err) { setErro(err.message); } finally { setCarregando(false); }
  }

  return (
    <form className="pilha" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }} onSubmit={salvar}>
      <h1>Nova senha</h1>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      <Campo rotulo="Nova senha" ajuda="Pelo menos 8 caracteres"><input type="password" required minLength={8} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></Campo>
      <Botao carregando={carregando} className="btn-primario btn-bloco">Salvar nova senha</Botao>
    </form>
  );
}
