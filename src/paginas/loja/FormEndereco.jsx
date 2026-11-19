// Campos de endereço com preenchimento automático pelo CEP
import { useState } from 'react';
import { Campo, Girando } from '../../componentes/ui';
import { buscarCep } from '../../utils';

export const enderecoVazio = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: 'RJ' };

export default function FormEndereco({ valor, aoMudar }) {
  const [buscando, setBuscando] = useState(false);
  const mudar = (c) => (e) => aoMudar({ ...valor, [c]: e.target.value });

  async function aoMudarCep(e) {
    const cep = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatado = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
    aoMudar({ ...valor, cep: formatado });
    if (cep.length === 8) {
      setBuscando(true);
      const achado = await buscarCep(cep);
      setBuscando(false);
      if (achado) aoMudar({ ...valor, cep: formatado, ...achado });
    }
  }

  return (
    <div className="pilha">
      <div className="grade-2">
        <Campo rotulo="CEP" ajuda={buscando ? <span className="linha"><Girando /> buscando…</span> : null}>
          <input inputMode="numeric" required value={valor.cep} onChange={aoMudarCep} placeholder="00000-000" autoComplete="postal-code" />
        </Campo>
        <Campo rotulo="Número"><input required maxLength={10} value={valor.numero} onChange={mudar('numero')} /></Campo>
      </div>
      <Campo rotulo="Rua"><input required maxLength={120} value={valor.rua} onChange={mudar('rua')} autoComplete="address-line1" /></Campo>
      <Campo rotulo="Complemento (opcional)"><input maxLength={60} value={valor.complemento} onChange={mudar('complemento')} placeholder="Apto, bloco, referência" /></Campo>
      <div className="grade-2">
        <Campo rotulo="Bairro"><input required maxLength={60} value={valor.bairro} onChange={mudar('bairro')} /></Campo>
        <Campo rotulo="Cidade"><input required maxLength={60} value={valor.cidade} onChange={mudar('cidade')} /></Campo>
      </div>
    </div>
  );
}
