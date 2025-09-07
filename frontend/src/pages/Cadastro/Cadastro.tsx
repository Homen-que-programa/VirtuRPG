import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Cadastro.css";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState(""); // adiciona apelido
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const { setTokens } = useAuth();

  const handleCadastro = async () => {
    try {
      const res = await fetch("http://localhost:3000/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, apelido, email, senha }), // inclui apelido
      });

      const data = await res.json();

      if (res.ok) {
        // Backend agora deve retornar { accessToken, refreshToken }
        setTokens(data.accessToken, data.refreshToken);
        navigate("/"); // Redireciona logado
      } else {
        setMensagem(data.message || "Erro ao criar conta.");
      }
    } catch (err) {
      setMensagem("Erro no servidor.");
    }
  };

  return (
    <div className="cadastro-page">
      <div className="cadastro-box">
        <h1>VirtualRPG</h1>
        <p className="cadastro-subtitle">Crie sua conta e comece a jogar</p>

        <input
          className="cadastro-input"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="cadastro-input"
          placeholder="Apelido"
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
        />
        <input
          className="cadastro-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="cadastro-input"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button className="cadastro-button" onClick={handleCadastro}>
          Cadastrar
        </button>

        {mensagem && <p className="cadastro-error">{mensagem}</p>}

        <div className="cadastro-links">
          <Link to="/login">Já tem uma conta? Entre</Link>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
