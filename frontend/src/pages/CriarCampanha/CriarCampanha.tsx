import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./CriarCampanha.css";

const CriarCampanha = () => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const { accessToken: token } = useAuth();

  const handleCriar = async () => {
    if (!nome || !descricao) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    if (!token) {
      setMensagem("Você precisa estar logado.");
      return;
    }

    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const mestre = tokenPayload.nome || tokenPayload.apelido;
    const usuario_id = tokenPayload.id;

    try {
      const res = await fetch("http://localhost:3000/criar-campanha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome, descricao, mestre, usuario_id }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensagem("Campanha criada com sucesso!");
        setNome("");
        setDescricao("");
        navigate(`/campanha/${data.campanhaId}`); // redireciona para a campanha criada
      } else {
        setMensagem(data.message || "Erro ao criar campanha.");
      }
    } catch {
      setMensagem("Erro no servidor.");
    }
  };

  const handleSair = () => {
    navigate("/"); // volta para Home
  };

  return (
    <div className="criar-campanha-container">
      <h1>Criar Campanha</h1>
      {mensagem && <p className="mensagem">{mensagem}</p>}

      <input
        type="text"
        placeholder="Nome da Campanha"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <textarea
        placeholder="Descrição da Campanha"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <div className="acoes">
        <button className="btn" onClick={handleCriar}>
          Criar
        </button>
        <button className="btn btn-logout" onClick={handleSair}>
          Sair
        </button>
      </div>
    </div>
  );
};

export default CriarCampanha;
