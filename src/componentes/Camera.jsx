// Câmera DENTRO da página (sem abrir o app de câmera do celular).
// Em celulares com pouca memória, o Android fecha o Chrome quando o app de câmera
// abre — e a foto se perde. Aqui a câmera roda no próprio navegador, então isso não acontece.
import { useEffect, useRef, useState } from 'react';
import { Aviso, Girando } from './ui';

export const cameraDisponivel = () => Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext;

export default function Camera({ aberta, aoFechar, aoTirar, aoFalhar }) {
  const video = useRef(null);
  const fluxo = useRef(null);
  const [frontal, setFrontal] = useState(false);
  const [pronta, setPronta] = useState(false);
  const [erro, setErro] = useState('');
  const [tirando, setTirando] = useState(false);

  useEffect(() => {
    if (!aberta) return undefined;
    let cancelado = false;
    setPronta(false);
    setErro('');
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: frontal ? 'user' : { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1920 } },
      audio: false,
    }).then((s) => {
      if (cancelado) { s.getTracks().forEach((t) => t.stop()); return; }
      fluxo.current = s;
      if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); }
    }).catch((e) => {
      const negado = e?.name === 'NotAllowedError';
      setErro(negado ? 'Permissão da câmera negada. Libere a câmera para este site nas configurações do navegador, ou use a Galeria.' : 'Não foi possível abrir a câmera. Use a Galeria.');
      aoFalhar?.(e);
    });
    return () => {
      cancelado = true;
      fluxo.current?.getTracks().forEach((t) => t.stop());
      fluxo.current = null;
    };
  }, [aberta, frontal, aoFalhar]);

  if (!aberta) return null;

  function tirar() {
    const v = video.current;
    if (!v?.videoWidth) return;
    setTirando(true);
    const lado = 1200;
    const escala = Math.min(1, lado / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * escala);
    c.height = Math.round(v.videoHeight * escala);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    let dados = c.toDataURL('image/webp', 0.82);
    if (!dados.startsWith('data:image/webp')) dados = c.toDataURL('image/jpeg', 0.82);
    c.width = 0; c.height = 0;
    fluxo.current?.getTracks().forEach((t) => t.stop());
    setTirando(false);
    aoTirar(dados);
  }

  return (
    <div className="camera-tela" role="dialog" aria-modal="true" aria-label="Câmera">
      {erro ? (
        <div className="camera-erro"><Aviso tipo="erro">{erro}</Aviso><button type="button" className="btn btn-primario" onClick={aoFechar}>Voltar</button></div>
      ) : (
        <>
          <video ref={video} playsInline muted autoPlay onLoadedMetadata={() => setPronta(true)} />
          {!pronta ? <div className="camera-carregando"><Girando /> Abrindo a câmera…</div> : null}
          <div className="camera-controles">
            <button type="button" className="btn btn-contorno camera-btn-texto" onClick={aoFechar}>Cancelar</button>
            <button type="button" className="camera-disparo" aria-label="Tirar foto" disabled={!pronta || tirando} onClick={tirar} />
            <button type="button" className="btn btn-contorno camera-btn-texto" onClick={() => setFrontal(!frontal)}>Virar</button>
          </div>
        </>
      )}
    </div>
  );
}
