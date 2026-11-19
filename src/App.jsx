// Rotas do app
import { Navigate, Route, Routes } from 'react-router-dom';
import { sessao } from './api';
import Inicio from './paginas/Inicio';
import Termos from './paginas/Termos';
import Entrar from './paginas/conta/Entrar';
import CriarLoja from './paginas/conta/CriarLoja';
import EsqueciSenha from './paginas/conta/EsqueciSenha';
import RedefinirSenha from './paginas/conta/RedefinirSenha';
import LayoutPainel from './paginas/painel/LayoutPainel';
import Pedidos from './paginas/painel/Pedidos';
import PedidoDetalhe from './paginas/painel/PedidoDetalhe';
import Produtos from './paginas/painel/Produtos';
import ProdutoForm from './paginas/painel/ProdutoForm';
import EntregaPix from './paginas/painel/EntregaPix';
import Aparencia from './paginas/painel/Aparencia';
import MinhaConta from './paginas/painel/MinhaConta';
import LayoutAdmin from './paginas/admin/LayoutAdmin';
import Lojas from './paginas/admin/Lojas';
import LojaDetalhe from './paginas/admin/LojaDetalhe';
import Moderacao from './paginas/admin/Moderacao';
import AvisoAdmin from './paginas/admin/AvisoAdmin';
import LayoutLoja from './paginas/loja/LayoutLoja';
import Vitrine from './paginas/loja/Vitrine';
import ProdutoPagina from './paginas/loja/ProdutoPagina';
import Carrinho from './paginas/loja/Carrinho';
import EntrarComprador from './paginas/loja/EntrarComprador';
import RedefinirComprador from './paginas/loja/RedefinirComprador';
import MeusPedidos from './paginas/loja/MeusPedidos';
import PedidoComprador from './paginas/loja/PedidoComprador';
import ContaComprador from './paginas/loja/ContaComprador';

function SoLogado({ papel, children }) {
  if (!sessao.token) return <Navigate to="/entrar" replace />;
  if (papel && sessao.papel !== papel) return <Navigate to={sessao.papel === 'admin' ? '/admin' : '/painel'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/termos" element={<Termos />} />

      {/* Lojista */}
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/criar-loja" element={<CriarLoja />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/painel" element={<SoLogado papel="lojista"><LayoutPainel /></SoLogado>}>
        <Route index element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetalhe />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="produtos/novo" element={<ProdutoForm />} />
        <Route path="produtos/:id" element={<ProdutoForm />} />
        <Route path="entrega" element={<EntregaPix />} />
        <Route path="aparencia" element={<Aparencia />} />
        <Route path="conta" element={<MinhaConta />} />
      </Route>

      {/* Você (desenvolvedor) */}
      <Route path="/admin" element={<SoLogado papel="admin"><LayoutAdmin /></SoLogado>}>
        <Route index element={<Lojas />} />
        <Route path="lojas/:id" element={<LojaDetalhe />} />
        <Route path="moderacao" element={<Moderacao />} />
        <Route path="aviso" element={<AvisoAdmin />} />
      </Route>

      {/* Loja pública (o link que o lojista divulga) */}
      <Route path="/loja/:slug" element={<LayoutLoja />}>
        <Route index element={<Vitrine />} />
        <Route path="produto/:id" element={<ProdutoPagina />} />
        <Route path="carrinho" element={<Carrinho />} />
        <Route path="entrar" element={<EntrarComprador />} />
        <Route path="redefinir-senha" element={<RedefinirComprador />} />
        <Route path="pedidos" element={<MeusPedidos />} />
        <Route path="pedidos/:id" element={<PedidoComprador />} />
        <Route path="conta" element={<ContaComprador />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
