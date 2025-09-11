import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import HomeLogoff from "./pages/HomeLogoff/HomeLogoff";
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import Perfil from "./pages/Perfil/Perfil";
import Notificacoes from "./pages/Notificacoes/Notificacoes";
import CriarCampanha from "./pages/CriarCampanha/CriarCampanha";
import PaginaCampanha from "./pages/PaginaCampanha/PaginaCampanha";
import Campanhas from "./pages/Campanhas/Campanhas";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Page404 from "./pages/Page404/Page404";
import { useAuth } from "./context/AuthContext";
import { PrivateRoute, PublicRoute } from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";
import InformacoesCampanha from './pages/PaginaCampanha/InformacoesCampanha';
import ChatCampanha from './pages/PaginaCampanha/ChatCampanha';
import FichasCampanha from './pages/PaginaCampanha/FichasCampanha';
import SessaoCampanha from './pages/PaginaCampanha/SessaoCampanha';
import FerramentasCampanha from './pages/PaginaCampanha/FerramentasCampanha';
import NotasMestre from './pages/PaginaCampanha/NotasMestre';

function AppRoutes() {
  const { accessToken, logout } = useAuth();

  return (
    <div className="app-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header isLoggedIn={!!accessToken} logout={logout} />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Home: mostra HomeLogoff se não logado */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/homelogoff" element={<HomeLogoff />} />

          {/* Páginas protegidas */}
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/notificacoes" element={<PrivateRoute><Notificacoes /></PrivateRoute>} />
          <Route path="/criarCampanha" element={<PrivateRoute><CriarCampanha /></PrivateRoute>} />

          {/* Páginas públicas */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />

          {/* Campanha sempre acessível */}
          <Route path="/campanha/:id" element={<PaginaCampanha />}>
            <Route index element={<InformacoesCampanha />} />
            <Route path="chat" element={<ChatCampanha />} />
            <Route path="fichas" element={<FichasCampanha />} />
            <Route path="sessao" element={<SessaoCampanha />} />
            <Route path="ferramentas" element={<FerramentasCampanha />} />
            <Route path="notas" element={<NotasMestre />} />
          </Route>
          <Route path="/campanhas" element={<Campanhas />} />

          {/* Qualquer outro caminho */}
          <Route path="*" element={<Page404 />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;