// Termos de Uso e lista de produtos proibidos (aceitos no cadastro)
import { Link } from 'react-router-dom';

export default function Termos() {
  return (
    <div className="conteudo conteudo-estreito pilha" style={{ paddingTop: 32 }}>
      <Link to="/" className="pequeno">← Voltar</Link>
      <h1>Termos de Uso</h1>
      <p className="suave pequeno">Modelo inicial. Revise com um advogado antes de lançar para muitos clientes.</p>
      <h2>1. O serviço</h2>
      <p>A plataforma aluga uma loja online para o lojista mostrar e vender seus produtos. O pagamento das vendas vai direto para o lojista; a plataforma não recebe, não guarda e não repassa o dinheiro dos clientes.</p>
      <h2>2. Plano</h2>
      <p>Os primeiros 30 dias são grátis. Depois, o uso continua mediante pagamento mensal. Sem pagamento, a loja sai do ar automaticamente, com os dados guardados até a renovação ou a exclusão.</p>
      <h2>3. Responsabilidade do lojista</h2>
      <p>O lojista é responsável pelos produtos anunciados, preços, estoque, entrega, trocas e devoluções (incluindo o direito de arrependimento de 7 dias do Código de Defesa do Consumidor) e pelo cumprimento das leis do seu ramo.</p>
      <h2>4. Produtos proibidos</h2>
      <p>É proibido anunciar: armas, munições e simulacros; drogas e medicamentos; cigarros, vapes e afins; bebida alcoólica para entrega; produtos falsificados, réplicas ou pirataria; conteúdo adulto; animais; produtos roubados; contas, cartões ou dados de terceiros; qualquer item de venda proibida no Brasil.</p>
      <h2>5. Moderação</h2>
      <p>A plataforma pode ocultar produtos e bloquear lojas que descumpram estes termos ou recebam denúncias procedentes, a qualquer momento.</p>
      <h2>6. Dados pessoais (LGPD)</h2>
      <p>Os dados dos clientes de cada loja (nome, contato e endereço) são usados apenas para processar os pedidos daquela loja. O cliente pode pedir a exclusão dos seus dados ao lojista ou ao suporte.</p>
    </div>
  );
}
