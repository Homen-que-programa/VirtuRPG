import { Link } from "react-router-dom";
import "./Header.css";

interface HeaderProps {
  isLoggedIn: boolean;
  logout: () => void;
}

function Header({ isLoggedIn }: HeaderProps) {
  return (
    <header className="header">
      <div className="logo">VirtualRPG</div>
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/campanhas">Encontrar Campanha</Link>
        {isLoggedIn ? (
          <>
            <Link to="/notificacoes">Noticações</Link>
            <Link to="/perfil">Perfil</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/cadastro">Cadastrar</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;