// Página inicial: apresenta o serviço e leva para criar a loja ou entrar
import { Link, Navigate } from 'react-router-dom';
import { sessao } from '../api';

const VANTAGENS = [
  ['Sua loja com link próprio', 'Divulgue no Instagram e no WhatsApp. O cliente vê os produtos, escolhe tamanho e cor e faz o pedido.'],
  ['Você aprova cada pedido', 'Confere estoque, frete e horário antes de aceitar. Nada de vender o que não pode entregar.'],
  ['Frete por quilômetro', 'O app calcula a distância e mostra o frete estimado. Você confirma o valor final.'],
  ['Pix direto na sua conta', 'O cliente paga com Pix copia e cola, sem taxa de intermediário. Ou paga na entrega, se você aceitar.'],
];

export default function Inicio() {
  if (sessao.token) return <Navigate to={sessao.papel === 'admin' ? '/admin' : '/painel'} replace />;
  return (
    <div className="inicio">
      <section className="heroi">
        <span className="pequeno" style={{ color: '#b5b5b5' }}>Loja online para comércios locais</span>
        <h1>Seus produtos<br /><span className="destaque">vendendo pelo celular</span></h1>
        <p style={{ color: '#c8c8c8', maxWidth: 560 }}>Crie a loja do seu negócio em minutos: vitrine com fotos, carrinho, pedidos com entrega ou retirada e acompanhamento para o cliente. 30 dias grátis.</p>
        <div className="linha">
          <Link to="/criar-loja" className="btn btn-primario btn-grande">Criar minha loja grátis</Link>
          <Link to="/entrar" className="btn btn-contorno btn-grande">Já tenho loja</Link>
        </div>
      </section>
      <section className="vantagens">
        {VANTAGENS.map(([t, d]) => (
          <div key={t} className="vantagem"><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>
    </div>
  );
}
