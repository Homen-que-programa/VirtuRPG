import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../services/api";
import CampaignCard from "./CardCampanha";
import "./Home.css";

const Home = () => {
  const { accessToken: token } = useAuth();
  const { apiFetch } = useApi();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [usuariosCampanha, setUsuariosCampanha] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Buscar perfil do usuário
        const resPerfil = await apiFetch("/perfil");
        if (!resPerfil.ok) throw new Error("Erro ao buscar perfil");
        const dataPerfil = await resPerfil.json();
        setUser(dataPerfil.user);

        // Buscar campanhas do usuário com detalhes (reduz N+1)
        const resC = await apiFetch("/campanhas-do-usuario-detalhe", {
          method: "POST",
          body: JSON.stringify({ id: dataPerfil.user.id }),
        });

        if (!resC.ok) throw new Error("Erro ao buscar campanhas");
        const dataC = await resC.json();
        // O backend já retorna campanhas com lista de usuários
        setUsuariosCampanha(dataC.campanhas);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleCreateCampaign = () => navigate("/criarCampanha");

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="home-container">
      <h1>Bem-vindo, {user?.apelido}</h1>
      <button className="create-btn" onClick={handleCreateCampaign}>
        Criar Nova Campanha
      </button>

      <h2>Sua Lista de Campanhas</h2>
      {usuariosCampanha.length === 0 ? (
        <p className="empty-msg">Você ainda não participa de nenhuma campanha.</p>
      ) : (
        <ul className="campaigns-list">
          {usuariosCampanha.map(({ campanha, usuarios }) => (
            <CampaignCard key={campanha.id} campanha={campanha} usuarios={usuarios} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;