// Componentes pequenos usados em várias telas
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { aoServidorLento } from '../api';
import { STATUS } from '../utils';

export function Girando() { return <span className="girando" aria-hidden="true" />; }

export function Carregando({ texto = 'Carregando…' }) {
  return <div className="carregando" role="status"><Girando /> {texto}</div>;
}

export function Aviso({ tipo = 'info', children }) {
  return <div className={`aviso aviso-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>{children}</div>;
}

export function Botao({ carregando, children, className = 'btn-primario', ...props }) {
  return (
    <button className={`btn ${className}`} disabled={carregando || props.disabled} {...props}>
      {carregando ? <Girando /> : null}
      {children}
    </button>
  );
}

export function Campo({ rotulo, ajuda, erro, children }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      {children}
      {erro ? <div className="erro-campo">{erro}</div> : ajuda ? <small>{ajuda}</small> : null}
    </label>
  );
}

export function Chave({ ligado, aoMudar, rotulo, descricao }) {
  return (
    <button type="button" className="chave" aria-pressed={ligado} onClick={() => aoMudar(!ligado)}>
      <span className="chave-texto"><strong>{rotulo}</strong>{descricao ? <small>{descricao}</small> : null}</span>
      <span className={`chave-trilho${ligado ? ' ligado' : ''}`}><span /></span>
    </button>
  );
}

export function Selo({ status }) {
  const s = STATUS[status] || { nome: status, cor: 'cinza' };
  return <span className={`selo selo-${s.cor}`}>{s.nome}</span>;
}

export function Modal({ titulo, aberto, aoFechar, children }) {
  const ref = useRef(null);
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;
  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === 'Escape' && fecharRef.current();
    document.addEventListener('keydown', tecla);
    ref.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', tecla);
  }, [aberto]);
  if (!aberto) return null;
  return (
    <div className="fundo-modal" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal pilha" role="dialog" aria-modal="true" aria-label={titulo} ref={ref} tabIndex={-1}>
        <div className="linha-entre">
          <h2>{titulo}</h2>
          <button className="btn btn-texto" onClick={aoFechar}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const ToastContexto = createContext(() => {});
export const useToast = () => useContext(ToastContexto);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const mostrar = useCallback((texto, tipo = 'ok') => {
    clearTimeout(timer.current);
    setToast({ texto, tipo });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return (
    <ToastContexto.Provider value={mostrar}>
      {children}
      {toast && <div className={`toast ${toast.tipo === 'erro' ? 'erro' : ''}`} role="status">{toast.texto}</div>}
    </ToastContexto.Provider>
  );
}

export function AvisoServidor() {
  const [lento, setLento] = useState(false);
  useEffect(() => aoServidorLento(setLento), []);
  if (!lento) return null;
  return <div className="aviso-servidor" role="status"><Girando /> Conectando ao servidor… pode levar alguns segundos.</div>;
}

// Copiar texto (Pix, link da loja)
export function BotaoCopiar({ texto, rotulo = 'Copiar', className = 'btn-contorno' }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try { await navigator.clipboard.writeText(texto); } catch {
      const t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
  return <button type="button" className={`btn ${className}`} onClick={copiar}>{copiado ? 'Copiado!' : rotulo}</button>;
}

export function Vazio({ titulo, children }) {
  return <div className="vazio"><strong>{titulo}</strong>{children ? <div className="suave">{children}</div> : null}</div>;
}
