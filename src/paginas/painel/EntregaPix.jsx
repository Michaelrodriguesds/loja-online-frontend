// Configuração de entrega (frete por km, cidades, prazos), endereço da loja e Pix
import { useState } from 'react';
import { api } from '../../api';
import { Aviso, Botao, Campo, Chave, useToast } from '../../componentes/ui';
import { lerValor, reais } from '../../utils';
import { usePainel } from './LayoutPainel';

const paraTexto = (n) => String(n ?? '').replace('.', ',');

export default function EntregaPix() {
  const { loja, recarregar } = usePainel();
  const toast = useToast();
  const [e, setE] = useState({ ...loja.entrega, valorKm: paraTexto(loja.entrega.valorKm), taxaMinima: paraTexto(loja.entrega.taxaMinima), raioMaxKm: String(loja.entrega.raioMaxKm) });
  const [end, setEnd] = useState({ texto: loja.endereco.texto, cidade: loja.endereco.cidade, uf: loja.endereco.uf || 'RJ' });
  const [pg, setPg] = useState({ ...loja.pagamento });
  const [horas, setHoras] = useState(String(loja.regras?.horasParaExpirar || 12));
  const [novaCidade, setNovaCidade] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);

  const valorKm = lerValor(e.valorKm);
  const taxa = lerValor(e.taxaMinima);
  const exemplo = Number.isFinite(valorKm) && Number.isFinite(taxa) ? Math.max(taxa, 5 * valorKm * (e.calculo === 'ida_volta' ? 2 : 1)) : null;

  function addCidade() {
    const c = novaCidade.trim();
    if (c.length >= 2 && !e.cidades.some((x) => x.toLowerCase() === c.toLowerCase())) setE({ ...e, cidades: [...e.cidades, c] });
    setNovaCidade('');
  }

  async function salvar(ev) {
    ev.preventDefault();
    setErro('');
    setAviso('');
    if (![valorKm, taxa, Number(e.raioMaxKm)].every(Number.isFinite)) return setErro('Confira os valores do frete.');
    setSalvando(true);
    try {
      const r = await api('/painel/loja', {
        metodo: 'PUT',
        corpo: {
          entrega: { ativa: e.ativa, valorKm, taxaMinima: taxa, raioMaxKm: Number(e.raioMaxKm), calculo: e.calculo, cidades: e.cidades, prazo: e.prazo, retiradaAtiva: e.retiradaAtiva, prazoRetirada: e.prazoRetirada },
          endereco: end,
          pagamento: { chavePix: pg.chavePix.trim(), nomeRecebedor: pg.nomeRecebedor.trim(), cidade: pg.cidade.trim(), aceitaNaEntrega: pg.aceitaNaEntrega },
          regras: { horasParaExpirar: Math.min(168, Math.max(1, parseInt(horas, 10) || 12)) },
        },
      });
      if (r.avisoEndereco) setAviso(r.avisoEndereco);
      toast('Configurações salvas!');
      recarregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="pilha" onSubmit={salvar} style={{ maxWidth: 640 }}>
      <h1>Entrega e Pix</h1>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
      {aviso ? <Aviso tipo="alerta">{aviso}</Aviso> : null}

      <section className="cartao pilha">
        <h2>Endereço da loja</h2>
        <p className="suave pequeno">Ponto de partida do frete e local de retirada.</p>
        <Campo rotulo="Rua, número e bairro"><input value={end.texto} maxLength={150} onChange={(x) => setEnd({ ...end, texto: x.target.value })} placeholder="Rua Exemplo, 123 - Alcântara" /></Campo>
        <div className="grade-2">
          <Campo rotulo="Cidade"><input value={end.cidade} maxLength={60} onChange={(x) => setEnd({ ...end, cidade: x.target.value })} /></Campo>
          <Campo rotulo="UF"><input value={end.uf} maxLength={2} onChange={(x) => setEnd({ ...end, uf: x.target.value.toUpperCase() })} /></Campo>
        </div>
      </section>

      <section className="cartao pilha">
        <Chave ligado={e.ativa} aoMudar={(v) => setE({ ...e, ativa: v })} rotulo="Fazer entregas" descricao="Frete calculado pela distância" />
        {e.ativa ? (
          <>
            <div className="grade-2">
              <Campo rotulo="Valor por km (R$)"><input inputMode="decimal" value={e.valorKm} onChange={(x) => setE({ ...e, valorKm: x.target.value })} /></Campo>
              <Campo rotulo="Taxa mínima (R$)" ajuda="Para entregas perto"><input inputMode="decimal" value={e.taxaMinima} onChange={(x) => setE({ ...e, taxaMinima: x.target.value })} /></Campo>
              <Campo rotulo="Distância máxima (km)"><input inputMode="numeric" value={e.raioMaxKm} onChange={(x) => setE({ ...e, raioMaxKm: x.target.value.replace(/\D/g, '') })} /></Campo>
              <Campo rotulo="Cálculo">
                <select value={e.calculo} onChange={(x) => setE({ ...e, calculo: x.target.value })}>
                  <option value="ida">Só ida</option>
                  <option value="ida_volta">Ida e volta</option>
                </select>
              </Campo>
            </div>
            {exemplo != null ? <p className="pequeno suave">Exemplo: entrega a 5 km = {reais(exemplo)}. O valor é uma estimativa; você confirma o frete final ao aprovar cada pedido.</p> : null}
            <div className="pilha-p">
              <span className="pequeno suave">Cidades atendidas</span>
              <div className="linha">
                {e.cidades.map((c) => (
                  <button type="button" key={c} className="filtro" aria-pressed="true" onClick={() => setE({ ...e, cidades: e.cidades.filter((x) => x !== c) })} aria-label={`Remover ${c}`}>{c} ×</button>
                ))}
              </div>
              <div className="linha" style={{ flexWrap: 'nowrap' }}>
                <input className="busca" value={novaCidade} onChange={(x) => setNovaCidade(x.target.value)} onKeyDown={(x) => { if (x.key === 'Enter') { x.preventDefault(); addCidade(); } }} placeholder="Adicionar cidade" aria-label="Adicionar cidade" />
                <button type="button" className="btn btn-contorno" onClick={addCidade}>Adicionar</button>
              </div>
              {!e.cidades.length ? <small className="suave">Sem cidades na lista: entrega em qualquer cidade dentro da distância máxima.</small> : null}
            </div>
            <Campo rotulo="Prazo padrão da entrega"><input value={e.prazo} maxLength={80} onChange={(x) => setE({ ...e, prazo: x.target.value })} /></Campo>
          </>
        ) : null}
      </section>

      <section className="cartao pilha">
        <Chave ligado={e.retiradaAtiva} aoMudar={(v) => setE({ ...e, retiradaAtiva: v })} rotulo="Retirada no local" descricao="Cliente busca sem pagar frete" />
        {e.retiradaAtiva ? <Campo rotulo="Prazo padrão da retirada"><input value={e.prazoRetirada} maxLength={80} onChange={(x) => setE({ ...e, prazoRetirada: x.target.value })} /></Campo> : null}
      </section>

      <section className="cartao pilha">
        <h2>Pagamento</h2>
        <Campo rotulo="Chave Pix" ajuda="CPF, CNPJ, e-mail, telefone (+5521...) ou chave aleatória"><input value={pg.chavePix} maxLength={77} onChange={(x) => setPg({ ...pg, chavePix: x.target.value })} /></Campo>
        <div className="grade-2">
          <Campo rotulo="Nome do recebedor" ajuda="Como aparece no banco"><input value={pg.nomeRecebedor} maxLength={25} onChange={(x) => setPg({ ...pg, nomeRecebedor: x.target.value })} /></Campo>
          <Campo rotulo="Cidade do recebedor"><input value={pg.cidade} maxLength={15} onChange={(x) => setPg({ ...pg, cidade: x.target.value })} /></Campo>
        </div>
        <Chave ligado={pg.aceitaNaEntrega} aoMudar={(v) => setPg({ ...pg, aceitaNaEntrega: v })} rotulo="Aceitar pagamento na entrega/retirada" descricao="Você decide pedido a pedido ao aprovar" />
        <Campo rotulo="Cancelar pedido não aprovado/pago depois de (horas)" ajuda="O estoque volta automaticamente"><input inputMode="numeric" value={horas} onChange={(x) => setHoras(x.target.value.replace(/\D/g, ''))} /></Campo>
      </section>

      <Botao carregando={salvando} className="btn-primario btn-grande">Salvar</Botao>
    </form>
  );
}
