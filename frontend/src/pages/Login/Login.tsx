import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const { setTokens } = useAuth(); // usa o contexto correto

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (res.ok) {
        // Salva tokens no contexto e localStorage
        setTokens(data.accessToken, data.refreshToken);

        // Redireciona para Home
        navigate("/");
      } else {
        setMensagem(data.message || "Erro ao fazer login.");
      }
    } catch (err) {
      setMensagem("Erro no servidor.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>VirtualRPG</h1>
        <p className="login-subtitle">Entre na aventura</p>

        <input
          className="login-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="login-input"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>
          Entrar
        </button>

        {mensagem && <p className="login-error">{mensagem}</p>}

        <div className="login-links">
          <Link to="/cadastro">Criar conta</Link>
          <span> | </span>
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
