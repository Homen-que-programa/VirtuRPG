import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Perfil.css";
import { useApi } from "../../services/api";

interface User {
  id: number;
  nome?: string;
  email: string;
}

const Perfil = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const { accessToken, logout, loading } = useAuth(); // ✅ usar token do contexto
  const { apiFetch } = useApi();

  useEffect(() => {
    if (loading) return;
    if (!accessToken) {
      navigate("/homelogoff");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await apiFetch("/perfil", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (res.ok) {
          setUser(data.user);
        } else {
          setMensagem(data.message || "Erro ao carregar perfil.");
        }
      } catch (err) {
        setMensagem("Erro no servidor.");
      }
    };

    fetchUser();
  }, [accessToken, navigate]);

  const handleLogout = () => {
    logout(); // ✅ logout do contexto
    navigate("/homelogoff");
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja deletar sua conta?")) return;

    if (!accessToken) return;

    try {
      const res = await apiFetch("/deletar-conta", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (res.ok) {
        alert("Conta deletada com sucesso!");
        handleLogout();
      } else {
        setMensagem(data.message || "Erro ao deletar conta.");
      }
    } catch (err) {
      setMensagem("Erro no servidor.");
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h1>Perfil do Jogador</h1>
        {mensagem && <p className="mensagem">{mensagem}</p>}

        {user ? (
          <div className="info-usuario">
            <p><strong>ID:</strong> {user.id}</p>
            {user.nome && <p><strong>Nome:</strong> {user.nome}</p>}
            <p><strong>Email:</strong> {user.email}</p>

            <div className="acoes">
              <button className="btn" onClick={handleLogout}>Sair</button>
              <button className="btn btn-edit">Editar Perfil</button>
              <button className="btn btn-edit">Alterar Senha</button>
              <button className="btn btn-delete" onClick={handleDelete}>Deletar Conta</button>
            </div>
          </div>
        ) : (
          <p>Carregando...</p>
        )}
      </div>
    </div>
  );
};

export default Perfil;
