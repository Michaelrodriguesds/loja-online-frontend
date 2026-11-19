// Conta do comprador: dados, endereço e sair
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Aviso, Botao, Campo, Carregando, useToast } from '../../componentes/ui';
import FormEndereco, { enderecoVazio } from './FormEndereco';
import { useLoja } from './LayoutLoja';

export default function ContaComprador() {
  const { slug, comprador, apiComprador, atualizarComprador, sair } = useLoja();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!comprador) return;
    apiComprador('/conta').then((c) => setF({ ...c, endereco: { ...enderecoVazio, ...c.endereco } })).catch((e) => setErro(e.message));
  }, [comprador, apiComprador]);

  if (!comprador) return <Navigate to={`/loja/${slug}/entrar`} replace />;
  if (!f) return erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />;

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const corpo = { nome: f.nome, whatsapp: f.whatsapp };
      if (f.endereco.cep || f.endereco.rua) corpo.endereco = f.endereco;
      const c = await apiComprador('/conta', { metodo: 'PUT', corpo });
      atualizarComprador(c);
      toast('Dados salvos!');
      if (params.get('voltar') === 'carrinho') navegar(`/loja/${slug}/carrinho`);
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  }

  return (
    <form className="pilha" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }} onSubmit={salvar}>
      <h1>Minha conta</h1>
      <span className="suave pequeno">{f.email}</span>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      <Campo rotulo="Nome"><input required maxLength={80} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Campo>
      <Campo rotulo="WhatsApp"><input type="tel" required value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Campo>
      <div className="cartao pilha"><strong>Endereço de entrega</strong><FormEndereco valor={f.endereco} aoMudar={(endereco) => setF({ ...f, endereco })} /></div>
      <Botao carregando={salvando} className="btn-primario btn-grande btn-bloco">Salvar</Botao>
      <button type="button" className="btn btn-texto" onClick={() => { sair(); navegar(`/loja/${slug}`); }}>Sair da conta</button>
    </form>
  );
}
