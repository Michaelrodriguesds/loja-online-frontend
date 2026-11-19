// Conta do lojista: situação do plano e troca de senha
import { useState } from 'react';
import { api, sessao } from '../../api';
import { Aviso, Botao, Campo, useToast } from '../../componentes/ui';
import { data, linkWhatsapp } from '../../utils';
import { usePainel } from './LayoutPainel';

const SITUACAO = { teste: 'Teste grátis', ativo: 'Ativo', vencendo: 'Vencendo', vencido: 'Vencido' };

export default function MinhaConta() {
  const { loja, licenca, suporteWhatsapp } = usePainel();
  const toast = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function trocar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api('/auth/trocar-senha', { metodo: 'POST', corpo: { senhaAtual, novaSenha } });
      setSenhaAtual(''); setNovaSenha('');
      toast('Senha alterada!');
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  }

  return (
    <div className="pilha" style={{ maxWidth: 640 }}>
      <h1>Conta e plano</h1>
      <section className="cartao pilha-p">
        <div className="linha-entre"><strong>Plano</strong><span className={`selo selo-${licenca.ativa ? (licenca.situacao === 'vencendo' ? 'ambar' : 'verde') : 'vermelho'}`}>{SITUACAO[licenca.situacao]}</span></div>
        <span className="suave">{licenca.ativa ? `Válido até ${data(licenca.acessoAte)} (${licenca.diasRestantes} dias)` : `Venceu em ${data(licenca.acessoAte)}`}</span>
        <span className="pequeno suave">Para renovar, fale com o suporte. A renovação soma os dias que ainda faltam.</span>
        {suporteWhatsapp ? <a className="btn btn-contorno" style={{ marginTop: 8 }} href={linkWhatsapp(suporteWhatsapp, `Olá! Quero renovar o plano da loja ${loja.nome} (${loja.slug}).`)} target="_blank" rel="noreferrer">Falar com o suporte</a> : null}
      </section>
      <form className="cartao pilha" onSubmit={trocar}>
        <h2>Trocar senha</h2>
        <p className="suave pequeno">Conectado como {sessao.nome}.</p>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
        <Campo rotulo="Senha atual"><input type="password" required autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} /></Campo>
        <Campo rotulo="Nova senha" ajuda="Pelo menos 8 caracteres"><input type="password" required minLength={8} autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} /></Campo>
        <Botao carregando={salvando} className="btn-primario">Salvar nova senha</Botao>
      </form>
    </div>
  );
}
