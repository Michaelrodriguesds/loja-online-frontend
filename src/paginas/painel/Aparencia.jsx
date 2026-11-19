// Aparência e dados da loja: nome, descrição, logo, banner, tema, cor, pausar loja
import { useState } from 'react';
import { api } from '../../api';
import { Aviso, Botao, Campo, Chave, Girando, useToast } from '../../componentes/ui';
import EscolherTema from '../../componentes/EscolherTema';
import { SEGMENTOS, comprimirImagem } from '../../utils';
import { usePainel } from './LayoutPainel';

export default function Aparencia() {
  const { loja, link, recarregar, segmentosBloqueados } = usePainel();
  const toast = useToast();
  const [f, setF] = useState({
    nome: loja.nome, descricao: loja.descricao, whatsapp: loja.whatsapp, instagram: loja.instagram, segmento: loja.segmento,
    tema: loja.tema, corPrimaria: loja.corPrimaria, logoUrl: loja.logoUrl, bannerUrl: loja.bannerUrl, aberta: loja.aberta,
  });
  const [enviando, setEnviando] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const mudar = (c) => (e) => setF({ ...f, [c]: e.target.value });

  async function enviarImagem(campo, arquivo, lado) {
    if (!arquivo) return;
    setEnviando(campo);
    setErro('');
    try {
      const dados = await comprimirImagem(arquivo, lado);
      const r = await api('/painel/imagens', { metodo: 'POST', corpo: { dados } });
      setF((atual) => ({ ...atual, [campo]: r.url }));
    } catch (e) { setErro(e.message); } finally { setEnviando(''); }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api('/painel/loja', { metodo: 'PUT', corpo: f });
      toast('Loja atualizada!');
      recarregar();
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  }

  const Imagem = ({ campo, rotulo, lado, redonda }) => (
    <div className="pilha-p">
      <span className="pequeno suave">{rotulo}</span>
      <div className="linha">
        {f[campo] ? <img src={f[campo]} alt="" style={{ width: redonda ? 64 : 160, height: 64, objectFit: 'cover', borderRadius: redonda ? '50%' : 12 }} /> : null}
        <label className="btn btn-contorno" style={{ position: 'relative' }}>
          {enviando === campo ? <Girando /> : null}{f[campo] ? 'Trocar' : 'Enviar imagem'}
          <input type="file" accept="image/*" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} onChange={(e) => enviarImagem(campo, e.target.files[0], lado)} />
        </label>
        {f[campo] ? <button type="button" className="btn btn-texto" onClick={() => setF({ ...f, [campo]: '' })}>Remover</button> : null}
      </div>
    </div>
  );

  return (
    <form className="pilha" onSubmit={salvar} style={{ maxWidth: 640 }}>
      <h1>Aparência da loja</h1>
      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <section className="cartao pilha">
        <Chave ligado={f.aberta} aoMudar={(v) => setF({ ...f, aberta: v })} rotulo={f.aberta ? 'Loja aberta' : 'Loja pausada'} descricao="Pausada: a vitrine aparece, mas não recebe pedidos (férias, dia cheio)" />
        <div className="pilha-p">
          <span className="pequeno suave">Link da sua loja</span>
          <a href={link} target="_blank" rel="noreferrer" className="pix-codigo">{link}</a>
        </div>
      </section>

      <section className="cartao pilha">
        <h2>Estilo</h2>
        <EscolherTema tema={f.tema} cor={f.corPrimaria} aoMudar={(v) => setF({ ...f, ...v })} />
        <Imagem campo="logoUrl" rotulo="Logo (quadrada)" lado={400} redonda />
        <Imagem campo="bannerUrl" rotulo="Banner do topo (horizontal)" lado={1600} />
      </section>

      <section className="cartao pilha">
        <h2>Dados</h2>
        <Campo rotulo="Nome da loja"><input required maxLength={80} value={f.nome} onChange={mudar('nome')} /></Campo>
        <Campo rotulo="Descrição curta" ajuda="Aparece abaixo do banner"><textarea maxLength={300} value={f.descricao} onChange={mudar('descricao')} /></Campo>
        <div className="grade-2 quebra">
          <Campo rotulo="WhatsApp"><input type="tel" value={f.whatsapp} onChange={mudar('whatsapp')} /></Campo>
          <Campo rotulo="Instagram" ajuda="Só o @"><input value={f.instagram} maxLength={60} onChange={mudar('instagram')} placeholder="@sualoja" /></Campo>
        </div>
        <Campo rotulo="Tipo do negócio">
          <select value={f.segmento} onChange={mudar('segmento')}>
            {Object.entries(SEGMENTOS).map(([id, nome]) => (
              <option key={id} value={id} disabled={segmentosBloqueados?.includes(id) && id !== loja.segmento}>{nome}</option>
            ))}
          </select>
        </Campo>
      </section>

      <Botao carregando={salvando} className="btn-primario btn-grande">Salvar</Botao>
    </form>
  );
}
