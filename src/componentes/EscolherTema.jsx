// Escolha do estilo da loja (tema) e da cor principal
import { TEMAS } from '../utils';

const AMOSTRAS = {
  urbano: { fundo: '#121212', blocos: ['#1d1d1d', '#2e2e2e'] },
  clean: { fundo: '#ffffff', blocos: ['#f0f0ee', '#e3e3e0'] },
  delicado: { fundo: '#fcf7f5', blocos: ['#f3e3df', '#eddcd6'] },
  vibrante: { fundo: '#fffaf0', blocos: ['#ffd23f', '#3bceac'] },
};
const CORES = ['#E8A33D', '#111111', '#C0392B', '#B5657A', '#2E86AB', '#1F7A4D', '#7B4FB8', '#E4572E'];

export default function EscolherTema({ tema, cor, aoMudar }) {
  return (
    <div className="pilha">
      <div className="opcoes-tema">
        {Object.entries(TEMAS).map(([id, t]) => (
          <button type="button" key={id} className="opcao-tema" aria-pressed={tema === id} onClick={() => aoMudar({ tema: id, corPrimaria: cor || t.cor })}>
            <span className="amostra" style={{ background: AMOSTRAS[id].fundo }}>
              <i style={{ background: AMOSTRAS[id].blocos[0] }} />
              <i style={{ background: cor || t.cor, flex: 0.6 }} />
              <i style={{ background: AMOSTRAS[id].blocos[1] }} />
            </span>
            <span className="texto"><strong>{t.nome}</strong><span className="suave">{t.descricao}</span></span>
          </button>
        ))}
      </div>
      <div className="pilha-p">
        <span className="pequeno suave">Cor principal (botões e destaques)</span>
        <div className="cores">
          {CORES.map((c) => (
            <button type="button" key={c} className="cor" style={{ background: c }} aria-label={`Cor ${c}`} aria-pressed={cor?.toLowerCase() === c.toLowerCase()} onClick={() => aoMudar({ tema, corPrimaria: c })} />
          ))}
          <label className="cor" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', position: 'relative' }} aria-label="Escolher outra cor">
            <input type="color" value={cor || '#000000'} onChange={(e) => aoMudar({ tema, corPrimaria: e.target.value })} style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          </label>
        </div>
      </div>
    </div>
  );
}
