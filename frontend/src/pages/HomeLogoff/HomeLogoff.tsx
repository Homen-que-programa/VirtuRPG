import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./HomeLogoff.css";

const HomeLogoff = () => {
  const { accessToken: token } = useAuth(); // pega token do contexto

  return (
    <div className="home-logoff">
      <header className="header">
        <h1>Bem-vindo ao VirtualRPG</h1>
        <nav>
          {!token ? (
            <>
              <Link to="/login">Login</Link> |{" "}
              <Link to="/cadastro">Cadastrar</Link> |{" "}
              <Link to="/sobre">Sobre</Link>
            </>
          ) : (
            <>
              <Link to="/">Home</Link> |{" "}
              <Link to="/perfil">Perfil</Link> |{" "}
              <Link to="/criarCampanha">Criar Campanha</Link>
            </>
          )}
        </nav>
      </header>

      <section className="intro">
        <h2>O que é o VirtualRPG?</h2>
        <p>
          Uma plataforma para criar e participar de campanhas de RPG online,
          conectando jogadores e mestres em um ambiente imersivo e colaborativo.
        </p>
      </section>

      <section className="funcionalidades">
        <h2>Funcionalidades</h2>
        <ul>
          <li>
            <strong>Criação de Campanhas:</strong> Crie suas próprias aventuras
            e convide amigos para jogar.
          </li>
          <li>
            <strong>Participação em Campanhas:</strong> Junte-se a campanhas
            existentes e embarque em novas jornadas.
          </li>
          <li>
            <strong>Perfil de Jogador:</strong> Gerencie suas informações e
            acompanhe seu progresso.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default HomeLogoff;
